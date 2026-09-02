import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Scrolled } from './scrolled';

@Component({
  standalone: true,
  imports: [Scrolled],
  template: `<div sdScrolled class="probe">bar</div>`,
})
class HostCmp {}

function setScrollY(value: number): void {
  Object.defineProperty(window, 'scrollY', { value, configurable: true, writable: true });
}

describe('Scrolled', () => {
  let fixture: ComponentFixture<HostCmp>;
  let el: HTMLElement;

  beforeEach(async () => {
    setScrollY(0);
    await TestBed.configureTestingModule({ imports: [HostCmp] }).compileComponents();
    fixture = TestBed.createComponent(HostCmp);
    fixture.detectChanges();
    await fixture.whenStable();
    el = (fixture.nativeElement as HTMLElement).querySelector('.probe') as HTMLElement;
  });

  afterEach(() => setScrollY(0));

  it('creates without data-scrolled at the top of the page', () => {
    expect(el).not.toBeNull();
    expect(el.hasAttribute('data-scrolled')).toBe(false);
  });

  it('sets data-scrolled once the window scrolls past the top', () => {
    setScrollY(10);
    window.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();
    expect(el.getAttribute('data-scrolled')).toBe('');
  });

  it('ignores the first few pixels', () => {
    setScrollY(4);
    window.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();
    expect(el.hasAttribute('data-scrolled')).toBe(false);
  });

  it('clears data-scrolled when scrolled back to the top', () => {
    setScrollY(40);
    window.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();
    expect(el.hasAttribute('data-scrolled')).toBe(true);

    setScrollY(0);
    window.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();
    expect(el.hasAttribute('data-scrolled')).toBe(false);
  });

  it('reads the initial scroll position on first render', async () => {
    setScrollY(50);
    const again = TestBed.createComponent(HostCmp);
    again.detectChanges();
    await again.whenStable();
    again.detectChanges();
    const probe = (again.nativeElement as HTMLElement).querySelector('.probe') as HTMLElement;
    expect(probe.getAttribute('data-scrolled')).toBe('');
    again.destroy();
  });

  it('removes the window listener when destroyed', () => {
    const remove = vi.spyOn(window, 'removeEventListener');
    fixture.destroy();
    expect(remove).toHaveBeenCalledWith('scroll', expect.any(Function));
    remove.mockRestore();
  });
});
