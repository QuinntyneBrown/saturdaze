# 07 · Asymmetric matchers: objectContaining, any, anything and stringMatching

Most matchers compare the value under test with a value you wrote. Asymmetric matchers flip that around. You put them on the expected side, inside an object, an argument list or an array, and they match by rule instead of by equality: any string, anything at all, any object that has these properties. The Saturdaze specs use four of them, about thirty times in all. This video shows each one in a real spec, explains exactly how strict it is, and shows how they keep a test focused on the part of a value that matters.

## Why asymmetric

Think about what the app hands to a dialog or a menu. A call to open a dialog passes the dialog component and a config object. The config carries focus behaviour, panel classes, a backdrop class and the data. A test about the data should not break when someone changes the backdrop class.

You could pull the call out of the mock and assert on pieces of it, and the specs sometimes do. But often it is clearer to state the whole call in one `toHaveBeenCalledWith` and mark the parts you don't care about. That is where asymmetric matchers sit: as placeholders inside the expected value, in `toEqual`, `toHaveBeenCalledWith` and its nth and last called variants.

## expect.objectContaining

`expect.objectContaining` is the workhorse, with twenty-five uses across nine spec files. It matches any object that has the listed properties with equal values, and ignores every other property.

The ideas page spec shows the classic case. Suggesting an event opens the submit event dialog with the shared dialog options. Those options, defined next to the confirm dialog, carry four settings: auto focus, restore focus, the panel class and the backdrop class. The spec expects the first dialog call to have been the submit event dialog with an object containing the panel class and auto focus first tabbable. The other two settings can change without breaking this test. The second call is checked the same way, with an object containing the submission as data.

The commitment dialog spec uses it on a result. When the user saves, the dialog closes with an object, and the spec expects close to have been called with an object containing kind save, the title swim lessons exactly as typed, and the day Sunday. Whatever else the result carries is not the point of that test.

## How strict objectContaining is

Here is the detail people get wrong. `objectContaining` is partial only at its own level. For each property you list, Vitest checks the property exists, then compares its value with full deep equality.

Look at the family page spec. It expects the family member dialog to be opened with an object containing a data property, and that data is mode add with existing names Quinn and Mae. The config can carry any other keys, but data itself must equal that object exactly. If the page started passing an extra field inside data, this test would fail.

That is usually what you want: loose about the envelope, strict about the payload. If you need partial matching deeper down, nest another asymmetric matcher, or use `toMatchObject`, which is partial all the way down and was covered in video four.

## Nesting matchers

Asymmetric matchers nest anywhere a value can go. The weekend page spec checks the More options menu. It expects the menu's open call to receive any H T M L element as the anchor, and an object containing the title Weekend options and an items array. Inside that array are two more `objectContaining` matchers, one for the regenerate item and one for the calendar item, each matched by id alone.

Read that carefully. The array itself is a plain array, so it must have exactly two items in that order. Each item only needs the right id. Labels and icons can change freely. The test states the menu's structure and nothing more.

## expect.any

`expect.any` takes a constructor and matches any value of that type. For strings, numbers, functions and booleans it accepts the primitive as well as the wrapper object. It appears five times, with three constructors.

Any H T M L element is used twice, in the app spec and the weekend page spec. Both check a menu opened from a button, and the anchor element is an internal detail of the click; the test only needs to know an element was passed.

Any function appears in the scrolled spec. The directive adds a scroll listener on the window and removes it when destroyed. The listener is a local arrow function inside the directive, so the test can't get a reference to it. Instead it spies on remove event listener, destroys the fixture, and expects the spy to have been called with scroll and any function.

Any string appears twice in the session store spec, where the value is a timestamp. One test rehydrates a legacy token and expects the stored token to equal an object with the value legacy, an empty refresh token, and an expires field that is any string. The expiry is computed from the current time, so the test pins its type and the other fields exactly. Another expects the user's email verified timestamp to equal any string after verification.

## expect.anything

`expect.anything` matches any value except null and undefined. It has two uses, both in the weekend page spec. After choosing Add to calendar, the spec expects the dialog's last call to have been the calendar dialog with anything as the config. In the regenerate test, it expects the confirm dialog to have been opened with anything.

Why not just check the first argument? Because `toHaveBeenCalledWith` compares the whole argument list. Writing anything in the second position says there was a config, it wasn't null, and this test doesn't care what it was. The interesting assertions about the confirm dialog's data happen elsewhere, through a helper that reads the mock's calls.

## expect.stringMatching

`expect.stringMatching` takes a regular expression and matches any string that fits it. Its single use is in the weekend page spec. When you press the empty state's call to action, the page plans the coming weekend, passing the upcoming Saturday as an I S O date. That date depends on the day the test runs, so the spec expects plan to have been called with a string matching four digits, dash, two digits, dash, two digits, anchored at both ends. The shape is pinned, the moving value is not.

It is `toMatch` from video six, in placeholder form.

## Pitfalls

A few pitfalls. Don't assume `objectContaining` is partial all the way down; nested values are compared exactly. Don't scatter `expect.anything` until the assertion proves nothing; each placeholder is a statement that you don't care, so make sure that's true. Remember `expect.anything` rejects null and undefined, so it can't stand in for an optional missing argument. And `expect.any` needs a constructor; call it with nothing and it throws.

## Recap

Things to remember.

- Asymmetric matchers go on the expected side and match by rule.
- `objectContaining` ignores extra keys but compares listed values exactly.
- Nest matchers to be loose about the envelope and strict about the payload.
- `expect.any` pins a type: H T M L element, function or string.
- `expect.anything` is any value except null and undefined.
- `expect.stringMatching` pins the shape of a moving string.

Next, in video eight, we test promises and errors with `resolves`, `rejects` and `toThrow`.
