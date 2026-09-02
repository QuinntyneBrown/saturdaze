import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListItem } from '../list-item/list-item';
import { List } from './list';

@Component({
  standalone: true,
  imports: [List, ListItem],
  template: `
    <sd-list card>
      <sd-list-item title="Quinn" />
      <sd-list-item title="Sara" />
      <sd-list-item title="Eli" />
    </sd-list>
  `,
})
class HostCmp {}

describe('List', () => {
  let fixture: ComponentFixture<List>;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [List, HostCmp] }).compileComponents();
    fixture = TestBed.createComponent(List);
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  it('creates a plain list', () => {
    expect(fixture.componentInstance).toBeTruthy();
    expect(host.classList.contains('list')).toBe(true);
    expect(host.getAttribute('role')).toBe('list');
    expect(host.classList.contains('list--card')).toBe(false);
    expect(host.getAttribute('card')).toBeNull();
  });

  it('draws the card surface when asked', () => {
    fixture.componentRef.setInput('card', true);
    fixture.detectChanges();
    expect(host.classList.contains('list--card')).toBe(true);
    expect(host.getAttribute('card')).toBe('');
  });

  it('projects list items as its direct children', () => {
    const wrapper = TestBed.createComponent(HostCmp);
    wrapper.detectChanges();
    const list = (wrapper.nativeElement as HTMLElement).querySelector('sd-list') as HTMLElement;
    expect(list.classList.contains('list--card')).toBe(true);
    const items = Array.from(list.children);
    expect(items.length).toBe(3);
    expect(items.every((i) => i.getAttribute('role') === 'listitem')).toBe(true);
    expect(items.map((i) => i.querySelector('.list__title')?.textContent?.trim())).toEqual([
      'Quinn',
      'Sara',
      'Eli',
    ]);
  });
});
