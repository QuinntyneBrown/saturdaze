import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { SkipLink } from './skip-link';

@Component({
  standalone: true,
  imports: [SkipLink],
  template: `<sd-skip-link />
    <main id="main"><button type="button">First</button></main>`,
})
class HostCmp {}

describe('SkipLink', () => {
  it('moves focus to main without navigating', async () => {
    await TestBed.configureTestingModule({ imports: [HostCmp] }).compileComponents();
    const fixture = TestBed.createComponent(HostCmp);
    fixture.detectChanges();
    document.body.appendChild(fixture.nativeElement);
    const host = fixture.nativeElement as HTMLElement;
    const link = host.querySelector('a.skip-link') as HTMLAnchorElement;
    const main = host.querySelector('main') as HTMLElement;

    expect(link.textContent?.trim()).toBe('Skip to content');
    expect(link.getAttribute('href')).toBe(
      `${document.location.pathname}${document.location.search}#main`,
    );

    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    link.dispatchEvent(click);

    expect(click.defaultPrevented).toBe(true);
    expect(main.getAttribute('tabindex')).toBe('-1');
    expect(document.activeElement).toBe(main);
    fixture.nativeElement.remove();
  });
});
