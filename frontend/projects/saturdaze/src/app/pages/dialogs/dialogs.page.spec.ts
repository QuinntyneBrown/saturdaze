import { vi } from 'vitest';
import { Directive, inject } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgModel } from '@angular/forms';
import { provideRouter } from '@angular/router';

import { EVENT_SUBMISSIONS_SERVICE, WEEKEND_PLAN_SERVICE } from 'api';

import { DialogsPage } from './dialogs.page';

describe('DialogsPage', () => {
  let fixture: ComponentFixture<DialogsPage>;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogsPage],
      providers: [
        provideRouter([]),
        { provide: WEEKEND_PLAN_SERVICE, useValue: { addErrand: vi.fn() } },
        { provide: EVENT_SUBMISSIONS_SERVICE, useValue: { submit: vi.fn() } },
      ],
    })
      .compileComponents();
    fixture = TestBed.createComponent(DialogsPage);
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  const specimens = (): HTMLElement[] => Array.from(host.querySelectorAll('section.specimen[id^="dialog-"]'));

  it('renders the page header and every specimen in the mock order', () => {
    expect(host.querySelector('sd-page-header')?.getAttribute('title')).toBe('Dialogs');
    expect(specimens().length).toBe(30);
    expect(specimens().map((s) => s.id)).toEqual([
      'dialog-block',
      'dialog-block-locked',
      'dialog-block-commitment',
      'dialog-regenerate',
      'dialog-regenerate-day',
      'dialog-share',
      'dialog-calendar',
      'dialog-errand',
      'dialog-errand-added',
      'dialog-suggest',
      'dialog-submitted',
      'dialog-lock-in',
      'dialog-rate',
      'dialog-rename',
      'dialog-repeat',
      'dialog-remix',
      'dialog-member',
      'dialog-member-add',
      'dialog-commitment',
      'dialog-commitment-add',
      'dialog-home',
      'dialog-likes',
      'dialog-remove',
      'dialog-remove-commitment',
      'dialog-signout',
      'dialog-approve',
      'dialog-reject',
      'dialog-more',
      'dialog-more-menu',
      'dialog-account',
    ]);
  });

  it('renders each dialog specimen statically inside the sd-dialog shell', () => {
    const dialogs = specimens().filter((s) => !s.classList.contains('specimen--menu'));
    expect(dialogs.length).toBe(28);
    for (const section of dialogs) {
      const shell = section.querySelector('sd-dialog');
      expect(shell, section.id).not.toBeNull();
      expect(shell?.hasAttribute('static'), section.id).toBe(true);
      expect(section.querySelector('.specimen__label')?.textContent?.trim(), section.id).toMatch(/^D\d+ · /);
    }
    expect(host.querySelector('#dialog-block .dialog__title')?.textContent?.trim()).toBe('Terre Bleu Lavender Farm');
    expect(host.querySelector('#dialog-signout .dialog__title')?.textContent?.trim()).toBe('Sign out?');
  });

  it('renders the two anchored menus as plain sd-menu specimens', () => {
    const menus = specimens().filter((s) => s.classList.contains('specimen--menu'));
    expect(menus.map((m) => m.id)).toEqual(['dialog-more-menu', 'dialog-account']);
    for (const section of menus) {
      expect(section.querySelector('sd-dialog')).toBeNull();
      expect(section.querySelector('sd-menu')).not.toBeNull();
    }
    expect(host.querySelector('#dialog-account .menu__header')?.textContent?.trim()).toBe(
      'quinntynebrown@gmail.com',
    );
    expect(host.querySelectorAll('#dialog-more-menu [role="menuitem"]').length).toBe(2);
  });

  it('keeps specimens on the page when their close buttons are pressed', () => {
    (host.querySelector('#dialog-regenerate sd-button[slot="actions"] button') as HTMLButtonElement).click();
    (host.querySelector('#dialog-share .dialog__close button') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(specimens().length).toBe(30);
  });
});
