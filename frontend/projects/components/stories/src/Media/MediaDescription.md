A photo frame. The `sd-media` host carries `.media` from `docs/mocks/styles/app.css` and holds a place's photo at a fixed aspect ratio (`16:9` by default, `4:3` for thumbnails and pickers) with explicit `width` and `height`, so the layout never shifts while it loads (L2-101). The photo's attribution sits on the image as a `.media__credit` chip.

With no photo, or when the image fails to load, the frame becomes the tinted fallback tile (`.media--fallback` plus a tone) showing a category icon. The tile is decorative and `aria-hidden`; the card title next to it carries the meaning.

Idea cards (`sd-activity-card`, `sd-food-card`, `sd-event-card`) lead with one, flush with the card's top edge (L2-106).
