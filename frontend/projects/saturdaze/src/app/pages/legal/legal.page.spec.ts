import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';

import { LegalPage } from './legal.page';

describe('LegalPage', () => {
  let fixture: ComponentFixture<LegalPage>;
  let host: HTMLElement;
  let fragment$: BehaviorSubject<string | null>;

  async function mount(fragment: string | null): Promise<void> {
    fragment$ = new BehaviorSubject<string | null>(fragment);
    await TestBed.configureTestingModule({
      imports: [LegalPage],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({}),
              queryParamMap: convertToParamMap({}),
              params: {},
              queryParams: {},
              data: {},
              fragment,
            },
            paramMap: of(convertToParamMap({})),
            queryParamMap: of(convertToParamMap({})),
            params: of({}),
            queryParams: of({}),
            data: of({}),
            fragment: fragment$.asObservable(),
          },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(LegalPage);
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  }

  afterEach(() => {
    delete document.body.dataset['doc'];
  });

  const article = (kind: string): HTMLElement => host.querySelector(`article[data-doc="${kind}"]`) as HTMLElement;
  const activeTab = (): string | undefined =>
    host.querySelector('sd-segments a[aria-current="page"]')?.textContent?.trim();

  it('shows the Terms by default, with the Privacy article in the DOM but hidden', async () => {
    await mount(null);
    expect(article('terms').hidden).toBe(false);
    expect(article('privacy').hidden).toBe(true);
    expect(article('terms').querySelector('h1')?.textContent?.trim()).toBe('Terms of Service');
    expect(article('privacy').querySelector('h1')?.textContent?.trim()).toBe('Privacy Policy');
    expect(activeTab()).toBe('Terms');
    expect(document.body.dataset['doc']).toBe('terms');
  });

  it('shows the Privacy Policy for the #privacy fragment', async () => {
    await mount('privacy');
    expect(article('privacy').hidden).toBe(false);
    expect(article('terms').hidden).toBe(true);
    expect(activeTab()).toBe('Privacy');
    expect(document.body.dataset['doc']).toBe('privacy');
  });

  it('picks the article from a section anchor prefix', async () => {
    await mount('privacy-kids');
    expect(article('privacy').hidden).toBe(false);
    fragment$.next('terms-account');
    fixture.detectChanges();
    expect(article('terms').hidden).toBe(false);
    expect(article('privacy').hidden).toBe(true);
    expect(document.body.dataset['doc']).toBe('terms');
  });

  it('lists six sections per document with matching anchors', async () => {
    await mount(null);
    for (const kind of ['terms', 'privacy']) {
      const toc = Array.from(article(kind).querySelectorAll('.prose__toc a'));
      const headings = Array.from(article(kind).querySelectorAll('h2'));
      expect(toc.length, kind).toBe(6);
      expect(headings.map((h) => h.id)).toEqual(toc.map((a) => a.getAttribute('href')?.split('#')[1]));
      expect(headings.every((h) => h.id.startsWith(`${kind}-`))).toBe(true);
    }
    expect(article('terms').querySelector('h2')?.id).toBe('terms-acceptance');
    expect(article('privacy').querySelector('sd-well')?.getAttribute('title')).toBe('The short version');
  });

  it('offers both documents as segments and a site footer', async () => {
    await mount(null);
    const tabs = Array.from(host.querySelectorAll('sd-segments a'));
    expect(tabs.map((t) => t.textContent?.trim())).toEqual(['Terms', 'Privacy']);
    expect(tabs[1]?.getAttribute('href')).toBe('/legal#privacy');
    const footer = Array.from(host.querySelectorAll('footer a')).map((a) => a.textContent?.trim());
    expect(footer).toEqual(['Terms', 'Privacy', 'Sign in']);
  });

  it('clears the body marker on destroy', async () => {
    await mount('privacy');
    expect(document.body.dataset['doc']).toBe('privacy');
    fixture.destroy();
    expect(document.body.dataset['doc']).toBeUndefined();
  });
});
