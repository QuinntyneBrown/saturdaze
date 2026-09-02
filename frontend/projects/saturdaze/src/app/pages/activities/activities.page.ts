import { Dialog } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { ACTIVITY_SERVICE, FAMILY_SERVICE } from 'api';
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
import { kidsPhrase } from '../../shared/family-presentation';

const TRY_NEW_SECTION = 'Try something new';

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
  private readonly activities = inject(ACTIVITY_SERVICE);
  private readonly family = inject(FAMILY_SERVICE);

  protected readonly view = this.activities.list();
  protected readonly activeFilter = this.activities.activeFilter();

  private readonly profile = this.family.getProfile();
  private readonly editable = this.family.getEditableProfile();

  protected readonly heading = computed(() => {
    const name = this.profile().familyName;
    return name ? `Picked for ${name}` : 'Picked for your family';
  });

  protected readonly lede = computed(() => {
    const kids = kidsPhrase(this.editable()?.members ?? []);
    const home = this.profile().location.trim();
    const near = home ? `close to ${home}` : 'close to home';
    return kids ? `Curated around ${kids}, ${near}.` : `Curated for your family, ${near}.`;
  });

  protected selectFilter(label: string): void {
    this.activities.setFilter(label);
  }

  protected trySomethingNew(): void {
    const activities = this.view().sections.find((s) => s.title === TRY_NEW_SECTION)?.activities ?? [];
    this.dialog.open(ProductActionDialog, {
      data: { kind: 'surprise', activities },
      autoFocus: 'first-tabbable',
      restoreFocus: true,
    });
  }
}
