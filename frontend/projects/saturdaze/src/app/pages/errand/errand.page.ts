import { ChangeDetectionStrategy, Component } from '@angular/core';

import {
  BottomNav,
  Button,
  Card,
  Chip,
  Icon,
  TagGroup,
  TextInput,
  TopBar,
} from 'components';

@Component({
  selector: 'app-errand',
  standalone: true,
  imports: [
    BottomNav,
    Button,
    Card,
    Chip,
    Icon,
    TagGroup,
    TextInput,
    TopBar,
  ],
  templateUrl: './errand.page.html',
  styleUrl: './errand.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrandPage {}
