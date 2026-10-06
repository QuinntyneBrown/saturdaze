import type { StoryObj } from '@storybook/angular';

import type { TextInput } from 'components';

export const Default: StoryObj<TextInput> = {
  args: {
    label: 'Family name',
    placeholder: 'The Browns',
    hint: 'How we greet you.',
    error: '',
    type: 'text',
    required: false,
    invalid: false,
    multiline: false,
    readonly: false,
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="max-width: 360px">
        <sd-text-input
          [label]="label"
          [placeholder]="placeholder"
          [hint]="hint"
          [error]="error"
          [type]="type"
          [required]="required"
          [invalid]="invalid"
          [multiline]="multiline"
          [readonly]="readonly"
        />
      </div>
    `,
  }),
};
