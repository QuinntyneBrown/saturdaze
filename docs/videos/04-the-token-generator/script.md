# 04 · The generator: generate-tokens.mjs

We now have a complete, typed theme in TypeScript. But browsers don't run our TypeScript before first paint, and stylesheets can't import it. Something has to turn the theme into CSS. In Saturdaze that something is a single Node script of about ninety lines, `generate-tokens.mjs`, in the frontend scripts folder. This video walks through it from top to bottom. By the end you will be able to write the same script for your own system, including the check mode that keeps continuous integration honest.

## Why generate at all?

You might ask: why not let JavaScript set the custom properties at runtime, the way Fluent's provider component does? Three reasons.

First, performance. A static stylesheet is parsed with the rest of the CSS, so the very first paint already has every token. Nothing waits for a script to run, and there is no flash of unstyled colour.

Second, one source of truth. The TypeScript theme stays the only place values are written. The stylesheet is an output, like compiled code.

Third, a typed object comes for free. The same script writes `tokens.ts`, so code written in TypeScript can refer to tokens without copying a single hex value.

Saturdaze still has a runtime half, the theme provider directive, which we cover in video five. But it only overrides a subtree. The baseline theme is always the static stylesheet.

## How you run it

The script is wired up in the frontend package dot json as two scripts. `npm run tokens` regenerates the files. `npm run tokens:check` runs the same script with a dash dash check flag, and fails if either generated file is out of date. Both pass a Node flag that silences a warning about module type detection, because the token sources are TypeScript files inside a package that does not declare a module type.

## The header comment

The script opens with a comment that tells you exactly what it does. It renders the TypeScript theme into the two generated files the rest of the workspace consumes: the stylesheet with the root custom properties and responsive retunes, and the typed tokens object. Then it lists the two commands.

Then comes a line worth reading twice: Node strips the token sources' TypeScript types natively, and the resolve hook only adds the dot T S extension that Angular style imports leave off. Let's unpack both halves of that sentence.

## Running TypeScript in plain Node

Modern Node can run TypeScript files directly by stripping the type annotations, with no compiler and no build step. It is on by default from Node twenty two point eighteen, and this repository runs Node twenty two. That means the script can import the real theme source files, not a compiled copy.

There is one snag. The token files import each other Angular style, without a file extension, for example importing from dot dot slash types. Node's module loader requires extensions. So the script registers a resolve hook with `registerHooks` from the node module package. The hook looks at every import specifier. If it is a relative path, starting with a dot, and it does not already end in a JavaScript or TypeScript extension, the hook retries the import with dot T S appended. Every other import passes through untouched. That is the entire hook, about six lines.

This is a nice pattern to remember. Instead of compiling your theme or duplicating it in JavaScript, you teach Node how to find the files, and you import the exact source the app uses.

## Loading the theme

Next the script works out where the library lives. It takes the script's own location, from `import.meta.url`, converts it to a path, goes up one level to the frontend folder, and resolves into projects, components, source, lib. A tiny helper called load turns a path inside lib into a file URL and dynamically imports it.

Then two awaits at the top level. The first loads the themes index and takes out `saturdazeLightTheme` and `responsiveOverrides`. The second loads `themeToCss.ts` and takes the serialiser function. Top level await is allowed because the file is an ES module, which is what the dot M J S extension means.

## The serialiser: themeToCss

Before going further in the script, open `themeToCss.ts` in the tokens folder, because that's where the actual CSS is written. It lives in the library, not the script, so it can be unit tested and reused.

The first function, `themeToCssVariables`, takes a partial theme and returns a new object where every key gets two dashes in front. So color brand background becomes dash dash color brand background, with the same value. Undefined values are skipped. This little function is shared: the generator uses it at build time, and the theme provider directive uses it at runtime.

A private helper called block turns a selector and a partial theme into one CSS rule: the selector, an opening brace, one line per custom property, and a closing brace, with an optional indent.

