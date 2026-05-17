import { Dialog } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { SAVED_SERVICE, WEEKEND_PLAN_SERVICE } from 'api';
import {
  BottomNav,
  Button,
  Chip,
  Icon,
  IconButton,
  ListItem,
  SavedCard,
  Section,
  TagGroup,
  TopBar,
} from 'components';
import {
  ProductActionDialog,
  ProductActionDialogResult,
} from '../../dialogs/product-action-dialog/product-action-dialog';

@Component({
  selector: 'app-saved',
  standalone: true,
  imports: [
    BottomNav,
    Button,
    Chip,
    Icon,
    IconButton,
    ListItem,
    SavedCard,
    Section,
    TagGroup,
    TopBar,
  ],
  templateUrl: './saved.page.html',
  styleUrl: './saved.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SavedPage {
  private readonly dialog = inject(Dialog);
  private readonly weekend = inject(WEEKEND_PLAN_SERVICE);
  private readonly router = inject(Router);

  protected readonly view = inject(SAVED_SERVICE).list();

  protected openMore(): void {
    this.dialog.open(ProductActionDialog, {
      data: { kind: 'saved-more' },
      autoFocus: 'first-tabbable',
      restoreFocus: true,
    });
  }

  protected async remix(id: string, title: string): Promise<void> {
    const result = await this.openConfirm('remix', title);
    if (result !== 'confirm') return;
    await this.weekend.remixSaved(id);
    await this.router.navigateByUrl('/weekend');
  }

  protected async repeat(id: string, title: string): Promise<void> {
    const result = await this.openConfirm('repeat', title);
    if (result !== 'confirm') return;
    await this.weekend.repeatSaved(id);
    await this.router.navigateByUrl('/weekend');
  }

  private async openConfirm(kind: 'remix' | 'repeat', title: string): Promise<ProductActionDialogResult | undefined> {
    const ref = this.dialog.open<ProductActionDialogResult>(ProductActionDialog, {
      data: { kind, title },
      autoFocus: 'first-tabbable',
      restoreFocus: true,
    });
    return await firstValueFrom(ref.closed);
  }
}
