import { ChangeDetectionStrategy, Component } from '@angular/core';

import { PhotoSuggestions } from 'components';

@Component({
  imports: [PhotoSuggestions],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-photo-suggestions
      label="Suggest photos"
      state="done"
      heading="From the web"
      selected="a"
      [suggestions]="tiles"
    />
  `,
})
export default class PhotoSuggestionsScenario {
  protected readonly tiles = [
    { id: 'a', src: '', caption: 'Wikimedia Commons', label: 'Lavender rows · Wikimedia Commons' },
    { id: 'b', src: '', caption: 'Terre Bleu', label: 'Farm at dusk · Terre Bleu' },
    { id: 'c', src: '', caption: 'Unsplash', label: 'Lavender close-up · Unsplash' },
  ];
}
