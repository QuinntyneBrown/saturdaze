import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Icon } from '../icon/icon';
import { Well } from './well';

/** The svg markup `sd-icon` draws for `name`, to compare against a rendered glyph. */
const glyph = (name: string): string => {
  const ref = TestBed.createComponent(Icon);
  ref.componentRef.setInput('name', name);
  ref.detectChanges();
  return (ref.nativeElement as HTMLElement).querySelector('svg')?.innerHTML ?? '';
};
const drawn = (icon: Element | null): string => icon?.querySelector('svg')?.innerHTML ?? '';

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
    await TestBed.configureTestingModule({ imports: [Well, HostCmp, Icon] }).compileComponents();
    fixture = TestBed.createComponent(Well);
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  it('creates a plain well with a leading sparkle', () => {
    expect(fixture.componentInstance).toBeTruthy();
    expect(host.classList.contains('well')).toBe(true);
    expect(drawn(host.querySelector('sd-icon'))).toBe(glyph('sparkle'));
    expect(host.querySelector('.well__title')).toBeNull();
    expect(host.querySelector('.well__text .well__body')).not.toBeNull();
  });

  it('mirrors the tone to a host class', () => {
    for (const tone of ['accent', 'warn', 'primary']) {
      fixture.componentRef.setInput('tone', tone);
      fixture.detectChanges();
      expect(host.classList.contains(`well--${tone}`)).toBe(true);
    }
  });

  it('renders the bold first line from title', () => {
    fixture.componentRef.setInput('title', 'Keeping Saturday');
    fixture.detectChanges();
    expect(host.querySelector('.well__title')?.textContent?.trim()).toBe('Keeping Saturday');
  });

  it('forwards the icon name', () => {
    fixture.componentRef.setInput('icon', 'lock');
    fixture.detectChanges();
    expect(drawn(host.querySelector('sd-icon'))).toBe(glyph('lock'));
  });

  it('projects the body under the title', () => {
    const wrapper = TestBed.createComponent(HostCmp);
    wrapper.detectChanges();
    const el = (wrapper.nativeElement as HTMLElement).querySelector('sd-well') as HTMLElement;
    expect(el.querySelector('.well__title')?.textContent?.trim()).toBe('Why this');
    expect(el.querySelector('.well__body')?.textContent?.trim()).toBe(
      'Sunny and 22°, so we kept it outside.',
    );
    expect(drawn(el.querySelector('sd-icon'))).toBe(glyph('sun'));
  });
});
