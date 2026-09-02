import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthCard } from './auth-card';

@Component({
  standalone: true,
  imports: [AuthCard],
  template: `
    <sd-auth-card title="Welcome back" subtitle="Sign in to plan the weekend" center>
      <i slot="disc" class="disc-a"></i>
      <p slot="head" class="head-a">Verifying</p>
      <form class="form-a"></form>
      <a slot="alt" class="alt-a" href="/create-account">Create an account</a>
    </sd-auth-card>
  `,
})
class HostCmp {}

describe('AuthCard', () => {
  let fixture: ComponentFixture<AuthCard>;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [AuthCard, HostCmp] }).compileComponents();
    fixture = TestBed.createComponent(AuthCard);
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  it('creates the card with an h1 and an alt line', () => {
    expect(fixture.componentInstance).toBeTruthy();
    expect(host.classList.contains('auth-card')).toBe(true);
    expect(host.querySelector('.auth-card__head h1.auth-card__title')).not.toBeNull();
    expect(host.querySelector('.auth-card__sub')).toBeNull();
    expect(host.querySelector('p.auth-card__alt')).not.toBeNull();
    expect(host.querySelector('.auth-card__head--center')).toBeNull();
    expect(host.getAttribute('title')).toBeNull();
    expect(host.getAttribute('center')).toBeNull();
  });

  it('renders the title and subtitle and mirrors the title to the host', () => {
    fixture.componentRef.setInput('title', 'Create your account');
    fixture.componentRef.setInput('subtitle', 'Takes about a minute');
    fixture.detectChanges();
    expect(host.querySelector('.auth-card__title')?.textContent?.trim()).toBe(
      'Create your account',
    );
    expect(host.querySelector('.auth-card__sub')?.textContent?.trim()).toBe('Takes about a minute');
    expect(host.getAttribute('title')).toBe('Create your account');
  });

  it('centres the head when asked', () => {
    fixture.componentRef.setInput('center', true);
    fixture.detectChanges();
    expect(
      host.querySelector('.auth-card__head')?.classList.contains('auth-card__head--center'),
    ).toBe(true);
    expect(host.getAttribute('center')).toBe('');
  });

  it('projects disc, head, form and alt into their slots', () => {
    const wrapper = TestBed.createComponent(HostCmp);
    wrapper.detectChanges();
    const el = (wrapper.nativeElement as HTMLElement).querySelector('sd-auth-card') as HTMLElement;
    const head = el.querySelector('.auth-card__head') as HTMLElement;
    expect(head.firstElementChild?.classList.contains('disc-a')).toBe(true);
    expect(head.querySelector('.auth-card__title')?.textContent?.trim()).toBe('Welcome back');
    expect(head.lastElementChild?.classList.contains('head-a')).toBe(true);
    expect(head.classList.contains('auth-card__head--center')).toBe(true);
    expect(el.querySelector(':scope > .form-a')).not.toBeNull();
    expect(el.querySelector('.auth-card__alt .alt-a')?.textContent).toBe('Create an account');
  });
});
