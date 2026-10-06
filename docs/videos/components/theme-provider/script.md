# 47 · Coding sdThemeProvider: a directive that re themes a subtree

This video is a little different, because S D theme provider is not a component. It is an attribute directive with no template and no stylesheet. You put it on any element, bind a partial theme, and every component inside that element picks up the overridden design tokens through the normal C S S cascade. It is the Saturdaze version of Fluent's provider component.

Where is it used? Not in the app pages, and that is by design. The whole app already gets the light theme from the generated tokens stylesheet. The directive is for a section that must look different, and today you see it in the design system: the theme provider stories show a partial override on one card, and a full re brand to a forest green ramp. In this video you will build the directive in about fifty lines and read its two tests.

## The directive decorator

Open theme provider dot T S in the components library. The decorator is the directive decorator, not the component decorator. The selector is the attribute selector S D theme provider in square brackets, so it matches any element that carries the attribute, and it is standalone. There is no change detection setting, because a directive has no view of its own to check.

The doc comment shows the intended use: a section element with the directive bound to an object that sets only the brand background.

## Injecting the host and the renderer

The class starts with three private fields. The host is the element ref, obtained with the inject function and typed as an element ref of H T M L element. The renderer is Renderer two, also from inject. Using inject instead of constructor parameters keeps the dependencies next to the fields that use them, and works the same way in directives, components and functions.

The third field, applied, is a plain array of strings: the custom property names the directive wrote last time. It is not a signal, because nothing reads it reactively. It is bookkeeping for the next run.

## A required, aliased signal input

The only input is the theme. It is declared with input dot required, typed as a partial theme, with an alias equal to the selector, S D theme provider. Two best practices meet here. Required means a consumer who forgets to bind a theme gets a compile time error instead of silent nothing. And the alias lets the attribute name and the input name be the same thing in templates, so you write square bracket S D theme provider equals, while inside the class the property has the readable name theme.

Partial theme is simply a partial of the full theme type, so any subset of token names is allowed and checked.

## The effect that writes the tokens

Everything happens in one effect in the constructor. This is the textbook case for an effect: synchronising signal state into something Angular does not render for you, in this case inline styles on the host.

The effect takes the native element and converts the current theme into C S S variables with the theme to C S S variables helper, the same function the token generator uses. It turns a key like color brand background into a property name with two leading dashes.

Then it does two loops. First, for each name in the applied list that is no longer present in the new variables, it removes that style from the host. Second, for every name and value in the new variables, it sets the style. Both calls pass the renderer style flag called dash case, which tells Renderer two to treat the name as a literal C S S property, which custom properties require. Finally, the applied list is replaced with the new names.

Because the effect reads the theme signal, it re runs whenever the bound theme changes, and only then.

Why not a host binding? Host style bindings need property names known at compile time. Here the set of names depends on the theme object, so a small imperative effect is the honest solution. And why the renderer rather than writing to the element's style directly? Renderer two keeps the directive platform neutral, for example for server side rendering.

## Styles and accessibility

There are no styles in this directive, and no A R I A. The theme provider changes values, not structure. Components below it still read tokens by role, as A D R thirteen requires, so they work under the default theme and under any override without a single change.

## The spec

Open the spec file. Because a directive needs an element to sit on, the spec declares a tiny standalone host component. Its template is a div with the class probe and the directive bound to a theme signal. The signal starts with two keys: a green brand background and a four pixel small border radius.

The setup creates the host, runs detect changes, and then awaits when stable, so the effect has flushed before any assertion. Then it finds the probe element.

The first test, "writes each theme key to the host as a CSS custom property", reads both properties back from the element's inline style and expects the exact values.

The second test, "removes properties a new theme no longer sets", sets the signal to a theme with only a purple brand background, runs detect changes, awaits stability again, and checks two things: the brand background was updated in place, and the border radius property is now empty. That is the behaviour the applied list exists for.

Driving the input through a signal on a host component is the right pattern for directives, and it exercises the real binding rather than poking the directive instance.

## Pitfalls

- Don't wrap the app root. The root already has the theme, and doubling it only adds inline styles.
- Only tokens that components actually read will change anything. Override roles, not raw values.
- Remember the effect runs asynchronously with change detection, so tests must await stability.

## Recap

Things to remember.

- An attribute directive with a required, aliased signal input.
- Dependencies come from inject: the element ref and Renderer two.
- One effect syncs the theme to inline custom properties and removes stale ones.
- No host binding, because the property names are dynamic.
- Test directives through a host component and a signal.

Next, in video forty eight, we build S D toggle, a switch built on a real checkbox.
