A grid of photo choices, exactly one of which is picked. `sd-photo-pick` carries `.photo-pick` from `docs/mocks/styles/app.css`: two columns, three from 576px. The grid is a `radiogroup` named by `label`; with `showLabel` the name is also printed above the grid as a field label, the way `sd-text-input` labels its field.

Project `sd-photo-pick-option`s, one per choice, and optionally an `sd-photo-drop tile` as the last cell for "your own photo". It picks the weekend cover in the family app (D29) and the next primary photo when an administrator removes the current one (AD5).
