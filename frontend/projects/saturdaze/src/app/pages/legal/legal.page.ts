import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  DestroyRef,
  computed,
  effect,
  inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { Segments, SegmentTab, Well } from 'components';

/**
 * Legal — `docs/mocks-v2/pages/legal.html`: Terms and Privacy on one page,
 * switched by the `#privacy` fragment. Both articles are in the DOM; the
 * inactive one is hidden, and `<body data-doc>` names the visible one.
 */

type LegalKind = 'terms' | 'privacy';

interface LegalSection {
  readonly id: string;
  readonly title: string;
  readonly paragraphs: readonly string[];
}

interface LegalDoc {
  readonly kind: LegalKind;
  readonly title: string;
  readonly updated: string;
  readonly summary: string;
  readonly sections: readonly LegalSection[];
}

const DOCS: readonly LegalDoc[] = [
  {
    kind: 'terms',
    title: 'Terms of Service',
    updated: 'Last updated 17 May 2026',
    summary:
      'Saturdaze plans weekends for your family. You own your data and can delete it any time. It is not sold and not used to train models.',
    sections: [
      { id: 'acceptance', title: '1. Acceptance', paragraphs: ["By creating an account you agree to these terms. If you don't agree, don't create an account."] },
      { id: 'account', title: '2. Your account', paragraphs: ["You're responsible for keeping your account secure and for the activity on it. You must be 18 or older to create an account."] },
      { id: 'content', title: '3. What you put in', paragraphs: ['Your family, commitments, saved weekends, and preferences belong to you. We use them only to plan your weekends and improve recommendations.'] },
      { id: 'service', title: '4. What Saturdaze does', paragraphs: ['Saturdaze drafts weekend plans from your home base, family settings, locked commitments, and prior weekends. The drafts are suggestions; you decide what actually happens.'] },
      { id: 'termination', title: '5. Closing your account', paragraphs: ['You can close your account any time. Closure deletes your data within 30 days; backups roll off within 90 days.'] },
      { id: 'contact', title: '6. Contact', paragraphs: ['Questions about these terms? Email support@saturdaze.app.'] },
    ],
  },
  {
    kind: 'privacy',
    title: 'Privacy Policy',
    updated: 'Last updated 17 May 2026',
    summary:
      "Your family's data stays encrypted, is not sold, is not shared with advertisers, and is not used to train AI models.",
    sections: [
      { id: 'what', title: '1. What we collect', paragraphs: ['Account details, family names and ages, home location, commitments, preferences, saved weekends, and operational logs needed to keep the service working.'] },
      { id: 'why', title: '2. How we use it', paragraphs: ['To plan weekends, send account emails, keep your session secure, and improve recommendations for your family.'] },
      { id: 'kids', title: "3. Kids' data", paragraphs: ["Children don't have logins. Parents add only first names and ages so recommendations fit the family."] },
      { id: 'sharing', title: '4. Sharing', paragraphs: ['Only when you create a share link, when service providers host or email the app, or when legally required.'] },
      { id: 'choices', title: '5. Your choices', paragraphs: ['You can edit, export, or delete family data from the Family screen.'] },
      { id: 'contact', title: '6. Contact', paragraphs: ['Privacy questions go to privacy@saturdaze.app.'] },
    ],
  },
];

const TABS: readonly SegmentTab[] = [
  { label: 'Terms', link: '/legal' },
  { label: 'Privacy', link: '/legal', fragment: 'privacy' },
];

@Component({
  selector: 'app-legal',
  standalone: true,
  imports: [RouterLink, Segments, Well],
  templateUrl: './legal.page.html',
  styleUrl: './legal.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LegalPage {
  private readonly route = inject(ActivatedRoute);
  private readonly document = inject(DOCUMENT);

  private readonly fragment = toSignal(this.route.fragment, {
    initialValue: this.route.snapshot.fragment,
  });

  protected readonly docs = DOCS;
  protected readonly tabs = TABS;
  // `#privacy` selects the policy; section anchors are `#terms-<id>` /
  // `#privacy-<id>`, so the prefix decides which article is showing.
  protected readonly doc = computed<LegalKind>(() =>
    (this.fragment() ?? '').startsWith('privacy') ? 'privacy' : 'terms',
  );
  protected readonly activeTab = computed(() => (this.doc() === 'privacy' ? 'Privacy' : 'Terms'));

  constructor() {
    effect(() => {
      this.document.body.dataset['doc'] = this.doc();
    });
    inject(DestroyRef).onDestroy(() => {
      delete this.document.body.dataset['doc'];
    });
  }
}
