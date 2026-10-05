A read-only value with a Copy button — the weekend share link. Pressing Copy writes `value` to the clipboard, flips the button to a check and "Copied" for two seconds, and emits `copied` with the text.

The host carries the `.copy-field` block from `docs/mocks-v2/styles/app.css`: a `.copy-field__value` span and a quiet `sd-button` (`aria-pressed` while "Copied" shows). If clipboard access is denied the value stays on screen to select by hand, and the button still confirms. There are no forms bindings — pass the text with `value`.
