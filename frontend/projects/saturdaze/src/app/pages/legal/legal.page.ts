import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { Icon, TopBar } from 'components';

type LegalKind = 'terms' | 'privacy';

interface LegalSection {
  readonly id: string;
  readonly title: string;
  readonly paragraphs: readonly string[];
}

const CONTENT: Record<LegalKind, {
  readonly topBarTitle: string;
  readonly eyebrow: string;
  readonly title: string;
  readonly summaryIcon: string;
  readonly summaryTone: 'primary' | 'accent';
  readonly summary: string;
  readonly sections: readonly LegalSection[];
}> = {
  terms: {
    topBarTitle: 'Terms',
    eyebrow: 'Terms of Service',
    title: 'Terms of Service',
    summaryIcon: 'sparkle',
    summaryTone: 'primary',
    summary: "The short version: Saturdaze plans weekends for your family. You own your data and can delete it any time. I won't sell it or train models on it.",
    sections: [
      { id: 'acceptance', title: '1. Acceptance', paragraphs: ["By creating an account you agree to these terms. If you don't agree, don't create an account."] },
      { id: 'account', title: '2. Your account', paragraphs: ["You're responsible for keeping your account secure and for the activity on it. You must be 18 or older to create an account."] },
      { id: 'content', title: '3. What you put in', paragraphs: ['Your family, commitments, saved weekends, and preferences belong to you. We use them only to plan your weekends and improve recommendations.'] },
      { id: 'service', title: '4. What I do', paragraphs: ['Saturdaze drafts weekend plans from your home base, family settings, locked commitments, and prior weekends. The drafts are suggestions; you decide what actually happens.'] },
      { id: 'termination', title: '5. Closing your account', paragraphs: ['You can close your account any time. Closure deletes your data within 30 days; backups roll off within 90 days.'] },
      { id: 'contact', title: '6. Contact', paragraphs: ['Questions about these terms? Email support@saturdaze.app.'] },
    ],
  },
  privacy: {
    topBarTitle: 'Privacy',
    eyebrow: 'Privacy Policy',
    title: 'Privacy Policy',
    summaryIcon: 'lock',
    summaryTone: 'accent',
    summary: "The short version: your family's data stays encrypted, is not sold, is not shared with advertisers, and is not used to train AI models.",
    sections: [
      { id: 'what', title: '1. What I collect', paragraphs: ['Account details, family names and ages, home location, commitments, preferences, saved weekends, and operational logs needed to keep the service working.'] },
      { id: 'why', title: '2. How I use it', paragraphs: ['To plan weekends, send account emails, keep your session secure, and improve recommendations for your family.'] },
      { id: 'kids', title: "3. Kids' data", paragraphs: ["Children don't have logins. Parents add only first names and ages so recommendations fit the family."] },
      { id: 'sharing', title: '4. Sharing', paragraphs: ['Only when you create a share link, when service providers host or email the app, or when legally required.'] },
      { id: 'choices', title: '5. Your choices', paragraphs: ['You can edit, export, or delete family data from your profile.'] },
      { id: 'contact', title: '6. Contact', paragraphs: ['Privacy questions go to privacy@saturdaze.app.'] },
    ],
  },
};

@Component({
  selector: 'app-legal',
  standalone: true,
  imports: [Icon, TopBar],
  templateUrl: './legal.page.html',
  styleUrl: './legal.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LegalPage {
  private readonly route = inject(ActivatedRoute);
  protected readonly content = computed(() => {
    const kind = this.route.snapshot.data['legal'] === 'privacy' ? 'privacy' : 'terms';
    return CONTENT[kind];
  });
}
