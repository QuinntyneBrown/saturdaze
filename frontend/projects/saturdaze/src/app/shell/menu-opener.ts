import { BreakpointObserver } from '@angular/cdk/layout';
import { Dialog } from '@angular/cdk/dialog';
import { Overlay } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { Menu, MenuItem } from 'components';

import { MenuDialog, MenuDialogData } from '../dialogs/menu-dialog/menu-dialog';

export interface MenuOptions {
  /** Sheet title below 720px ("Weekend options", "Account"). */
  readonly title: string;
  /** Header line in the anchored menu (the account email). */
  readonly header?: string;
  readonly items: readonly MenuItem[];
}

/**
 * Opens a short action menu the way the design does at each width: an
 * anchored popover under the trigger from 720px (CDK Overlay), a bottom
 * sheet below (CDK Dialog). Resolves with the chosen item, or undefined
 * when dismissed. Used by the account menu and the Weekend "More" button.
 */
@Injectable({ providedIn: 'root' })
export class MenuOpener {
  readonly dialog = inject(Dialog);
  private readonly overlay = inject(Overlay);
  private readonly breakpoints = inject(BreakpointObserver);

  async open(anchor: HTMLElement, options: MenuOptions): Promise<MenuItem | undefined> {
    if (!this.breakpoints.isMatched('(min-width: 720px)')) {
      const ref = this.dialog.open<MenuItem | undefined, MenuDialogData>(MenuDialog, {
        data: { title: options.title, items: options.items },
        autoFocus: 'first-tabbable',
        restoreFocus: true,
        panelClass: 'sd-dialog-panel',
        backdropClass: 'sd-dialog-backdrop',
      });
      return firstValueFrom(ref.closed);
    }

    const overlayRef = this.overlay.create({
      positionStrategy: this.overlay
        .position()
        .flexibleConnectedTo(anchor)
        .withPositions([
          { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 8 },
          { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetY: -8 },
        ]),
      scrollStrategy: this.overlay.scrollStrategies.close(),
      hasBackdrop: true,
      backdropClass: 'sd-menu-backdrop',
      panelClass: 'sd-menu-pane',
    });

    return new Promise<MenuItem | undefined>((resolve) => {
      let settled = false;
      const finish = (item?: MenuItem): void => {
        if (settled) return;
        settled = true;
        overlayRef.dispose();
        anchor.focus();
        resolve(item);
      };

      const ref = overlayRef.attach(new ComponentPortal(Menu));
      ref.setInput('items', options.items);
      ref.setInput('header', options.header ?? '');
      ref.setInput('label', options.title);
      ref.instance.select.subscribe((item) => finish(item));
      overlayRef.backdropClick().subscribe(() => finish());
      overlayRef.keydownEvents().subscribe((event) => {
        if (event.key === 'Escape') finish();
      });
      overlayRef.detachments().subscribe(() => finish());

      queueMicrotask(() => {
        const first = ref.location.nativeElement.querySelector('[role="menuitem"]') as HTMLElement | null;
        first?.focus();
      });
    });
  }
}
