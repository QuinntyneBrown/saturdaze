import { Injectable, Signal, signal } from '@angular/core';

import { ActivityView } from '../models/activity';

const DEMO_VIEW: ActivityView = {
  filters: [
    { label: 'All', tone: 'primary' },
    { label: 'Outdoor', tone: 'leaf' },
    { label: 'Indoor', tone: 'indoor' },
    { label: '< 30 min', tone: 'sky' },
    { label: 'Ages 5+', tone: 'default' },
    { label: 'New for us', tone: 'default' },
    { label: 'Weather-safe', tone: 'warn' },
  ],
  sections: [
    {
      title: "This weekend's weather-fit",
      activities: [
        {
          title: 'Terre Bleu Lavender Farm',
          subtitle: 'Milton · The bloom peaks May 17–24',
          icon: 'tree',
          tone: 'outdoor',
          drive: '45 min',
          ages: 'all',
          tag: 'Day highlight',
          why: "Sara loved this last summer. Mae's old enough this year to walk the rows.",
        },
        {
          title: 'Bronte Creek Provincial Park',
          subtitle: 'Easy hike + splash pad if hot',
          icon: 'tree',
          tone: 'outdoor',
          drive: '25 min',
          ages: '5+',
          why: 'Short trail (1.5km), washrooms, picnic tables — your usual win.',
        },
        {
          title: 'Royal Botanical Gardens',
          subtitle: 'Tulip festival in bloom',
          icon: 'tree',
          tone: 'outdoor',
          drive: '35 min',
        },
      ],
    },
    {
      title: 'If weather turns',
      activities: [
        {
          title: 'The Rec Room — Square One',
          subtitle: 'Bowling, arcade, dinner under one roof',
          icon: 'popcorn',
          tone: 'indoor',
          drive: '10 min',
          ages: 'all',
          tag: "Eli's pick",
          why: 'Eli asked for it twice last week. Sunday afternoon clouds = good window.',
        },
        {
          title: 'Ontario Science Centre',
          subtitle: "New 'Senses' exhibit",
          icon: 'popcorn',
          tone: 'indoor',
          drive: '40 min',
        },
        {
          title: 'Toronto Zoo',
          subtitle: 'Polar bears, splash zone, indoor pavilions',
          icon: 'tree',
          tone: 'outdoor',
          drive: '55 min',
          ages: 'all',
        },
      ],
    },
    {
      title: 'Try something new',
      subtitle: "You haven't done these recently",
      activities: [
        {
          title: 'Riverwood Conservancy',
          subtitle: 'Forest school trails, owl barn',
          icon: 'tree',
          tone: 'outdoor',
          drive: '8 min',
          tag: 'First time',
        },
        {
          title: "Living Arts Centre — kids' theatre",
          subtitle: 'Saturday matinée at 2pm',
          icon: 'ticket',
          tone: 'indoor',
          drive: '5 min',
          tag: 'First time',
        },
      ],
    },
  ],
};

@Injectable({ providedIn: 'root' })
export class ActivityService {
  private readonly view = signal<ActivityView>(DEMO_VIEW);

  list(): Signal<ActivityView> {
    return this.view.asReadonly();
  }
}
