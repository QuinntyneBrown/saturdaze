# 15 · Coding sd-cover: a photo header with a readable scrim

S D cover is the weekend cover: the large photo at the top of the weekend page. It shows the cover photo with a credit chip, and over a dark gradient at the bottom, the date range, the page's main heading and a one line summary. When the weekend has no photo, it becomes a tinted tile and the heading stays readable. The weekend page is its only user. It binds the media, the date range as the eyebrow, the headline as the title and the subtitle, and projects a quiet change photo button into the edit slot. In this video you build it from its three files. It has no spec file, so at the end we will talk about what one should cover, and where its behaviour is tested today.

## The decorator

Open the cover component file. Selector S D cover, standalone, OnPush, and it imports the icon component for the fallback tile. The host carries the static class cover, the block from the mock, and one class binding: the fallback modifier is on when there is no media. That single binding reads the media signal directly, with a not operator in front. It is too small to justify a computed signal.

The doc comment above the class is worth reading. It ties the component to requirement L two one hundred and eight, and it explains the two design promises: the photo is loaded eagerly because it is above the fold, and the scrim keeps white text at a contrast of four and a half to one over light and dark photos.

## Inputs

There are five inputs, all with defaults, and no outputs. Media is a card media object or null, and defaults to null. Card media comes from the media component: a source, alt text, a width, a height and a credit. Eyebrow is a string, for example sixteen to seventeen May. Subtitle is a string, and tone is a media tone that defaults to sky; it picks the fallback colour.

The fifth input is the interesting one. In the class it is called cover title, but it is declared with the alias option set to title. So a page writes title in square brackets, matching the mock's vocabulary, while inside the class the name cover title is unambiguous and cannot be confused with the title attribute every HTML element already has. Use alias sparingly, for exactly this kind of public naming.

There is no input required here, although a cover without a title would be odd. The weekend page always passes one, so the default of an empty string just keeps the component safe to render.

## The template

The template starts with a let declaration: let m equal media. This reads the media signal once, and gives the template a local name. Inside the if block on m, Angular narrows the type, so m dot source and m dot alt need no null checks.

When there is media, the template renders an image with the class cover image. It binds the source and alt text, and the width and height as attributes, so the browser reserves the right space before the image loads, with no layout shift. Loading is eager and fetch priority is high, because this is the largest thing above the fold. If the media has a credit, a span with the media credit class shows it.

The else branch renders the fallback: a div with the cover fallback class, plus a tone class built by a class binding from the tone input. It is marked aria hidden, because it is decorative, and it holds a forty pixel sparkle icon.

Then the body: an optional eyebrow paragraph, the heading level one with the cover title, and an optional summary paragraph. The heading is always rendered, with or without a photo, so the page keeps its only level one heading.

Last, the edit slot. A div with the cover edit class holds a single content projection that selects elements with slot equals edit. It is declared once, outside every branch, as the project rule requires.

## Styles

The stylesheet starts by using the breakpoints partial. The host declares a component knob, dash dash S D cover scrim, built with color mix from neutral foreground one at seventy eight percent. Knobs like this keep the S D prefix, because they belong to the component, not the theme. The host is positioned, clips its overflow, has an aspect ratio of sixteen by nine, border radius large and a neutral background.

Each fallback tone is a fill and ink pair, for example palette sky background one with palette sky foreground one. The credit chip and the body both use the scrim. The body is pinned to the bottom with a linear gradient from the scrim colour at fifty five percent up to transparent, and its text uses neutral foreground on brand. A comment explains that the dark end sits under the text, so it reads at four and a half to one whatever the photo. The title uses the font size base six hundred and bold weight tokens.

Finally the respond to mixin, with tablet. From seven hundred and twenty pixels the host switches to a twenty one by eight aspect ratio and the body gets more padding. The number seven hundred and twenty never appears in the component; it lives in the breakpoints partial.

## Testing it

The cover folder has no spec file. If you add one, follow the pattern from the other videos: a host component that projects a button into the edit slot, and set input for the rest. It should prove that with media the image renders with its source, alt, width and height, eager loading and high fetch priority, and the credit chip only when a credit exists. Without media, the host gets the fallback modifier, the fallback tile carries the tone class and aria hidden, and no image renders. The title input, through its alias, fills the heading in both states. The eyebrow and summary disappear when empty, and the edit slot receives the projected button.

Today this behaviour is covered end to end instead. The Playwright weekend cover spec checks that the cover leads with the photo, its credit, the dates, the title and the summary; the sixteen by nine and twenty one by eight ratios; and that with no stop photos the fallback shows and the title stays the heading. A unit spec would catch the same regressions faster.

## Pitfalls

- Don't drop the width and height on the image, or the page jumps as the photo loads.
- Don't lazy load the cover. It is the largest content above the fold.
- Keep the title rendered in both branches. It is the page's only level one heading.
- Don't hard code the breakpoint; use the respond to mixin.
- Keep the fallback aria hidden. It is decoration, not content.

## Recap

Things to remember.

- One host modifier, bound straight to the media signal.
- An input alias keeps the public name title and a clear class name.
- Let plus if reads the signal once and narrows the type.
- Explicit dimensions, eager loading and high fetch priority for the hero image.
- A scrim knob, tone pairs and the respond to mixin keep it readable and responsive.

Next, video sixteen builds S D date tile, the small calendar style month and day badge.
