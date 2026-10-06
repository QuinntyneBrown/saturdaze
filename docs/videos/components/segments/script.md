# 38 · Coding sd-segments: router links or an ARIA tab list

The segments component is a pill shaped track of tabs, where the current tab lifts out as a white segment. It has two personalities. By default every tab is a real router link, and the current one is marked as the current page. In tabs mode the track becomes an ARIA tab list of buttons, with arrow key navigation and a two way bound selection. You will build S D segments from its real source, then walk through its spec file.

## Where it is used

The Ideas page shows Activities, Food and Events as router links, and lets the router decide which one is current. The Legal page switches between Terms and Privacy on a U R L fragment, which the router does not match on, so it names the active tab explicitly. And the Weekend page uses tabs mode for its Saturday and Sunday switch: it binds selected one way and listens to selected change, and each tab names the panel it controls.

## The tab type and the decorator

Open the file called segments dot T S. It exports an interface called segment tab. Every tab has a label. In nav mode it has a link, either a string or an array of segments, plus an optional exact flag and an optional fragment. In tabs mode it has a panel: the I D of the element it controls.

The decorator uses the selector S D segments, standalone, On Push, and imports router link and router link active. The host carries the class called segments, a narrow modifier class, the aria label, and a role computed from the mode: tab list in tabs mode, navigation otherwise.

## Inputs and the model

There are five inputs, all made with the input function. Tabs defaults to an empty array. Label defaults to the word Sections, so the navigation always has an accessible name. Narrow uses the boolean attribute transform, so a consumer can write the bare word narrow, as the Legal and Weekend pages do. Active is a string or null, where null means let the router decide. And mode is a union of nav and tabs, defaulting to nav.

Then the selected tab is declared with the model function. A model signal is a writable input: the parent can bind it, the component can set it, and Angular generates a matching output called selected change. That is why the Weekend page can bind selected and listen to selected change separately, and why you could also use the banana in a box syntax. Use model whenever a component owns a piece of state that its parent also wants to control. Use a plain input when the component only reads.

## Helper methods

Link of turns a tab's link into what router link wants: an empty array when there is none, the string as is, or a fresh copy of a read only array. Tab I D builds a stable button I D from the panel, or the label, plus the suffix dash tab.

The keydown handler is the interesting one. Arrow right steps forward, arrow left steps back, any other key returns. It prevents the default, wraps the index around the ends, sets the selected model to the next label, and then moves focus to that button, escaping the I D with C S S dot escape. Selection follows focus, which suits a small tab list where switching is cheap.

## The template

The template branches on mode. In tabs mode, an at for loop renders one button per tab with role tab, its I D, aria selected, aria controls pointing at the panel, and a roving tab index: zero on the selected tab and minus one on the others, so the whole list is one tab stop. Clicking sets the model; keydown calls the handler.

In nav mode, each tab is an anchor with router link and fragment. If an active label was given, aria current is set by comparison. Otherwise the anchor uses router link active with aria current when active set to page, and an exact match when the tab asks for one. Notice that nothing here uses ng content, so the slot rule does not apply: the branches render data, not projected content.

## The styles

Open segments dot S C S S. The host is the track: a flex row with four pixels of padding, a circular radius and the neutral background three fill. Each tab flexes equally to thirty six pixels high, with a short transition built from duration fast and curve easy ease.

The selected look is keyed off the A R I A state, not a class: aria current equals page, or aria selected equals true, gets the neutral background one fill, foreground one and shadow four. Styling the accessible state means the visuals can never disagree with what a screen reader hears. Hover only applies on devices that can hover, and on tablets the track caps its width at four hundred and twenty pixels, or two hundred and eighty when narrow.

## The spec file

Open segments dot spec dot T S. The setup provides the router with a catch all route, creates the component, sets three tabs through set input, and detects changes.

"creates a labelled navigation of real links" proves the default: the navigation role, the Sections label, and real link targets, including one built from an array link.

"mirrors narrow and the label" checks the modifier class and a custom aria label. "appends a fragment to the link" checks the Privacy tab's link ends in hash privacy.

"marks the explicitly active tab with aria-current" sets active to Food, checks only that tab is current, then sets an unknown label and checks none is.

And "lets the router mark the active tab when none is named" injects the router, navigates to the food U R L, waits for the fixture to be stable, and checks Food is current; then navigates back to ideas and checks the exact match makes Activities current.

Be honest about the gap: all five tests run nav mode. The tabs mode, with its roles, roving tab index and arrow keys, has no test in this spec file. A good addition would set mode to tabs and dispatch arrow key events.

## Pitfalls

- Leaving exact off a parent route like ideas. Every child route would mark it current too.
- Relying on the router for fragments. Fragments are not matched, so pass active instead.
- In tabs mode, forgetting the panel I D on each tab, which leaves aria controls empty.

## Recap

Things to remember.

- One component, two roles: navigation of links, or a tab list of buttons.
- Model gives a two way selected binding with a generated change output.
- Boolean attribute transform lets consumers write a bare narrow.
- Roving tab index and arrow keys, with focus following selection.
- Style the ARIA state, not a parallel class.
- The spec covers nav mode, including real router navigation.

Next, video thirty nine builds S D select, a native select dressed as a field and wired into Angular forms.
