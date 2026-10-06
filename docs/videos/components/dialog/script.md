# 19 · Coding sd-dialog: a presentational panel for CDK dialogs

In this video you will build S D dialog, the panel every Saturdaze modal is drawn in: a title, an optional subtitle, a close button, a body and an action row. Below seven hundred and twenty pixels it is a bottom sheet with a grip; from there up it is a centred modal. It appears in more than twenty files in the app's dialogs folder, from rename weekend to confirm and rating.

## Presentational, not a modal engine

The key decision comes first. S D dialog does not open anything. Real modals are opened with the Angular C D K dialog service, which owns the backdrop, the focus trap, the Escape key and the container with the dialog role. The app opens its dialogs with a shared options object, including the panel class S D dialog panel, which the global stylesheet uses to pin the sheet to the bottom edge or centre it. S D dialog only draws the panel inside. That is the project rule: use C D K Dialog and Overlay, and never hand roll a modal.

## The decorator and host bindings

Open dialog dot T S. The selector is S D dialog, the component is standalone, it imports the button and icon components, and change detection is On Push, like every component in this library.

The host object adds the class dialog, the B E M block from the mock stylesheet, so styles and end to end locators match the design reference, as A D R nine requires. It binds two modifier classes, dialog specimen and dialog wide, by calling the signals is static and wide. Notice what is not there: the inputs are not mirrored back onto host attributes. Only classes and ARIA state go on the host. Nothing read those attributes, and a reflected title attribute gave every dialog a native browser tooltip, so A D R nine now forbids it.

## Inputs, an output and inject

Two private fields use the inject function instead of constructor parameters: the host element, and the C D K dialog ref, injected as optional, because the panel also renders inline in Storybook and the dialogs gallery, where no ref exists.

The static input is a signal input with an alias: the public attribute is static, the property is static mode. It uses the boolean attribute transform, so a template can write the bare attribute and get true. Wide uses the same transform. The title input is aliased to a property called dialog title. Subtitle and close label are plain string inputs with defaults.

Then there is an injection token called S D dialog static. A provider can set it to true for a whole subtree, and the dialogs gallery page does exactly that. The computed signal called is static combines the input and the token, so the host and template read one derived value. That is computed's job: derived, memoised state.

The closed output uses the output function, not the Output decorator, and emits when the close button is pressed.

## After next render, not an effect

Accessibility needs one piece of DOM work. The C D K container has the dialog role, but it needs an accessible name. Each panel gets a unique title id from a module level counter. In the constructor, after next render runs once in the browser: it finds the closest ancestor with the dialog or alert dialog role and, only if that container has no aria labelled by yet, points it at the heading.

Why not an effect? There is no signal to react to, just one time DOM work after the first render.

The close method emits the output, then closes the ref if there is one, so the same component works inside and outside a C D K dialog.

## The template and its slots

In the template, the header holds an H two whose id is the title id, the subtitle paragraph only when the subtitle signal is not empty, and an S D button in ghost, small, icon mode, labelled by the close label input.

Then come three content slots, each declared once. The default slot fills the body. The actions left slot takes a destructive Remove button, and the actions slot takes the quiet and primary buttons. Declare each N G content once; a slot repeated inside conditional branches projects into only one of them.

## Styles: tokens by role

Open dialog dot S C S S. Every value is a token read by role: neutral background one for the panel, border radius extra large for the corners, shadow twenty eight for elevation, and duration normal with curve easy ease for the rise animation.

On phones the action row is a column. It sets the S D button height and width knobs, so every button is forty four pixels high and full width, and primary and danger buttons move to the top, near the thumb. The respond to mixin at tablet switches to a row, hides the grip, rounds all corners, and pushes the left actions to the left. The only N G deep reaches into the projected buttons to reorder them; everything else stays encapsulated.

## The spec file

The spec file has a small host component that projects a paragraph, a Remove button into actions left, and a Save button into actions. The main block creates the dialog with TestBed and runs detect changes.

Creates a panel with a heading and a close button checks the B E M structure, the close button's aria label, an empty heading, and that the host carries only the dialog class by default. Renders title and subtitle drives inputs with fixture dot component ref dot set input, the signal friendly way. Mirrors static and wide to host classes covers the modifiers. Emits closed when the cross is pressed subscribes to the output and clicks the inner button.

Three tests guard accessibility. One checks the heading id and that the panel never adds a dialog role of its own. Labels the surrounding C D K container with its heading wraps the component in a fake container and awaits when stable, so after next render has run. Leaves an existing aria labelled by on the container alone proves the guard.

Projects body, left action and actions into their regions renders the host and checks each slot. A second describe block provides a fake dialog ref and proves the cross both emits and closes the ref.

## Pitfalls

- Don't make S D dialog open itself; use the C D K dialog service and the shared options.
- Don't add a dialog role to the panel; the container already has it.
- Don't use an effect for the labelling.
- In a consumer, don't wrap several slot nodes in one if block; the slot is lost.

## Recap

Things to remember.

- S D dialog is presentational; the C D K owns backdrop, focus and Escape.
- Aliased signal inputs and the boolean attribute transform keep the template natural.
- A computed signal merges the static input and the injection token.
- The output function and an optional injected ref make close work everywhere.
- After next render labels the container once.
- Tokens by role, B E M classes from the mock, each slot declared once.

Next, in video twenty, we build S D disc, the small round badge, and see how fill and ink token pairs drive its variants.
