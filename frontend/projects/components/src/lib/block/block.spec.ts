import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Block } from './block';

@Component({
  standalone: true,
  imports: [Block],
  template: `
    <sd-block title="Park" time="10:00">
      <span slot="chips" class="chip-a">Outdoors</span>
      <button slot="actions" class="act">Swap</button>
    </sd-block>
  `,
})
class HostCmp {}

describe('Block', () => {
  let fixture: ComponentFixture<Block>;
  let host: HTMLElement;

  const chevron = (): HTMLButtonElement | null => host.querySelector('button.block__chev');
  const discIcon = (): HTMLElement => host.querySelector('.block__disc sd-icon') as HTMLElement;
  const glyph = (el: Element | null | undefined): string =>
    el?.querySelector('svg')?.innerHTML ?? '';

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Block, HostCmp] }).compileComponents();
    fixture = TestBed.createComponent(Block);
    fixture.componentRef.setInput('title', 'Breakfast at home');
    fixture.componentRef.setInput('time', '8:00');
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  it('creates a timeline row with time, rail and title', () => {
    expect(fixture.componentInstance).toBeTruthy();
    expect(host.classList.contains('block')).toBe(true);
    expect(host.getAttribute('role')).toBe('listitem');
    expect(host.querySelector('.block__time .block__clock')?.textContent?.trim()).toBe('8:00');
    expect(host.querySelector('.block__dur')).toBeNull();
    expect(host.querySelector('.block__rail .block__disc sd-icon')).not.toBeNull();
    expect(glyph(discIcon())).toContain('M12 3l1.7 5.3L19 10l-5.3 1.7L12 17');
    expect(host.querySelector('.block__body h3.block__title')?.textContent?.trim()).toBe(
      'Breakfast at home',
    );
    expect(host.querySelector('.block__sub')).toBeNull();
  });

  it('renders duration, subtitle and the icon', () => {
    fixture.componentRef.setInput('duration', '45 min');
    fixture.componentRef.setInput('subtitle', 'Pancakes, the usual');
    fixture.componentRef.setInput('icon', 'fork');
    fixture.detectChanges();
    expect(host.querySelector('.block__dur')?.textContent?.trim()).toBe('45 min');
    expect(host.querySelector('.block__sub')?.textContent?.trim()).toBe('Pancakes, the usual');
    expect(glyph(discIcon())).toContain('M7 3v8a2 2 0 0 0 4 0V3');
    expect(discIcon().style.getPropertyValue('--_size')).toBe('16px');
  });

  it('mirrors every modifier to a host class', () => {
    for (const flag of ['commitment', 'locked', 'errand', 'done']) {
      fixture.componentRef.setInput(flag, true);
      fixture.detectChanges();
      expect(host.classList.contains(`block--${flag}`)).toBe(true);

      fixture.componentRef.setInput(flag, false);
      fixture.detectChanges();
      expect(host.classList.contains(`block--${flag}`)).toBe(false);
    }
  });

  it('offers a chevron that names the row and emits details', () => {
    const chev = chevron() as HTMLButtonElement;
    expect(chev.getAttribute('type')).toBe('button');
    expect(chev.getAttribute('aria-label')).toBe('Details for Breakfast at home');
    expect(chev.querySelector('sd-icon')?.getAttribute('name')).toBe('chevron_right');

    const spy = vi.fn();
    fixture.componentInstance.details.subscribe(spy);
    chev.click();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('is compact with a smaller glyph and no chevron for drive rows', () => {
    fixture.componentRef.setInput('drive', true);
    fixture.detectChanges();
    expect(host.classList.contains('block--drive')).toBe(true);
    expect(discIcon().style.getPropertyValue('--_size')).toBe('13px');
    expect(chevron()).toBeNull();
  });

  it('hides the chevron in the read-only shared view', () => {
    fixture.componentRef.setInput('readonly', true);
    fixture.detectChanges();
    expect(chevron()).toBeNull();
    fixture.componentRef.setInput('readonly', false);
    fixture.detectChanges();
    expect(chevron()).not.toBeNull();
  });

  it('projects chips into the body and actions into their own region', () => {
    const wrapper = TestBed.createComponent(HostCmp);
    wrapper.detectChanges();
    const el = (wrapper.nativeElement as HTMLElement).querySelector('sd-block') as HTMLElement;
    expect(el.querySelector('.block__body .block__chips .chip-a')?.textContent).toBe('Outdoors');
    expect(el.querySelector('.block__actions .act')?.textContent).toBe('Swap');
    expect(el.querySelector('.block__title')?.textContent?.trim()).toBe('Park');
  });
});
