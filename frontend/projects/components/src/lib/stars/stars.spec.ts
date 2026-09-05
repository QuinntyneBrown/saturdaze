import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Stars } from './stars';

describe('Stars', () => {
  let fixture: ComponentFixture<Stars>;
  let host: HTMLElement;

  const icons = (): HTMLElement[] => Array.from(host.querySelectorAll('sd-icon'));
  const filled = (): number => icons().filter((i) => i.hasAttribute('filled')).length;
  const radios = (): HTMLButtonElement[] =>
    Array.from(host.querySelectorAll('button.stars__btn[role="radio"]'));

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Stars] }).compileComponents();
    fixture = TestBed.createComponent(Stars);
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  it('creates five empty display stars', () => {
    expect(fixture.componentInstance).toBeTruthy();
    expect(host.classList.contains('stars')).toBe(true);
    expect(icons().length).toBe(5);
    expect(icons().every((i) => i.getAttribute('name') === 'star')).toBe(true);
    expect(filled()).toBe(0);
    expect(host.getAttribute('rating')).toBe('0');
    expect(host.getAttribute('role')).toBeNull();
    expect(host.getAttribute('editable')).toBeNull();
    expect(host.querySelector('.stars__label')).toBeNull();
  });

  it('fills stars up to the rating and mirrors it to the host', () => {
    fixture.componentRef.setInput('rating', 3);
    fixture.detectChanges();
    expect(filled()).toBe(3);
    expect(icons()[2]?.hasAttribute('filled')).toBe(true);
    expect(icons()[3]?.hasAttribute('filled')).toBe(false);
    expect(host.getAttribute('rating')).toBe('3');
  });

  it('shows a caption after the stars in display mode', () => {
    fixture.componentRef.setInput('label', '5 of 5');
    fixture.detectChanges();
    expect(host.querySelector('.stars__label')?.textContent?.trim()).toBe('5 of 5');
  });

  it('grows the glyphs for the large size', () => {
    expect(icons()[0]?.getAttribute('size')).toBe('18');
    fixture.componentRef.setInput('size', 'lg');
    fixture.detectChanges();
    expect(host.classList.contains('stars--lg')).toBe(true);
    expect(icons()[0]?.getAttribute('size')).toBe('24');
  });

  it('becomes a radiogroup of five labelled radios when editable', () => {
    fixture.componentRef.setInput('editable', true);
    fixture.componentRef.setInput('rating', 2);
    fixture.detectChanges();

    expect(host.getAttribute('role')).toBe('radiogroup');
    expect(host.getAttribute('aria-label')).toBe('Rating');
    expect(host.getAttribute('editable')).toBe('');
    expect(host.querySelector('.stars__label')).toBeNull();

    const btns = radios();
    expect(btns.length).toBe(5);
    expect(btns.map((b) => b.getAttribute('aria-label'))).toEqual([
      '1 star',
      '2 stars',
      '3 stars',
      '4 stars',
      '5 stars',
    ]);
    expect(btns.map((b) => b.getAttribute('aria-checked'))).toEqual([
      'false',
      'true',
      'false',
      'false',
      'false',
    ]);
    expect(filled()).toBe(2);

    fixture.componentRef.setInput('groupLabel', 'Rate Saturday');
    fixture.detectChanges();
    expect(host.getAttribute('aria-label')).toBe('Rate Saturday');
  });

  it('emits the picked step and clears when the current star is pressed again', () => {
    fixture.componentRef.setInput('editable', true);
    fixture.componentRef.setInput('rating', 4);
    fixture.detectChanges();
    const spy = vi.fn();
    fixture.componentInstance.ratingChange.subscribe(spy);

    radios()[1]?.click();
    expect(spy).toHaveBeenLastCalledWith(2);

    radios()[3]?.click();
    expect(spy).toHaveBeenLastCalledWith(0);
  });
});
