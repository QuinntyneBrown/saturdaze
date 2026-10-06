# 13 · Coding sd-chip-input: a tag editor built on signals

S D chip input is a tag editor: the current values as removable chips, followed by a bare text box that adds a value when you press Enter or type a comma. In the app it lives in the likes dialog, once for likes with the leaf tone and once for dislikes with the warn tone, each bound with N G model. It combines the forms contract from the checkbox with the chip and its remove output. You build it, then walk through its nine tests.

## The decorator

Open the chip input component file. Above the decorator sits a module level counter called next chip input id, starting at zero.

The decorator has the selector S D chip input, standalone, and OnPush, and it imports the chip component. The host has the static class field, because in the mock the chip input sits inside a field block. It no longer mirrors label and tone as host attributes: nothing read them, so they stay plain inputs, as A D R nine asks. The providers array registers the class as an N G value accessor with forward ref and multi, exactly as the checkbox does.

## Inputs and local state

There are three inputs with defaults: label, empty; tone, a chip tone that defaults to leaf; and placeholder, add one, press Enter.

Then four protected members. The first is a plain string, not a signal: an id built from the prefix S D chip input and the counter, incremented once per instance. It never changes, so it need not be reactive, and it links the label to the text box.

The other three are signals. Values holds the read only array of committed tags. Draft holds the text being typed. Disabled holds the form's disabled state. All three are owned by the component and written by its own methods, which is exactly what the signal function is for. As with the checkbox, the value is not an input or a model, because the form owns it.

## The behaviour

Now the methods. On draft copies the text box value into the draft signal on every input event. On key handles the keyboard. Enter or a comma prevents the default, so no form submits and no comma appears, and then commits. Backspace with an empty draft removes the last value.

Commit trims the draft, returns early if it is empty, adds it only if no existing value matches ignoring case, and clears the draft. Remove at returns early when disabled, and otherwise filters out the value at that index.

Both paths go through one private method called set. It sets the values signal, calls on change with a fresh copy of the array, and calls on touched. Copying matters: the form never receives the same array the component holds, so neither side can mutate the other's state by accident. Write value does the same in reverse: it copies the incoming array, or uses an empty array for null.

Notice that there is no effect anywhere. Every state change happens in an event handler, so there is nothing to synchronise after the fact. Reach for effect only when you must push signal state into something outside Angular's templates.

## The template

The template opens with an if block on label. When there is a label, it renders a label element with the field label class, whose for attribute points at the generated id.

Then the chip input block. A for loop renders one S D chip per value, tracked by the value itself, which is safe because values are unique. Each chip gets the tone, the removable flag, a remove label of the word Remove followed by the value, and its remove output calls remove at with the loop index. So a screen reader hears remove parks, not just remove.

After the chips comes the native text input, with the generated id. Its value is bound to the draft signal, which is how commit clears the box. Input calls on draft, keydown calls on key, and blur calls commit, so a typed value is not lost when you tab away.

## Styles

The host is a flex column. The label uses the font size base three hundred and font weight medium tokens. The chip input block is a wrapping flex row, at least forty four pixels tall, with neutral background one, neutral stroke one and border radius medium. When anything inside has focus, the focus within rule switches the border to brand stroke one and draws a three pixel ring in brand stroke two. That is why the bare text box can drop its own outline: the whole field shows focus instead.

## The spec

Open the spec file. There is no host component this time. Before each test, the test bed creates the chip input, registers a vitest mock as on change, writes Parks and Pizza, and runs detect changes. A type helper sets the box value, dispatches an input event and runs detect changes. A key helper dispatches a cancelable keydown and returns it, so a test can check whether default was prevented.

Creates a leaf toned field with the written values as removable chips checks the defaults: the field class, a remove button and the leaf tone class on every chip, the remove label Remove Parks, and the placeholder. Links the label to the bare input and forwards tone and placeholder sets three inputs, then checks that the label's for matches the input id, and that the id matches the S D chip input pattern. It also checks that every chip now carries the warn tone class and none is still leaf.

The next four cover typing. Adds the draft on Enter, clears the input and swallows the key checks the new chip, the value sent to the form, the empty box and default prevented. Adds on comma and on blur, trimming whitespace types a padded value and expects it trimmed. Ignores blanks and case insensitive duplicates types spaces, then pizza in lower case, and expects nothing to change and on change never called. Removes the last value on Backspace when the draft is empty also proves that Backspace does nothing while there is draft text.

Removes a value when its chip cross is pressed clicks a remove button. Disables the input and ignores removals from the form proves the early return. And replaces the values on a later write value and clears on null proves the form can reset the control.

## Pitfalls

- Don't make the values a model or an input. The form owns them; the component holds a signal copy.
- Always copy arrays across the forms boundary.
- Prevent default on Enter and comma, or forms submit and commas leak into tags.
- Generate a unique id per instance, or several labels point at the same box.
- Don't add an effect to sync state that an event handler can set directly.

## Recap

Things to remember.

- Signals for owned state: values, draft and disabled.
- One private set method updates the signal and notifies the form.
- Event handlers, not effects, drive every change.
- The chip's remove output wires straight to remove at.
- A generated id links the label, and focus within draws the ring.

Next, video fourteen builds S D copy field, a read only value with a copy button and a timed confirmation.
