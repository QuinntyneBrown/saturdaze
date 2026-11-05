# 47 · Couples dates: the frontend and tests

This is the last of three videos on couples dates in Saturdaze. The product video showed what a date is; the backend video showed how one is planned. This one walks the Angular side: the API library's contract and projections, the Weekend page's new action, the dialogs, the date's own screen, the small changes to Food and Past, and the Playwright tests that drive it all through page objects.

## The API library

Everything starts in the api library, so pages never touch HTTP themselves. Couple date DTO mirrors the server's shape: the date with its attendees, restaurant, activity, steps and who needs care, plus the planning summary of adults and whether a date can be planned. Couple date view is what a page renders: a headline like Dinner date, a subtitle with the day, the compact time range and the names joined with and, each step with its clock, duration, icon and reason, and the care banner's title and body.

The projection file turns one into the other. Compact range writes five fifteen to eight fifteen pm with the am or pm once, and and list writes Ada and Ben, or Ada, Ben and Cy. Past date line writes Sunday dinner at Snug Harbour, Ada and Ben, for the Past card.

The service follows the house pattern: a contract file declares the I date service interface and the DATE SERVICE injection token, and a concrete class implements it. The interface has planning, get, plan, move, regenerate, swap restaurant, swap activity, drop activity and cancel. A refused change, a four hundred or a four oh nine, rejects with a date refusal that carries the server's own words, so a page can show why rather than a generic error. Pages inject the token, never the class.

The weekend projection learned the new block kind. A Date block gets the heart icon, is neither swappable nor lockable, takes who is going from the first part of its reason, and gets two chips: Date, and Kids need care with the window when the reason says the kids need care.

## The Weekend page

On the Weekend page, Plan a date is a quiet button with a heart beside the other actions. It asks the service who can go, opens the plan date dialog with the answer, and when the dialog closes with a choice, posts the date once and navigates to its screen. A refusal shows in the page's existing warn banner. The date block's heart action, and its row's details, open the same screen.

The plan date dialog is D38. It has the meal and day as segmented radios, the adults as checkboxes with the first two ticked, and a ready signal that is true only when the family can plan and exactly two people are going. With fewer than two adults it renders D38b: the reason in a warn well, and everything disabled.

## The date's screen

The date page sits at weekend slash dates slash id, under the Weekend navigation item, so the four-item bar does not change. It loads the current weekend, finds the date, and renders the header with a back link to This weekend, the care banner, the steps as block rows, and the actions. The meal row offers Swap restaurant and the activity row Change activity; below seven hundred and twenty pixels each row's chevron opens the same dialog.

Every action is a dialog. Swap restaurant, regenerate and cancel use the shared confirm with helper with their copy from the mocks, cancel in danger red. Change activity opens its own small dialog with Swap activity and Drop activity. Move opens a dialog with the meal and day radios again. One change method wraps every call: it sets busy so the page shows Planning your date, replaces the date with what the server returned, and turns a date refusal into the warn alert's text.

## Food and Past

Two small changes finish the UI. Meal slot gains Breakfast, and the Food ideas page gets a Breakfast filter chip, with a Breakfast section beside Lunch and Dinner. The past card component gains a dates input and renders one date line per date, with a heart chip, and has a new story, With date, in Storybook. The Past page just passes each card's dates through.

## The tests

The end-to-end suite runs in Chromium through page objects: tests state intent, page objects know the DOM, and no selector lives in a test. A new date page object owns the date screen's steps, banners, buttons and dialog options; the weekend page object gained Plan a date, the date block, and the dialog's radios, people and well; the ideas and past page objects gained the breakfast section and the date line.

The couples date spec has six tests, each on a throwaway family created through the API by the couple date fixture: two adults and two children, or one adult for the D38b case. They plan a Sunday dinner through D38 and check the screen and the block's chips; see D38b refuse with one adult; swap the restaurant and drop the activity; move to Saturday lunch; cancel and find no block; and open Past with a date on the card. Because a past weekend can no longer get a date, that last test stubs the history response with one. The food spec gained a Breakfast case. The unit specs for the projection cover the formatting helpers.

## Recap

The api library carries the contract, the token and the projections, so pages stay thin. Plan a date and the date block live on the Weekend page, the date has its own screen under the same navigation item, and every edit is a CDK dialog with a refusal shown in the server's words. Breakfast reaches Food ideas and the date reaches Past. Page objects own the DOM, and six end-to-end tests plus the projection specs prove the behaviour.
