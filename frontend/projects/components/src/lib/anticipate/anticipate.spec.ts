import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Anticipate } from './anticipate';

describe('Anticipate', () => {
  let component: Anticipate;
  let fixture: ComponentFixture<Anticipate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Anticipate],
    }).compileComponents();

    fixture = TestBed.createComponent(Anticipate);
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

  it('should reflect the headline input', () => {
    fixture.componentRef.setInput('headline', 'test-value');
    fixture.detectChanges();
    expect(component.headline()).toBe('test-value');
  });

  it('should reflect the body input', () => {
    fixture.componentRef.setInput('body', 'test-value');
    fixture.detectChanges();
    expect(component.body()).toBe('test-value');
  });

  it('should reflect the cta input', () => {
    fixture.componentRef.setInput('cta', 'test-value');
    fixture.detectChanges();
    expect(component.cta()).toBe('test-value');
  });
});
