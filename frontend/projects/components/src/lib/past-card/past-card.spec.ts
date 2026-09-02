import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PastCard } from './past-card';

describe('PastCard', () => {
  let fixture: ComponentFixture<PastCard>;
  let host: HTMLElement;

  const favBtn = (): HTMLButtonElement => host.querySelector('button.fav-btn') as HTMLButtonElement;
  const titleBtn = (): HTMLButtonElement =>
    host.querySelector('h3.card__title button.card__title-btn') as HTMLButtonElement;
  const rateBtn = (): HTMLButtonElement =>
    host.querySelector('button.card__rate') as HTMLButtonElement;
  const stars = (): HTMLElement => host.querySelector('sd-stars') as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [PastCard] }).compileComponents();
    fixture = TestBed.createComponent(PastCard);
    fixture.componentRef.setInput('title', 'Beach and pizza');
    fixture.componentRef.setInput('dateRange', '10 – 11 May 2026');
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  it('creates an unrated, unfavourited card', () => {
    expect(fixture.componentInstance).toBeTruthy();
    expect(host.classList.contains('card')).toBe(true);
    expect(host.querySelector('.card__row .card__eyebrow')?.textContent?.trim()).toBe(
      '10 – 11 May 2026',
    );
    expect(titleBtn().textContent?.trim()).toBe('Beach and pizza');
    expect(titleBtn().getAttribute('aria-label')).toBe('Rename: Beach and pizza');
    expect(rateBtn().getAttribute('aria-label')).toBe('Rate this weekend');
    expect(stars().getAttribute('rating')).toBe('0');
    expect(stars().querySelector('.stars__label')?.textContent?.trim()).toBe('Rate it');
    expect(host.querySelector('.card__highlights')).toBeNull();
    expect(host.getAttribute('title')).toBe('Beach and pizza');
    expect(host.getAttribute('rating')).toBeNull();
    expect(host.getAttribute('favourite')).toBeNull();
  });

  it('shows the favourite heart as a pressed toggle', () => {
    expect(favBtn().getAttribute('aria-label')).toBe('Favourite this weekend');
    expect(favBtn().getAttribute('aria-pressed')).toBe('false');
    expect(favBtn().querySelector('sd-icon')?.getAttribute('name')).toBe('heart');
    expect(favBtn().querySelector('sd-icon')?.hasAttribute('filled')).toBe(false);

    fixture.componentRef.setInput('favourite', true);
    fixture.detectChanges();
    expect(favBtn().getAttribute('aria-pressed')).toBe('true');
    expect(favBtn().querySelector('sd-icon')?.getAttribute('filled')).toBe('');
    expect(host.getAttribute('favourite')).toBe('');
  });

  it('reflects the rating in the stars, the rate button name and the host', () => {
    fixture.componentRef.setInput('rating', 4);
    fixture.detectChanges();
    expect(stars().getAttribute('rating')).toBe('4');
    expect(stars().querySelector('.stars__label')?.textContent?.trim()).toBe('4 of 5');
    expect(rateBtn().getAttribute('aria-label')).toBe('Rate this weekend, currently 4 of 5');
    expect(host.getAttribute('rating')).toBe('4');
  });

  it('renders the highlights line', () => {
    fixture.componentRef.setInput('highlights', 'Sandcastles, then Pizza Nova.');
    fixture.detectChanges();
    expect(host.querySelector('.card__highlights')?.textContent?.trim()).toBe(
      'Sandcastles, then Pizza Nova.',
    );
  });

  it('emits the next favourite state', () => {
    const spy = vi.fn();
    fixture.componentInstance.favouriteToggle.subscribe(spy);
    favBtn().click();
    expect(spy).toHaveBeenLastCalledWith(true);

    fixture.componentRef.setInput('favourite', true);
    fixture.detectChanges();
    favBtn().click();
    expect(spy).toHaveBeenLastCalledWith(false);
  });

  it('emits rename, rate, remix and repeat from their buttons', () => {
    const rename = vi.fn();
    const rate = vi.fn();
    const remix = vi.fn();
    const repeat = vi.fn();
    fixture.componentInstance.rename.subscribe(rename);
    fixture.componentInstance.rate.subscribe(rate);
    fixture.componentInstance.remix.subscribe(remix);
    fixture.componentInstance.repeat.subscribe(repeat);

    titleBtn().click();
    rateBtn().click();
    const footer = host.querySelector('.card__footer.card__footer--2up') as HTMLElement;
    const remixBtn = footer.querySelector('button.btn--quiet') as HTMLButtonElement;
    const repeatBtn = footer.querySelector('button.btn--primary') as HTMLButtonElement;
    expect(remixBtn.textContent?.trim()).toBe('Remix');
    expect(repeatBtn.textContent?.trim()).toBe('Repeat');
    remixBtn.click();
    repeatBtn.click();

    expect(rename).toHaveBeenCalledTimes(1);
    expect(rate).toHaveBeenCalledTimes(1);
    expect(remix).toHaveBeenCalledTimes(1);
    expect(repeat).toHaveBeenCalledTimes(1);
  });
});
