import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Checkbox } from './checkbox';

@Component({
  standalone: true,
  imports: [Checkbox],
  template: `<sd-checkbox required name="terms"
    >I agree to the <a href="/legal">Terms</a></sd-checkbox
  >`,
})
class HostCmp {}

describe('Checkbox', () => {
  let fixture: ComponentFixture<Checkbox>;
  let component: Checkbox;
  let host: HTMLElement;

  const input = (): HTMLInputElement =>
    host.querySelector('input.check__input') as HTMLInputElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Checkbox, HostCmp] }).compileComponents();
    fixture = TestBed.createComponent(Checkbox);
    component = fixture.componentInstance;
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  it('creates an unchecked native checkbox inside its label', () => {
    expect(component).toBeTruthy();
    const label = host.querySelector('label.check') as HTMLLabelElement;
    expect(label).not.toBeNull();
    expect(label.contains(input())).toBe(true);
    expect(input().type).toBe('checkbox');
    expect(input().checked).toBe(false);
    expect(host.getAttribute('checked')).toBeNull();
    expect(host.getAttribute('required')).toBeNull();
    expect(input().hasAttribute('aria-required')).toBe(false);
  });

  it('marks required fields and forwards the name', () => {
    fixture.componentRef.setInput('required', true);
    fixture.componentRef.setInput('name', 'terms');
    fixture.detectChanges();
    expect(input().getAttribute('aria-required')).toBe('true');
    expect(input().getAttribute('name')).toBe('terms');
    expect(host.getAttribute('required')).toBe('');
  });

  it('checks the box from a written value and mirrors it to the host', () => {
    component.writeValue(true);
    fixture.detectChanges();
    expect(input().checked).toBe(true);
    expect(host.getAttribute('checked')).toBe('');

    component.writeValue(null);
    fixture.detectChanges();
    expect(input().checked).toBe(false);
    expect(host.getAttribute('checked')).toBeNull();
  });

  it('reports a user toggle to the form and marks it touched', () => {
    const onChange = vi.fn();
    const onTouched = vi.fn();
    component.registerOnChange(onChange);
    component.registerOnTouched(onTouched);

    input().checked = true;
    input().dispatchEvent(new Event('change'));
    expect(onChange).toHaveBeenCalledWith(true);
    expect(onTouched).toHaveBeenCalledTimes(1);
    fixture.detectChanges();
    expect(host.getAttribute('checked')).toBe('');
  });

  it('disables the box from the form', () => {
    component.setDisabledState(true);
    fixture.detectChanges();
    expect(input().disabled).toBe(true);
  });

  it('projects rich label content beside the box', () => {
    const wrapper = TestBed.createComponent(HostCmp);
    wrapper.detectChanges();
    const el = (wrapper.nativeElement as HTMLElement).querySelector('sd-checkbox') as HTMLElement;
    const label = el.querySelector('.check__label') as HTMLElement;
    expect(label.textContent?.replace(/\s+/g, ' ').trim()).toBe('I agree to the Terms');
    expect(label.querySelector('a')?.getAttribute('href')).toBe('/legal');
    expect(el.getAttribute('required')).toBe('');
  });
});
