/* The site menu: one list for the desktop in-scene menu (Helix3D) and
   the NavBar menu phones and the other pages use, so both offer the same
   items. Numbers come from the position. */
export const SITE_MENU: ReadonlyArray<{ label: string; href: string }> = [
  { label: 'marginalia', href: '#marginalia' },
  { label: 'people', href: '#who' },
  { label: 'services', href: '#services' },
  { label: 'advisory', href: '#helix3d?skipIntro=true&focus=advisory' },
];
