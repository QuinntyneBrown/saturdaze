import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Toggle } from './toggle';

describe('Toggle', () => {
  let component: Toggle;
  let fixture: ComponentFixture<Toggle>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Toggle],
    }).compileComponents();

    fixture = TestBed.createComponent(Toggle);
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

  it('should reflect the checked input', () => {
    fixture.componentRef.setInput('checked', true);
    fixture.detectChanges();
    expect(component.checked()).toBe(true);
    fixture.componentRef.setInput('checked', false);
    fixture.detectChanges();
    expect(component.checked()).toBe(false);
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
});
