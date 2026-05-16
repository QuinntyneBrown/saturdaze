import { ChangeDetectionStrategy, Component } from '@angular/core';

import {
  SdAnticipate,
  SdAvatar,
  SdButton,
  SdCard,
  SdChip,
  SdEmpty,
  SdIcon,
  SdIconButton,
  SdListItem,
  SdTextInput,
  SdTimelineBlock,
  SdToggle,
  SdWeatherDay,
  SdWeatherStrip,
} from 'components';

@Component({
  selector: 'app-components-gallery',
  standalone: true,
  imports: [
    SdAnticipate,
    SdAvatar,
    SdButton,
    SdCard,
    SdChip,
    SdEmpty,
    SdIcon,
    SdIconButton,
    SdListItem,
    SdTextInput,
    SdTimelineBlock,
    SdToggle,
    SdWeatherDay,
    SdWeatherStrip,
  ],
  templateUrl: './components-gallery.page.html',
  styleUrl: './components-gallery.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComponentsGalleryPage {}
