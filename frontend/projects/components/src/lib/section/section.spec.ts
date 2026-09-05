import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Section } from './section';

@Component({
  standalone: true,
  imports: [Section],
  template: `
    <sd-section title="Members" subtitle="Four of you">
      <button slot="action" class="edit">Edit</button>
      <p class="body">Quinn, Sara, Eli, Mae</p>
    </sd-section>
  `,
})
class HostCmp {}

describe('Section', () => {
  let fixture: ComponentFixture<Section>;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Section, HostCmp] }).compileComponents();
    fixture = TestBed.createComponent(Section);
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  it('creates an untitled section without a header', () => {
    expect(fixture.componentInstance).toBeTruthy();
    expect(host.classList.contains('section')).toBe(true);
    expect(host.querySelector('.section-header')).toBeNull();
    expect(host.hasAttribute('aria-labelledby')).toBe(false);
    expect(host.getAttribute('title')).toBeNull();
    expect(host.getAttribute('subtitle')).toBeNull();
  });

  it('renders the heading and labels the section with it', () => {
    fixture.componentRef.setInput('title', 'Likes');
    fixture.detectChanges();
    const h2 = host.querySelector('h2.section-header__title') as HTMLElement;
    expect(h2.textContent?.trim()).toBe('Likes');
    expect(h2.id).toMatch(/^sd-section-\d+$/);
    expect(host.getAttribute('aria-labelledby')).toBe(h2.id);
    expect(host.getAttribute('title')).toBe('Likes');
    expect(host.querySelector('.section-header__sub')).toBeNull();
  });

  it('renders the subtitle under the heading', () => {
    fixture.componentRef.setInput('title', 'Likes');
    fixture.componentRef.setInput('subtitle', 'What the family enjoys');
    fixture.detectChanges();
    expect(host.querySelector('.section-header__sub')?.textContent?.trim()).toBe(
      'What the family enjoys',
    );
    expect(host.getAttribute('subtitle')).toBe('What the family enjoys');
  });

  it('projects the action into the header and the body below it', () => {
    const wrapper = TestBed.createComponent(HostCmp);
    wrapper.detectChanges();
    const el = (wrapper.nativeElement as HTMLElement).querySelector('sd-section') as HTMLElement;
    expect(el.querySelector('.section-header__action .edit')?.textContent).toBe('Edit');
    expect(el.querySelector('.section-header .body')).toBeNull();
    expect(el.querySelector(':scope > .body')?.textContent).toBe('Quinn, Sara, Eli, Mae');
    expect(el.querySelector('.section-header__title')?.textContent?.trim()).toBe('Members');
  });
});
