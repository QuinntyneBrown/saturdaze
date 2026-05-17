import { Dialog } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { ACTIVITY_SERVICE } from 'api';
import {
  ActivityCard,
  BottomNav,
  Chip,
  IconButton,
  Section,
  TagGroup,
  TopBar,
} from 'components';
import { ProductActionDialog } from '../../dialogs/product-action-dialog/product-action-dialog';

@Component({
  selector: 'app-activities',
  standalone: true,
  imports: [
    ActivityCard,
    BottomNav,
    Chip,
    IconButton,
    Section,
    TagGroup,
    TopBar,
  ],
  templateUrl: './activities.page.html',
  styleUrl: './activities.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivitiesPage {
  private readonly dialog = inject(Dialog);
  protected readonly view = inject(ACTIVITY_SERVICE).list();

  protected trySomethingNew(): void {
    this.dialog.open(ProductActionDialog, {
      data: { kind: 'surprise' },
      autoFocus: 'first-tabbable',
      restoreFocus: true,
    });
  }
}
