import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { ListItem } from './list-item';

@Component({
  standalone: true,
  imports: [ListItem],
  template: `
    <sd-list-item title="Quinn" subtitle="Parent" chevron>
      <span slot="leading" class="lead">Q</span>
      <em class="extra">admin</em>
      <span slot="trailing" class="trail">•</span>
    </sd-list-item>
  `,
})
class HostCmp {}

describe('ListItem', () => {
  let fixture: ComponentFixture<ListItem>;
  let host: HTMLElement;

  const row = (): HTMLElement => host.querySelector('.list__item') as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListItem, HostCmp],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(ListItem);
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  it('creates a static listitem row', () => {
    expect(fixture.componentInstance).toBeTruthy();
    expect(host.getAttribute('role')).toBe('listitem');
    expect(row().tagName).toBe('DIV');
    expect(row().classList.contains('list__item--action')).toBe(false);
    expect(host.querySelector('.list__title')).toBeNull();
    expect(host.querySelector('.list__sub')).toBeNull();
    expect(host.querySelector('.list__trail sd-icon')).toBeNull();
    for (const attr of ['title', 'subtitle', 'href', 'action', 'chevron']) {
      expect(host.hasAttribute(attr)).toBe(false);
    }
  });

  it('renders title and subtitle and mirrors them to the host', () => {
    fixture.componentRef.setInput('title', 'Sara');
    fixture.componentRef.setInput('subtitle', 'Parent');
    fixture.detectChanges();
    expect(host.querySelector('.list__text .list__title')?.textContent?.trim()).toBe('Sara');
    expect(host.querySelector('.list__text .list__sub')?.textContent?.trim()).toBe('Parent');
    expect(host.getAttribute('title')).toBe('Sara');
    expect(host.getAttribute('subtitle')).toBe('Parent');
  });

  it('adds the trailing chevron glyph', () => {
    fixture.componentRef.setInput('chevron', true);
    fixture.detectChanges();
    expect(host.querySelector('.list__trail sd-icon')?.getAttribute('name')).toBe('chevron_right');
    expect(host.getAttribute('chevron')).toBe('');
  });

  it('becomes a button that emits pressed when action is set', () => {
    fixture.componentRef.setInput('action', true);
    fixture.componentRef.setInput('label', 'Edit Sara');
    fixture.detectChanges();
    const btn = row() as HTMLButtonElement;
    expect(btn.tagName).toBe('BUTTON');
    expect(btn.getAttribute('type')).toBe('button');
    expect(btn.classList.contains('list__item--action')).toBe(true);
    expect(btn.getAttribute('aria-label')).toBe('Edit Sara');
    expect(host.getAttribute('action')).toBe('');

    const spy = vi.fn();
    fixture.componentInstance.pressed.subscribe(spy);
    btn.click();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('becomes an in-app anchor when href is set and routes plain clicks', () => {
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    fixture.componentRef.setInput('href', '/family/review');
    fixture.componentRef.setInput('action', true);
    fixture.detectChanges();

    const a = row() as HTMLAnchorElement;
    expect(a.tagName).toBe('A');
    expect(a.getAttribute('href')).toBe('/family/review');
    expect(a.classList.contains('list__item--action')).toBe(true);
    expect(host.querySelector('button')).toBeNull();
    expect(host.getAttribute('href')).toBe('/family/review');

    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    a.dispatchEvent(event);
    expect(navigate).toHaveBeenCalledWith('/family/review');
    expect(event.defaultPrevented).toBe(true);
  });

  it('projects leading, default and trailing content into the row', () => {
    const wrapper = TestBed.createComponent(HostCmp);
    wrapper.detectChanges();
    const el = (wrapper.nativeElement as HTMLElement).querySelector('sd-list-item') as HTMLElement;
    const item = el.querySelector('.list__item') as HTMLElement;
    expect(item.firstElementChild?.classList.contains('lead')).toBe(true);
    expect(item.querySelector('.list__text .extra')?.textContent).toBe('admin');
    expect(item.querySelector('.list__text .list__title')?.textContent?.trim()).toBe('Quinn');
    const trail = item.querySelector('.list__trail') as HTMLElement;
    expect(trail.querySelector('.trail')).not.toBeNull();
    expect(trail.querySelector('sd-icon')?.getAttribute('name')).toBe('chevron_right');
  });
});
