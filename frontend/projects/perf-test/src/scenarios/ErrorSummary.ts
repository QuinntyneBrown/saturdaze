import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ErrorSummary } from 'components';

@Component({
  imports: [ErrorSummary],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-error-summary
      [problems]="[
        { id: 'title', message: 'Enter a title for the event' },
        { id: 'link', message: 'Enter a link that starts with https://' },
      ]"
    />
  `,
})
export default class ErrorSummaryScenario {}
