# 41 · Design drift D46: a selected tab you can actually see

A segmented control is a track with a pill sitting on it. The pill tells you which option is on. This short video covers drift D46 from the design-system drift log: what drifted, why it matters, the fix in the mocks, the design system and the app, and the real tabs before and after, with the contrast measured on screen. Recorded as of October 2026.

## What drifted

Saturdaze has two of these controls. The Saturday and Sunday tabs on the Weekend screen, and the choice buttons in dialogs, such as Will they sign in. In both, the selected pill is white on a cream track, and the only thing that separates them is a soft shadow. On screen they look fine to most people. But measured, the white pill and the cream track differ by only a small step of lightness.

The design system had already added a one pixel edge in the accessible stroke colour to the selected pill. The mocks and the app had not.

## Why it matters

The success criterion is WCAG one point four point eleven, non-text contrast, at level double A. The part of a control that shows its state needs three to one against what sits next to it. For a person with low vision, or on a phone in sunlight, a shadow is not enough to tell which tab is on. Before the fix, the pill's fill measured one point one five to one against its track.

## The fix in code

The fix is the same one pixel line in three places. In the mocks' stylesheet, the selected tab and the checked choice get an inset edge of one pixel in the control line colour, the slate we introduced for field borders. In the design system, the tabs page's note that described this as a difference is removed. And in the app, the segments component and the segmented radio add an inset shadow of one pixel in the accessible stroke colour, after their existing soft shadow.

The acceptance test came first. It opens the Weekend screen and reads the selected day tab's box shadow, finds the one pixel inset edge, and compares its colour with the track's background, expecting at least three to one. A second test does the same for the chosen option in the Add a family member dialog. Both failed, because there was no inset edge in the shadow, and both pass now. Finally, the D46 row is gone from the drift log.

## Before and after

Here is the build from before the fix. This is the Weekend screen, zoomed in. The panel measures the selected Saturday tab: its fill against the track is one point one five to one, and it has no edge at all.

And here is the fix. The same tab now has a thin slate outline around the pill. The panel measures the edge against the track at three point two zero to one, which clears the three to one bar, and the fill is unchanged.

## Recap

Things to remember.

- The selected segment needs its own edge: a soft shadow and a small luminance step are not enough.
- A one pixel inset edge in the accessible stroke gives three point two to one on the track.
- The same line goes into the mocks, the design system and both segmented components.
- Failing test first, then delete the drift record.
