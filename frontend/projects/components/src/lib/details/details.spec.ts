import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailItem, Details } from './details';

const ITEMS: readonly DetailItem[] = [
  { label: 'Location', value: 'Port Credit' },
  { label: 'Cost', value: null },
  { label: 'Link', value: 'example.com', href: 'https://example.com' },
];

describe('Details', () => {
  let fixture: ComponentFixture<Details>;
  let host: HTMLElement;

  const labels = (): string[] =>
    Array.from(host.querySelectorAll('dt.details__label')).map((d) => d.textContent?.trim() ?? '');
  const values = (): HTMLElement[] => Array.from(host.querySelectorAll('dd.details__value'));

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Details] }).compileComponents();
    fixture = TestBed.createComponent(Details);
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  it('creates an empty definition list', () => {
    expect(fixture.componentInstance).toBeTruthy();
    expect(host.classList.contains('details')).toBe(true);
    expect(labels()).toEqual([]);
    expect(values()).toEqual([]);
  });

  it('renders one label / value pair per item', () => {
    fixture.componentRef.setInput('items', ITEMS);
    fixture.detectChanges();
    expect(labels()).toEqual(['Location', 'Cost', 'Link']);
    expect(values().length).toBe(3);
    expect(values()[0]?.textContent?.trim()).toBe('Port Credit');
    expect(values()[0]?.classList.contains('details__value--faint')).toBe(false);
  });

  it('renders a faint placeholder for a missing value', () => {
    fixture.componentRef.setInput('items', ITEMS);
    fixture.detectChanges();
    expect(values()[1]?.classList.contains('details__value--faint')).toBe(true);
    expect(values()[1]?.textContent?.trim()).toBe('Not given');

    fixture.componentRef.setInput('missing', 'Unknown');
    fixture.detectChanges();
    expect(values()[1]?.textContent?.trim()).toBe('Unknown');
  });

  it('renders an external link when the item has an href', () => {
    fixture.componentRef.setInput('items', ITEMS);
    fixture.detectChanges();
    const link = values()[2]?.querySelector('a.details__link') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('https://example.com');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener');
    expect(link.textContent?.trim()).toBe('example.com');
    expect(link.querySelector('sd-icon')?.getAttribute('name')).toBe('arrow_right');
  });

  it('ignores an href without a value', () => {
    fixture.componentRef.setInput('items', [{ label: 'Link', value: null, href: 'https://x.y' }]);
    fixture.detectChanges();
    expect(host.querySelector('a')).toBeNull();
    expect(values()[0]?.classList.contains('details__value--faint')).toBe(true);
  });
});
