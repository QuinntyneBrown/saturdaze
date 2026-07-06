import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivityCard } from './activity-card';

describe('ActivityCard', () => {
  let component: ActivityCard;
  let fixture: ComponentFixture<ActivityCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActivityCard],
    }).compileComponents();

    fixture = TestBed.createComponent(ActivityCard);
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
    expect(component.cardTitle()).toBe('test-value');
  });

  it('should reflect the subtitle input', () => {
    fixture.componentRef.setInput('subtitle', 'test-value');
    fixture.detectChanges();
    expect(component.subtitle()).toBe('test-value');
  });

  it('should reflect the drive input', () => {
    fixture.componentRef.setInput('drive', 'test-value');
    fixture.detectChanges();
    expect(component.drive()).toBe('test-value');
  });

  it('should reflect the why input', () => {
    fixture.componentRef.setInput('why', 'test-value');
    fixture.detectChanges();
    expect(component.why()).toBe('test-value');
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

  it('should reflect the ages input', () => {
    fixture.componentRef.setInput('ages', 'test-value');
    fixture.detectChanges();
    expect(component.ages()).toBe('test-value');
  });

  it('should reflect the tag input', () => {
    fixture.componentRef.setInput('tag', 'test-value');
    fixture.detectChanges();
    expect(component.tag()).toBe('test-value');
  });
});
