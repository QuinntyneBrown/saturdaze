# 33 · Coding sd-page-header: the title, the actions and three slots

The S D page header component is the first thing on every core screen: the page's only h1, one subtitle, and the screen's actions. It is a lesson in responsive layout through content projection. Three named slots take the buttons, and the header arranges them differently on phones and on wider screens without the page doing anything. It also has an optional back link for drill down screens. In this video you will build it from its real source and walk through its six unit tests.

## Where it is used

Every core page starts with one. The Past page uses the simplest form: a fixed title, "Past weekends", and a bound subtitle. The Family page binds both from its view model. The Weekend page is the full form. Inside the header it projects three S D buttons: an icon only quiet button labelled "More options" into the more slot, an "Add to calendar" quiet button into the actions slot, and a primary "Share" button into the primary slot. Notice each button has its own if block. A single if wrapping several slotted nodes would lose the slot attributes, so the project rule is one if per node.

The Review submissions page uses the back link, pointing to the Family screen.

## Step one: the decorator

Create the page header file. The selector is S D page header, standalone, OnPush, and it imports the Button and Icon components, because the phone back button is an S D button.

The host carries the class page header, the B E M block from the mock, and nothing else. The title and subtitle inputs are not mirrored onto the host: a title attribute there would put a native browser tooltip over the whole header, and nothing reads it. A D R nine keeps inputs as inputs; only the mock's classes and aria state go on the host.

## Step two: inputs and inject

The class injects the router with the inject function, marked optional. Then four string inputs.

Page title is aliased to title. A field named title would shadow the native title property of the element, so the class uses page title and templates still write title. Subtitle is a plain string. Back href is empty by default, and empty means no back affordance at all. Back label defaults to the word Back.

There are no outputs: buttons in the slots bring their own click handlers. And there is no computed signal, because the one derived string, "Back to" plus the back label, is a simple expression in the template.

The on back method is the same pattern you saw in the list item. If there is a router, it hands the click to the shared navigate in app helper, so a plain click is routed inside the app while modifier clicks keep their browser meaning.

## Step three: the template

The template has three regions. The first is the text column. Inside it, when back href is set, an anchor with the eyebrow class shows an arrow left icon and the back label. It also carries a utility class that hides it below seven hundred and twenty pixels. Then the title row. When back href is set, it starts with a ghost, icon only S D button, labelled "Back to" plus the back label, linking to the same href, and hidden from seven hundred and twenty pixels up. Then the h1 with the page title. Below the title row, the subtitle paragraph renders only when there is a subtitle.

So the back affordance exists twice, but only one is ever visible: an eyebrow link on wide screens and a compact icon button on phones. Both have accessible names.

The second region is the more div, holding the more slot. The third is the actions div, holding the primary slot followed by the actions slot. Each slot is declared exactly once.

## Step four: responsive styles

On phones, the host is a two column grid. The text sits in column one, the more button in column two beside the h1, and the actions span the full width on the second row as a two column grid. The actions div sets the button height knob, S D button height, to forty four pixels for comfortable touch targets.

Projected S D buttons are display contents, so their inner button elements are the real grid items. The style sheet reaches them with ng deep, scoped under the actions class. The primary button spans both columns and moves first with a negative order. A lone button also spans the row.

Empty regions hide themselves with a has selector: if the more or actions div has no children, it is display none.

From the tablet breakpoint, through the respond to mixin, the host becomes a wrapping flex row aligned to the bottom. The text takes the space it needs, the actions line up at the end, the button height drops to forty pixels, and the eyebrow link appears while the phone back button hides.

Colours and type use tokens by role: font size hero seven hundred for the title, neutral foreground two for the subtitle and eyebrow.

## Unit tests

The spec file provides an empty router and a host component that projects a primary, an actions and a more button into a header titled "This weekend".

"Creates with an empty h1 and no back affordance" proves the defaults: the class, an h1, no eyebrow, no back button, and no subtitle.

"Renders the title and subtitle" sets both with set input and checks the rendered text in the h1 and the subtitle paragraph.

"Renders the eyebrow link and the phone back button from back href" checks the eyebrow's href, text, hide class and icon, then checks the S D button's inner anchor: its href, its aria label, "Back to Family", and the icon button class.

"Draws the arrow glyph inside the phone back button" confirms the projected icon reaches the button.

"Routes a plain click on the eyebrow through the router" spies on navigate by U R L and checks that the default was prevented.

And "projects primary, actions and more into their regions" renders the host component and checks that the primary button comes first in the actions region, the quiet button second, and the more button sits in its own region.

## Pitfalls

- Wrapping several slotted buttons in one if block; the slot attribute is lost.
- More than one primary button, or more than two quiet actions.
- An icon only more button without a label.
- Styling the projected buttons from the page instead of letting the header lay them out.

## Recap

Things to remember.

- One header per screen, holding the page's only h1.
- A title alias, nothing mirrored onto the host, and an optional router.
- Three slots, each declared once: primary, actions and more.
- The back affordance renders twice and shows once, both named.
- The phone grid and the tablet flex row come from the same markup, sized through the S D button height knob.

Next, in video thirty four, we build S D past card, a card where every control emits.
