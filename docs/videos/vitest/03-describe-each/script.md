# 03 · Table-driven tests with describe.each

Sometimes four methods behave exactly the same way and only their names and inputs differ. Writing the same two tests four times hides that sameness and lets the copies drift apart. Vitest's answer is a table: `describe.each` takes a list of rows and runs one block of tests per row. The Saturdaze frontend uses it exactly once, in the auth service spec, and that one use shows every part of the feature worth knowing.

## Four methods with one shape

Open the auth service in the api project and look at four methods: forgot password, resend verification, reset password and verify email. Each one posts a request body to its own endpoint under slash api slash auth, resolves with nothing on success, and on failure passes the error through the same helper, rethrow as auth error, which turns the backend's error body into an auth error with a code and a message.

Same shape, four endpoints. That is the signal that a table will pay for itself: the behaviour is identical and only the data changes.

## The table

Now open the auth service spec. Inside the outer `describe` for the auth service, `describe.each` is called with an array of four rows. Each row is itself an array with three columns: the method name as a string, the endpoint path, and an arrow function that calls the method with a sample request.

After the array come the words `as const`. That freezes every row into a read only tuple with literal types. Vitest's typings map the positions of a tuple onto the parameters of your callback, so the second column arrives as a string and the third as a function returning a promise, each with its exact type.

Then `describe.each` returns a function, and you call that with the block's name and its body, just like a normal `describe`.

## The title format

The name is a format string, percent s. Vitest replaces placeholders with the row's columns in order, so percent s becomes the first column, the method name. The four generated blocks are called forgot password, resend verification, reset password and verify email.

Percent s is the one placeholder this repository uses, but Vitest supports more: percent d for numbers, percent j for J S O N, and percent hash for the zero based index of the row. When rows are objects instead of arrays, you can write a dollar sign followed by a property name to pull that property into the title.

## The callback and its tests

The body receives one parameter per column. The first is named underscore name, because the title already used it and the body does not; the underscore tells the reader it is deliberately unused. The other two are path and call.

Inside, two ordinary `it` blocks. The first has a template literal title, P O S T s, followed by the path. It calls the method, expects exactly one request to the base U R L plus that path, checks the method is P O S T, answers with a two oh two, and expects the promise to resolve to undefined.

The second, rejects on an error response, answers the same request with a four hundred whose body has a code of token invalid, and expects the promise to reject with that same code and message.

Four rows times two tests is eight tests. In the report they read as auth service, forgot password, P O S T s slash api slash auth slash forgot password, and so on for every row. Each one passes or fails on its own.

## Why the calls are wrapped in arrow functions

Here is the subtle part. The table is evaluated when Vitest collects the file, before any test runs. At that moment the service variable is still undefined, because it is assigned in `beforeEach`.

So the third column cannot be a promise from calling the service. It has to be a function that will call the service later. When a test runs, `beforeEach` has already created a fresh auth service, and calling the arrow function reaches that fresh instance. If you ever need a value in a row that only exists after setup, wrap it in a function in the same way.

## A table or a loop?

The repository has a second way to repeat a check. The reset password page spec has one test called renders each of the five states for the design harness. It loops over an object of five states and their titles, mounts the page for each, and passes the state name as the second argument to `expect`, so a failure says which state broke. You will see that custom message again in video five.

The difference is reporting. The loop is one test: it stops at the first failing state, and the report shows a single name. The table creates separate tests, so every row runs and every failure is reported by name. Use a loop for a quick sweep where one failure is enough to investigate. Use `describe.each` when each row is a behaviour you would otherwise write as its own test.

## When not to use a table

The rest of the auth service spec stays hand written, and for good reason. Sign up, log in, refresh and log out each map responses differently: refresh maps any four oh one onto token expired, log in falls back to invalid credentials. Forcing them into a table would mean columns of expected results and branches in the body, and the tests would stop reading as sentences. A table is for identical behaviour, not for similar behaviour.

Vitest also has `it.each` and `test.each`, which repeat a single test rather than a block. Nothing in this repository uses them yet, but they follow the same rules.

## Pitfalls

A few pitfalls. Don't call the code under test while building the table; wrap it in a function so it runs after `beforeEach`. Don't let every row share one title; use a placeholder, or the report cannot tell rows apart. Don't add columns that switch the body's behaviour; split the table instead. And keep rows short enough to read at a glance.

## Recap

Things to remember.

- `describe.each` runs one block per row; the auth service spec has four rows and two tests each, eight tests in all.
- `as const` keeps each row a typed tuple, and the callback gets one parameter per column.
- Percent s in the title takes the first column; percent hash is the row index.
- Rows are built at collection time, so wrap calls in arrow functions.
- Tables are for identical behaviour; a loop is one test, a table is many.

Next, in video four, we compare the three equality matchers: `toBe`, `toEqual` and `toMatchObject`.
