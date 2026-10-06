The weekend cover. The `sd-cover` host carries `.cover` from `docs/mocks/styles/app.css`: the weekend's cover photo at 16:9 on phones and 21:8 from 720px, its label ("From Terre Bleu", "Your photo") as a credit chip, and the date range, the page's `h1` title and the summary over a gradient scrim (L2-108).

The photo loads eagerly because it is above the fold. With no photo the cover is a tinted tile and the title is still the `h1`. Project the "Change photo" control into `[slot=edit]`; the Weekend screen's Add to calendar, Share and More sit in a row below it.
