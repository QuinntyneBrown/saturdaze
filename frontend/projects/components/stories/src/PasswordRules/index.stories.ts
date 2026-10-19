import type { Meta } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { PasswordRules, Strength } from 'components';

import descriptionMd from './PasswordRulesDescription.md';
import bestPracticesMd from './PasswordRulesBestPractices.md';

export { Default } from './PasswordRulesDefault.stories';
export { AllMet } from './PasswordRulesAllMet.stories';
export { WithStrength } from './PasswordRulesWithStrength.stories';

export default {
  title: 'Components/PasswordRules',
  component: PasswordRules,
  decorators: [moduleMetadata({ imports: [PasswordRules, Strength] })],
  parameters: {
    docs: {
      description: {
        component: [descriptionMd, bestPracticesMd].join('\n'),
      },
    },
  },
} as Meta<PasswordRules>;
