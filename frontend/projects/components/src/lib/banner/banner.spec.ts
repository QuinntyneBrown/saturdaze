import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Banner } from './banner';

@Component({
  standalone: true,
  imports: [Banner],
  template: `<sd-banner tone="warn" role="alert" icon="close">Something went wrong.</sd-banner>`,
})
class HostCmp {}

describe('Banner', () => {
  let fixture: ComponentFixture<Banner>;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Banner, HostCmp] }).compileComponents();
    fixture = TestBed.createComponent(Banner);
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  it('creates a polite info status by default', () => {
    expect(fixture.componentInstance).toBeTruthy();
    expect(host.classList.contains('banner')).toBe(true);
    expect(host.classList.contains('banner--info')).toBe(true);
    expect(host.getAttribute('tone')).toBe('info');
    expect(host.getAttribute('role')).toBe('status');
    expect(host.getAttribute('aria-live')).toBe('polite');
    expect(host.querySelector('sd-icon')).toBeNull();
    expect(host.querySelector('.banner__text')).not.toBeNull();
  });

  it('mirrors the tone to a host class and attribute', () => {
    for (const tone of ['warn', 'success', 'info']) {
      fixture.componentRef.setInput('tone', tone);
      fixture.detectChanges();
      expect(host.classList.contains(`banner--${tone}`)).toBe(true);
      expect(host.getAttribute('tone')).toBe(tone);
    }
    expect(host.classList.contains('banner--warn')).toBe(false);
  });

  it('becomes an assertive alert for errors', () => {
    fixture.componentRef.setInput('role', 'alert');
    fixture.detectChanges();
    expect(host.getAttribute('role')).toBe('alert');
    expect(host.getAttribute('aria-live')).toBe('assertive');
  });

  it('renders a leading glyph only when an icon is given', () => {
    fixture.componentRef.setInput('icon', 'lock');
    fixture.detectChanges();
    expect(host.querySelector('sd-icon')?.getAttribute('name')).toBe('lock');
    fixture.componentRef.setInput('icon', '');
    fixture.detectChanges();
    expect(host.querySelector('sd-icon')).toBeNull();
  });

  it('projects the message into the text span', () => {
    const wrapper = TestBed.createComponent(HostCmp);
    wrapper.detectChanges();
    const el = (wrapper.nativeElement as HTMLElement).querySelector('sd-banner') as HTMLElement;
    expect(el.querySelector('.banner__text')?.textContent?.trim()).toBe('Something went wrong.');
    expect(el.getAttribute('role')).toBe('alert');
    expect(el.classList.contains('banner--warn')).toBe(true);
    expect(el.querySelector('sd-icon')?.getAttribute('name')).toBe('close');
  });
});
