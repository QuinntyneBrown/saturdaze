import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Toggle } from './toggle';

describe('Toggle', () => {
  let fixture: ComponentFixture<Toggle>;
  let component: Toggle;
  let host: HTMLElement;

  const input = (): HTMLInputElement =>
    host.querySelector('input.toggle__input') as HTMLInputElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Toggle] }).compileComponents();
    fixture = TestBed.createComponent(Toggle);
    component = fixture.componentInstance;
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  it('creates an unchecked switch inside its label', () => {
    expect(component).toBeTruthy();
    const label = host.querySelector('label.toggle') as HTMLLabelElement;
    expect(label).not.toBeNull();
    expect(label.contains(input())).toBe(true);
    expect(input().type).toBe('checkbox');
    expect(input().getAttribute('role')).toBe('switch');
    expect(input().checked).toBe(false);
    expect(host.querySelector('.toggle__track')).not.toBeNull();
    expect(host.querySelector('.toggle__label')).toBeNull();
    expect(host.getAttribute('checked')).toBeNull();
    expect(host.getAttribute('disabled')).toBeNull();
    expect(host.getAttribute('label')).toBeNull();
  });

  it('renders the visible label and drops any aria-label', () => {
    fixture.componentRef.setInput('label', 'Lock Saturday');
    fixture.componentRef.setInput('srLabel', 'ignored');
    fixture.detectChanges();
    expect(host.querySelector('.toggle__label')?.textContent?.trim()).toBe('Lock Saturday');
    expect(input().hasAttribute('aria-label')).toBe(false);
    expect(host.getAttribute('label')).toBe('Lock Saturday');
  });

  it('uses srLabel as the accessible name when there is no visible label', () => {
    fixture.componentRef.setInput('srLabel', 'Share this weekend');
    fixture.detectChanges();
    expect(input().getAttribute('aria-label')).toBe('Share this weekend');
    expect(host.querySelector('.toggle__label')).toBeNull();
  });

  it('seeds the state from the static checked input', () => {
    fixture.componentRef.setInput('checked', true);
    fixture.detectChanges();
    expect(input().checked).toBe(true);
    expect(host.getAttribute('checked')).toBe('');

    fixture.componentRef.setInput('checked', false);
    fixture.detectChanges();
    expect(input().checked).toBe(false);
    expect(host.getAttribute('checked')).toBeNull();
  });

  it('lets a bound form take over from the static input', () => {
    component.writeValue(true);
    fixture.detectChanges();
    expect(input().checked).toBe(true);

    fixture.componentRef.setInput('checked', false);
    fixture.detectChanges();
    expect(input().checked).toBe(true);
    expect(host.getAttribute('checked')).toBe('');

    component.writeValue(null);
    fixture.detectChanges();
    expect(input().checked).toBe(false);
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

  it('disables the switch from the form and mirrors it to the host', () => {
    component.setDisabledState(true);
    fixture.detectChanges();
    expect(input().disabled).toBe(true);
    expect(host.getAttribute('disabled')).toBe('');
  });
});
