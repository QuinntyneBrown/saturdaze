import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TextInput } from './text-input';

describe('TextInput', () => {
  let component: TextInput;
  let fixture: ComponentFixture<TextInput>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TextInput],
    }).compileComponents();

    fixture = TestBed.createComponent(TextInput);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render component', () => {
    expect(fixture.nativeElement).toBeTruthy();
  });

  it('should reflect the label input', () => {
    fixture.componentRef.setInput('label', 'test-value');
    fixture.detectChanges();
    expect(component.label()).toBe('test-value');
  });

  it('should reflect the value input', () => {
    fixture.componentRef.setInput('value', 'test-value');
    fixture.detectChanges();
    expect(component.value()).toBe('test-value');
  });

  it('should reflect the placeholder input', () => {
    fixture.componentRef.setInput('placeholder', 'test-value');
    fixture.detectChanges();
    expect(component.placeholder()).toBe('test-value');
  });

  it('should reflect the type input', () => {
    fixture.componentRef.setInput('type', 'test-value');
    fixture.detectChanges();
    expect(component.type()).toBe('test-value');
  });

  it('should reflect the hint input', () => {
    fixture.componentRef.setInput('hint', 'test-value');
    fixture.detectChanges();
    expect(component.hint()).toBe('test-value');
  });

  it('should reflect the autocomplete input', () => {
    fixture.componentRef.setInput('autocomplete', 'test-value');
    fixture.detectChanges();
    expect(component.autocomplete()).toBe('test-value');
  });

  it('should reflect the name input', () => {
    fixture.componentRef.setInput('name', 'test-value');
    fixture.detectChanges();
    expect(component.name()).toBe('test-value');
  });

  it('should call handleInput without throwing', () => {
    expect(() => component['handleInput']({ preventDefault: () => {}, stopPropagation: () => {}, target: { value: '', checked: false }, currentTarget: { value: '', checked: false } } as any)).not.toThrow();
  });

  it('should call handleBlur without throwing', () => {
    expect(() => component['handleBlur']()).not.toThrow();
  });

  it('should call writeValue without throwing', () => {
    expect(() => component.writeValue({} as any)).not.toThrow();
  });

  it('should call registerOnChange without throwing', () => {
    expect(() => component.registerOnChange(() => undefined)).not.toThrow();
  });

  it('should call registerOnTouched without throwing', () => {
    expect(() => component.registerOnTouched(() => undefined)).not.toThrow();
  });

  it('should call setDisabledState without throwing', () => {
    expect(() => component.setDisabledState(true)).not.toThrow();
  });

  it('should reflect setDisabledState through its signals', () => {
    const isDisabledArg = true;
    component.setDisabledState(isDisabledArg);
    expect(component['disabled']()).toBe(isDisabledArg);
  });
});
