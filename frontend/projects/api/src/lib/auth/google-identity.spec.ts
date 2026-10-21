import { vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { GOOGLE_CLIENT_ID, GoogleIdentityService } from './google-identity';

interface FakeAccountsId {
  initialize: ReturnType<typeof vi.fn>;
  renderButton: ReturnType<typeof vi.fn>;
}

type GoogleWindow = typeof globalThis & { google?: { accounts: { id: FakeAccountsId } } };

describe('GoogleIdentityService', () => {
  let accountsId: FakeAccountsId;

  function configure(clientId: string): GoogleIdentityService {
    TestBed.configureTestingModule({
      providers: [GoogleIdentityService, { provide: GOOGLE_CLIENT_ID, useValue: clientId }],
    });
    return TestBed.inject(GoogleIdentityService);
  }

  beforeEach(() => {
    accountsId = { initialize: vi.fn(), renderButton: vi.fn() };
    (globalThis as GoogleWindow).google = { accounts: { id: accountsId } };
  });

  afterEach(() => {
    delete (globalThis as GoogleWindow).google;
    document
      .querySelectorAll('script[src^="https://accounts.google.com"]')
      .forEach((s) => s.remove());
  });

  it('is enabled only with a client id', () => {
    expect(configure('').enabled).toBe(false);
    TestBed.resetTestingModule();
    expect(configure('client-1').enabled).toBe(true);
  });

  it('initialises with the client id and renders the large "Continue with" button at the host width', async () => {
    const service = configure('client-1');
    const host = document.createElement('div');
    Object.defineProperty(host, 'clientWidth', { value: 336 });
    const onCredential = vi.fn();

    await service.renderButton(host, onCredential);

    expect(accountsId.initialize).toHaveBeenCalledWith(
      expect.objectContaining({ client_id: 'client-1', ux_mode: 'popup' }),
    );
    expect(accountsId.renderButton).toHaveBeenCalledWith(
      host,
      expect.objectContaining({ size: 'large', text: 'continue_with', width: 336 }),
    );
    expect(document.querySelector('script[src^="https://accounts.google.com"]')).toBeNull();
  });

  it('hands each credential Google returns to the callback', async () => {
    const service = configure('client-1');
    const onCredential = vi.fn();
    await service.renderButton(document.createElement('div'), onCredential);

    const config = accountsId.initialize.mock.calls[0][0] as {
      callback: (r: { credential: string }) => void;
    };
    config.callback({ credential: 'id-token' });

    expect(onCredential).toHaveBeenCalledWith('id-token');
  });

  it('clamps the button width to the 200 to 400 px Google allows', async () => {
    const service = configure('client-1');
    const wide = document.createElement('div');
    Object.defineProperty(wide, 'clientWidth', { value: 900 });
    await service.renderButton(wide, vi.fn());
    expect(accountsId.renderButton.mock.calls[0][1]).toMatchObject({ width: 400 });

    const hidden = document.createElement('div');
    await service.renderButton(hidden, vi.fn());
    expect(accountsId.renderButton.mock.calls[1][1]).toMatchObject({ width: 400 });
  });

  it('loads the script once when Google is not on the page yet', async () => {
    delete (globalThis as GoogleWindow).google;
    const service = configure('client-1');

    const first = service.renderButton(document.createElement('div'), vi.fn());
    const second = service.renderButton(document.createElement('div'), vi.fn());
    const scripts = document.querySelectorAll(
      'script[src^="https://accounts.google.com/gsi/client"]',
    );
    expect(scripts).toHaveLength(1);

    (globalThis as GoogleWindow).google = { accounts: { id: accountsId } };
    (scripts[0] as HTMLScriptElement).onload?.(new Event('load'));
    await Promise.all([first, second]);
    expect(accountsId.renderButton).toHaveBeenCalledTimes(2);
  });

  it('rejects when the script fails to load', async () => {
    delete (globalThis as GoogleWindow).google;
    const service = configure('client-1');

    const pending = service.renderButton(document.createElement('div'), vi.fn());
    const script = document.querySelector(
      'script[src^="https://accounts.google.com/gsi/client"]',
    ) as HTMLScriptElement;
    script.onerror?.(new Event('error'));

    await expect(pending).rejects.toThrow(/failed to load/);
  });
});
