import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { EVENT_SUBMISSIONS_SERVICE } from 'api';
import { BottomNav, Button, Card, Icon, TopBar } from 'components';

import { nextHourFromNowAsInputValue } from '../../shared/next-hour-default';

@Component({
  selector: 'app-events-submit',
  standalone: true,
  imports: [BottomNav, Button, Card, FormsModule, Icon, TopBar],
  templateUrl: './events-submit.page.html',
  styleUrl: './events-submit.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventsSubmitPage {
  private readonly submissions = inject(EVENT_SUBMISSIONS_SERVICE);
  private readonly router = inject(Router);

  protected readonly title = signal('');
  protected readonly startsAtLocal = signal(nextHourFromNowAsInputValue(new Date()));
  protected readonly location = signal('');
  protected readonly description = signal('');
  protected readonly costNote = signal('');
  protected readonly ageRange = signal('');
  protected readonly sourceUrl = signal('');
  protected readonly error = signal('');
  protected readonly submitting = signal(false);

  protected readonly canSubmit = computed(
    () =>
      this.title().trim().length > 0 &&
      this.startsAtLocal().length > 0 &&
      !this.submitting(),
  );

  protected cancel(): void {
    void this.router.navigateByUrl('/events');
  }

  protected async submit(event: Event): Promise<void> {
    event.preventDefault();
    if (!this.canSubmit()) return;
    this.submitting.set(true);
    this.error.set('');
    try {
      await this.submissions.submit({
        title: this.title().trim(),
        startsAtLocal: this.startsAtLocal(),
        location: this.location().trim() || null,
        description: this.description().trim() || null,
        costNote: this.costNote().trim() || null,
        ageRange: this.ageRange().trim() || null,
        sourceUrl: this.sourceUrl().trim() || null,
      });
      void this.router.navigateByUrl('/events/submitted');
    } catch (err) {
      this.error.set('Could not submit. Check your link, then try again.');
      console.error('EventsSubmitPage.submit failed', err);
    } finally {
      this.submitting.set(false);
    }
  }
}
