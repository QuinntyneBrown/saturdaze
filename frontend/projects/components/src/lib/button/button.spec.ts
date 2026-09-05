import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { Button } from './button';

@Component({
  standalone: true,
  imports: [Button],
  template: `
    <sd-button id="plain">
      <span slot="leading" class="lead">L</span>
      Save
      <span slot="trailing" class="trail">T</span>
    </sd-button>
    <sd-button id="link" href="/weekend">
      <span slot="leading" class="lead">L</span>
      Save
      <span slot="trailing" class="trail">T</span>
    </sd-button>
  `,
})
class HostCmp {}

/**
 * Dispatches a cancelable click and reports whether the component prevented
 * it. A window-level guard cancels the event afterwards so jsdom never tries
 * to follow an external href ("Not implemented: navigation").
 */
function click(el: HTMLElement, init: MouseEventInit = {}): boolean {
  const event = new MouseEvent('click', { bubbles: true, cancelable: true, ...init });
  let preventedByComponent = false;
  const guard = (e: Event): void => {
    preventedByComponent = e.defaultPrevented;
    e.preventDefault();
  };
  window.addEventListener('click', guard);
  try {
    el.dispatchEvent(event);
  } finally {
    window.removeEventListener('click', guard);
  }
  return preventedByComponent;
}

