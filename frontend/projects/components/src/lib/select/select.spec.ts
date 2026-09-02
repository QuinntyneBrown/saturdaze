import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Select, SelectOption } from './select';

const OPTIONS: readonly SelectOption[] = [
  { value: 'sat', label: 'Saturday' },
  { value: 'sun', label: 'Sunday' },
  { value: 'either', label: 'Either' },
];

describe('Select', () => {
  let fixture: ComponentFixture<Select>;
  let component: Select;
  let host: HTMLElement;

  const select = (): HTMLSelectElement =>
    host.querySelector('select.field__input') as HTMLSelectElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Select] }).compileComponents();
    fixture = TestBed.createComponent(Select);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('options', OPTIONS);
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  it('creates a native select in field clothes with one option per entry', () => {
    expect(component).toBeTruthy();
    expect(host.classList.contains('field')).toBe(true);
    expect(select()).not.toBeNull();
    expect(select().id).toMatch(/^sd-select-\d+$/);
    const options = Array.from(select().options);
    expect(options.map((o) => o.value)).toEqual(['sat', 'sun', 'either']);
    expect(options.map((o) => o.textContent?.trim())).toEqual(['Saturday', 'Sunday', 'Either']);
    expect(host.querySelector('.field__label')).toBeNull();
    expect(host.querySelector('.field__hint')).toBeNull();
  });

  it('links the label to the select and marks required fields', () => {
    fixture.componentRef.setInput('label', 'Day');
    fixture.componentRef.setInput('required', true);
    fixture.componentRef.setInput('name', 'day');
    fixture.detectChanges();

    const label = host.querySelector('label.field__label') as HTMLLabelElement;
    expect(label.getAttribute('for')).toBe(select().id);
    expect(label.textContent).toContain('Day');
    expect(label.querySelector('.field__req')?.textContent?.trim()).toBe('Required');
    expect(select().getAttribute('name')).toBe('day');
    expect(host.getAttribute('label')).toBe('Day');
    expect(host.getAttribute('required')).toBe('');
  });

  it('renders the hint under the select', () => {
    fixture.componentRef.setInput('hint', 'Pick the day that suits.');
    fixture.detectChanges();
    expect(host.querySelector('.field__hint')?.textContent?.trim()).toBe(
      'Pick the day that suits.',
    );
  });

  it('selects the option matching a written value', () => {
    component.writeValue('sun');
    fixture.detectChanges();
    expect(select().value).toBe('sun');
    expect(select().options[1]?.selected).toBe(true);
  });

  it('reports a user change to the form and marks it touched', () => {
    const onChange = vi.fn();
    const onTouched = vi.fn();
    component.registerOnChange(onChange);
    component.registerOnTouched(onTouched);

    select().value = 'either';
    select().dispatchEvent(new Event('change'));

    expect(onChange).toHaveBeenCalledWith('either');
    expect(onTouched).toHaveBeenCalled();
    fixture.detectChanges();
    expect(select().value).toBe('either');
  });

  it('disables the select from the form', () => {
    component.setDisabledState(true);
    fixture.detectChanges();
    expect(select().disabled).toBe(true);
  });
});
