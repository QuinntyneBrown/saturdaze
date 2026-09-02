import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatusRow } from './status-row';

@Component({
  standalone: true,
  imports: [StatusRow],
  template: `<sd-status-row icon="refresh">Working through your locks.</sd-status-row>`,
})
class HostCmp {}

describe('StatusRow', () => {
  let fixture: ComponentFixture<StatusRow>;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [StatusRow, HostCmp] }).compileComponents();
    fixture = TestBed.createComponent(StatusRow);
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  it('creates a polite live status region', () => {
    expect(fixture.componentInstance).toBeTruthy();
    expect(host.classList.contains('status-row')).toBe(true);
    expect(host.getAttribute('role')).toBe('status');
    expect(host.getAttribute('aria-live')).toBe('polite');
  });

  it('shows a spinner disc with the sparkle glyph by default', () => {
    const spinner = host.querySelector('sd-spinner') as HTMLElement;
    expect(spinner).not.toBeNull();
    expect(spinner.classList.contains('spinner-disc')).toBe(true);
    expect(spinner.getAttribute('icon')).toBe('sparkle');
  });

  it('forwards the icon to the spinner', () => {
    fixture.componentRef.setInput('icon', 'refresh');
    fixture.detectChanges();
    expect(host.querySelector('sd-spinner')?.getAttribute('icon')).toBe('refresh');
  });

  it('projects the message into the text span', () => {
    const wrapper = TestBed.createComponent(HostCmp);
    wrapper.detectChanges();
    const el = (wrapper.nativeElement as HTMLElement).querySelector('sd-status-row') as HTMLElement;
    expect(el.querySelector('.status-row__text')?.textContent?.trim()).toBe(
      'Working through your locks.',
    );
    expect(el.querySelector('sd-spinner')?.getAttribute('icon')).toBe('refresh');
  });
});
