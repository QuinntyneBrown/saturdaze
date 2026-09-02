import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { Mock } from 'vitest';

import { CopyField } from './copy-field';

describe('CopyField', () => {
  let fixture: ComponentFixture<CopyField>;
  let host: HTMLElement;
  let writeText: Mock<(text: string) => Promise<void>>;

  const button = (): HTMLButtonElement => host.querySelector('sd-button .btn') as HTMLButtonElement;

  async function flush(): Promise<void> {
    for (let i = 0; i < 4; i++) await Promise.resolve();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    writeText = vi.fn<(text: string) => Promise<void>>().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

    await TestBed.configureTestingModule({ imports: [CopyField] }).compileComponents();
    fixture = TestBed.createComponent(CopyField);
    fixture.componentRef.setInput('value', 'https://saturdaze.app/s/abc123');
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('creates a read-only value with a quiet Copy button', () => {
    expect(fixture.componentInstance).toBeTruthy();
    expect(host.classList.contains('copy-field')).toBe(true);
    expect(host.querySelector('.copy-field__value')?.textContent?.trim()).toBe(
      'https://saturdaze.app/s/abc123',
    );
    expect(host.getAttribute('value')).toBe('https://saturdaze.app/s/abc123');
    expect(button().classList.contains('btn--quiet')).toBe(true);
    expect(button().getAttribute('aria-label')).toBe('Copy link');
    expect(button().getAttribute('aria-pressed')).toBe('false');
    expect(button().textContent?.trim()).toBe('Copy');
    expect(button().querySelector('sd-icon')?.getAttribute('name')).toBe('copy');
  });

  it('writes the value to the clipboard and emits copied', async () => {
    const spy = vi.fn();
    fixture.componentInstance.copied.subscribe(spy);

    button().click();
    await flush();

    expect(writeText).toHaveBeenCalledWith('https://saturdaze.app/s/abc123');
    expect(spy).toHaveBeenCalledWith('https://saturdaze.app/s/abc123');
  });

  it('flips to a pressed "Copied" state and reverts after two seconds', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });

    button().click();
    await flush();

    expect(button().getAttribute('aria-pressed')).toBe('true');
    expect(button().textContent?.trim()).toBe('Copied');
    expect(button().querySelector('sd-icon')?.getAttribute('name')).toBe('check');
    expect(button().querySelector('[aria-live="polite"]')?.textContent?.trim()).toBe('Copied');

    vi.advanceTimersByTime(1999);
    fixture.detectChanges();
    expect(button().textContent?.trim()).toBe('Copied');

    vi.advanceTimersByTime(1);
    fixture.detectChanges();
    expect(button().getAttribute('aria-pressed')).toBe('false');
    expect(button().textContent?.trim()).toBe('Copy');
  });

  it('still confirms when the clipboard is unavailable', async () => {
    writeText.mockRejectedValue(new Error('denied'));
    const spy = vi.fn();
    fixture.componentInstance.copied.subscribe(spy);

    button().click();
    await flush();

    expect(spy).toHaveBeenCalledTimes(1);
    expect(button().textContent?.trim()).toBe('Copied');
    expect(host.querySelector('.copy-field__value')?.textContent?.trim()).toBe(
      'https://saturdaze.app/s/abc123',
    );
  });
});
