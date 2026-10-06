"How families see it" on the admin Place photos screen (L2-114). `sd-slot-preview` carries `.preview-grid` from `docs/mocks/styles/app.css` and renders the place's primary photo in every slot the family app uses: the idea card at 16:9 (the same frame at 390 and 1440 px), the 4:3 thumbnails of the timeline stop and the cover picker, and the weekend cover with its scrim and "From {name}" line.

With `media` null every slot falls back to its tinted tile, so a curator sees exactly what a family sees today.
