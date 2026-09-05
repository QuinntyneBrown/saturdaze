import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { PageHeader } from './page-header';

@Component({
  standalone: true,
  imports: [PageHeader],
  template: `
    <sd-page-header title="This weekend" subtitle="10 – 11 May">
      <button slot="primary" class="primary">Plan it</button>
      <button slot="actions" class="quiet">Share</button>
      <button slot="more" class="more">More</button>
    </sd-page-header>
  `,
})
class HostCmp {}

describe('PageHeader', () => {
  let fixture: ComponentFixture<PageHeader>;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageHeader, HostCmp],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(PageHeader);
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  it('creates with an empty h1 and no back affordance', () => {
    expect(fixture.componentInstance).toBeTruthy();
    expect(host.classList.contains('page-header')).toBe(true);
    expect(host.querySelector('h1.page-header__title')).not.toBeNull();
    expect(host.querySelector('.page-header__eyebrow')).toBeNull();
    expect(host.querySelector('.titlerow sd-button')).toBeNull();
    expect(host.querySelector('.page-header__subtitle')).toBeNull();
    expect(host.getAttribute('title')).toBeNull();
    expect(host.getAttribute('subtitle')).toBeNull();
  });

  it('renders the title and subtitle and mirrors them to the host', () => {
    fixture.componentRef.setInput('title', 'Past weekends');
    fixture.componentRef.setInput('subtitle', 'Every Saturday and Sunday so far');
    fixture.detectChanges();
    expect(host.querySelector('.page-header__title')?.textContent?.trim()).toBe('Past weekends');
    expect(host.querySelector('.page-header__subtitle')?.textContent?.trim()).toBe(
      'Every Saturday and Sunday so far',
    );
    expect(host.getAttribute('title')).toBe('Past weekends');
    expect(host.getAttribute('subtitle')).toBe('Every Saturday and Sunday so far');
  });

  it('renders the eyebrow link and the phone back button from backHref', () => {
    fixture.componentRef.setInput('backHref', '/family');
    fixture.componentRef.setInput('backLabel', 'Family');
    fixture.detectChanges();

    const eyebrow = host.querySelector('a.page-header__eyebrow') as HTMLAnchorElement;
    expect(eyebrow.getAttribute('href')).toBe('/family');
    expect(eyebrow.textContent?.trim()).toBe('Family');
    expect(eyebrow.classList.contains('sd-hide-lt-720')).toBe(true);
    expect(eyebrow.querySelector('sd-icon')?.getAttribute('name')).toBe('arrow_left');

    const back = host.querySelector('.titlerow sd-button') as HTMLElement;
    expect(back.classList.contains('sd-hide-gte-720')).toBe(true);
    const backLink = back.querySelector('a.btn') as HTMLAnchorElement;
    expect(backLink.getAttribute('href')).toBe('/family');
    expect(backLink.getAttribute('aria-label')).toBe('Back to Family');
    expect(backLink.classList.contains('btn--icon')).toBe(true);
  });
  it('draws the arrow glyph inside the phone back button', () => {
    fixture.componentRef.setInput('backHref', '/family');
    fixture.detectChanges();
    const backLink = host.querySelector('.titlerow sd-button a.btn') as HTMLAnchorElement;
    expect(backLink.querySelector('sd-icon')?.getAttribute('name')).toBe('arrow_left');
  });

  it('routes a plain click on the eyebrow through the router', () => {
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    fixture.componentRef.setInput('backHref', '/family');
    fixture.detectChanges();

    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    (host.querySelector('.page-header__eyebrow') as HTMLElement).dispatchEvent(event);
    expect(navigate).toHaveBeenCalledWith('/family');
    expect(event.defaultPrevented).toBe(true);
  });

  it('projects primary, actions and more into their regions', () => {
    const wrapper = TestBed.createComponent(HostCmp);
    wrapper.detectChanges();
    const el = (wrapper.nativeElement as HTMLElement).querySelector(
      'sd-page-header',
    ) as HTMLElement;
    const actions = el.querySelector('.page-header__actions') as HTMLElement;
    expect(actions.children[0]?.classList.contains('primary')).toBe(true);
    expect(actions.children[1]?.classList.contains('quiet')).toBe(true);
    expect(el.querySelector('.page-header__more .more')?.textContent).toBe('More');
    expect(el.querySelector('.page-header__title')?.textContent?.trim()).toBe('This weekend');
  });
});
