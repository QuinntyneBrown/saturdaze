# 13 · Photo health and finding places

Video twelve showed the shell of Saturdaze Admin. This one covers the two screens a curator opens every session. Photo health, the admin home, answers one question per catalog: how many places can a family recognise at a glance? Places is where you find the ones that need you. Both screens are built on the same four health flags, evaluated by the same code on the server, so a number on the home screen always matches the list it opens. Everything on screen is the real app with the demo data, as of October 2026.

## Four health flags

A place's health is judged on its primary photo, the one families actually see. `PhotoHealth.Flags`, in the domain project, looks at that photo and returns the place's flags, worst first.

- No photo: the place has no primary at all, so families see the fallback tile.
- Blocked URL: there is a primary, but its address is not HTTPS on an allowed origin, so the family app would refuse to show it.
- Unreviewed: the primary is a provider photo that ingestion brought in, and nobody has reviewed it yet.
- Missing alt text: the primary has no alt text. Families still hear "Photo of" and the place name, but a curator should write something better.

The allowed origin check is not new code. It is `PlacePhotoReader.IsAllowed`, the same rule the family app projects photos through. The address must parse, it must be HTTPS, and its origin must be listed in `Saturdaze:Images:AllowedOrigins`. Admin reuses that rule, so blocked means exactly what a family would experience.

`PhotoHealth.Severity` turns the flags into a sort key: zero for no photo, rising through blocked and unreviewed to missing alt text, with healthy places last. That single ordering drives the home screen's worst first list and the Places screen's default sort.

## Photo health

This is the admin home. There is one card per catalog: activities, restaurants and upcoming events. The big figure counts places with a primary photo that actually shows; in the demo data, five of eight activities. Under it sit the four flag counts. A blocked primary is counted as blocked and never as a photo that shows, because a family would not see it. And when provider photos are waiting, the header offers to review them; here, four.

Below the cards is worst first: the six worst places, from the same health-first sort the Places screen uses. These are the places a family is most likely to hit without a photo this weekend. All places opens the full list.

Every figure is a link. Choose six without a photo on the restaurants card, and Places opens filtered to restaurants with no photo, with both of those filter chips already pressed. The count on the card and the length of the list agree, because `GetPhotoHealthQueryHandler` runs the same flag evaluation per place that the list runs. One detail: the events card only counts events starting today or later.

## Places

Places lists every catalog place, across all three catalogs, with the primary photo as a thumbnail through `sd-media`, the kind, the photo count and the health chips. Search is a case-insensitive name match. Type port, and you get the Port Credit restaurant and the farmer's market. Type bronte, and one park remains. The search box waits a quarter of a second after you stop typing, so it does not call the API on every keystroke.

The filter chips combine. Pick a kind: activities, restaurants or events. Pick a flag: no photo, blocked URL, unreviewed or missing alt text. Restaurants plus unreviewed leaves the two restaurants whose primary came from ingestion. The source chips filter on where the primary came from, curated or provider, and upcoming events only drops past events. The sort offers worst health first, name, or recently changed, and the list pages fifty at a time. A row opens that place's photos, which is video fourteen.

Here is the part worth copying into your own screens. The filters, the search and the sort all live in the query string. The page reads its query from the route's query parameters, treats that as the single source of truth, and writes every change back through the router. That is what makes the health card links work, and it means any filtered view is a link you can paste to a colleague.

On the server, `ListAdminPlacesQueryHandler` loads the places, applies the kind, upcoming and search filters, evaluates each place's flags against its photos, filters by flag and source, and then sorts. Look at the default branch: order by severity, then by name ignoring case. That is the rule the requirement spells out: no photo first, then blocked, then unreviewed, then healthy, with ties broken by name.

## Recap

Things to remember.

- Health is judged on the primary photo, with four flags: no photo, blocked URL, unreviewed and missing alt text.
- Blocked means the family app's own allow-list would refuse the photo, so a blocked primary never counts as shown.
- The home screen and the Places list share one evaluation, so every count matches the list it opens.
- Filters, search and sort live in the address, so every view is a shareable link.

Next, video fourteen opens a place: the slot previews, choosing the primary photo, editing details and removing photos.
