# 01 · Design tokens: what they are and why

Welcome. This is the first video in a six part series on design tokens. By the end of the series you will understand every file in the Saturdaze token system, including the small Node script that generates the theme, and you will be able to build the same kind of system for your own product. This first video is about the ideas. No code yet, just the mental model you need for everything that follows.

## The questions this video answers

We will answer four questions. What is a design token? What problem does a token system actually solve? Why do we split tokens into layers? And how does a value travel from a TypeScript file all the way to a pixel on the screen?

## The problem: one name, many jobs

Let's start with a real story from this repository. Until `ADR-013` was accepted in October 2026, Saturdaze kept its styles in a hand written stylesheet full of CSS custom properties with names like `--sd-primary`, `--sd-ink-soft` and `--sd-fs-sm`. Those names describe a value family. Primary means "the coral colour". That sounds fine until you notice what the coral was used for.

The same `--sd-primary` was the fill of the main button, the colour of coral text, the colour of a coral border, and the focus ring. Four different jobs, one name. So what happens when a designer says: the button fill can stay, but coral text needs to be darker so it passes contrast? You can't change one job without changing all four. You end up hunting through component stylesheets, adding one off overrides, and the system slowly turns back into hard coded values.

There were two more problems. TypeScript code, like stories and the Storybook theme, could not read the stylesheet, so people copied hex values by hand. And the documentation pages parsed the stylesheet with regular expressions to list the tokens. Three copies of the truth, all drifting.

That decision record, `ADR-013`, lives in the docs folder under adr. It is short, and I recommend reading it after this video.

## What a design token is

A design token is a named design decision. It has three parts: a name, a value, and a role. The name is what code refers to. The value is what the browser finally uses, like a hex colour, sixteen pixels, or two hundred and twenty milliseconds. And the role is the job the token does, like "the background of the primary button" or "secondary text".

The key idea is that components never mention values. A button stylesheet does not say coral. It says: my background is the brand background, my text is the foreground that sits on brand. The value lives in exactly one place, and changing it changes every component that uses that role, and nothing else.

In the browser, Saturdaze delivers tokens as CSS custom properties, also called CSS variables. A token named `colorBrandBackground` becomes the custom property dash dash color Brand Background, declared on the root element, and a component reads it with the var function. Custom properties cascade and can be overridden on any element, which is exactly what makes theming possible later.

## Naming by role, not by value

Saturdaze copies its naming from Microsoft's Fluent UI version nine design system. Fluent names describe a role and a rank, not a colour. Let me read you a few. `colorNeutralForeground1` is the main body text. Foreground 2 is secondary text, and foreground 3 is hints and placeholders. `colorNeutralBackground1` is cards and dialogs, background 2 is the page, background 3 is recessed wells.

Brand tokens follow the same shape. `colorBrandBackground` is a coral fill. `colorBrandForeground1` is coral text. `colorBrandStroke1` is a coral border. Right now, three of those hold the very same hex value. That is the point. They are separate decisions that happen to agree today, so tomorrow they can disagree without touching a single component.

Notice the pattern: category, then concept, then a role like foreground, background or stroke, then a rank or a state like hover. Once you know the pattern, you can guess a token name without looking it up. That predictability is worth more than short names.

## The three layers

Tokens in this repo come in three layers, exactly like Fluent.

The first layer is global tokens. These are raw, theme independent values: a sixteen step coral brand ramp, named colour palettes like slate, cream and forest green, and ramps for font size, spacing, corner radius, stroke width, motion, layout and stacking order. Global tokens have no opinions about where they are used.

The second layer is alias tokens. These are the semantic tokens with role names, like neutral foreground one or brand background. An alias token's value is chosen from the globals. For example, brand background is step eighty of the brand ramp. This layer is where design decisions live.

The third layer is the theme. A theme is one flat, typed object with every token in it, built by a function called `createLightTheme`, which takes a brand ramp. Give it the coral ramp and you get the Saturdaze theme. Give it a green ramp and every brand role turns green.

The golden rule across all three layers: components only read alias tokens and ramp tokens like spacing and radius. They never read a raw palette colour.

## From TypeScript to pixels

So how does a value reach the screen? Follow the pipeline with me.

The source of truth is TypeScript, in the tokens folder of the components library. Because it is TypeScript, the types guarantee every theme has every token, and any TypeScript code can import the theme directly.

Then a small Node script, `generate-tokens.mjs`, loads that theme and writes two generated files. The first is `_tokens.scss`, a stylesheet that declares every token as a custom property on the root element, plus a few media query blocks for responsive adjustments. The second is `tokens.ts`, a typed object that maps every token name to its var reference, for styles written in TypeScript.

Both generated files say "do not edit" at the top. Continuous integration runs the same script in check mode, and fails the build if either file is out of date. So the only way to change a token is to change the TypeScript and regenerate.

Finally, components read the custom properties by role, and a small Angular directive called theme provider can override any subset of tokens on part of the page at runtime. That is the build time and run time halves of theming.

## Where this lives in the repository

Here are the exact places to look. The token source is in the frontend folder, under projects, components, source, lib, tokens. Inside it are folders named global, alias, themes and utils, plus `types.ts` which defines the shape of everything. The generator script is in the frontend scripts folder. The generated stylesheet is in the styles folder next to tokens. And the commands are `npm run tokens` to regenerate and `npm run tokens:check` to verify, both run from the frontend folder.

## The rest of the series

Here is the road map. Video two covers the global layer: ramps, palettes, and why the spacing ramp is private. Video three covers alias tokens and how `createLightTheme` assembles the theme. Video four walks through the generator script line by line. Video five shows how components, TypeScript and the theme provider consume tokens. And video six puts it all together as a step by step recipe you can follow to build a production design system from scratch.

## Recap

Things to remember.

- A design token is a named design decision with a name, a value and a role.
- Name tokens by role, not by value, so two jobs that share a colour today can diverge tomorrow.
- Three layers: global values, alias roles, and one flat theme object.
- Components read alias and ramp tokens only, never raw palette values.
- TypeScript is the source of truth; a script generates the stylesheet, and continuous integration rejects stale output.

Next, in video two, we open the global folder and look at every raw value the theme is built from.
