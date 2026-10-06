import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Block } from '../block/block';
import { Day } from './day';

@Component({
  standalone: true,
  imports: [Day, Block],
  template: `
    <sd-day title="Saturday" weather="sun">
      <sd-block title="Breakfast" time="8:00" />
      <sd-block title="Park" time="10:00" />
      <sd-block title="Dinner" time="18:00" />
      <button slot="footer" class="add">Add an errand</button>
    </sd-day>
  `,
})
class HostCmp {}

describe('Day', () => {
  let fixture: ComponentFixture<Day>;
  let host: HTMLElement;

  const buttons = (): HTMLButtonElement[] => Array.from(host.querySelectorAll('button.day__btn'));
  const regenerateBtn = (): HTMLButtonElement => buttons()[0] as HTMLButtonElement;
  const lockBtn = (): HTMLButtonElement => buttons()[1] as HTMLButtonElement;
  const glyph = (el: Element | null | undefined): string =>
    el?.querySelector('svg')?.innerHTML ?? '';

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Day, HostCmp] }).compileComponents();
    fixture = TestBed.createComponent(Day);
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  it('creates Saturday with a labelled heading and an empty list', () => {
    expect(fixture.componentInstance).toBeTruthy();
    expect(host.classList.contains('day')).toBe(true);
    const h2 = host.querySelector('header.day__header h2.day__title') as HTMLElement;
    expect(h2.textContent?.trim()).toBe('Saturday');
    expect(h2.id).toMatch(/^sd-day-\d+$/);
    expect(host.getAttribute('aria-labelledby')).toBe(h2.id);
    expect(host.querySelector('.day__list')?.getAttribute('role')).toBe('list');
    expect(host.querySelector('.weather-disc')).toBeNull();
    expect(host.querySelector('.day__meta')).toBeNull();
    expect(host.querySelector('.day__chip')).toBeNull();
    expect(host.classList.contains('day--locked')).toBe(false);
  });

  it('renders the meta line and the weather disc', () => {
    fixture.componentRef.setInput('title', 'Sunday');
    fixture.componentRef.setInput('meta', '11 May · 18° and cloudy');
    fixture.componentRef.setInput('weather', 'rain');
    fixture.detectChanges();
    expect(host.querySelector('.day__title')?.textContent?.trim()).toBe('Sunday');
    expect(host.querySelector('.day__meta')?.textContent?.trim()).toBe('11 May · 18° and cloudy');
    const disc = host.querySelector('sd-disc.weather-disc') as HTMLElement;
    expect(glyph(disc.querySelector('sd-icon'))).toContain('M8 18l-1 2M12 18l-1 2M16 18l-1 2');
    expect(disc.classList.contains('disc--sky')).toBe(true);
    expect(disc.classList.contains('disc--lg')).toBe(true);

    fixture.componentRef.setInput('weather', 'sun');
    fixture.detectChanges();
    expect(glyph(disc.querySelector('sd-icon'))).toContain('M12 2v2M12 20v2M2 12h2M20 12h2');
    expect(disc.classList.contains('disc--sun')).toBe(true);
    expect(disc.classList.contains('disc--sky')).toBe(false);
  });

  it('shows the Regenerate and Lock buttons with accessible names', () => {
    expect(buttons().length).toBe(2);
    expect(regenerateBtn().getAttribute('aria-label')).toBe('Regenerate Saturday');
    expect(regenerateBtn().querySelector('.day__btn-label')?.textContent?.trim()).toBe(
      'Regenerate',
    );
    expect(regenerateBtn().querySelector('sd-icon')?.getAttribute('name')).toBe('refresh');
    expect(lockBtn().getAttribute('aria-label')).toBe('Lock Saturday');
    expect(lockBtn().getAttribute('aria-pressed')).toBe('false');
    expect(lockBtn().querySelector('.day__btn-label')?.textContent?.trim()).toBe('Lock day');
    expect(glyph(lockBtn().querySelector('sd-icon'))).toContain('M8 11V8a4 4 0 0 1 8 0v3');
  });

  it('reflects a locked day in the chip, the lock button and the host class', () => {
    fixture.componentRef.setInput('locked', true);
    fixture.detectChanges();
    expect(host.classList.contains('day--locked')).toBe(true);
    const chip = host.querySelector('sd-chip.day__chip') as HTMLElement;
    expect(chip.textContent?.trim()).toBe('Day locked');
    expect(chip.classList.contains('chip--accent')).toBe(true);
    expect(lockBtn().getAttribute('aria-label')).toBe('Unlock Saturday');
    expect(lockBtn().getAttribute('aria-pressed')).toBe('true');
    expect(lockBtn().querySelector('.day__btn-label')?.textContent?.trim()).toBe('Unlock day');
    expect(glyph(lockBtn().querySelector('sd-icon'))).toContain('M8 11V8a4 4 0 0 1 7.5-2');
  });

  it('hides the actions and disables them while busy', () => {
    fixture.componentRef.setInput('busy', true);
    fixture.detectChanges();
    expect(regenerateBtn().disabled).toBe(true);
    expect(lockBtn().disabled).toBe(true);

    fixture.componentRef.setInput('actions', false);
    fixture.detectChanges();
    expect(host.querySelector('.day__actions')).toBeNull();
    expect(buttons().length).toBe(0);
  });

  it('emits regenerate and the next lock state', () => {
    const regenerate = vi.fn();
    const lockToggle = vi.fn();
    fixture.componentInstance.regenerate.subscribe(regenerate);
    fixture.componentInstance.lockToggle.subscribe(lockToggle);

    regenerateBtn().click();
    expect(regenerate).toHaveBeenCalledTimes(1);

    lockBtn().click();
    expect(lockToggle).toHaveBeenLastCalledWith(true);

    fixture.componentRef.setInput('locked', true);
    fixture.detectChanges();
    lockBtn().click();
    expect(lockToggle).toHaveBeenLastCalledWith(false);
  });

  it('projects blocks into the list and the footer after it', () => {
    const wrapper = TestBed.createComponent(HostCmp);
    wrapper.detectChanges();
    const day = (wrapper.nativeElement as HTMLElement).querySelector('sd-day') as HTMLElement;
    const list = day.querySelector('.day__list') as HTMLElement;
    const blocks = Array.from(list.children);
    expect(blocks.length).toBe(3);
    expect(blocks.every((b) => b.tagName.toLowerCase() === 'sd-block')).toBe(true);
    expect(blocks.every((b) => b.getAttribute('role') === 'listitem')).toBe(true);
    expect(blocks.map((b) => b.querySelector('.block__title')?.textContent?.trim())).toEqual([
      'Breakfast',
      'Park',
      'Dinner',
    ]);
    expect(list.querySelector('.add')).toBeNull();
    expect(day.lastElementChild?.classList.contains('add')).toBe(true);
    expect(glyph(day.querySelector('.weather-disc sd-icon'))).toContain(
      'M12 2v2M12 20v2M2 12h2M20 12h2',
    );
    expect(day.querySelector('.weather-disc')?.classList.contains('disc--sun')).toBe(true);
  });
});
