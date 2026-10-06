One shimmering placeholder row shaped like a schedule block: a right-aligned time stub, a 32px disc and a two-line body. The `sd-skeleton-row` host carries `.skeleton-row` and its children the `.skeleton`, `.skeleton--time`, `.skeleton--disc`, `.skeleton--text` and `.skeleton--text-sm` classes from `docs/mocks/styles/app.css`.

It has no inputs and no slots. The shimmer stops under `prefers-reduced-motion`, and the row is `aria-hidden` — announce loading with `sd-status-row`.
