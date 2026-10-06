import { Dialog } from '@angular/cdk/dialog';
import { firstValueFrom } from 'rxjs';

import { DIALOG_OPTIONS } from '../dialogs/confirm-dialog/confirm-dialog';
import {
  AddToDayDialog,
  AddToDayDialogData,
  AddToDayDialogResult,
} from '../dialogs/add-to-day-dialog/add-to-day-dialog';

/** Open D27 for an idea (L2-107); resolves with the day it was added to, if any. */
export async function openAddToDay(
  dialog: Dialog,
  data: AddToDayDialogData,
): Promise<AddToDayDialogResult | undefined> {
  const ref = dialog.open<AddToDayDialogResult, AddToDayDialogData>(AddToDayDialog, {
    ...DIALOG_OPTIONS,
    data,
  });
  return firstValueFrom(ref.closed);
}
