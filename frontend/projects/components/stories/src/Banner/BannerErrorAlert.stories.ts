import { signal } from '@angular/core';
import type { StoryObj } from '@storybook/angular';

import type { Banner } from 'components';

export const ErrorAlert: StoryObj<Banner> = {
  render: () => {
    const error = signal('');
    return {
      props: {
        error,
        signIn: () => error.set("That email and password don't match. Try again or reset your password."),
        clear: () => error.set(''),
      },
      template: `
        <div style="display: grid; gap: 12px; max-width: 420px; justify-items: start">
          @if (error()) {
            <sd-banner tone="warn" role="alert" icon="close">{{ error() }}</sd-banner>
          }
          <div style="display: flex; gap: 8px">
            <sd-button (click)="signIn()">Sign in</sd-button>
            <sd-button variant="quiet" (click)="clear()">Clear</sd-button>
          </div>
        </div>
      `,
    };
  },
  parameters: {
    docs: {
      description: {
        story:
          'Errors use `role="alert"` (assertive). Render the banner with `@if` when the error appears so the live region is announced — press Sign in.',
      },
    },
  },
};
