import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import type { PartialTheme } from '../tokens/types';
import { ThemeProvider } from './theme-provider';

@Component({
  standalone: true,
  imports: [ThemeProvider],
  template: `<div class="probe" [sdThemeProvider]="theme()">themed</div>`,
})
class HostCmp {
  readonly theme = signal<PartialTheme>({
    colorBrandBackground: '#2d7d5f',
    borderRadiusSmall: '4px',
  });
}

describe('ThemeProvider', () => {
  let fixture: ComponentFixture<HostCmp>;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostCmp] }).compileComponents();
    fixture = TestBed.createComponent(HostCmp);
    fixture.detectChanges();
    await fixture.whenStable();
    el = (fixture.nativeElement as HTMLElement).querySelector('.probe') as HTMLElement;
  });

  it('writes each theme key to the host as a CSS custom property', () => {
    expect(el.style.getPropertyValue('--colorBrandBackground')).toBe('#2d7d5f');
    expect(el.style.getPropertyValue('--borderRadiusSmall')).toBe('4px');
  });

  it('removes properties a new theme no longer sets', async () => {
    fixture.componentInstance.theme.set({ colorBrandBackground: '#5a3b82' });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(el.style.getPropertyValue('--colorBrandBackground')).toBe('#5a3b82');
    expect(el.style.getPropertyValue('--borderRadiusSmall')).toBe('');
  });
});
