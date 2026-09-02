import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SegRadio, SegRadioOption } from './seg-radio';

const OPTIONS: readonly SegRadioOption[] = [
  { value: 'sat', label: 'Saturday' },
  { value: 'sun', label: 'Sunday' },
  { value: 'either', label: 'Either' },
];

describe('SegRadio', () => {
  let fixture: ComponentFixture<SegRadio>;
  let component: SegRadio;
  let host: HTMLElement;

  const group = (): HTMLElement => host.querySelector('.seg-radio') as HTMLElement;
  const radios = (): HTMLInputElement[] =>
    Array.from(host.querySelectorAll('label.seg-radio__opt input[type="radio"]'));

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SegRadio] }).compileComponents();
    fixture = TestBed.createComponent(SegRadio);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('options', OPTIONS);
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  it('creates a radiogroup with one native radio per option', () => {
    expect(component).toBeTruthy();
    expect(host.classList.contains('field')).toBe(true);
    expect(group().getAttribute('role')).toBe('radiogroup');
    expect(radios().length).toBe(3);
    expect(radios().map((r) => r.value)).toEqual(['sat', 'sun', 'either']);
    expect(new Set(radios().map((r) => r.name)).size).toBe(1);
    expect(radios()[0]?.name).toMatch(/^sd-seg-radio-\d+$/);
    expect(
      Array.from(host.querySelectorAll('.seg-radio__opt')).map((l) => l.textContent?.trim()),
    ).toEqual(['Saturday', 'Sunday', 'Either']);
    expect(radios().some((r) => r.checked)).toBe(false);
    expect(host.getAttribute('value')).toBeNull();
  });

  it('widens to three columns for three options', () => {
    expect(group().classList.contains('seg-radio--3')).toBe(true);
    fixture.componentRef.setInput('options', OPTIONS.slice(0, 2));
    fixture.detectChanges();
    expect(group().classList.contains('seg-radio--3')).toBe(false);
  });

  it('labels the group with the field label', () => {
    expect(host.querySelector('.field__label')).toBeNull();
    expect(group().hasAttribute('aria-labelledby')).toBe(false);

    fixture.componentRef.setInput('label', 'Which day');
    fixture.detectChanges();
    const label = host.querySelector('.field__label') as HTMLElement;
    expect(label.textContent?.trim()).toBe('Which day');
    expect(label.id).toMatch(/^sd-seg-radio-\d+-label$/);
    expect(group().getAttribute('aria-labelledby')).toBe(label.id);
    expect(host.getAttribute('label')).toBe('Which day');
  });

  it('checks the radio matching a written value and mirrors it to the host', () => {
    component.writeValue('sun');
    fixture.detectChanges();
    expect(radios().map((r) => r.checked)).toEqual([false, true, false]);
    expect(host.getAttribute('value')).toBe('sun');
  });

  it('reports a user pick to the form and marks it touched', () => {
    const onChange = vi.fn();
    const onTouched = vi.fn();
    component.registerOnChange(onChange);
    component.registerOnTouched(onTouched);

    const either = radios()[2] as HTMLInputElement;
    either.checked = true;
    either.dispatchEvent(new Event('change'));

    expect(onChange).toHaveBeenCalledWith('either');
    expect(onTouched).toHaveBeenCalledTimes(1);
    fixture.detectChanges();
    expect(host.getAttribute('value')).toBe('either');
  });

  it('disables every radio from the form and ignores picks', () => {
    const onChange = vi.fn();
    component.registerOnChange(onChange);
    component.setDisabledState(true);
    fixture.detectChanges();
    expect(radios().every((r) => r.disabled)).toBe(true);

    const sat = radios()[0] as HTMLInputElement;
    sat.dispatchEvent(new Event('change'));
    expect(onChange).not.toHaveBeenCalled();
  });
});
