# 06 · Strings and collections: toContain, toContainEqual, toMatch and toHaveLength

This video covers the four matchers the Saturdaze specs use when the value under test is a string, a list or a class list: `toContain`, `toContainEqual`, `toMatch` and `toHaveLength`. They look interchangeable, but each one compares in a different way, and picking the wrong one either fails for a confusing reason or passes when it shouldn't. By the end you will know which to reach for, and when to skip all four and compare a mapped array with `toEqual` instead.

## toContain is three matchers in one

`toContain` appears about sixty-five times in the specs, and it quietly changes behaviour with the type of the value you pass to `expect`.

Give it a string and it checks for a substring. The confirm dialog spec expects the dialog's text content to contain Delete Mae, and the reset password page expects the resend button's text to contain Sent. Text content often carries extra whitespace from the template, so a substring check is more forgiving than an exact `toBe`.

The component specs use the same idea for icons: they check that an icon's inner H T M L contains a fragment of the glyph's path data. That proves the right glyph is drawn without copying the whole S V G into the test.

Give it a class list and it checks for a class. In Vitest, `toContain` recognises a D O M token list, which is what an element's class list is. The media spec expects the host's class list to contain media fallback and media leaf. The activity card and food card specs do the same.

Give it an array and it checks membership with strict equality, the same comparison as triple equals. The icon spec loops over six names, sparkle, home, star, user, lock and check, and expects the exported icon names list to contain each one.

## Prefer toContain over contains then toBe

Compare two styles in the same library. The icon spec checks a modifier class by calling class list contains and expecting the result to be true. The media spec passes the class list straight to `toContain`.

Both pass when the class is there. The difference is the failure. The first fails with expected false to be true, which tells you nothing. The second fails with a message that prints the actual class list and the class it was looking for, so you see at once what the element did have. When the subject is a class list or a string, hand it to the matcher and let the matcher do the looking.

## The negative form

Every matcher has a `.not` form, and `.not.toContain` appears once, in the likes dialog spec. The test adds Beaches to the dialog's working list of likes, then expects the original likes array not to contain Beaches. That one line proves the dialog edits a copy, so cancelling leaves the caller's data untouched.

Use the negative form for that kind of claim, that something must not leak, not as a substitute for stating what the value should be.

## toContainEqual for objects in a list

Because `toContain` uses strict equality on arrays, it can never find an object literal you write in the test. A new object is never the same reference as one the code built. That is what `toContainEqual` is for: it checks that at least one element is deeply equal to the expected value.

There are three uses: two in the weekend projection spec and one in the activity service spec. The first activity of the day must carry the primary Day highlight chip, so the spec expects that block row's chips to contain an equal object with tone primary and label Day highlight. The next test expects a sky chip with a car icon labelled forty-five min drive. The activity service spec expects the first fresh activity to carry a First time chip.

Note what this does not say. It does not say the chip is first, or that it is the only chip. Use `toContainEqual` when the list can hold other items and their order doesn't matter to the behaviour.

## toMatch for patterns

`toMatch` takes a regular expression, and it is how the specs pin down values that are partly generated. There are twenty uses.

The clearest pattern is generated element ids. The chip input spec expects the field's id to match S D chip input, dash, one or more digits, anchored at both ends. The day, dialog, empty, section, seg radio, select and text input specs do the same. The number changes from run to run, so `toBe` is impossible, but the anchors still make the check strict: nothing before, nothing after.

The auth interceptor spec reads the first argument of the router spy and expects it to match a pattern that starts with slash sign in, question mark, return U R L equals. That proves the bounce goes to the sign in page and carries a return address, without hard-coding the encoded path.

One caution. The format spec checks a formatted date with patterns as loose as the single digit two, because the output depends on the locale. Loose patterns are fine when the exact string isn't yours to control, but a pattern that matches almost anything proves almost nothing. Anchor patterns whenever you can.

## toHaveLength

`toHaveLength` checks a length property. There are ten uses. The format spec expects twelve month abbreviations. The activity and events service specs expect three sections. The restaurant spec expects three picks in the first section and two in the second, and the shared weekend spec expects two days.

The icon spec instead reads the names list's length and expects it to be forty. That works, but `toHaveLength` reports a failure against the list itself, not just two numbers.

## When to use toEqual on a mapped array instead

Here is the most useful habit in this video. When order and completeness both matter, don't stack several `toContain` calls. Map the elements to the values you care about and compare the whole array with `toEqual`.

The past page spec does this with the filter chips. It maps each chip to its trimmed text and expects exactly All, Favourites, This year and five star. Then it maps the same chips to their aria pressed attribute and expects true, false, false, false. Four `toContain` calls would pass even with the chips in the wrong order or with an extra chip. The mapped `toEqual` fails in both cases, and the diff shows exactly which position differs.

## Pitfalls

A few pitfalls. Don't use `toContain` for objects in an array; it compares references, so use `toContainEqual`. Don't unwrap a class list into a boolean and assert true; pass the class list to `toContain`. Don't write unanchored patterns when you mean a whole value. And don't stack `toContain` calls when the order matters; map the list and use `toEqual`.

## Recap

Things to remember.

- `toContain` means substring for strings, class for a class list and strict membership for arrays.
- Pass the class list or string itself, so the failure shows what was there.
- `.not.toContain` proves nothing leaked.
- `toContainEqual` finds a deeply equal object anywhere in a list.
- `toMatch` with anchored patterns pins generated values.
- `toHaveLength` beats comparing a length with `toBe`.
- When order and completeness matter, map and use `toEqual`.

Next, in video seven, we look at asymmetric matchers: `expect.objectContaining`, `expect.any`, `expect.anything` and `expect.stringMatching`.
