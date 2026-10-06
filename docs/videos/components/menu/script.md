# 32 · Coding sd-menu: actions, roles and arrow keys

The S D menu component is a short list of actions: the account menu with Family settings and Sign out, and the Weekend "More" menu with Regenerate and Add to calendar. On wide screens it is an anchored popover; on phones the same items render as rows in a bottom sheet. In this video you will build it from its real source, including arrow key focus handling, then walk through its seven unit tests.

## Where it is used

The menu is never placed by hand in a page. A service in the app shell, the menu opener, decides the form by width. Below seven hundred and twenty pixels it opens the menu dialog with C D K Dialog, and that dialog renders an S D menu with the sheet attribute, the items, the title as the label, and a select handler. From seven hundred and twenty pixels it attaches the menu to a C D K Overlay through a component portal and sets its inputs with set input. Either way, the caller gets a promise of the chosen item.

## Step one: the item type

Open the menu file. It exports an interface called menu item with six read only fields. Id, label and icon are required. Sub, a second line, is optional. Tone is optional, either default or warn. And href is optional: give it to items that only navigate, so they render as real links.

Driving the menu with data keeps every item consistent and lets the overlay set it with one input.

## Step two: the decorator

The selector is S D menu, standalone, OnPush, and it imports the Disc and Icon components.

The host is the B E M block, class menu, with role menu. A class binding adds menu double dash sheet for the sheet form. The aria label is bound to the label input, which defaults to the word Menu, so the menu always has a name. The sheet input itself is not mirrored onto the host: A D R nine keeps inputs as inputs, and the sheet class is all the styles need. And there is one host listener: keydown calls the on key method. Declaring it in host metadata, not with a decorator, keeps every host concern in one object.

## Step three: inputs, output and inject

The class injects two things with the inject function: the router, marked optional so the menu works in Storybook and tests, and the host element reference, typed as an element ref of H T M L element.

Then four inputs. Items is a read only array of menu items, defaulting to empty. Header is the line at the top, the account email. Label defaults to Menu. And sheet is a boolean with the boolean attribute transform.

The output is called select, typed as menu item. There is a lint suppression above it, with a comment explaining why: select is also a native D O M event name, and the angular eslint rule warns about that. Renaming it would break consumers, so the suppression is documented rather than silent.

## Step four: choosing and moving focus

The choose method emits the item on select, and if the item has an href and there is a router, it passes the click to the shared navigate in app helper. A plain click on an in app path is routed by Angular; a modifier click keeps its browser meaning.

The on key method handles focus. It returns straight away unless the key is arrow down or arrow up. It collects every element with role menu item inside the host, finds the one with focus, adds one or subtracts one, and wraps around with a modulo. Then it prevents the default scroll and focuses the next item. Every other key, like Tab, passes through untouched.

Notice this is plain D O M work in an event handler, not an effect and not a signal. Focus belongs to the browser, so the component reads it only when it needs it.

## Step five: the template

If there is a header, a paragraph with the menu header class shows it. Then a for loop over items, tracked by id. Tracking by a stable id lets Angular reuse rows when the list changes.

For each item, an href renders an anchor with the menu item class, the warn modifier when the tone is warn, role menu item, the href and the click handler. Otherwise it is a button of type button with the same classes, role and handler. Inside, the sheet form shows an S D disc with the item's icon, and the popover form shows a plain S D icon at size eighteen. The label follows, and in the sheet form only, the sub line.

The inner markup is repeated in both branches. That is acceptable here because there is no ng content; the declare slots once rule is about projection.

## Step six: the styles

The host is a flex column between two hundred and forty and two hundred and eighty pixels wide, on neutral background one, with a neutral stroke two border, a large radius and shadow twenty eight. Items use the medium radius, and their icons use neutral foreground two. The warn modifier switches the label and icon to status danger foreground one.

The sheet modifier strips the surface, and rows get bottom borders and a larger, semibold font.

## Unit tests

The spec file provides an empty router and three items: Family with an href, Share weekend, and Sign out with the warn tone. Every test starts with the items set.

"Creates a labelled menu with one menu item per entry" checks the class, the menu role, the default label, three items in order, and no header or sheet.

"Renders href items as anchors and the rest as buttons" checks tags and the button type.

"Shows the header line and the warn tone" sets a header and the label Account.

"Uses plain glyphs as a popover and discs with sub lines as a sheet" flips sheet on and checks the disc and the sub line, which Sign out doesn't have.

"Emits the chosen item" and "routes href items through the router on a plain click" check the output and the router spy, including that the default was prevented.

And "moves focus with the arrow keys and wraps around" dispatches arrow down, two arrow ups and a Tab on the host, checking the focused item after each, that arrow keys prevent default, and that Tab does not.

## Pitfalls

- Positioning the popover by hand in a page instead of using C D K Overlay.
- Forgetting the label; a menu needs an accessible name.
- Tracking items by index instead of id.
- Swallowing keys other than the arrows.

## Recap

Things to remember.

- A data driven menu: a typed item interface and a for loop tracked by id.
- Host metadata holds the role, the label, the sheet class and the keydown listener.
- Optional inject of the router, inject of the element ref, one select output.
- Arrow keys move real D O M focus and wrap; nothing is mirrored in signals.
- C D K Overlay or Dialog places it; the menu only renders.

Next, in video thirty three, we build S D page header, the title and actions at the top of every screen.