describe('Button', () => {
  let fixture: ComponentFixture<Button>;
  let host: HTMLElement;

  const inner = (): HTMLElement => host.querySelector('.btn') as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Button, HostCmp],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(Button);
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  it('creates a primary, medium <button type="button"> by default', () => {
    expect(fixture.componentInstance).toBeTruthy();
    const btn = inner();
    expect(btn.tagName).toBe('BUTTON');
    expect(btn.getAttribute('type')).toBe('button');
    expect(btn.classList.contains('btn--primary')).toBe(true);
    expect(btn.classList.contains('btn--md')).toBe(false);
    expect(host.getAttribute('variant')).toBe('primary');
    expect(host.getAttribute('size')).toBeNull();
    expect(host.querySelector('a')).toBeNull();
  });

  it('mirrors variant, size, full, icon and warnText to classes and host attributes', () => {
    fixture.componentRef.setInput('variant', 'quiet');
    fixture.componentRef.setInput('size', 'sm');
    fixture.componentRef.setInput('full', true);
    fixture.componentRef.setInput('icon', true);
    fixture.componentRef.setInput('warnText', true);
    fixture.componentRef.setInput('btnClass', 'fav-btn');
    fixture.componentRef.setInput('type', 'submit');
    fixture.detectChanges();

    const btn = inner();
    for (const cls of [
      'btn--quiet',
      'btn--sm',
      'btn--block',
      'btn--icon',
      'btn--warn-text',
      'fav-btn',
    ]) {
      expect(btn.classList.contains(cls)).toBe(true);
    }
    expect(btn.classList.contains('btn--primary')).toBe(false);
    expect(btn.getAttribute('type')).toBe('submit');
    expect(host.getAttribute('variant')).toBe('quiet');
    expect(host.getAttribute('size')).toBe('sm');
    expect(host.getAttribute('full')).toBe('');
    expect(host.getAttribute('icon')).toBe('');
  });

  it('disables the inner button and mirrors disabled to the host', () => {
    expect(host.getAttribute('disabled')).toBeNull();
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    expect((inner() as HTMLButtonElement).disabled).toBe(true);
    expect(host.getAttribute('disabled')).toBe('');
  });

  it('exposes pressed as aria-pressed only when it is a toggle', () => {
    expect(inner().hasAttribute('aria-pressed')).toBe(false);
    expect(host.hasAttribute('pressed')).toBe(false);

    fixture.componentRef.setInput('pressed', true);
    fixture.detectChanges();
    expect(inner().getAttribute('aria-pressed')).toBe('true');
    expect(host.getAttribute('pressed')).toBe('true');

    fixture.componentRef.setInput('pressed', false);
    fixture.detectChanges();
    expect(inner().getAttribute('aria-pressed')).toBe('false');
    expect(host.getAttribute('pressed')).toBe('false');
  });

  it('uses label as the accessible name', () => {
    expect(inner().hasAttribute('aria-label')).toBe(false);
    fixture.componentRef.setInput('label', 'Close');
    fixture.detectChanges();
    expect(inner().getAttribute('aria-label')).toBe('Close');
  });

  it('renders an anchor when href is given', () => {
    fixture.componentRef.setInput('href', 'https://maps.example/x');
    fixture.componentRef.setInput('target', '_blank');
    fixture.componentRef.setInput('label', 'Map');
    fixture.componentRef.setInput('pressed', true);
    fixture.detectChanges();

    const a = inner() as HTMLAnchorElement;
    expect(a.tagName).toBe('A');
    expect(host.querySelector('button')).toBeNull();
    expect(a.getAttribute('href')).toBe('https://maps.example/x');
    expect(a.getAttribute('target')).toBe('_blank');
    expect(a.getAttribute('rel')).toBe('noopener');
    expect(a.getAttribute('aria-label')).toBe('Map');
    expect(a.getAttribute('aria-pressed')).toBe('true');
    expect(a.hasAttribute('aria-disabled')).toBe(false);
  });

  it('routes a plain click on an in-app href through the router', () => {
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    fixture.componentRef.setInput('href', '/weekend');
    fixture.detectChanges();

    expect(click(inner())).toBe(true);
    expect(navigate).toHaveBeenCalledWith('/weekend');
  });

  it('lets external, modifier and targeted clicks keep their browser meaning', () => {
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    fixture.componentRef.setInput('href', 'https://example.com');
    fixture.detectChanges();
    expect(click(inner())).toBe(false);

    fixture.componentRef.setInput('href', '/weekend');
    fixture.detectChanges();
    expect(click(inner(), { ctrlKey: true })).toBe(false);

    fixture.componentRef.setInput('target', '_blank');
    fixture.detectChanges();
    expect(click(inner())).toBe(false);

    expect(navigate).not.toHaveBeenCalled();
  });

  it('marks a disabled anchor with aria-disabled and swallows its click', () => {
    fixture.componentRef.setInput('href', '/weekend');
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    expect(inner().getAttribute('aria-disabled')).toBe('true');
    expect(click(inner())).toBe(true);
  });

  it('projects default content into the button', () => {
    const wrapper = TestBed.createComponent(HostCmp);
    wrapper.detectChanges();
    const btn = (wrapper.nativeElement as HTMLElement).querySelector('#plain .btn') as HTMLElement;
    expect(btn.tagName).toBe('BUTTON');
    expect(btn.textContent?.replace(/\s+/g, ' ').trim()).toContain('Save');
  });

  it('projects leading and trailing content into the anchor', () => {
    const wrapper = TestBed.createComponent(HostCmp);
    wrapper.detectChanges();
    const a = (wrapper.nativeElement as HTMLElement).querySelector('#link .btn') as HTMLElement;
    expect(a.tagName).toBe('A');
    expect(a.firstElementChild?.classList.contains('lead')).toBe(true);
    expect(a.lastElementChild?.classList.contains('trail')).toBe(true);
  });

  it('projects leading, default and trailing content in order into the button', () => {
    const wrapper = TestBed.createComponent(HostCmp);
    wrapper.detectChanges();
    const btn = (wrapper.nativeElement as HTMLElement).querySelector('#plain .btn') as HTMLElement;
    expect(btn.textContent?.replace(/\s+/g, ' ').trim()).toBe('L Save T');
    expect(btn.firstElementChild?.classList.contains('lead')).toBe(true);
    expect(btn.lastElementChild?.classList.contains('trail')).toBe(true);
  });

  it('projects leading, default and trailing content in order into the anchor', () => {
    const wrapper = TestBed.createComponent(HostCmp);
    wrapper.detectChanges();
    const a = (wrapper.nativeElement as HTMLElement).querySelector('#link .btn') as HTMLElement;
    expect(a.textContent?.replace(/\s+/g, ' ').trim()).toBe('L Save T');
    expect(a.firstElementChild?.classList.contains('lead')).toBe(true);
    expect(a.lastElementChild?.classList.contains('trail')).toBe(true);
  });
});
