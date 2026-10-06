import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';

/** The bubble rendered into the overlay; internal to `sdTooltip`. */
@Component({
  selector: 'sd-tooltip',
  standalone: true,
  template: '{{ text() }}',
  styleUrl: './tooltip-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'tooltip',
    role: 'tooltip',
    '[id]': 'tooltipId()',
    '[attr.aria-hidden]': 'hidden() ? "true" : null',
  },
})
export class TooltipPanel {
  readonly text = input<string>('');
  readonly tooltipId = input<string>('');
  readonly hidden = input(false, { transform: booleanAttribute });
}
