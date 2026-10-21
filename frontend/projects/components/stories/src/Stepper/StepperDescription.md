Progress through a short wizard, shown above the card of each onboarding step (Welcome). The page decides the step; `sd-stepper` only draws it.

The host carries the `.stepper` block from `docs/mocks/styles/app.css`: a `.stepper__label` reading "Step n of N" and an `aria-hidden` `.stepper__track` of `count` `.stepper__seg`s, the ones before the current step `.stepper__seg--done` and the current one `.stepper__seg--current`. The label is the accessible progress; the track is decoration.
