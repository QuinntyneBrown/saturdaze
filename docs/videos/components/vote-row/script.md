# 51 · Coding sd-vote-row: thumbs up, thumbs down, one output

S D vote row is the family's thumbs on a restaurant: one cell per family member, each with an avatar, a name, and a pair of thumbs up and thumbs down buttons. You see it at the bottom of every food card on the food ideas page. It is not used by pages directly; S D food card renders it, passes the votes, a disabled flag and a label built from the restaurant name, and forwards the vote change output. In this video you will build it from its real source, see why it is a controlled component with no local state, and walk through its spec.

## Types first

Open vote row dot T S. Before the component, the file exports two types. Vote is the union of up, down and none. Vote cell is an interface with three read only fields: the member's name, an avatar tone, which reuses the avatar's own tone type, and the current vote. Exporting them lets the food card and the page speak the same language.

## The decorator

The selector is S D vote row, standalone, On Push, and it imports the avatar and icon components. The host gets the class vote row, the B E M block from the mocks, and role group, so assistive technology treats the six or eight buttons as one labelled set. The aria label binds to the label input. That is the only binding on the host: the disabled flag is not mirrored as a host attribute. Inputs stay inputs, only classes and ARIA state go on a host, as A D R nine records, and disabled already lands where it matters, on each button.

## Inputs and output

Votes is an input holding a read only array of vote cells, defaulting to an empty array. Label defaults to "Family vote", so the group always has a name, and the food card overrides it with "Family vote for" and the restaurant title. Disabled uses the boolean attribute transform.

The output, vote change, carries an object with the member's index and the next vote. The doc comment states the rule: pressing the current vote clears it.

## Controlled, not stateful

Here is the key design decision. The component has no signal of its own and no model. It never changes the votes array. When you click, the cast method checks the disabled flag and returns if it is set. Otherwise it reads the member's current vote, falling back to none, and emits the index with the next vote: none if you pressed the direction that is already selected, otherwise the direction you pressed.

The parent owns the truth, saves the vote, and passes a new array back in. Because the input is a signal and the component is On Push, the new array re renders the row, and nothing can drift out of sync. This is the controlled component pattern, and for data that lives on the server, it is usually the right choice over a model signal with two way binding.

## The template

The template is a single at for loop over the votes, tracked by the member's name, which also exposes the index as i. Each iteration renders a cell div. Inside, an S D avatar takes the name and tone at medium size, then a span with the name, then a choice div with two buttons.

Both buttons have type button, so they never submit a surrounding form. Each has the base class vote row button plus an up or down modifier. Aria pressed is bound to whether the cell's vote equals up, or down, which makes each thumb a toggle button for screen readers. The aria label combines the name with "votes yes" or "votes no", because an icon alone has no accessible name. Disabled binds to the disabled signal, and click calls cast with the index and direction. Inside each button, an S D icon draws thumbs up or thumbs down at fourteen pixels.

## The styles

The host is a four column grid with an eight pixel gap, twelve pixels of top padding and a top border in neutral stroke two, so it sits as the footer of a card. The name is small, neutral foreground two, and truncates with an ellipsis so a long name can't break the grid.

The buttons are twenty eight pixel circles in neutral colours. The selected states are styled on aria pressed, the same attribute screen readers use. Pressed up uses status success background one with status success foreground one. Pressed down uses status danger background one with status danger foreground one. Those are fill and ink pairs, so contrast is correct by construction. Hover styles live in a hover media query and skip pressed buttons.

## The spec

Open the spec file. A constant holds three members: Quinn with no vote, Sara voting up, and Eli voting down. The setup sets the votes input with set input before the first detect changes, and helpers find the cells and the up and down button of a given cell.

"Creates a labelled group with one cell per member" checks the class, role group, the default aria label "Family vote", and the three names in order.

"Draws a medium avatar in each member tone" reads the rendered avatars, not their inputs: each one carries the tone modifier class for its member and the medium size class, and shows the initials Q, S and E.

"Names each thumb and reflects the current vote in aria-pressed" checks the labels, such as "Quinn votes yes", the icon names, the pressed states for all three members, and that all six buttons have type button.

"Uses the label input as the accessible name" sets a custom label.

"Emits the member index and the next vote, clearing a repeated vote" is the heart of the spec. It subscribes a spy and clicks through the cases: Quinn up gives up, then down gives down. Sara, already up, pressing up gives none. Eli, already down, pressing up gives up, and pressing down gives none. Notice that the inputs never change between clicks, which proves the component computes from the votes it was given, not from hidden state.

"Disables every thumb and swallows votes when disabled" checks that every button is disabled, and that a click emits nothing.

## Pitfalls

- Don't mutate the votes array in place. Emit, and let the parent pass a new array.
- Don't track by index; names give Angular a stable identity.
- Every icon only button needs its own aria label.

## Recap

Things to remember.

- Exported types keep parent and component in step.
- A controlled component: signal inputs in, one output out, no local state.
- Role group with a label; aria pressed on each thumb.
- Pressed styles read aria pressed and use fill and ink pairs.
- The spec proves the clear on repeat rule with a spy.

Next, in video fifty two, the last video in the series, we build S D well, the quiet note block.
