import { ChangeDetectionStrategy, Component } from '@angular/core';

import { PasswordRules } from 'components';

@Component({
  imports: [PasswordRules],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-password-rules
      [rules]="[
        { label: '8 or more characters', met: true },
        { label: 'A number or symbol', met: false },
      ]"
    />
  `,
})
export default class PasswordRulesScenario {}
