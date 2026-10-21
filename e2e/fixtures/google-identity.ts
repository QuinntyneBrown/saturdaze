import { BrowserContext, Page } from "@playwright/test";

/**
 * Stand-in for Google Identity Services (L2-164, ADR-019 decision 7).
 *
 * The app loads `https://accounts.google.com/gsi/client` only when
 * `window.google.accounts.id` is absent, so installing this object before
 * the first script runs keeps every spec off Google's network and gives the
 * sign-in page a button it can click. `renderButton` draws the same
 * "Continue with Google" stand-in as the mock (`.btn--google` in
 * `docs/mocks/styles/app.css`), with its own inline styles exactly as
 * Google's iframe brings its own, so the sign-in visual baselines stay exact.
 *
 * A click hands the stored callback `{ credential }`. The credential is
 * `E2E_GOOGLE_CREDENTIAL` unless a spec sets `window.__sdGoogleCredential`.
 */

export const E2E_GOOGLE_CREDENTIAL = "e2e-google-credential";

/** `window.google` as the app and this fake both see it. */
interface FakeGoogleWindow extends Window {
  google?: unknown;
  __sdGoogleCredential?: string;
}

function installFakeGoogle(): void {
  const w = window as FakeGoogleWindow;
  if (w.google) return;
  let callback: ((response: { credential: string; select_by: string }) => void) | null = null;

  const LOGO =
    '<svg viewBox="0 0 48 48" aria-hidden="true" style="width:20px;height:20px;flex:none">' +
    '<path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.3l7.9 6.1C12.4 13.7 17.7 9.5 24 9.5z"/>' +
    '<path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 2.9-2.2 5.4-4.7 7.1l7.6 5.9c4.4-4.1 6.9-10.1 6.9-17z"/>' +
    '<path fill="#FBBC05" d="M10.5 28.6A14.5 14.5 0 0 1 9.7 24c0-1.6.3-3.2.8-4.6l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.7l7.9-6.1z"/>' +
    '<path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.6-4.2-13.5-9.9l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/>' +
    "</svg>";

  const TEXT: Record<string, string> = {
    continue_with: "Continue with Google",
    signin_with: "Sign in with Google",
    signup_with: "Sign up with Google",
    signin: "Sign in",
  };

  w.google = {
    accounts: {
      id: {
        initialize(config: { callback?: typeof callback }) {
          callback = config.callback ?? null;
        },
        renderButton(host: HTMLElement, options: { text?: string; theme?: string; width?: number } = {}) {
          const dark = options.theme === "filled_black";
          const button = document.createElement("button");
          button.type = "button";
          button.className = "gsi-fake";
          button.style.cssText =
            "display:inline-flex;align-items:center;justify-content:center;gap:10px;box-sizing:border-box;" +
            `width:${options.width ? options.width + "px" : "100%"};height:40px;padding:0 12px;border-radius:4px;` +
            `background:${dark ? "#131314" : "#FFFFFF"};border:1px solid ${dark ? "#8E918F" : "#747775"};` +
            `color:${dark ? "#E3E3E3" : "#1F1F1F"};font:500 14px/1 Roboto,"Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;` +
            "letter-spacing:0.25px;white-space:nowrap;cursor:pointer";
          button.innerHTML = LOGO + (TEXT[options.text ?? "signin_with"] ?? TEXT.signin_with);
          button.addEventListener("click", () => {
            callback?.({ credential: w.__sdGoogleCredential ?? "e2e-google-credential", select_by: "btn" });
          });
          host.replaceChildren(button);
        },
        prompt() {},
        cancel() {},
        disableAutoSelect() {},
      },
    },
  };
}

/** Installs the fake before every navigation of `target` (a page or a whole context). */
export async function installFakeGoogleIdentity(target: Page | BrowserContext): Promise<void> {
  await target.addInitScript(installFakeGoogle);
}

/** Makes the fake hand back `credential` on the next click. */
export async function setGoogleCredential(page: Page, credential: string): Promise<void> {
  await page.evaluate((c) => {
    (window as FakeGoogleWindow).__sdGoogleCredential = c;
  }, credential);
}
