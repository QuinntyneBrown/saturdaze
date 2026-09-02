import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { RatingDialog } from './rating-dialog';

describe('RatingDialog', () => {
  let fixture: ComponentFixture<RatingDialog>;
  let component: RatingDialog;
  let mockDialogRef: { close: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockDialogRef = { close: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [RatingDialog],
      providers: [
        { provide: DialogRef, useValue: mockDialogRef },
        { provide: DIALOG_DATA, useValue: { weekendTitle: 'Bronte + Rec Room', rating: 3, title: null } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(RatingDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders five pressable stars seeded from the current rating', () => {
    const stars = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button.star'));
    expect(stars).toHaveLength(5);
    expect(stars.map((s) => s.getAttribute('aria-pressed'))).toEqual(['true', 'true', 'true', 'false', 'false']);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('3 of 5 stars');
  });

  it('picks a star, clears it on a second press, and saves rating + title', () => {
    component['pick'](5);
    expect(component['rating']()).toBe(5);
    component['pick'](5);
    expect(component['rating']()).toBeNull();
    expect(component['ratingLabel']()).toBe('Not rated yet');
    component['pick'](4);
    component['title'].set('  Lavender day ');
    component['save']();
    expect(mockDialogRef.close).toHaveBeenCalledWith({ rating: 4, title: 'Lavender day' });
  });

  it('cancels without a result', () => {
    component['cancel']();
    expect(mockDialogRef.close).toHaveBeenCalledWith();
  });
});
