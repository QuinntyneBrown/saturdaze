Pages through a long list: the rows on screen ("51 to 100 of 120") with Previous and Next. `sd-pager` carries `.pager` from `docs/mocks/pages/admin.places.html` and is a `navigation` landmark named by `label`.

The pager does not own the page. It emits `pageChange` with the page to show, and the screen applies it, usually through the address (`?page=2`), so a page is a link and the back button works.
