import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Section } from './section';

describe('Section', () => {
  let component: Section;
  let fixture: ComponentFixture<Section>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Section],
    }).compileComponents();

    fixture = TestBed.createComponent(Section);
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
    expect(component.sectionTitle()).toBe('test-value');
  });

  it('should reflect the subtitle input', () => {
    fixture.componentRef.setInput('subtitle', 'test-value');
    fixture.detectChanges();
    expect(component.subtitle()).toBe('test-value');
  });

  it('should reflect the flush input', () => {
    fixture.componentRef.setInput('flush', true);
    fixture.detectChanges();
    expect(component.flush()).toBe(true);
    fixture.componentRef.setInput('flush', false);
    fixture.detectChanges();
    expect(component.flush()).toBe(false);
  });
});
