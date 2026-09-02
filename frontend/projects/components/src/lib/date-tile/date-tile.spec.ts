import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DateTile } from './date-tile';

describe('DateTile', () => {
  let fixture: ComponentFixture<DateTile>;
  let host: HTMLElement;

  const month = (): string => host.querySelector('.date-tile__m')?.textContent ?? '';
  const day = (): string => host.querySelector('.date-tile__d')?.textContent ?? '';

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [DateTile] }).compileComponents();
    fixture = TestBed.createComponent(DateTile);
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  it('creates a decorative, empty tile', () => {
    expect(fixture.componentInstance).toBeTruthy();
    expect(host.classList.contains('date-tile')).toBe(true);
    expect(host.getAttribute('aria-hidden')).toBe('true');
    expect(month()).toBe('');
    expect(day()).toBe('');
  });

  it('renders month over day from an ISO date', () => {
    fixture.componentRef.setInput('date', '2026-05-17');
    fixture.detectChanges();
    expect(month()).toBe('May');
    expect(day()).toBe('17');
    expect(host.getAttribute('date')).toBe('2026-05-17');
  });

  it('accepts an ISO date-time and drops the leading zero on the day', () => {
    fixture.componentRef.setInput('date', '2026-12-03T10:30:00Z');
    fixture.detectChanges();
    expect(month()).toBe('Dec');
    expect(day()).toBe('3');
  });

  it('renders nothing for an unparseable date', () => {
    fixture.componentRef.setInput('date', 'next saturday');
    fixture.detectChanges();
    expect(month()).toBe('');
    expect(day()).toBe('');
  });
});
