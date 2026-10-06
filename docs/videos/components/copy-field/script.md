# 14 · Coding sd-copy-field: async work, a timed signal and an output

S D copy field shows a read only value next to a copy button. In the app it has one job: the share dialog, titled share this weekend, passes it the weekend's share link, and the family can copy it with one click. When you press the button it writes the value to the clipboard, flips to a pressed state that says copied for two seconds, and emits an event. It is small, but it covers three things the earlier components did not: an async method, a signal that resets itself on a timer, and composing another library component, S D button. In this video you build it and walk through its four tests.

## The decorator

Open the copy field component file. The selector is S D copy field, standalone, OnPush. The imports array lists the button and the icon components, because the template uses both. The host carries the static class copy field, the block from the mock, and nothing else. The value is not mirrored as a host attribute: per A D R nine, inputs stay inputs, and a test or a page object reads the link from the rendered text.

## Inputs, output and local state

There is one input, value, a string that defaults to empty. There is one output, copied, typed as a string: it emits the text that was copied, so a parent could show a toast or record an event without reading the input back.

And there is one local signal, just copied, which starts as false. It is protected, because only the template needs it. This is the textbook case for the signal function: short lived state that the component owns, sets and clears itself. Neither an input nor a model would make sense, because no parent decides whether the button has just been pressed.

## The copy method

The copy method is async and returns a promise of void. It first reads the value signal into a local constant called text. Reading the signal once, at the start, means the text that is copied, and the text that is emitted, are guaranteed to be the same, even if the input changes while the clipboard call is in flight.

Then a try block awaits the clipboard's write text method. Notice the optional chaining on clipboard: in an insecure context the clipboard object may not exist at all. The catch block is deliberately empty, with a comment explaining why. Clipboard access can be denied, by an insecure context or by permissions, and in that case the value stays visible, so the user can select it by hand.

After the try block, whatever happened, the method sets just copied to true, emits copied with the text, and starts a two second timeout that sets just copied back to false. Because the component is OnPush and just copied is a signal read by the template, the timeout's set call alone is enough to re render. There is no change detector ref, no mark for check, and no zone trick.

## The template

The template has two parts. First, a span with the class copy field value that interpolates the value. Second, an S D button with the quiet variant and the label copy link, which the button turns into the accessible name. Its pressed input is bound to just copied, and the button mirrors that to aria pressed, so assistive technology hears the toggle. Its click calls copy.

Inside the button, an if block switches the content. When just copied is true, it shows a check icon and a span with aria live set to polite that reads copied, so a screen reader announces the confirmation. Otherwise it shows the copy icon and the word copy. Both branches go into the button's single default slot, so there is no slot repetition here: the if block is in the consumer, choosing what to project.

## Styles

The host is the grid: two columns, the value taking the remaining space with a min max of zero and one fraction, and the button sized to its content, with an eight pixel gap. The value is a forty four pixel tall box with border radius medium and neutral background three. It uses a monospace font stack, the font size base three hundred token, and clips long links with an ellipsis instead of wrapping. The min max of zero is what lets that ellipsis work inside a grid column.

## The spec

Open the spec file. Before each test, it creates a vitest mock for write text that resolves, and installs it on navigator with object define property, marked configurable so the next test can replace it. Then it creates the copy field, sets the value input to a share link with set input, and runs detect changes. A button helper finds the real button element inside S D button, and a flush helper awaits a few resolved promises, then runs detect changes, so the async copy method can finish. After each test, real timers are restored.

Creates a read only value with a quiet Copy button checks the starting state: the class, the value text, the quiet button class, the aria label copy link, aria pressed false, the text copy and the copy icon.

Writes the value to the clipboard and emits copied subscribes a mock to the output, clicks, flushes, and expects both the clipboard and the output to receive the link.

Flips to a pressed Copied state and reverts after two seconds is the timing test. It switches to fake timers for set timeout and clear timeout only, clicks and flushes, and checks aria pressed true, the text copied, the check icon and the polite live region. Then it advances time by one thousand nine hundred and ninety nine milliseconds and checks the button still says copied. One more millisecond, and it is back to copy with aria pressed false. Testing both sides of the boundary proves the duration exactly.

Still confirms when the clipboard is unavailable makes write text reject, and expects the output to fire once, the button to say copied, and the value to stay visible. That locks in the empty catch.

## Pitfalls

- Read the value once at the start of an async method, not after an await.
- Don't let a clipboard failure throw; keep the value selectable.
- The pending timeout is not cleared on destroy or on a second click. That is harmless here, but for longer timers, clean up with destroy ref.
- Announce the change with a polite live region, not only an icon swap.
- In tests, fake only the timers you need, and restore real timers afterwards.

## Recap

Things to remember.

- One input, one typed output, one local signal.
- Async copy with a forgiving catch, then confirm and emit.
- A timeout setting a signal is enough to re render under OnPush.
- Compose S D button: label for the name, pressed for aria pressed.
- Fake timers prove the two second boundary from both sides.

Next, video fifteen builds S D cover, the weekend photo header with a readable scrim and a tinted fallback.
