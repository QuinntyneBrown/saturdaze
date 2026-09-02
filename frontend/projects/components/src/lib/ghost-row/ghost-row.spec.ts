import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { GhostRow } from './ghost-row';

@Component({
  standalone: true,
  imports: [GhostRow],
  template: `<sd-ghost-row icon="user">Add a family member</sd-ghost-row>`,
})
class HostCmp {}

describe('GhostRow', () => {
  let fixture: ComponentFixture<GhostRow>;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GhostRow, HostCmp],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(GhostRow);
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  it('creates a dashed add button with a plus glyph', () => {
    expect(fixture.componentInstance).toBeTruthy();
    const btn = host.querySelector('button.ghost-row') as HTMLButtonElement;
    expect(btn).not.toBeNull();
    expect(btn.getAttribute('type')).toBe('button');
    expect(btn.querySelector('sd-icon')?.getAttribute('name')).toBe('plus');
    expect(host.querySelector('a')).toBeNull();
    expect(host.getAttribute('icon')).toBe('plus');
    expect(host.getAttribute('href')).toBeNull();
  });

  it('forwards the icon name', () => {
    fixture.componentRef.setInput('icon', 'user');
    fixture.detectChanges();
    expect(host.querySelector('sd-icon')?.getAttribute('name')).toBe('user');
    expect(host.getAttribute('icon')).toBe('user');
  });

  it('emits pressed when the button is clicked', () => {
    const spy = vi.fn();
    fixture.componentInstance.pressed.subscribe(spy);
    (host.querySelector('button.ghost-row') as HTMLElement).click();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('renders an in-app anchor when href is given and routes plain clicks', () => {
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    fixture.componentRef.setInput('href', '/family/new');
    fixture.detectChanges();

    const a = host.querySelector('a.ghost-row') as HTMLAnchorElement;
    expect(a).not.toBeNull();
    expect(host.querySelector('button')).toBeNull();
    expect(a.getAttribute('href')).toBe('/family/new');
    expect(host.getAttribute('href')).toBe('/family/new');

    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    a.dispatchEvent(event);
    expect(navigate).toHaveBeenCalledWith('/family/new');
    expect(event.defaultPrevented).toBe(true);
  });

  it('projects the row text after the glyph', () => {
    const wrapper = TestBed.createComponent(HostCmp);
    wrapper.detectChanges();
    const btn = (wrapper.nativeElement as HTMLElement).querySelector('.ghost-row') as HTMLElement;
    expect(btn.textContent?.trim()).toBe('Add a family member');
    expect(btn.firstElementChild?.tagName.toLowerCase()).toBe('sd-icon');
  });
});
