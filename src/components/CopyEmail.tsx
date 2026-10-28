import { useEffect, useRef, useState } from 'react';
import styles from './CopyEmail.module.css';
import { CONTACT_EMAIL } from '../data/people';

/* A subtle copy-to-clipboard icon to sit beside an email link, so the
   address can be pasted into any mail client. Shows a tick briefly. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older browsers / non-secure contexts.
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}

export default function CopyEmail({ email = CONTACT_EMAIL, className }: { email?: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const label = copied ? 'Email address copied' : `Copy ${email}`;
  return (
    <button
      type="button"
      className={`${styles.copy}${copied ? ` ${styles.done}` : ''}${className ? ` ${className}` : ''}`}
      title={copied ? 'Copied' : 'Copy email address'}
      aria-label={label}
      onClick={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (await copyText(email)) {
          setCopied(true);
          window.clearTimeout(timer.current);
          timer.current = window.setTimeout(() => setCopied(false), 1600);
        }
      }}
    >
      {copied ? (
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5l3 3 7-7" /></svg>
      ) : (
        <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="5.5" y="5.5" width="8" height="8" rx="1" /><path d="M10.5 3.5v-.5a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h.5" /></svg>
      )}
      <span className={styles.srOnly} aria-live="polite">{copied ? 'Copied' : ''}</span>
    </button>
  );
}

/* The same button for markup built as HTML strings (the Helix3D list
   view). Wire it once with bindCopyEmail(root). */
export const copyEmailHTML = (email = CONTACT_EMAIL) =>
  `<button type="button" class="${styles.copy}" data-copy-email="${email}" title="Copy email address" aria-label="Copy ${email}">`
  + '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="5.5" y="5.5" width="8" height="8" rx="1" /><path d="M10.5 3.5v-.5a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h.5" /></svg></button>';

export function bindCopyEmail(root: HTMLElement): () => void {
  const onClick = async (e: MouseEvent) => {
    const btn = (e.target as Element | null)?.closest<HTMLButtonElement>('[data-copy-email]');
    if (!btn || !root.contains(btn)) return;
    e.preventDefault();
    e.stopPropagation();
    if (await copyText(btn.dataset.copyEmail!)) {
      btn.classList.add(styles.done);
      btn.title = 'Copied';
      window.setTimeout(() => { btn.classList.remove(styles.done); btn.title = 'Copy email address'; }, 1600);
    }
  };
  root.addEventListener('click', onClick);
  return () => root.removeEventListener('click', onClick);
}
