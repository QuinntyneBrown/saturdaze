import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Strength } from './strength';

describe('Strength', () => {
  let fixture: ComponentFixture<Strength>;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Strength] }).compileComponents();
    fixture = TestBed.createComponent(Strength);
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  it('creates a polite live meter with three hidden segments', () => {
    expect(fixture.componentInstance).toBeTruthy();
    expect(host.classList.contains('strength')).toBe(true);
    expect(host.getAttribute('aria-live')).toBe('polite');
    const bar = host.querySelector('.strength__bar') as HTMLElement;
    expect(bar.getAttribute('aria-hidden')).toBe('true');
    expect(bar.querySelectorAll('.strength__seg').length).toBe(3);
  });

  it('has no level and no label until told', () => {
    expect(host.getAttribute('level')).toBeNull();
    expect(host.className.trim()).toBe('strength');
    expect(host.querySelector('.strength__label')).toBeNull();
  });

  it('mirrors the level to a host class and attribute', () => {
    for (const level of ['weak', 'ok', 'strong']) {
      fixture.componentRef.setInput('level', level);
      fixture.detectChanges();
      expect(host.classList.contains(`strength--${level}`)).toBe(true);
      expect(host.getAttribute('level')).toBe(level);
    }
    expect(host.classList.contains('strength--weak')).toBe(false);

    fixture.componentRef.setInput('level', null);
    fixture.detectChanges();
    expect(host.getAttribute('level')).toBeNull();
    expect(host.classList.contains('strength--strong')).toBe(false);
  });

  it('announces the label text', () => {
    fixture.componentRef.setInput('label', 'Strong password');
    fixture.detectChanges();
    expect(host.querySelector('.strength__label')?.textContent?.trim()).toBe('Strong password');
  });
});
