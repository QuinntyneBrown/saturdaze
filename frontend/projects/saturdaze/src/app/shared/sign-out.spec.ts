import { vi } from 'vitest';
import { of } from 'rxjs';

import { ConfirmDialog, DIALOG_OPTIONS } from '../dialogs/confirm-dialog/confirm-dialog';
import { signOutWith } from './sign-out';

describe('signOutWith', () => {
  const session = () => ({ logout: vi.fn(async () => undefined) });
  const router = () => ({ navigateByUrl: vi.fn(async () => true) });

  it('asks D22 first, then signs out and hops to /sign-in', async () => {
    const dialog = { open: vi.fn(() => ({ closed: of('confirm') })) } as any;
    const s = session();
    const r = router();
    await expect(signOutWith(dialog, s as any, r as any)).resolves.toBe(true);
    expect(dialog.open).toHaveBeenCalledWith(ConfirmDialog, {
      ...DIALOG_OPTIONS,
      data: {
        title: 'Sign out?',
        body: 'Your family and weekends stay saved.',
        cancelLabel: 'Stay signed in',
        confirmLabel: 'Sign out',
        danger: true,
        icon: 'sign_out',
      },
    });
    expect(s.logout).toHaveBeenCalledTimes(1);
    expect(r.navigateByUrl).toHaveBeenCalledWith('/sign-in');
  });

  it('does nothing when the user stays signed in', async () => {
    const dialog = { open: vi.fn(() => ({ closed: of(undefined) })) } as any;
    const s = session();
    const r = router();
    await expect(signOutWith(dialog, s as any, r as any)).resolves.toBe(false);
    expect(s.logout).not.toHaveBeenCalled();
    expect(r.navigateByUrl).not.toHaveBeenCalled();
  });
});
