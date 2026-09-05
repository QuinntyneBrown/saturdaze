import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Empty } from './empty';

@Component({
  standalone: true,
  imports: [Empty],
  template: `
    <sd-empty title="No weekends yet" note="Takes about a minute">
      <button slot="cta" class="cta">Plan this weekend</button>
      <p class="extra">Or wait for Saturday.</p>
    </sd-empty>
  `,
})
class HostCmp {}

describe('Empty', () => {
  let fixture: ComponentFixture<Empty>;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Empty, HostCmp] }).compileComponents();
    fixture = TestBed.createComponent(Empty);
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  it('creates a labelled empty state with a default title', () => {
    expect(fixture.componentInstance).toBeTruthy();
    expect(host.classList.contains('empty')).toBe(true);
    const h2 = host.querySelector('h2.empty__title') as HTMLElement;
    expect(h2.textContent?.trim()).toBe('Nothing here yet');
    expect(h2.id).toMatch(/^sd-empty-\d+$/);
    expect(host.getAttribute('aria-labelledby')).toBe(h2.id);
    expect(host.getAttribute('title')).toBe('Nothing here yet');
    expect(host.querySelector('.empty__body')).toBeNull();
    expect(host.querySelector('.empty__note')).toBeNull();
    expect(host.getAttribute('warm')).toBeNull();
  });

  it('draws an extra-large disc with the given icon and tone', () => {
    const disc = host.querySelector('sd-disc') as HTMLElement;
    expect(disc.getAttribute('icon')).toBe('sparkle');
    expect(disc.getAttribute('size')).toBe('xl');
    expect(disc.getAttribute('tone')).toBeNull();

    fixture.componentRef.setInput('icon', 'calendar');
    fixture.componentRef.setInput('tone', 'primary');
    fixture.detectChanges();
    expect(disc.getAttribute('icon')).toBe('calendar');
    expect(disc.getAttribute('tone')).toBe('primary');
  });

  it('renders title, body and note', () => {
    fixture.componentRef.setInput('title', 'No past weekends');
    fixture.componentRef.setInput('body', 'Plan one and it will show up here.');
    fixture.componentRef.setInput('note', 'Takes a minute');
    fixture.detectChanges();
    expect(host.querySelector('.empty__title')?.textContent?.trim()).toBe('No past weekends');
    expect(host.querySelector('.empty__body')?.textContent?.trim()).toBe(
      'Plan one and it will show up here.',
    );
    expect(host.querySelector('.empty__cta .empty__note')?.textContent?.trim()).toBe(
      'Takes a minute',
    );
    expect(host.getAttribute('title')).toBe('No past weekends');
  });

  it('mirrors the warm first-run variant', () => {
    fixture.componentRef.setInput('warm', true);
    fixture.detectChanges();
    expect(host.classList.contains('empty--warm')).toBe(true);
    expect(host.getAttribute('warm')).toBe('');
  });

  it('projects the cta into the action row and the rest below', () => {
    const wrapper = TestBed.createComponent(HostCmp);
    wrapper.detectChanges();
    const el = (wrapper.nativeElement as HTMLElement).querySelector('sd-empty') as HTMLElement;
    const cta = el.querySelector('.empty__cta') as HTMLElement;
    expect(cta.querySelector('.cta')?.textContent).toBe('Plan this weekend');
    expect(cta.querySelector('.empty__note')?.textContent?.trim()).toBe('Takes about a minute');
    expect(cta.querySelector('.extra')).toBeNull();
    expect(el.querySelector(':scope > .extra')?.textContent).toBe('Or wait for Saturday.');
  });
});
