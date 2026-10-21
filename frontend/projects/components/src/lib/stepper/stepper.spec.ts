import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Stepper } from './stepper';

describe('Stepper', () => {
  let fixture: ComponentFixture<Stepper>;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Stepper] }).compileComponents();
    fixture = TestBed.createComponent(Stepper);
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  const segs = (): HTMLElement[] => Array.from(host.querySelectorAll('.stepper__seg'));

  it('reads "Step 1 of 4" over four hidden segments by default', () => {
    expect(host.classList.contains('stepper')).toBe(true);
    expect(host.querySelector('.stepper__label')?.textContent?.trim()).toBe('Step 1 of 4');
    const track = host.querySelector('.stepper__track') as HTMLElement;
    expect(track.getAttribute('aria-hidden')).toBe('true');
    expect(segs().length).toBe(4);
    expect(segs().map((s) => s.classList.contains('stepper__seg--current'))).toEqual([
      true,
      false,
      false,
      false,
    ]);
    expect(segs().some((s) => s.classList.contains('stepper__seg--done'))).toBe(false);
  });

  it('marks the steps before the current one done', () => {
    fixture.componentRef.setInput('step', 3);
    fixture.detectChanges();
    expect(host.querySelector('.stepper__label')?.textContent?.trim()).toBe('Step 3 of 4');
    expect(segs().map((s) => s.classList.contains('stepper__seg--done'))).toEqual([
      true,
      true,
      false,
      false,
    ]);
    expect(segs().map((s) => s.classList.contains('stepper__seg--current'))).toEqual([
      false,
      false,
      true,
      false,
    ]);
  });

  it('draws as many segments as the count and sizes the track to it', () => {
    fixture.componentRef.setInput('count', 3);
    fixture.detectChanges();
    expect(segs().length).toBe(3);
    expect(host.querySelector('.stepper__label')?.textContent?.trim()).toBe('Step 1 of 3');
    expect(host.style.getPropertyValue('--sd-stepper-count')).toBe('3');
  });
});
