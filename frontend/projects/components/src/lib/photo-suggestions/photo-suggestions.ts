import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Banner } from '../banner/banner';
import { Button } from '../button/button';
import { Icon } from '../icon/icon';
import { PhotoPick } from '../photo-pick/photo-pick';
import { PhotoPickOption } from '../photo-pick-option/photo-pick-option';
import { Spinner } from '../spinner/spinner';
import { TextInput } from '../text-input/text-input';

/** One suggestion as a tile: the API's preview, the source name on the chip, and the radio's name. */
export interface PhotoSuggestionTile {
  readonly id: string;
  readonly src: string;
  /** The chip over the tile (the source name). */
  readonly caption: string;
  /** The radio's accessible name ("Lavender rows · Wikimedia Commons"). */
  readonly label: string;
}

export type PhotoSuggestionsState = 'idle' | 'loading' | 'done' | 'error';

/**
 * AI photo suggestions (L1-038): a search row, a live status line and a grid
 * of suggestion tiles. Mirrors `.photo-suggest` in docs/mocks/styles/app.css
 * (D29b, D27e, AD7). Presentational: the dialog that hosts it runs the
 * search through `IPhotoSuggestionsService` and feeds `state` and
 * `suggestions` back; `search` emits the query, `picked` the chosen tile.
 * The status line is a live region, so "Finding photos…" and the result
 * count are announced.
 */
@Component({
  selector: 'sd-photo-suggestions',
  standalone: true,
  imports: [FormsModule, Banner, Button, Icon, PhotoPick, PhotoPickOption, Spinner, TextInput],
  templateUrl: './photo-suggestions.html',
  styleUrl: './photo-suggestions.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhotoSuggestions {
  /** The search field's label ("Suggest photos", "Find a photo"). */
  readonly label = input.required<string>();
  /** The button's text ("Suggest photos", "Find photos"). */
  readonly buttonLabel = input<string>('Suggest photos');
  readonly placeholder = input<string>('');
  /** The query to start with (a place name in AD7). */
  readonly query = input<string>('');
  /** The shortest query the button accepts; 0 makes the query optional. */
  readonly minQuery = input<number>(0);
  readonly state = input<PhotoSuggestionsState>('idle');
  readonly suggestions = input<readonly PhotoSuggestionTile[]>([]);
  /** The picked tile's id. */
  readonly selected = input<string | null>(null);
  /** The radio group's name; share it with the other tiles of the dialog so one choice spans them all. */
  readonly name = input<string>('photo-suggestion');
  /** The heading over the tiles ("From the web"); empty hides it. */
  readonly heading = input<string>('');
  /** The tile group's accessible name. */
  readonly groupLabel = input<string>('Suggested photos');
  /** What the banner says when `state` is `error`. */
  readonly error = input<string>(
    'Photo suggestions are not available right now. Try again in a moment.',
  );

  readonly find = output<string>();
  readonly picked = output<string>();

  protected readonly text = signal('');
  protected readonly canSearch = computed(
    () => this.state() !== 'loading' && this.text().trim().length >= this.minQuery(),
  );
  protected readonly status = computed(() => {
    switch (this.state()) {
      case 'loading':
        return 'Finding photos…';
      case 'done': {
        const n = this.suggestions().length;
        if (n === 0) return 'No photos found. Try a different search.';
        return n === 1 ? '1 photo found on the web.' : `${n} photos found on the web.`;
      }
      default:
        return '';
    }
  });

  constructor() {
    effect(() => this.text.set(this.query()));
  }

  protected submit(event: Event): void {
    event.preventDefault();
    if (!this.canSearch()) return;
    this.find.emit(this.text().trim());
  }
}
