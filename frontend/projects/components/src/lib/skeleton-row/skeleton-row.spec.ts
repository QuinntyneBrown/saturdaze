import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SkeletonRow } from './skeleton-row';

describe('SkeletonRow', () => {
  let fixture: ComponentFixture<SkeletonRow>;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SkeletonRow] }).compileComponents();
    fixture = TestBed.createComponent(SkeletonRow);
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  it('creates a decorative placeholder row', () => {
    expect(fixture.componentInstance).toBeTruthy();
    expect(host.classList.contains('skeleton-row')).toBe(true);
    expect(host.getAttribute('aria-hidden')).toBe('true');
  });

  it('is shaped like a block: time, disc and a two-line body', () => {
    expect(host.querySelector('.skeleton.skeleton--time')).not.toBeNull();
    expect(host.querySelector('.skeleton.skeleton--disc')).not.toBeNull();
    const body = host.querySelector('.skeleton-row__body') as HTMLElement;
    expect(body).not.toBeNull();
    expect(body.querySelector('.skeleton--text')).not.toBeNull();
    expect(body.querySelector('.skeleton--text-sm')).not.toBeNull();
    expect(host.querySelectorAll('.skeleton').length).toBe(4);
  });

  it('has no text for assistive tech to read', () => {
    expect(host.textContent?.trim()).toBe('');
  });
});
