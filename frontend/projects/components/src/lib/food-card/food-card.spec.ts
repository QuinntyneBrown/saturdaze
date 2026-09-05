import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VoteCell } from '../vote-row/vote-row';
import { FoodCard } from './food-card';

const VOTES: readonly VoteCell[] = [
  { name: 'Quinn', tone: 'primary', vote: 'none' },
  { name: 'Sara', tone: 'leaf', vote: 'up' },
];

@Component({
  standalone: true,
  imports: [FoodCard],
  template: `
    <sd-food-card title="Pizza Nova">
      <span slot="chips" class="chip-a">Pizza</span>
    </sd-food-card>
  `,
})
class HostCmp {}

describe('FoodCard', () => {
  let fixture: ComponentFixture<FoodCard>;
  let host: HTMLElement;

  const chip = (): HTMLElement | null => host.querySelector('.card__head sd-chip');
  const lockBtn = (): HTMLButtonElement | null =>
    host.querySelector('.card__footer button.btn--primary');

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [FoodCard, HostCmp] }).compileComponents();
    fixture = TestBed.createComponent(FoodCard);
    fixture.componentRef.setInput('title', 'Pizza Nova');
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  it('creates a card with a fork disc, the name and a Lock it in button', () => {
    expect(fixture.componentInstance).toBeTruthy();
    expect(host.classList.contains('card')).toBe(true);
    const disc = host.querySelector('.card__head sd-disc') as HTMLElement;
    expect(disc.getAttribute('icon')).toBe('fork');
    expect(disc.getAttribute('tone')).toBeNull();
    expect(host.querySelector('h3.card__title')?.textContent?.trim()).toBe('Pizza Nova');
    expect(chip()).toBeNull();
    expect(host.querySelector('sd-vote-row')).toBeNull();
    expect(lockBtn()?.textContent?.trim()).toBe('Lock it in');
    expect(lockBtn()?.disabled).toBe(false);
    expect(host.querySelector('.card__footer a')).toBeNull();
    expect(host.getAttribute('title')).toBe('Pizza Nova');
    for (const attr of ['top-pick', 'locked', 'dimmed'])
      expect(host.hasAttribute(attr)).toBe(false);
  });

  it('renders the style line and the See menu link', () => {
    fixture.componentRef.setInput('meta', 'Pizza · 6 min');
    fixture.componentRef.setInput('menuUrl', 'https://pizzanova.example/menu');
    fixture.detectChanges();
    expect(host.querySelector('.card__meta')?.textContent?.trim()).toBe('Pizza · 6 min');
    const link = host.querySelector('.card__footer a.btn--quiet') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('https://pizzanova.example/menu');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener');
  });
  it('labels the See menu link with its text', () => {
    fixture.componentRef.setInput('menuUrl', 'https://pizzanova.example/menu');
    fixture.detectChanges();
    const link = host.querySelector('.card__footer a.btn--quiet') as HTMLAnchorElement;
    expect(link.textContent?.trim()).toBe('See menu');
  });

  it('marks the top pick with a spanning card and a primary chip', () => {
    fixture.componentRef.setInput('topPick', true);
    fixture.detectChanges();
    expect(host.classList.contains('card--span')).toBe(true);
    expect(host.getAttribute('top-pick')).toBe('');
    expect(chip()?.textContent?.trim()).toBe('Top pick');
    expect(chip()?.getAttribute('tone')).toBe('primary');
  });

  it('shows a locked pick with the accent border, chip and no lock button', () => {
    fixture.componentRef.setInput('topPick', true);
    fixture.componentRef.setInput('locked', true);
    fixture.componentRef.setInput('lockedLabel', 'Locked for dinner');
    fixture.detectChanges();
    expect(host.classList.contains('card--locked')).toBe(true);
    expect(host.getAttribute('locked')).toBe('');
    expect(chip()?.textContent?.trim()).toBe('Locked for dinner');
    expect(chip()?.getAttribute('tone')).toBe('accent');
    expect(chip()?.querySelector('sd-icon')?.getAttribute('name')).toBe('lock');
    expect(host.querySelector('sd-disc')?.getAttribute('tone')).toBe('accent');
    expect(lockBtn()).toBeNull();
  });

  it('dims siblings of a locked pick and disables their lock button', () => {
    fixture.componentRef.setInput('dimmed', true);
    fixture.detectChanges();
    expect(host.classList.contains('card--dimmed')).toBe(true);
    expect(host.getAttribute('dimmed')).toBe('');
    expect(lockBtn()?.disabled).toBe(true);
  });

  it('emits lockIn when the primary button is pressed', () => {
    const spy = vi.fn();
    fixture.componentInstance.lockIn.subscribe(spy);
    lockBtn()?.click();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('renders the family vote row and relays its votes', () => {
    fixture.componentRef.setInput('votes', VOTES);
    fixture.detectChanges();
    const row = host.querySelector('sd-vote-row') as HTMLElement;
    expect(row.getAttribute('aria-label')).toBe('Family vote for Pizza Nova');
    expect(row.querySelectorAll('.vote-row__cell').length).toBe(2);
    expect(row.hasAttribute('disabled')).toBe(false);

    const spy = vi.fn();
    fixture.componentInstance.voteChange.subscribe(spy);
    (row.querySelectorAll('.vote-row__btn--up')[0] as HTMLElement).click();
    expect(spy).toHaveBeenCalledWith({ index: 0, vote: 'up' });

    fixture.componentRef.setInput('votesDisabled', true);
    fixture.detectChanges();
    expect(row.getAttribute('disabled')).toBe('');
    expect(
      Array.from(row.querySelectorAll<HTMLButtonElement>('.vote-row__btn')).every(
        (b) => b.disabled,
      ),
    ).toBe(true);
  });

  it('projects chips into the chip row', () => {
    const wrapper = TestBed.createComponent(HostCmp);
    wrapper.detectChanges();
    const el = (wrapper.nativeElement as HTMLElement).querySelector('sd-food-card') as HTMLElement;
    expect(el.querySelector('.card__chips .chip-a')?.textContent).toBe('Pizza');
  });
});
