# 03 · Alias tokens and the theme

Video two gave us raw values. Raw values alone can't answer the question a component asks, which is: what colour should my secondary text be? This video is about the layer that answers that question, the alias tokens, and about the function that assembles everything into one complete theme. By the end you will be able to read every line of the alias folder and the create light theme function, and you will know how to re brand the whole app by changing one argument.

## What an alias token is

An alias token is a role with a value picked from the global layer. The name says what the token is for. The value says which raw colour currently plays that role.

Here is the important design choice. In Saturdaze, alias colour tokens are not written as a static list. They are computed by a function that takes a brand ramp as its argument. That single choice is what makes re branding possible. Let's open it.

## Generating the colour roles

Open `lightColor.ts` in the alias folder. It exports a function called `generateColorTokens`. It takes a brand ramp, and it returns an object that satisfies the colour tokens interface from `types.ts`.

Read the neutral tokens first. Neutral foreground one is slate seventeen, the body ink. Foreground two is slate forty six for secondary text and metadata. Foreground three is slate sixty five for hints, placeholders and disabled text. And foreground on brand is white, the text colour that sits on a coral button.

Backgrounds follow the same pattern. Background one is white, used by cards, dialogs and inputs. Background two is cream, the page itself. Background three is sand, for recessed wells. There is also an inverted background for selected filter chips and tooltips, and an overlay colour, slate at forty percent, for the dialog backdrop.

Each line has a short comment saying where the role is used. Copy that habit. A role without a documented use is a role nobody will pick correctly.

## Brand roles come from the ramp

Now the brand roles, and this is the heart of the file. Every brand token reads a step from the brand argument, never a literal colour.

Brand foreground one, brand background, brand stroke one and the focus stroke all read step eighty. Brand foreground two reads step seventy, the darker coral that passes double A contrast on the soft fill. Brand background two and brand stroke two read step one sixty, the soft fill.

Two tokens are computed rather than picked. The hover background uses the CSS `color-mix` function to mix ninety four percent of step eighty with six percent black, so hover is always a touch darker than whatever the brand is. And the brand background gradient layers two radial gradients, one using brand step one sixty and one using the sun palette's soft tint.

Finally, three shadow colours, ambient, key and key darker, read slate at four, six and twelve percent. Keep those in mind, because the shadow tokens are built from them in a moment.

## Palette and status roles

Open the second alias file, `lightColorPalette.ts`. It handles the weather and category tones, and the success and danger states.

At the top is a small helper called `roles`. It takes a prefix and one of the three shade palettes from video two, and returns six tokens. Background one is the soft tint. Background three is the saturated primary. Foreground one is the dark shade forty ink. Foreground three is the primary. Border one is the tint, and border active is the primary.

Then two lookup tables. Palettes maps the names sun, sky, leaf and indoor to their global colours. Statuses maps success to forest green, and danger to terracotta. The file runs the helper over each table and merges the results. So you get tokens like colour palette sun background one, and colour status success foreground one.

The comment states the usage rule: always pair background one with foreground one, because that ink is chosen to pass double A contrast on that fill. A pairing rule like that is exactly the kind of knowledge a token system should carry for you.

## Types that check generated names

Here is a TypeScript detail worth learning. These token names are built with string templates, so how can the compiler check them? Look at `types.ts` again. The palette tokens type is a record whose keys are a template literal type: colour palette, then one of the palette names, then one of the six role names. Four names times six roles gives twenty four keys, and the compiler knows every one of them. Status tokens work the same way with two names, giving twelve keys.

So even though the alias file builds names in a loop, any component or story that reads `theme.colorPaletteSunForeground1` gets autocomplete, and a typo is a compile error.

## Shadows from shadow colours

Open `shadows.ts` in the utils folder. The function `createShadowTokens` takes the three shadow colours and returns three elevation levels. Shadow four is a soft, low shadow for cards sitting on the cream page. Shadow sixteen is for hover and floating chrome. Shadow twenty eight is for dialogs and menus. The numbers are Fluent's elevation ranks.

Because shadows are built from alias colours instead of hard coded black, a future dark theme only has to supply darker shadow colours and every elevation follows.

## Assembling the theme

Now the function that ties it all together: `createLightTheme`, in `createLightTheme.ts` in the utils folder. It takes one argument, a brand ramp, and returns a complete theme.

First it calls generate colour tokens with the brand. Then it returns one object built by spreading every group into it: border radius, font sizes, line heights, font families, font weights, stroke widths, horizontal and vertical spacing, durations, curves, layout and z indexes. Then the colour roles, the palette roles and the status roles. And last, the shadow tokens, created from the three shadow colours it just generated.

The result is one flat object, with no nesting, and its return type is `Theme`. Remember from video two that `Theme` is the intersection of every token interface. So if you add a new interface to `Theme` and forget to spread it here, this function stops compiling. The type system guarantees every theme is complete.

Flat matters too. Each key becomes one CSS custom property with exactly the same name, so there is no translation step between TypeScript and CSS.

## The Saturdaze theme, and a re brand

Open `lightTheme.ts` in the themes folder. It is one line of real code: saturdaze light theme equals create light theme of brand saturdaze. That's the whole theme.

To re brand, you pass a different ramp. The tokens spec file in the same folder has a test called "re brands every brand role from a new ramp". It takes the coral ramp, swaps steps seventy, eighty and one sixty for blues, and checks that brand background, brand stroke one, brand foreground two and brand background two all became the new blues, while neutral foreground one stayed the same. The Storybook story for the theme provider does the same with a forest green ramp. Only the steps the alias tokens read need to change.

## Responsive overrides

One more file in the themes folder: `responsive.ts`. Fluent has nothing like it. It exports a list of overrides, and each override pairs a media query with a partial theme.

At seven hundred and twenty pixels and up, the layout gutter grows to twenty four pixels. At one thousand and twenty four pixels and up, the gutter grows to thirty two pixels and the display font sizes step up, so hero eight hundred becomes forty pixels. And on very small phones, below three hundred and eighty pixels wide, the two hero sizes step down so headings don't cramp.

The point is that components never branch their styles per breakpoint for these values. They read the same token everywhere, and the token itself changes. The spec file also checks that every override only retunes tokens the theme actually defines, which catches a typo in a key name.

## Recap

Things to remember.

- An alias token is a role whose value is picked from the global layer.
- Generate alias colours from a brand ramp argument, never from literals, and re branding becomes one argument.
- Document each role's use right next to it.
- Use template literal types so generated token names are still checked by the compiler.
- Build shadows from shadow colour tokens, so a dark theme only swaps colours.
- `createLightTheme` spreads every group into one flat object typed as `Theme`, so a missing group fails to compile.
- Responsive overrides retune tokens per media query, so components never branch.

Next, in video four, we read the generator script line by line, and see how this TypeScript theme becomes a stylesheet.
