import { Injectable, Signal, signal } from '@angular/core';

import { Block, ItineraryView, WeekendOverview } from '../models/weekend';

/**
 * Returns the demo weekend overview. Static data for now — the public
 * signal-returning surface stays the same when Phase 12 swaps the body to
 * `httpResource(...)`.
 */

const DEMO_OVERVIEW: WeekendOverview = {
  greeting: 'Morning, Browns 👋',
  heroSubtitle:
    "Sat & Sun are looking warm. I've sketched a weekend you can take as-is.",
  heroCta: 'Plan This Weekend',
  forecastSubtitle: 'Sat 17 May – Sun 18 May',
  forecast: [
    {
      day: 'Saturday',
      icon: 'sun',
      hi: '22',
      lo: '14',
      note: 'Light breeze, perfect for outdoors',
    },
    {
      day: 'Sunday',
      icon: 'cloud',
      hi: '18',
      lo: '12',
      note: 'Cloudy by 2pm — plan indoors after',
    },
  ],
  days: [
    {
      day: 'Saturday',
      date: 'Sat 17 May',
      weather: '22°  sunny',
      icon: 'sun',
      highlight: 'Lavender fields at Terre Bleu',
      chips: [
        { tone: 'accent', icon: 'lock', label: '9:00 swim' },
        { tone: 'sky', icon: 'car', label: '45 min drive' },
        { tone: 'leaf', label: 'Outdoor day' },
      ],
    },
    {
      day: 'Sunday',
      date: 'Sun 18 May',
      weather: '18°  cloudy',
      icon: 'cloud',
      highlight: "Rec Room → Eli's pick",
      chips: [
        { tone: 'accent', icon: 'lock', label: '10:30 church' },
        { tone: 'indoor', label: 'Indoor afternoon' },
        { tone: 'primary', label: 'New for us' },
      ],
    },
  ],
  anticipations: [
    {
      icon: 'sparkle',
      headline: 'Lavender bloom peaks this weekend',
      body: "It's a 45-min drive — and rain moves in Monday. I tucked it into Saturday afternoon.",
      cta: 'See on the map',
    },
    {
      icon: 'bag',
      headline: 'Sara mentioned a Costco run',
      body: "Want me to slot it Sunday morning before church so it doesn't kill the day?",
      cta: 'Add to Sunday',
    },
  ],
  quickActions: [
    {
      title: 'Regenerate the weekend',
      subtitle: 'Same commitments, fresh ideas',
      icon: 'refresh',
    },
    {
      title: "Lock what's already perfect",
      subtitle: '3 blocks locked',
      icon: 'lock',
    },
    {
      title: 'Share with Sara for approval',
      subtitle: 'A read-only preview link',
      icon: 'share',
    },
  ],
  preview: [
    {
      time: '9:00',
      duration: '60m',
      title: 'Swim lessons',
      subtitle: 'Port Credit Pool',
      icon: 'bike',
      tone: 'fixed',
      locked: true,
    },
    {
      time: '11:00',
      duration: '2h',
      title: 'Lavender fields',
      subtitle: 'Terre Bleu, Milton',
      icon: 'tree',
      drive: '45 min',
      chips: [{ tone: 'primary', label: 'Day highlight' }],
    },
    {
      time: '13:00',
      duration: '75m',
      title: 'Lunch — La Marina',
      subtitle: 'Wife-approved · patio',
      icon: 'fork',
      tone: 'meal',
    },
    {
      time: '15:30',
      duration: '90m',
      title: 'Quiet time at home',
      subtitle: 'Recharge before evening',
      icon: 'bed',
      tone: 'downtime',
    },
    {
      time: '17:00',
      duration: '60m',
      title: 'Workout',
      subtitle: 'Garage gym · Sara watches kids',
      icon: 'bike',
      tone: 'workout',
      locked: true,
    },
  ],
};

