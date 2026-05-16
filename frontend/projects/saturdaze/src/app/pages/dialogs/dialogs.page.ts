import { ChangeDetectionStrategy, Component } from '@angular/core';

import {
  Avatar,
  Button,
  Card,
  Chip,
  Dialog,
  Icon,
  ListItem,
  TextInput,
  Toggle,
  VoteRow,
} from 'components';

@Component({
  selector: 'app-dialogs',
  standalone: true,
  imports: [
    Avatar,
    Button,
    Card,
    Chip,
    Dialog,
    Icon,
    ListItem,
    TextInput,
    Toggle,
    VoteRow,
  ],
  templateUrl: './dialogs.page.html',
  styleUrl: './dialogs.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogsPage {}
