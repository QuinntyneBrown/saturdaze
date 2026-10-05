import { Overlay } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import type { StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { Button, Icon, Menu, type MenuItem } from 'components';

const ACCOUNT_ITEMS: readonly MenuItem[] = [
  { id: 'family', label: 'Family settings', icon: 'user' },
  { id: 'sign-out', label: 'Sign out', icon: 'sign_out', tone: 'warn' },
];

/**
 * Attaches `sd-menu` with CDK Overlay the way the app's `MenuOpener` does
 * from 720px; `.storybook/storybook.scss` carries the `.sd-menu-*` rules.
 */
@Component({
  selector: 'story-menu-launcher',
  standalone: true,
  imports: [Button, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div style="min-height: 200px; display: flex; justify-content: space-between; align-items: flex-start; gap: 12px">
      <span class="sd-text-soft" aria-live="polite">{{ result() }}</span>
      <sd-button variant="quiet" icon label="Account menu" (click)="open($event)"><sd-icon name="user" /></sd-button>
    </div>
  `,
})
class MenuLauncher {
  private readonly overlay = inject(Overlay);
  protected readonly result = signal('');

  protected open(event: Event): void {
    const anchor = (event.target as HTMLElement).closest<HTMLElement>('button') ?? (event.target as HTMLElement);
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

    let settled = false;
    const finish = (item?: MenuItem): void => {
      if (settled) return;
      settled = true;
      overlayRef.dispose();
      anchor.focus();
      this.result.set(item ? `Picked: ${item.label}` : 'Dismissed.');
    };

    const ref = overlayRef.attach(new ComponentPortal(Menu));
    ref.setInput('items', ACCOUNT_ITEMS);
    ref.setInput('header', 'quinntynebrown@gmail.com');
    ref.setInput('label', 'Account');
    ref.instance.select.subscribe((item) => finish(item));
    overlayRef.backdropClick().subscribe(() => finish());
    overlayRef.keydownEvents().subscribe((e) => {
      if (e.key === 'Escape') finish();
    });
    overlayRef.detachments().subscribe(() => finish());

    queueMicrotask(() => {
      ref.location.nativeElement.querySelector('[role="menuitem"]')?.focus();
    });
  }
}

export const OpenWithOverlay: StoryObj<Menu> = {
  decorators: [moduleMetadata({ imports: [MenuLauncher] })],
  render: () => ({
    template: `<story-menu-launcher />`,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'The account menu, live: the trigger attaches `sd-menu` through CDK `Overlay` with a `flexibleConnectedTo` position (end-aligned, 8px below, flipping above), a transparent backdrop for outside clicks and Escape to close. Focus moves to the first item and returns to the trigger.',
      },
    },
  },
};
