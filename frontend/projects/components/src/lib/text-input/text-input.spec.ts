import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TextInput } from './text-input';

describe('TextInput', () => {
  let fixture: ComponentFixture<TextInput>;
  let component: TextInput;
  let host: HTMLElement;

  const control = (): HTMLInputElement | HTMLTextAreaElement =>
    host.querySelector('.field__input') as HTMLInputElement | HTMLTextAreaElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TextInput] }).compileComponents();
    fixture = TestBed.createComponent(TextInput);
    component = fixture.componentInstance;
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  it('creates an unlabelled text field', () => {
    expect(component).toBeTruthy();
    expect(host.classList.contains('field')).toBe(true);
    expect(control().tagName).toBe('INPUT');
    expect(control().getAttribute('type')).toBe('text');
    expect(control().id).toMatch(/^sd-field-\d+$/);
    expect(host.querySelector('.field__label')).toBeNull();
    expect(host.getAttribute('type')).toBe('text');
    expect(host.getAttribute('label')).toBeNull();
    expect(control().hasAttribute('aria-invalid')).toBe(false);
    expect(control().hasAttribute('aria-describedby')).toBe(false);
  });

  it('links the label to the control and marks required fields', () => {
    fixture.componentRef.setInput('label', 'Email');
    fixture.componentRef.setInput('required', true);
    fixture.detectChanges();

    const label = host.querySelector('label.field__label') as HTMLLabelElement;
    expect(label.getAttribute('for')).toBe(control().id);
    expect(label.textContent).toContain('Email');
    expect(label.querySelector('.field__req')?.textContent?.trim()).toBe('Required');
    expect(control().getAttribute('aria-required')).toBe('true');
    expect(host.getAttribute('label')).toBe('Email');
    expect(host.getAttribute('required')).toBe('');
  });

  it('describes the control with its hint', () => {
    fixture.componentRef.setInput('hint', 'We never share it.');
    fixture.detectChanges();
    const hint = host.querySelector('.field__hint') as HTMLElement;
    expect(hint.textContent?.trim()).toBe('We never share it.');
    expect(hint.id).toBe(`${control().id}-hint`);
    expect(control().getAttribute('aria-describedby')).toBe(hint.id);
    expect(host.getAttribute('hint')).toBe('We never share it.');
  });

  it('shows the error instead of the hint and flags the control invalid', () => {
    fixture.componentRef.setInput('hint', 'A hint');
    fixture.componentRef.setInput('error', 'Enter a valid email');
    fixture.detectChanges();

    const error = host.querySelector('.field__error') as HTMLElement;
    expect(error.textContent).toContain('Enter a valid email');
    expect(error.id).toBe(`${control().id}-error`);
    expect(host.querySelector('.field__hint')).toBeNull();
    expect(control().getAttribute('aria-invalid')).toBe('true');
    expect(control().getAttribute('aria-describedby')).toBe(
      `${control().id}-error ${control().id}-hint`,
    );
    expect(host.getAttribute('error')).toBe('Enter a valid email');
  });

  it('forwards type, placeholder, autocomplete, name and numeric bounds', () => {
    fixture.componentRef.setInput('type', 'number');
    fixture.componentRef.setInput('placeholder', 'e.g. 2');
    fixture.componentRef.setInput('autocomplete', 'off');
    fixture.componentRef.setInput('name', 'kids');
    fixture.componentRef.setInput('min', 0);
    fixture.componentRef.setInput('max', 10);
    fixture.componentRef.setInput('step', 1);
    fixture.componentRef.setInput('readonly', true);
    fixture.detectChanges();

    const input = control() as HTMLInputElement;
    expect(input.getAttribute('type')).toBe('number');
    expect(input.getAttribute('placeholder')).toBe('e.g. 2');
    expect(input.getAttribute('autocomplete')).toBe('off');
    expect(input.getAttribute('name')).toBe('kids');
    expect(input.getAttribute('min')).toBe('0');
    expect(input.getAttribute('max')).toBe('10');
    expect(input.getAttribute('step')).toBe('1');
    expect(input.readOnly).toBe(true);
    expect(host.getAttribute('type')).toBe('number');
  });

  it('renders a textarea with the given rows when multiline', () => {
    fixture.componentRef.setInput('multiline', true);
    fixture.componentRef.setInput('rows', 5);
    fixture.detectChanges();
    const area = control() as HTMLTextAreaElement;
    expect(area.tagName).toBe('TEXTAREA');
    expect(area.rows).toBe(5);
    expect(host.getAttribute('multiline')).toBe('');
  });

  it('seeds the control from the static value input', () => {
    fixture.componentRef.setInput('value', 'Port Credit');
    fixture.detectChanges();
    expect(control().value).toBe('Port Credit');
  });

  it('writes form values into the control', () => {
    component.writeValue('hello');
    fixture.detectChanges();
    expect(control().value).toBe('hello');
    component.writeValue(null);
    fixture.detectChanges();
    expect(control().value).toBe('');
  });

  it('reports typing and blur back to the form', () => {
    const onChange = vi.fn();
    const onTouched = vi.fn();
    component.registerOnChange(onChange);
    component.registerOnTouched(onTouched);

    control().value = 'abc';
    control().dispatchEvent(new Event('input'));
    expect(onChange).toHaveBeenCalledWith('abc');

    control().dispatchEvent(new Event('blur'));
    expect(onTouched).toHaveBeenCalledTimes(1);
  });

  it('disables the control from the form', () => {
    component.setDisabledState(true);
    fixture.detectChanges();
    expect(control().disabled).toBe(true);
    component.setDisabledState(false);
    fixture.detectChanges();
    expect(control().disabled).toBe(false);
  });
});
