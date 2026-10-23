#!/usr/bin/env python3
"""Import iPhone spatial photos (.HEIC) into the #story page.

Portrait-mode HEICs (one image + the iPhone's own depth map inside) use
that embedded depth instead. For each spatial HEIC in the input folder
(default: story-src/):
  1. Split it into its left and right eye images: `spatial export` on
     macOS, or pillow-heif (reads both images in the HEIC) anywhere else.
  2. OpenCV stereo matching (SGBM) measures how far each point shifts
     between the eyes (disparity): big shift = near. That becomes the
     depth map (greyscale PNG, white = near), true depth from the camera.
  3. The left eye is saved as a web-sized JPEG.
Results go to public/story/, and src/data/story.generated.ts is rewritten
to list them (titles from the file names; edit captions in story.ts or
rename the files). Ordinary (non-spatial) HEICs/JPEGs are imported too,
with no depth map, unless --ai is given and Depth Anything is installed.

Setup (once, in the project; works on Linux and macOS):
  python3 -m venv .venv
  .venv/bin/pip install opencv-contrib-python numpy pillow-heif
  # optional, for non-spatial photos: .venv/bin/pip install transformers torch
  # optional on macOS: brew install spatial

Usage:
  .venv/bin/python scripts/story_import.py               # story-src/ -> public/story/
  .venv/bin/python scripts/story_import.py ~/Desktop/trip --ai
Check `spatial export --help` if your version's flags differ.
"""
import argparse, json, re, shutil, subprocess, sys, tempfile
from pathlib import Path

try:
    import cv2
    import numpy as np
except ImportError:
    sys.exit("Needs OpenCV + numpy (in a venv):\n  python3 -m venv .venv\n"
             "  .venv/bin/pip install opencv-contrib-python numpy pillow-heif\n"
             "then run with  .venv/bin/python scripts/story_import.py")

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "story"
GEN = ROOT / "src" / "data" / "story.generated.ts"
PHOTO_EDGE = 2400      # long edge of the web JPEG
DEPTH_W = 1024         # depth map width
MATCH_W = 1280         # width the stereo matching runs at