Then `themeToCss` itself. It takes a theme, a list of overrides, and a selector that defaults to colon root. It returns the root block, followed by one at media rule per override, each wrapping an indented root block with just the overridden tokens. The blocks are joined by blank lines.

The spec file pins this output exactly. Given a layout gutter of sixteen pixels and one override of twenty four pixels at seven hundred and twenty pixels, the test expects precisely a root block, a blank line, and a media block. When you write your own serialiser, write that test first.

## Building the two files

Back in the script. A small banner function builds the do not edit header from a comment prefix: three lines saying do not edit, generated by npm run tokens from the tokens folder, and change the TypeScript theme and regenerate.

The stylesheet string is the banner, a short explanation of how components consume the variables, a note that breakpoints live in the separate breakpoints stylesheet, and then the result of calling `themeToCss` with the light theme and the responsive overrides.

The TypeScript string is the banner, a type import of `Theme`, and an exported constant called tokens, typed as a record from every key of `Theme` to a string. Its body is built by taking `Object.keys` of the light theme and mapping each key to a line: the key, a colon, and the string var, open bracket, two dashes, the key, close bracket. So tokens dot color brand background is literally the text var dash dash color brand background.

Then an outputs array pairs each target path with its source: the stylesheet goes to styles slash underscore tokens dot S C S S, and the object goes to tokens slash tokens dot T S.

## Formatting with Prettier

Here is a detail that saves a lot of pain. Before writing or comparing anything, the script formats each output with Prettier, using the repository's own Prettier configuration resolved for that file path. Why? Because continuous integration also runs a Prettier format check across the workspace. If the generator wrote output in a slightly different style than Prettier wants, then generating and formatting would fight each other forever. Formatting inside the generator makes the output stable: running it twice produces identical bytes.

## Write mode and check mode

Now the loop. The script reads whether dash dash check was passed. For each output, it formats the content, then reads the current file from disk. If the file is missing, that counts as stale. If the current content is identical to the new content, it moves on.

If they differ, behaviour depends on the mode. In write mode, it writes the new file and logs wrote, followed by the path. In check mode, it writes nothing. It marks the run as stale and prints an error saying the file is out of date and to run npm run tokens in the frontend folder. After the loop, if anything was stale, it calls `process.exit(1)` so the command fails.

That's the whole safety net. One script, two modes, no second implementation to drift.

## Wiring it into continuous integration

Open the C I workflow in the dot github folder. In the job named frontend build and unit tests, after the Prettier format check and the lint step, there is a step named design tokens up to date. It runs `npm run tokens:check` in the frontend folder. So if someone edits the generated stylesheet by hand, or changes the theme and forgets to regenerate, the pull request goes red with a message telling them exactly what to run.

## How the stylesheet reaches the app

The generated stylesheet is a partial, which is why its name starts with an underscore. `index.scss` in the styles folder forwards three partials: tokens, breakpoints and global. The app's root stylesheet, `styles.scss`, uses that styles folder once, and the Angular build configuration adds the components library folder to the Sass include paths so component stylesheets can use the breakpoints partial by name. So the custom properties land on the root element of every page, once, before any component renders.

## The everyday workflow

Putting it together, here is how you change a token in this repository. Edit the TypeScript in the tokens folder. Run `npm run tokens` from the frontend folder. Look at the diff of the two generated files; it should show exactly the change you meant. Commit the source and the generated files together. And if you forget, C I tells you.

## Recap

Things to remember.

- Generate a static stylesheet so first paint never waits on script.
- Import the real TypeScript theme from Node, using native type stripping and a tiny resolve hook.
- Keep the serialiser in the library, share it with the runtime provider, and pin its output with a test.
- Generate a typed object of var references alongside the stylesheet.
- Format generated output with the repository's Prettier config so it is stable.
- One script, two modes: write locally, check in C I, and exit non zero when stale.

Next, in video five, we look at the consumers: component stylesheets, the typed tokens object, and the theme provider that re themes part of a page at runtime.
