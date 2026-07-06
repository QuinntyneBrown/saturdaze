import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EventCard } from './event-card';

describe('EventCard', () => {
  let component: EventCard;
  let fixture: ComponentFixture<EventCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventCard],
    }).compileComponents();

    fixture = TestBed.createComponent(EventCard);
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

  it('should reflect the venue input', () => {
    fixture.componentRef.setInput('venue', 'test-value');
    fixture.detectChanges();
    expect(component.venue()).toBe('test-value');
  });

  it('should reflect the when input', () => {
    fixture.componentRef.setInput('when', 'test-value');
    fixture.detectChanges();
    expect(component.whenLabel()).toBe('test-value');
  });

  it('should reflect the drive input', () => {
    fixture.componentRef.setInput('drive', 'test-value');
    fixture.detectChanges();
    expect(component.drive()).toBe('test-value');
  });

  it('should reflect the tag input', () => {
    fixture.componentRef.setInput('tag', 'test-value');
    fixture.detectChanges();
    expect(component.tag()).toBe('test-value');
  });

  it('should reflect the icon input', () => {
    fixture.componentRef.setInput('icon', 'test-value');
    fixture.detectChanges();
    expect(component.icon()).toBe('test-value');
  });
});