def slug(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-") or "photo"


def resize_long(img, edge):
    h, w = img.shape[:2]
    k = edge / max(h, w)
    return img if k >= 1 else cv2.resize(img, (round(w * k), round(h * k)), interpolation=cv2.INTER_AREA)


def heif_images(heic: Path):
    """Every top-level image in a HEIC as BGR arrays (pillow-heif)."""
    try:
        import pillow_heif
    except ImportError:
        sys.exit("Needs pillow-heif to read HEIC:  .venv/bin/pip install pillow-heif")
    hf = pillow_heif.open_heif(str(heic), convert_hdr_to_8bit=True)
    out = []
    for im in hf:
        a = np.asarray(im)
        out.append(cv2.cvtColor(a, cv2.COLOR_RGBA2BGR if a.shape[2] == 4 else cv2.COLOR_RGB2BGR))
    return out


def valid_ratio(L, R):
    """Share of pixels SGBM can match with L as the left eye (wrong order -> few)."""
    k = 640 / L.shape[1]
    gl = cv2.cvtColor(cv2.resize(L, None, fx=k, fy=k), cv2.COLOR_BGR2GRAY)
    gr = cv2.cvtColor(cv2.resize(R, None, fx=k, fy=k), cv2.COLOR_BGR2GRAY)
    d = cv2.StereoSGBM_create(minDisparity=0, numDisparities=48, blockSize=5).compute(gl, gr)
    return float((d > 0).mean())


def export_eyes(heic: Path, tmp: Path):
    """Left/right eye images from a spatial HEIC, or None if it isn't one."""
    if not shutil.which("spatial"):
        imgs = heif_images(heic)
        if len(imgs) < 2 or imgs[0].shape != imgs[1].shape:
            return None                       # an ordinary single-image HEIC
        a, b = imgs[0], imgs[1]
        # The file doesn't say which is which here: the right order is the
        # one stereo matching can actually match.
        return (a, b) if valid_ratio(a, b) >= valid_ratio(b, a) else (b, a)
    left, right = tmp / "left.png", tmp / "right.png"
    r = subprocess.run(["spatial", "export", "-i", str(heic), "-o", str(left), "-o", str(right)],
                       capture_output=True, text=True)
    if r.returncode != 0 or not left.exists() or not right.exists():
        return None
    L, R = cv2.imread(str(left)), cv2.imread(str(right))
    if L is None or R is None or L.shape != R.shape:
        return None
    return L, R


def stereo_depth(L, R):
    """Disparity (left as reference) -> 0..1 depth, 1 = near."""
    h, w = L.shape[:2]
    k = MATCH_W / w
    gl = cv2.cvtColor(cv2.resize(L, (MATCH_W, round(h * k))), cv2.COLOR_BGR2GRAY)
    gr = cv2.cvtColor(cv2.resize(R, (MATCH_W, round(h * k))), cv2.COLOR_BGR2GRAY)
    nd = 16 * 6                               # max disparity searched (px at MATCH_W)
    bs = 5
    left = cv2.StereoSGBM_create(minDisparity=0, numDisparities=nd, blockSize=bs,
                                 P1=8 * bs * bs, P2=32 * bs * bs, disp12MaxDiff=1,
                                 uniquenessRatio=8, speckleWindowSize=100, speckleRange=2,
                                 mode=cv2.STEREO_SGBM_MODE_SGBM_3WAY)
    dl = left.compute(gl, gr)
    try:  # edge-aware smoothing + hole filling (opencv-contrib)
        right_m = cv2.ximgproc.createRightMatcher(left)
        dr = right_m.compute(gr, gl)
        wls = cv2.ximgproc.createDisparityWLSFilter(left)
        wls.setLambda(8000.0); wls.setSigmaColor(1.4)
        disp = wls.filter(dl, gl, disparity_map_right=dr).astype(np.float32) / 16.0
    except AttributeError:
        disp = dl.astype(np.float32) / 16.0
        disp[disp <= 0] = np.nan
        disp = cv2.medianBlur(np.nan_to_num(disp, nan=np.nanmin(disp) if np.isfinite(disp).any() else 0).astype(np.float32), 5)
    disp = np.nan_to_num(disp, nan=0.0)
    lo, hi = np.percentile(disp, 2), np.percentile(disp, 98)
    if hi - lo < 1e-3:
        return None
    d = np.clip((disp - lo) / (hi - lo), 0, 1)
    d = cv2.bilateralFilter(d.astype(np.float32), 9, 0.1, 9)
    return np.clip(d, 0, 1)


def embedded_depth(path: Path, photo):
    """Depth map an iPhone stores inside Portrait-mode (and some other)
    HEICs, from its dual cameras / LiDAR -> 0..1, 1 = near. Upscaled to the
    photo and edge-aligned to it with a guided filter."""
    if path.suffix.lower() != ".heic":
        return None
    try:
        import pillow_heif
    except ImportError:
        return None
    im = pillow_heif.open_heif(str(path), convert_hdr_to_8bit=True)[0]
    deps = im.info.get("depth_images") or []
    if not deps:
        return None
    d = np.asarray(deps[0].to_pillow()).astype(np.float32)
    if d.ndim == 3:
        d = d[..., 0]
    h, w = photo.shape[:2]
    d = cv2.resize(d, (w, h), interpolation=cv2.INTER_CUBIC)
    lo, hi = np.percentile(d, 1), np.percentile(d, 99)
    d = np.clip((d - lo) / max(hi - lo, 1e-6), 0, 1)        # stored bright = near
    try:
        guide = cv2.cvtColor(photo, cv2.COLOR_BGR2GRAY)
        g = cv2.ximgproc.guidedFilter(guide, d.astype(np.float32), max(4, w // 200), 1e-3)
        d = np.where(np.isfinite(g), g, d)                   # the filter can leave NaNs at borders
    except AttributeError:
        d = cv2.GaussianBlur(d, (0, 0), 2)
    return np.clip(d, 0, 1)


def ai_depth(img):
    """Depth Anything V2 (optional) for ordinary photos -> 0..1, 1 = near."""
    try:
        from transformers import pipeline
        from PIL import Image
    except ImportError:
        return None
    pipe = ai_depth.pipe = getattr(ai_depth, "pipe", None) or pipeline(
        "depth-estimation", model="depth-anything/Depth-Anything-V2-Small-hf")
    out = pipe(Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB)))["predicted_depth"].squeeze().numpy()
    out = cv2.resize(out.astype(np.float32), (img.shape[1], img.shape[0]))
    lo, hi = np.percentile(out, 2), np.percentile(out, 98)
    return np.clip((out - lo) / max(hi - lo, 1e-6), 0, 1)


def read_any(path: Path, tmp: Path):
    img = cv2.imread(str(path))
    if img is None and path.suffix.lower() == ".heic":
        imgs = heif_images(path)
        img = imgs[0] if imgs else None
    if img is None and shutil.which("sips"):          # HEIC on macOS
        jpg = tmp / "flat.jpg"
        subprocess.run(["sips", "-s", "format", "jpeg", str(path), "--out", str(jpg)], capture_output=True)
        img = cv2.imread(str(jpg))
    return img


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("src", nargs="?", default=str(ROOT / "story-src"), help="folder of photos (default story-src/)")
    ap.add_argument("--ai", action="store_true", help="estimate depth for non-spatial photos (Depth Anything V2)")
    a = ap.parse_args()
    src = Path(a.src).expanduser()
    files = sorted(p for p in src.iterdir() if p.suffix.lower() in {".heic", ".jpg", ".jpeg", ".png"}) if src.is_dir() else []
    if not files:
        sys.exit(f"No photos in {src} (put your .HEIC files there)")
    OUT.mkdir(parents=True, exist_ok=True)
    entries = []
    for f in files:
        sid = slug(f.stem)
        with tempfile.TemporaryDirectory() as td:
            tmp = Path(td)
            eyes = export_eyes(f, tmp) if f.suffix.lower() == ".heic" else None
            if eyes:
                photo, depth, kind = eyes[0], stereo_depth(*eyes), "spatial"
            else:
                photo = read_any(f, tmp)
                if photo is None:
                    print(f"  skip {f.name}: can't read it"); continue
                depth, kind = embedded_depth(f, photo), "portrait"
                if depth is None:
                    depth, kind = (ai_depth(photo) if a.ai else None), "flat"
        photo = resize_long(photo, PHOTO_EDGE)
        cv2.imwrite(str(OUT / f"{sid}.jpg"), photo, [cv2.IMWRITE_JPEG_QUALITY, 88])
        entry = {"id": sid, "title": f.stem.replace("_", " ").replace("-", " "), "caption": "", "photo": f"story/{sid}.jpg"}
        if depth is not None:
            ph, pw = photo.shape[:2]
            dmap = cv2.resize(depth, (DEPTH_W, round(DEPTH_W * ph / pw)), interpolation=cv2.INTER_AREA)
            cv2.imwrite(str(OUT / f"{sid}-depth.png"), (np.nan_to_num(np.clip(dmap, 0, 1)) * 255).astype(np.uint8))
            entry["depth"] = f"story/{sid}-depth.png"
        if kind == "spatial":
            shutil.copyfile(f, OUT / f"{sid}.heic")
            entry["heic"] = f"story/{sid}.heic"
        entries.append(entry)
        print(f"  {f.name}: {kind}{'' if depth is not None else ' (no depth map)'} -> public/story/{sid}.jpg")
    # Tidy up: files from a previous import whose photo has left story-src/.
    keep = {Path(e[k]).name for e in entries for k in ("photo", "depth", "heic") if k in e}
    if GEN.exists():
        old = re.findall(r'"(?:photo|depth|heic)": "story/([^"]+)"', GEN.read_text())
        for name in old:
            if name not in keep and (OUT / name).exists():
                (OUT / name).unlink()
                print(f"  removed public/story/{name} (no longer in {src.name}/)")
    GEN.write_text(
        "/* Written by scripts/story_import.py: the imported photos, in file-name\n"
        "   order. Re-running the script replaces this file; set captions here or\n"
        "   copy entries into STORY in story.ts to keep them. */\n"
        "import type { StoryChapter } from './story'\n\n"
        f"export const IMPORTED: StoryChapter[] = {json.dumps(entries, indent=2, ensure_ascii=False)}\n")
    print(f"Done: {len(entries)} photo(s). Listed in src/data/story.generated.ts")


if __name__ == "__main__":
    main()
