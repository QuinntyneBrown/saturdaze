import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Empty } from './empty';

describe('Empty', () => {
  let component: Empty;
  let fixture: ComponentFixture<Empty>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Empty],
    }).compileComponents();

    fixture = TestBed.createComponent(Empty);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render component', () => {
    expect(fixture.nativeElement).toBeTruthy();
  });

  it('should reflect the title input', () => {
    fixture.componentRef.setInput('title', 'test-value');
    fixture.detectChanges();
    expect(component.emptyTitle()).toBe('test-value');
  });

  it('should reflect the subtitle input', () => {
    fixture.componentRef.setInput('subtitle', 'test-value');
    fixture.detectChanges();
    expect(component.subtitle()).toBe('test-value');
  });

  it('should reflect the icon input', () => {
    fixture.componentRef.setInput('icon', 'test-value');
    fixture.detectChanges();
    expect(component.icon()).toBe('test-value');
  });
});
