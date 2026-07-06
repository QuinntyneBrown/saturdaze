import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IconButton } from './icon-button';

describe('IconButton', () => {
  let component: IconButton;
  let fixture: ComponentFixture<IconButton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IconButton],
    }).compileComponents();

    fixture = TestBed.createComponent(IconButton);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render component', () => {
    expect(fixture.nativeElement).toBeTruthy();
  });

  it('should reflect the icon input', () => {
    fixture.componentRef.setInput('icon', 'test-value');
    fixture.detectChanges();
    expect(component.icon()).toBe('test-value');
  });

  it('should reflect the label input', () => {
    fixture.componentRef.setInput('label', 'test-value');
    fixture.detectChanges();
    expect(component.label()).toBe('test-value');
  });

  it('should reflect the variant input', () => {
    fixture.componentRef.setInput('variant', {} as any);
    fixture.detectChanges();
    expect(() => component.variant()).not.toThrow();
  });
});
