import { ChangeDetectionStrategy, Component } from '@angular/core';

import {
  Anticipate,
  Avatar,
  Button,
  Card,
  Chip,
  Empty,
  Icon,
  IconButton,
  ListItem,
  TextInput,
  TimelineBlock,
  Toggle,
  WeatherDay,
  WeatherStrip,
} from 'components';

@Component({
  selector: 'app-components-gallery',
  standalone: true,
  imports: [
    Anticipate,
    Avatar,
    Button,
    Card,
    Chip,
    Empty,
    Icon,
    IconButton,
    ListItem,
    TextInput,
    TimelineBlock,
    Toggle,
    WeatherDay,
    WeatherStrip,
  ],
  templateUrl: './components-gallery.page.html',
  styleUrl: './components-gallery.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComponentsGalleryPage {}
