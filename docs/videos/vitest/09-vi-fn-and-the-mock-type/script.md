# 09 · vi.fn and the Mock type

This video is about `vi.fn`, the most used Vitest feature in the Saturdaze frontend after `expect` itself. It appears two hundred and thirty-three times across sixty-one spec files. You will see the three ways the specs create mock functions, how those mocks stand in for whole services through Angular's injector, and how to type them, from the strict `Mock` type to the loose shortcut most page specs use.

## What a mock function is

A mock function is a function that records every call. Each time it runs, it stores the arguments it received and the value it returned, on a property called `mock`. Later, matchers such as to have been called with read that record. That is the whole idea: a mock is a function you can interrogate afterwards.

`vi.fn` makes one. Called with nothing, it returns a mock whose implementation does nothing and returns undefined. Called with a function, it returns a mock that runs that function and still records every call. Either way, the result is callable anywhere a real function is expected.

## A bare mock as an output subscriber

The simplest use is in the copy field spec. The test writes the value to the clipboard and emits copied. It creates a bare mock with `vi.fn`, subscribes it to the component's copied output, clicks the button, flushes the pending promises, and then asserts the mock was called with the share link.

Nothing about the mock is programmed. It is only a listener that remembers. That pattern, a bare mock subscribed to an output, is how fourteen component specs test their outputs, twenty-five subscriptions in all: subscribe, act, then check the calls. Outputs created with the output function still support subscribe, which is what makes this work without a host component.

## A mock with an implementation

When the code under test needs a return value, give the mock an implementation. Look at the past page spec. Before each test it builds a fake saved service as a plain object. Load is a mock whose implementation is an async function that sets a signal to the ready view. Set filter is a bare mock. Set favourite, rate and rename are mocks that resolve to undefined. The weekend fake has repeat saved and remix saved, both resolving. The dialog fake has open, a mock that returns an object whose closed stream emits undefined.

Two details are worth copying. First, the fake load does real work: it moves the page from loading to ready by setting the same signal the fake list function returns. So the page renders exactly as it would against the real service, without any H T T P.

Second, list is not a mock at all. It is a plain arrow function that returns the signal. Only wrap a member in `vi.fn` when a test will assert on it or reprogram it. Plain functions keep the fake honest about what matters.

## Fakes through the injector

Those objects reach the page through Angular's dependency injection. The mount helper configures the testing module with providers that say: provide the saved service token, use the value saved; provide the weekend plan service token, use the value weekend; and provide the C D K Dialog class, use the value dialog.

This is the repository's interface driven services rule at work. Each service in the api library has a contract file with an interface and an injection token. The saved service contract ends by exporting the saved service token, typed with the interface. The app config binds that token to the real class with use existing, and the past page injects the token, never the class. So in a test, swapping the real service for a fake is one provider line.

The same move works for Angular and C D K classes. The menu opener spec provides a fake breakpoint observer whose is matched mock returns false, and a fake Dialog. The confirm dialog spec provides a fake dialog ref whose close is a bare mock.

## Why not vi.mock

Vitest has a module mocking feature, `vi.mock`, that swaps an entire import. The specs never use it. The dev state spec says why in a comment: the Angular unit test builder does not support it on relative imports. That is not a loss here. Injection tokens give you the seam without any module magic, the fake is an ordinary object you can read in the test, and the same technique works in every spec in the repository.

## Typing mocks strictly

By default a mock accepts any arguments and returns anything. Two component specs type their mocks precisely instead, and both import the `Mock` type from Vitest as a type only import.

The chip input spec declares on change as a Mock of a function that takes an array of strings and returns void. In before each, it assigns a call to `vi.fn` with that same function type as its type argument, then registers it as the forms on change callback. Now passing a number to it, or asserting it was called with the wrong shape, is a compile error.

The copy field spec does the same for the clipboard. Write text is declared as a Mock of a function taking a string and returning a promise of void. Before each test it is created with the same type argument and chained with mock resolved value undefined, then installed on navigator with object define property. The type argument is the function's signature, not its return value.

## The loose shortcut

Most page and dialog specs take a shortcut. They declare a fake's members with the return type of `vi.fn`. It appears sixty-seven times across thirty-five spec files. In the past page spec, weekend has repeat saved and remix saved typed this way, and dialog has open.

That type is a mock of any function: any arguments, any return. It costs nothing to write and lets you call mock return value once with whatever shape the test needs, which video ten relies on. The price is that the compiler no longer checks the fake against the real contract. The saved fake goes further and is typed any, because it only implements six of the service's members.

So choose deliberately. For a small, stable callback, such as a forms on change or the clipboard, use the strict `Mock` type. For a large fake service where a test only touches a few members, the loose type is pragmatic, and the page's own types still check the code under test.

## Pitfalls

A few pitfalls. Don't wrap every member in `vi.fn`; plain functions for values you never assert on keep the fake readable. Don't build a fake in a describe block body without resetting it, because it would carry calls from one test into the next; build it in before each, as these specs do. Don't reach for `vi.mock`; provide a fake through the token. And don't forget that a bare mock returns undefined, so code that awaits it or reads a property from the result needs an implementation.

## Recap

Things to remember.

- A mock is a function that records its calls on its mock property.
- Bare `vi.fn` for listeners; `vi.fn` with an implementation when the code needs a result.
- Fakes reach the code under test through injection tokens and use value providers.
- No `vi.mock`; the builder does not support it on relative imports.
- The strict `Mock` type for small callbacks, the loose return type of `vi.fn` for big fakes.

Next, in video ten, we program those mocks: return values, resolved and rejected promises, and implementations, each with a once variant.
