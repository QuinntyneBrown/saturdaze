import { Injectable, InjectionToken, inject } from '@angular/core';

/**
 * Google Identity Services, the script behind "Continue with Google"
 * (L2-164, ADR-019). The page owns a host element; this service loads the
 * script once, renders Google's own button into the host, and hands back
 * each credential (signed ID token) Google returns. `POST /api/auth/google`
 * then verifies it.
 */

const GSI_SRC = 'https://accounts.google.com/gsi/client';

/** The OAuth client id the button is rendered for; empty turns the feature off. */
export const GOOGLE_CLIENT_ID = new InjectionToken<string>('GOOGLE_CLIENT_ID', {
  providedIn: 'root',
  factory: () => '',
});

/** What a page needs from Google Identity Services. */
export interface IGoogleIdentity {
  /** False when no client id is configured; the page then shows no Google button. */
  readonly enabled: boolean;
  /**
   * Loads the script if needed and renders Google's button into `host`.
   * `onCredential` receives each credential Google hands back. Rejects
   * when the script cannot load.
   *
   * @param {HTMLElement} host - The element Google draws the button into
   * @param {(credential: string) => void} onCredential - Called with each credential
   *
   * @returns {Promise<void>} Resolves once the button is rendered
   */
  renderButton(host: HTMLElement, onCredential: (credential: string) => void): Promise<void>;
}

export const GOOGLE_IDENTITY = new InjectionToken<IGoogleIdentity>('GOOGLE_IDENTITY');

/** The slice of `google.accounts.id` the service uses. */
interface GoogleAccountsId {
  initialize(config: {
    client_id: string;
    callback: (response: { credential: string }) => void;
    ux_mode?: 'popup' | 'redirect';
    itp_support?: boolean;
  }): void;
  renderButton(
    host: HTMLElement,
    options: {
      type: 'standard' | 'icon';
      theme: 'outline' | 'filled_blue' | 'filled_black';
      size: 'large' | 'medium' | 'small';
      text: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
      shape: 'rectangular' | 'pill' | 'circle' | 'square';
      logo_alignment: 'left' | 'center';
      width?: number;
    },
  ): void;
}

interface GoogleWindow extends Window {
  google?: { accounts?: { id?: GoogleAccountsId } };
}

/** Google caps the button at 400 px and floors it at 200 px. */
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;

/**
 * Real Google Identity Services. Bound to `GOOGLE_IDENTITY` in the family
 * app's composition root with `GOOGLE_CLIENT_ID` from the environment.
 */
@Injectable({ providedIn: 'root' })
export class GoogleIdentityService implements IGoogleIdentity {
  private readonly clientId = inject(GOOGLE_CLIENT_ID);
  private loading: Promise<GoogleAccountsId> | null = null;

  get enabled(): boolean {
    return this.clientId.length > 0;
  }

  async renderButton(host: HTMLElement, onCredential: (credential: string) => void): Promise<void> {
    const id = await this.load();
    id.initialize({
      client_id: this.clientId,
      callback: (response) => onCredential(response.credential),
      ux_mode: 'popup',
      itp_support: true,
    });
    const dark = globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
    id.renderButton(host, {
      type: 'standard',
      theme: dark ? 'filled_black' : 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'rectangular',
      logo_alignment: 'left',
      width: Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Math.round(host.clientWidth) || MAX_WIDTH)),
    });
  }

  /** Resolves `google.accounts.id`, injecting the script at most once. */
  private load(): Promise<GoogleAccountsId> {
    const present = (globalThis as unknown as GoogleWindow).google?.accounts?.id;
    if (present) return Promise.resolve(present);
    this.loading ??= new Promise<GoogleAccountsId>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = GSI_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        const id = (globalThis as unknown as GoogleWindow).google?.accounts?.id;
        if (id) resolve(id);
        else reject(new Error('Google Identity Services loaded without accounts.id'));
      };
      script.onerror = () => {
        this.loading = null;
        reject(new Error('Google Identity Services failed to load'));
      };
      document.head.append(script);
    });
    return this.loading;
  }
}
