The summary a form shows above its first field after a failed submit. The `sd-error-summary` host carries `.error-summary`, an alert panel (`role="alert"`, `tabindex="-1"`) with a title that counts the problems ("One thing to fix", "Two things to fix") and one link per problem.

`problems` is a list of `{ id, message }`. Following a link emits `problemSelected` with that `id`, so the form can move focus to the field. Call `focus()` when the summary appears so a keyboard or screen-reader user lands on it.
