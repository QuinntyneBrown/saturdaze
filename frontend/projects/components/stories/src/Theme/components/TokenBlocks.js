/**
 * Small React blocks for the Theme MDX pages (docs pages render with React
 * even in an Angular Storybook). Written with `createElement` so they need
 * no JSX transform. Every preview paints with `var(--sd-*)`, so what you see
 * is the live stylesheet, not a copy of it.
 */
import { createElement as h } from 'react';

import { overridesFor } from './tokens';

const code = {
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  fontSize: 13,
};
const muted = { color: 'var(--sd-ink-soft)', fontSize: 13 };
const row = {
  display: 'grid',
  gridTemplateColumns: 'minmax(160px, 260px) 1fr',
  gap: 16,
  alignItems: 'center',
  padding: '12px 0',
  borderBottom: '1px solid var(--sd-line)',
};

function Responsive({ name }) {
  const list = overridesFor(name);
  if (!list.length) return null;
  return h(
    'div',
    { style: { ...muted, marginTop: 4 } },
    list.map((o) =>
      h('div', { key: o.query }, `${o.query}: `, h('code', { style: code }, o.value)),
    ),
  );
}

function Meta({ token }) {
  return h(
    'div',
    null,
    h('code', { style: { ...code, fontWeight: 600 } }, token.name),
    h('div', { style: muted }, token.value),
    token.note ? h('div', { style: muted }, token.note) : null,
    h(Responsive, { name: token.name }),
  );
}

/** Colour swatches in a responsive grid. */
export function ColorGrid({ tokens }) {
  return h(
    'div',
    {
      className: 'sb-unstyled',
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: 16,
        margin: '16px 0 32px',
      },
    },
    tokens.map((t) =>
      h(
        'div',
        {
          key: t.name,
          style: {
            border: '1px solid var(--sd-line)',
            borderRadius: 'var(--sd-r-md)',
            overflow: 'hidden',
            background: 'var(--sd-surface)',
          },
        },
        h('div', {
          style: {
            height: 72,
            background: `var(${t.name})`,
            borderBottom: '1px solid var(--sd-line)',
          },
        }),
        h('div', { style: { padding: 12 } }, h(Meta, { token: t })),
      ),
    ),
  );
}

/** One row per token with a live preview rendered by `preview(token)`. */
export function TokenRows({ tokens, preview }) {
  return h(
    'div',
    { className: 'sb-unstyled', style: { margin: '16px 0 32px' } },
    tokens.map((t) =>
      h('div', { key: t.name, style: row }, h(Meta, { token: t }), h('div', null, preview(t))),
    ),
  );
}

export const previews = {
  fontSize: (t) =>
    h(
      'span',
      { style: { fontSize: `var(${t.name})`, lineHeight: 'var(--sd-lh-tight)', fontWeight: 600 } },
      'Saturday at the market',
    ),
  lineHeight: (t) =>
    h(
      'p',
      {
        style: {
          lineHeight: `var(${t.name})`,
          maxWidth: 320,
          background: 'var(--sd-surface-2)',
          borderRadius: 8,
          padding: 8,
        },
      },
      'Pancakes, then the splash pad before it gets busy, then a slow lunch on the patio.',
    ),
  fontWeight: (t) =>
    h(
      'span',
      { style: { fontWeight: `var(${t.name})`, fontSize: 'var(--sd-fs-md)' } },
      'Plan my weekend',
    ),
  fontFamily: (t) =>
    h(
      'span',
      { style: { fontFamily: `var(${t.name})`, fontSize: 'var(--sd-fs-lg)' } },
      'Aa Bb Cc 0123',
    ),
  space: (t) =>
    h('div', {
      style: {
        width: `max(2px, var(${t.name}))`,
        height: 16,
        background: 'var(--sd-primary)',
        borderRadius: 4,
      },
    }),
  radius: (t) =>
    h('div', {
      style: {
        width: 96,
        height: 56,
        borderRadius: `var(${t.name})`,
        background: 'var(--sd-primary-soft)',
        border: '1px solid var(--sd-primary)',
      },
    }),
  shadow: (t) =>
    h('div', {
      style: {
        width: 140,
        height: 72,
        borderRadius: 'var(--sd-r-lg)',
        background: 'var(--sd-surface)',
        boxShadow: `var(${t.name})`,
      },
    }),
  motion: (t) =>
    h(
      'div',
      { className: 'sd-motion-demo', style: { '--_dur': `var(${t.name})` } },
      h('div', { className: 'sd-motion-demo__dot' }),
    ),
  length: (t) =>
    h('div', {
      style: {
        width: `min(100%, calc(var(${t.name}) / 6))`,
        minWidth: 4,
        height: 12,
        background: 'var(--sd-accent-soft)',
        border: '1px solid var(--sd-accent)',
        borderRadius: 4,
      },
    }),
  none: () => null,
};
