import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import {
  ADMIN_INVITATIONS_SERVICE,
  CreateProspectRequest,
  addDaysIso,
  formatWeekendSpan,
  upcomingSaturdayIso,
} from 'api';
import {
  Banner,
  Button,
  Card,
  ChipInput,
  GhostRow,
  Icon,
  PageHeader,
  Select,
  SelectOption,
  TextInput,
} from 'components';

import { serverMessage } from '../../shared/server-errors';

export const MAX_MEMBERS = 8;
export const NO_FAMILY_NAME = 'Enter a family name';
export const NO_MEMBER = 'Add at least one family member';
export const BAD_AGE = 'Enter an age between 0 and 120 for each member';
export const GENERATE_FAILED = 'The weekend did not generate. Try again in a moment.';

type MemberGroup = FormGroup<{ name: FormControl<string>; age: FormControl<string> }>;

/** The next four Saturdays as the Weekend select offers them; the first is "this weekend". */
export function weekendOptions(now: Date = new Date()): SelectOption[] {
  const first = upcomingSaturdayIso(now);
  return [0, 7, 14, 21].map((days, i) => {
    const iso = addDaysIso(first, days);
    return { value: iso, label: `${formatWeekendSpan(iso)}${i === 0 ? ' (this weekend)' : ''}` };
  });
}

/**
 * New sample weekend (A9) — `docs/mocks/pages/admin.sample.new.html`: the
 * administrator describes a prospective family the way a family would on
 * its profile and the planner drafts Saturday and Sunday (L2-159). A form
 * screen, reached from the Invitations header; "Generate weekend" lands on
 * the Sample weekend screen.
 */
@Component({
  selector: 'sd-admin-sample-new',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    Banner,
    Button,
    Card,
    ChipInput,
    GhostRow,
    Icon,
    PageHeader,
    Select,
    TextInput,
  ],
  templateUrl: './sample-new.page.html',
  styleUrl: './sample-new.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SampleNewPage {
  private readonly service = inject(ADMIN_INVITATIONS_SERVICE);
  private readonly router = inject(Router);

  protected readonly weekends: readonly SelectOption[] = weekendOptions();
  protected readonly maxMembers = MAX_MEMBERS;

  protected readonly form = new FormGroup({
    familyName: new FormControl('', { nonNullable: true }),
    homeLocation: new FormControl('', { nonNullable: true }),
    members: new FormArray<MemberGroup>([SampleNewPage.member()]),
    likes: new FormControl<string[]>([], { nonNullable: true }),
    weekendOf: new FormControl(this.weekends[0].value, { nonNullable: true }),
  });

  protected readonly error = signal('');
  protected readonly generating = signal(false);
  /** Re-read after rows are added or removed so the template follows the array. */
  protected readonly memberCount = signal(1);
  protected readonly canAdd = computed(() => this.memberCount() < MAX_MEMBERS);

  protected get members(): FormArray<MemberGroup> {
    return this.form.controls.members;
  }

  private static member(): MemberGroup {
    return new FormGroup({
      name: new FormControl('', { nonNullable: true }),
      age: new FormControl('', { nonNullable: true }),
    });
  }

  protected addMember(): void {
    if (!this.canAdd()) return;
    this.members.push(SampleNewPage.member());
    this.memberCount.set(this.members.length);
  }

  protected removeMember(index: number): void {
    this.members.removeAt(index);
    if (this.members.length === 0) this.members.push(SampleNewPage.member());
    this.memberCount.set(this.members.length);
  }

  protected memberLabel(index: number): string {
    const name = this.members.at(index)?.controls.name.value.trim();
    return `Remove ${name || `member ${index + 1}`}`;
  }

  /** Validates the way the API does (L2-159 AC2, AC7), then generates and opens A10 (AC6). */
  protected async generate(event?: Event): Promise<void> {
    event?.preventDefault();
    if (this.generating()) return;
    const raw = this.form.getRawValue();
    const familyName = raw.familyName.trim();
    const members = raw.members
      .map((m) => ({ name: m.name.trim(), age: m.age.trim() }))
      .filter((m) => m.name || m.age);
    if (!familyName) return this.fail(NO_FAMILY_NAME);
    if (members.length === 0 || members.some((m) => !m.name)) return this.fail(NO_MEMBER);
    const parsed = members.map((m) => ({ name: m.name, age: Number(m.age) }));
    if (parsed.some((m) => !Number.isInteger(m.age) || m.age < 0 || m.age > 120))
      return this.fail(BAD_AGE);

    const request: CreateProspectRequest = {
      familyName,
      homeLocation: raw.homeLocation.trim() || null,
      members: parsed,
      likes: raw.likes,
      weekendOf: raw.weekendOf || null,
    };
    this.generating.set(true);
    this.error.set('');
    try {
      const view = await this.service.createProspect(request);
      await this.router.navigateByUrl(view.row.href);
    } catch (err) {
      this.error.set(serverMessage(err) || GENERATE_FAILED);
      console.error('SampleNewPage generate failed', err);
    } finally {
      this.generating.set(false);
    }
  }

  private fail(message: string): void {
    this.error.set(message);
  }
}
