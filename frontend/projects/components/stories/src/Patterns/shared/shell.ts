import type { NavKey } from 'components';

/**
 * The signed-in app shell exactly as `app.html` renders it: the top bar
 * (shown from 720px), one `<main class="sd-frame">`, and the bottom nav
 * (shown below 720px). CSS decides which bar is visible.
 */
export function appShell(active: NavKey | null, content: string): string {
  const nav = active ? ` active="${active}"` : '';
  return `
    <sd-top-bar${nav} email="quinn@saturdaze.app" />
    <main id="main" class="sd-frame">${content}</main>
    <sd-bottom-nav${nav} />
  `;
}

