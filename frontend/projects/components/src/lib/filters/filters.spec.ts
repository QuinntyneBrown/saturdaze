import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilterChip } from '../filter-chip/filter-chip';
import { Filters } from './filters';

@Component({
  standalone: true,
  imports: [Filters, FilterChip],
  template: `
    <sd-filters label="Kind">
      <sd-filter-chip>All</sd-filter-chip>
      <span class="sd-vdivider"></span>
      <sd-filter-chip>Outdoors</sd-filter-chip>
    </sd-filters>
  `,
})
class HostCmp {}

describe('Filters', () => {
  let fixture: ComponentFixture<Filters>;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Filters, HostCmp] }).compileComponents();
    fixture = TestBed.createComponent(Filters);
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  it('creates as a labelled group', () => {
    expect(fixture.componentInstance).toBeTruthy();
    expect(host.getAttribute('role')).toBe('group');
    expect(host.getAttribute('aria-label')).toBe('Filters');
  });

  it('scrolls horizontally by default', () => {
    expect(host.classList.contains('scroller-x')).toBe(true);
    expect(host.classList.contains('filters')).toBe(false);
    expect(host.getAttribute('scroll')).toBe('');
  });

  it('wraps when scroll is turned off', () => {
    fixture.componentRef.setInput('scroll', false);
    fixture.detectChanges();
    expect(host.classList.contains('filters')).toBe(true);
    expect(host.classList.contains('scroller-x')).toBe(false);
    expect(host.getAttribute('scroll')).toBeNull();
  });

  it('uses the label input as the accessible name', () => {
    fixture.componentRef.setInput('label', 'Kind of day');
    fixture.detectChanges();
    expect(host.getAttribute('aria-label')).toBe('Kind of day');
  });

  it('projects chips and dividers in order', () => {
    const wrapper = TestBed.createComponent(HostCmp);
    wrapper.detectChanges();
    const group = (wrapper.nativeElement as HTMLElement).querySelector('sd-filters') as HTMLElement;
    expect(group.getAttribute('aria-label')).toBe('Kind');
    const children = Array.from(group.children).map((c) => c.tagName.toLowerCase());
    expect(children).toEqual(['sd-filter-chip', 'span', 'sd-filter-chip']);
    expect(group.querySelectorAll('.filter-chip').length).toBe(2);
  });
});
