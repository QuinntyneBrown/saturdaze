import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Button } from './button';

describe('Button', () => {
  let component: Button;
  let fixture: ComponentFixture<Button>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Button],
    }).compileComponents();

    fixture = TestBed.createComponent(Button);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render component', () => {
    expect(fixture.nativeElement).toBeTruthy();
  });

  it('should reflect the variant input', () => {
    fixture.componentRef.setInput('variant', {} as any);
    fixture.detectChanges();
    expect(() => component.variant()).not.toThrow();
  });

  it('should reflect the size input', () => {
    fixture.componentRef.setInput('size', {} as any);
    fixture.detectChanges();
    expect(() => component.size()).not.toThrow();
  });

  it('should reflect the type input', () => {
    fixture.componentRef.setInput('type', {} as any);
    fixture.detectChanges();
    expect(() => component.type()).not.toThrow();
  });

  it('should reflect the full input', () => {
    fixture.componentRef.setInput('full', true);
    fixture.detectChanges();
    expect(component.full()).toBe(true);
    fixture.componentRef.setInput('full', false);
    fixture.detectChanges();
    expect(component.full()).toBe(false);
  });

  it('should reflect the disabled input', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    expect(component.disabled()).toBe(true);
    fixture.componentRef.setInput('disabled', false);
    fixture.detectChanges();
    expect(component.disabled()).toBe(false);
  });
});
