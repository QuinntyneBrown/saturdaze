import { Dialog } from '@angular/cdk/dialog';
import { Router } from '@angular/router';

import { ISessionStore } from 'api';

import { confirmWith } from '../dialogs/confirm-dialog/confirm-dialog';

/**
 * D22 — "Sign out?" confirmation, then the real sign-out and a hop to
 * `/sign-in`. Shared by the account menu and the Family account card.
 * Resolves `true` when the user signed out.
 */
export async function signOutWith(
  dialog: Dialog,
  session: ISessionStore,
  router: Router,
): Promise<boolean> {
  const confirmed = await confirmWith(dialog, {
    title: 'Sign out?',
    body: 'Your family and weekends stay saved.',
    cancelLabel: 'Stay signed in',
    confirmLabel: 'Sign out',
    danger: true,
    icon: 'sign_out',
  });
  if (!confirmed) return false;
  await session.logout();
  await router.navigateByUrl('/sign-in');
  return true;
}