const SATURDAY_BLOCKS: readonly Block[] = [
  {
    time: '8:30',
    duration: '30m',
    title: 'Breakfast at home',
    subtitle: "Cereal day — Eli's choice",
    icon: 'home',
    tone: 'meal',
  },
  {
    time: '9:00',
    duration: '60m',
    title: 'Swim lessons',
    subtitle: 'Port Credit Pool · Both kids',
    icon: 'bike',
    tone: 'fixed',
    locked: true,
    chips: [{ tone: 'accent', label: 'Recurring' }],
  },
  {
    time: '10:30',
    duration: '20m',
    title: 'Drive to Terre Bleu',
    subtitle: 'Hwy 401 W → Milton',
    icon: 'car',
    tone: 'drive',
    drive: '20 min',
  },
  {
    time: '11:00',
    duration: '2h',
    title: 'Lavender fields',
    subtitle: 'Walk the rows, snap photos, kid-friendly',
    icon: 'tree',
    chips: [
      { tone: 'primary', label: 'Day highlight' },
      { tone: 'leaf', label: 'Outdoor' },
    ],
  },
  {
    time: '13:00',
    duration: '75m',
    title: 'Lunch — La Marina',
    subtitle: 'Wife-approved · Patio · 4 votes in',
    icon: 'fork',
    tone: 'meal',
    chips: [{ tone: 'accent', label: 'Booked 1pm' }],
  },
  {
    time: '14:30',
    duration: '45m',
    title: 'Drive back to Port Credit',
    subtitle: 'Kids tend to nap on this stretch',
    icon: 'car',
    tone: 'drive',
    drive: '45 min',
  },
  {
    time: '15:30',
    duration: '90m',
    title: 'Quiet time at home',
    subtitle: 'Reading, blocks — recharge before evening',
    icon: 'bed',
    tone: 'downtime',
  },
  {
    time: '17:00',
    duration: '60m',
    title: "Husband's workout",
    subtitle: 'Garage gym — Sara watches the kids',
    icon: 'bike',
    tone: 'workout',
    locked: true,
    chips: [{ tone: 'accent', label: 'Recurring' }],
  },
  {
    time: '18:15',
    duration: '75m',
    title: 'Dinner at home',
    subtitle: 'Pasta + veg — picky-approved',
    icon: 'fork',
    tone: 'meal',
  },
  {
    time: '20:00',
    duration: '60m',
    title: 'Bath & books',
    subtitle: '9pm lights out',
    icon: 'bed',
    tone: 'downtime',
    locked: true,
  },
];

const DEMO_ITINERARY: ItineraryView = {
  day: 'Saturday',
  eyebrow: '17 May 2026',
  title: 'Sunny & 22°',
  subtitle: 'In bed by 9pm — out the door by 9am',
  icon: 'sun',
  chips: [
    { tone: 'accent', icon: 'lock', label: '3 locked' },
    { tone: 'sky', icon: 'car', label: '1h 10m driving' },
    { tone: 'leaf', label: 'Outdoor' },
    { tone: 'sun', label: '22° hi' },
  ],
  dayOptions: [
    {
      key: 'saturday',
      label: 'Saturday',
      icon: 'sun',
      iconTone: 'sun',
      meta: '5 blocks · 22° sunny · Lavender highlight',
      active: true,
    },
    {
      key: 'sunday',
      label: 'Sunday',
      icon: 'cloud',
      iconTone: 'soft',
      meta: '5 blocks · 18° cloudy · Rec Room highlight',
      active: false,
    },
  ],
  stats: [
    { num: '10', label: 'blocks planned' },
    { num: '2h 5m', label: 'total driving' },
    { num: '4', label: 'locked anchors' },
    { num: '$~120', label: 'est. spend' },
  ],
  previewTitle: 'Saturday — timeline',
  previewSubtitle: 'Tap any block for why, alternatives, map',
  blocks: SATURDAY_BLOCKS,
};

@Injectable({ providedIn: 'root' })
export class WeekendPlanService {
  private readonly overview = signal<WeekendOverview>(DEMO_OVERVIEW);
  private readonly itinerary = signal<ItineraryView>(DEMO_ITINERARY);

  getDemoOverview(): Signal<WeekendOverview> {
    return this.overview.asReadonly();
  }

  getDemoItinerary(): Signal<ItineraryView> {
    return this.itinerary.asReadonly();
  }
}
