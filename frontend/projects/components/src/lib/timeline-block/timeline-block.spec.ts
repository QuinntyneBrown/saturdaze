import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TimelineBlock } from './timeline-block';

describe('TimelineBlock', () => {
  let component: TimelineBlock;
  let fixture: ComponentFixture<TimelineBlock>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimelineBlock],
    }).compileComponents();

    fixture = TestBed.createComponent(TimelineBlock);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render component', () => {
    expect(fixture.nativeElement).toBeTruthy();
  });

  it('should reflect the time input', () => {
    fixture.componentRef.setInput('time', 'test-value');
    fixture.detectChanges();
    expect(component.time()).toBe('test-value');
  });

  it('should reflect the title input', () => {
    fixture.componentRef.setInput('title', 'test-value');
    fixture.detectChanges();
    expect(component.blockTitle()).toBe('test-value');
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

  it('should reflect the tone input', () => {
    fixture.componentRef.setInput('tone', {} as any);
    fixture.detectChanges();
    expect(() => component.tone()).not.toThrow();
  });

  it('should reflect the locked input', () => {
    fixture.componentRef.setInput('locked', true);
    fixture.detectChanges();
    expect(component.locked()).toBe(true);
    fixture.componentRef.setInput('locked', false);
    fixture.detectChanges();
    expect(component.locked()).toBe(false);
  });

  it('should reflect the drive input', () => {
    fixture.componentRef.setInput('drive', 'test-value');
    fixture.detectChanges();
    expect(component.drive()).toBe('test-value');
  });

  it('should reflect the duration input', () => {
    fixture.componentRef.setInput('duration', 'test-value');
    fixture.detectChanges();
    expect(component.duration()).toBe('test-value');
  });
});
