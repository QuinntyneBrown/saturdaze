import { Injectable, Signal, signal } from '@angular/core';

import { RestaurantView } from '../models/restaurant';

const DEMO_VIEW: RestaurantView = {
  title: 'Saturday food',
  lede:
    "Pre-filtered to wife-approved styles, near today's activity. Lock a pick to settle the debate.",
  filters: [
    { label: 'Lunch', tone: 'primary' },
    { label: 'Dinner', tone: 'default' },
    { label: 'Wife-approved only', tone: 'accent' },
    { label: '< 15 min', tone: 'sky' },
    { label: 'Patio', tone: 'leaf' },
  ],
  topPickSection: {
    title: 'Top pick for lunch',
    subtitle: 'Closest to Terre Bleu, kid-friendly menu',
    picks: [
      {
        name: 'La Marina',
        style: 'Mediterranean · Patio',
        near: 'Milton, 6 min from Terre Bleu',
        drive: '6 min',
        wifeapproved: true,
        icon: 'fork',
        votes: [
          { name: 'Quinn', tone: 'primary', vote: 'up' },
          { name: 'Sara', tone: 'leaf', vote: 'up' },
          { name: 'Eli', tone: 'sky', vote: 'up' },
          { name: 'Mae', tone: 'sun', vote: 'none' },
        ],
      },
    ],
  },
  otherPicks: {
    title: 'Other strong picks',
    picks: [
      {
        name: 'Symposium Café',
        style: 'Brunch · Family booths',
        near: 'Milton, 9 min from Terre Bleu',
        drive: '9 min',
        wifeapproved: true,
        icon: 'fork',
        votes: [
          { name: 'Quinn', tone: 'primary', vote: 'none' },
          { name: 'Sara', tone: 'leaf', vote: 'up' },
          { name: 'Eli', tone: 'sky', vote: 'none' },
          { name: 'Mae', tone: 'sun', vote: 'up' },
        ],
      },
      {
        name: 'The Sicilian Sidewalk Café',
        style: 'Italian · Casual',
        near: 'Hwy back to Port Credit',
        drive: '12 min',
        icon: 'fork',
        votes: [
          { name: 'Quinn', tone: 'primary', vote: 'up' },
          { name: 'Sara', tone: 'leaf', vote: 'down' },
          { name: 'Eli', tone: 'sky', vote: 'up' },
          { name: 'Mae', tone: 'sun', vote: 'up' },
        ],
      },
    ],
  },
  sundayDinner: {
    title: 'Sunday dinner',
    subtitle: 'After Rec Room — Square One area',
    picks: [
      {
        name: "Jack Astor's",
        style: "Casual · Kids' menu",
        near: 'Square One',
        drive: '2 min',
        wifeapproved: true,
        icon: 'fork',
        votes: [
          { name: 'Quinn', tone: 'primary', vote: 'up' },
          { name: 'Sara', tone: 'leaf', vote: 'up' },
          { name: 'Eli', tone: 'sky', vote: 'up' },
          { name: 'Mae', tone: 'sun', vote: 'up' },
        ],
      },
    ],
  },
};

@Injectable({ providedIn: 'root' })
export class RestaurantService {
  private readonly view = signal<RestaurantView>(DEMO_VIEW);

  list(): Signal<RestaurantView> {
    return this.view.asReadonly();
  }
}
