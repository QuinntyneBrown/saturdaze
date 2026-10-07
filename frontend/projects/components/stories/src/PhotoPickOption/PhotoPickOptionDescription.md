One choice in an `sd-photo-pick`: a 4:3 radio tile carrying `.photo-pick__opt` from `docs/mocks/styles/app.css`. The native radio covers the tile, so a click anywhere picks it and the arrow keys move through the group; `picked` emits the option's `value`.

The tile shows `src` as a plain cover-fit image, or `media` through `sd-media` (with its fallback tile when the photo is `null`). A `plain` tile is the dashed one with projected content instead ("No photo"). `caption` is the name chip in the corner; the picked tile gets a brand-stroke ring drawn over the photo.
