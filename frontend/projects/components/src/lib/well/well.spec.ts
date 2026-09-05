import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Well } from './well';

@Component({
  standalone: true,
  imports: [Well],
  template: `<sd-well title="Why this" icon="sun">Sunny and 22°, so we kept it outside.</sd-well>`,
})
class HostCmp {}

describe('Well', () => {
  let fixture: ComponentFixture<Well>;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Well, HostCmp] }).compileComponents();
    fixture = TestBed.createComponent(Well);
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  it('creates a plain well with a leading sparkle', () => {
    expect(fixture.componentInstance).toBeTruthy();
    expect(host.classList.contains('well')).toBe(true);
    expect(host.querySelector('sd-icon')?.getAttribute('name')).toBe('sparkle');
    expect(host.querySelector('.well__title')).toBeNull();
    expect(host.querySelector('.well__text .well__body')).not.toBeNull();
    expect(host.getAttribute('tone')).toBeNull();
    expect(host.getAttribute('title')).toBeNull();
  });

  it('mirrors the tone to a host class and attribute', () => {
    for (const tone of ['accent', 'warn', 'primary']) {
      fixture.componentRef.setInput('tone', tone);
      fixture.detectChanges();
      expect(host.classList.contains(`well--${tone}`)).toBe(true);
      expect(host.getAttribute('tone')).toBe(tone);
    }
  });

  it('renders the bold first line from title', () => {
    fixture.componentRef.setInput('title', 'Keeping Saturday');
    fixture.detectChanges();
    expect(host.querySelector('.well__title')?.textContent?.trim()).toBe('Keeping Saturday');
    expect(host.getAttribute('title')).toBe('Keeping Saturday');
  });

  it('forwards the icon name', () => {
    fixture.componentRef.setInput('icon', 'lock');
    fixture.detectChanges();
    expect(host.querySelector('sd-icon')?.getAttribute('name')).toBe('lock');
  });

  it('projects the body under the title', () => {
    const wrapper = TestBed.createComponent(HostCmp);
    wrapper.detectChanges();
    const el = (wrapper.nativeElement as HTMLElement).querySelector('sd-well') as HTMLElement;
    expect(el.querySelector('.well__title')?.textContent?.trim()).toBe('Why this');
    expect(el.querySelector('.well__body')?.textContent?.trim()).toBe(
      'Sunny and 22°, so we kept it outside.',
    );
    expect(el.querySelector('sd-icon')?.getAttribute('name')).toBe('sun');
  });
});
