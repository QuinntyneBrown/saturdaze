import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BrowserFrame } from './browser-frame';

@Component({
  standalone: true,
  imports: [BrowserFrame],
  template: `<sd-browser-frame><p class="inner">Weekend</p></sd-browser-frame>`,
})
class HostCmp {}

describe('BrowserFrame', () => {
  let fixture: ComponentFixture<BrowserFrame>;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [BrowserFrame, HostCmp] }).compileComponents();
    fixture = TestBed.createComponent(BrowserFrame);
    fixture.detectChanges();
    await fixture.whenStable();
    host = fixture.nativeElement as HTMLElement;
  });

  it('creates as a decorative browser chrome', () => {
    expect(fixture.componentInstance).toBeTruthy();
    expect(host.classList.contains('browser-frame')).toBe(true);
    expect(host.getAttribute('aria-hidden')).toBe('true');
    expect(host.querySelectorAll('.browser-frame__bar .browser-frame__dot').length).toBe(3);
  });

  it('shows the url in the bar and mirrors it to the host', () => {
    expect(host.querySelector('.browser-frame__url')?.textContent?.trim()).toBe(
      'saturdaze.app/weekend',
    );
    expect(host.getAttribute('url')).toBe('saturdaze.app/weekend');

    fixture.componentRef.setInput('url', 'saturdaze.app/past');
    fixture.detectChanges();
    expect(host.querySelector('.browser-frame__url')?.textContent?.trim()).toBe(
      'saturdaze.app/past',
    );
    expect(host.getAttribute('url')).toBe('saturdaze.app/past');
  });

  it('lays the composition out at the frame size', () => {
    expect(host.style.getPropertyValue('--_w')).toBe('720px');
    expect(host.style.getPropertyValue('--_h')).toBe('300px');

    fixture.componentRef.setInput('frameWidth', 1024);
    fixture.componentRef.setInput('frameHeight', 480);
    fixture.detectChanges();
    expect(host.style.getPropertyValue('--_w')).toBe('1024px');
    expect(host.style.getPropertyValue('--_h')).toBe('480px');
  });

  it('does not scale up when the host has no measurable width', () => {
    expect(host.style.getPropertyValue('--_s')).toBe('1');
  });

  it('projects the composition into the scaled view', () => {
    const wrapper = TestBed.createComponent(HostCmp);
    wrapper.detectChanges();
    const el = wrapper.nativeElement as HTMLElement;
    expect(el.querySelector('.browser-frame__view .browser-frame__scale .inner')?.textContent).toBe(
      'Weekend',
    );
  });
});
