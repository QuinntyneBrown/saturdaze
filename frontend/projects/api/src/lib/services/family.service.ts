import { Injectable, Signal, signal } from '@angular/core';

import { FamilyProfile } from '../models/family';

const DEMO_PROFILE: FamilyProfile = {
  familyName: 'The Browns',
  location: 'Port Credit, Mississauga',
  members: [
    { name: 'Quinn', tone: 'primary', subtitle: 'Parent · 38' },
    { name: 'Sara', tone: 'leaf', subtitle: 'Parent · 36' },
    { name: 'Eli', tone: 'sky', subtitle: 'Kid · 9 · picky eater' },
    { name: 'Mae', tone: 'sun', subtitle: 'Kid · 5 · loves animals' },
  ],
  commitments: [
    {
      title: 'Swim lessons',
      subtitle: 'Saturdays 9:00 – 10:00 · Port Credit Pool',
      icon: 'bike',
    },
    {
      title: 'Church',
      subtitle: "Sundays 10:30 – 11:45 · St. Mary's",
      icon: 'bed',
    },
    {
      title: 'Workout window',
      subtitle: 'Sat & Sun 5:00 – 6:00pm · Garage gym',
      icon: 'bike',
    },
  ],
  rhythm: [
    {
      title: 'Out the door by',
      subtitle: '9:00am',
      icon: 'home',
      chip: '9:00am',
    },
    {
      title: 'Kids in bed by',
      subtitle: '9:00pm sharp',
      icon: 'bed',
      chip: '9:00pm',
    },
  ],
  likes: [
    { label: 'Parks', tone: 'leaf', icon: 'heart' },
    { label: 'Short hikes', tone: 'leaf', icon: 'heart' },
    { label: 'Zoo', tone: 'leaf', icon: 'heart' },
    { label: 'Rec Room', tone: 'leaf', icon: 'heart' },
    { label: 'Lavender', tone: 'leaf', icon: 'heart' },
    { label: 'Live theatre', tone: 'leaf', icon: 'heart' },
    { label: 'Camping', tone: 'warn', icon: 'close' },
    { label: 'Drives > 60 min', tone: 'warn', icon: 'close' },
  ],
  preferences: [
    {
      title: 'Budget is a factor',
      subtitle: "Off — I won't filter by price",
      checked: false,
    },
    {
      title: 'Try something new each weekend',
      subtitle: 'One new activity per week',
      checked: true,
    },
    {
      title: 'Friday preview notifications',
      subtitle: 'A heads-up at 6pm Friday',
      checked: true,
    },
  ],
};

@Injectable({ providedIn: 'root' })
export class FamilyService {
  private readonly profile = signal<FamilyProfile>(DEMO_PROFILE);

  getProfile(): Signal<FamilyProfile> {
    return this.profile.asReadonly();
  }
}
