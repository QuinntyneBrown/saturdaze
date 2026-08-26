import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DayCard } from './day-card';

describe('DayCard', () => {
  let component: DayCard;
  let fixture: ComponentFixture<DayCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DayCard],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DayCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render component', () => {
    expect(fixture.nativeElement).toBeTruthy();
  });

  it('should reflect the day input', () => {
    fixture.componentRef.setInput('day', 'test-value');
    fixture.detectChanges();
    expect(component.day()).toBe('test-value');
  });

  it('should reflect the date input', () => {
    fixture.componentRef.setInput('date', 'test-value');
    fixture.detectChanges();
    expect(component.date()).toBe('test-value');
  });

  it('should reflect the weather input', () => {
    fixture.componentRef.setInput('weather', 'test-value');
    fixture.detectChanges();
    expect(component.weather()).toBe('test-value');
  });

  it('should reflect the icon input', () => {
    fixture.componentRef.setInput('icon', 'test-value');
    fixture.detectChanges();
    expect(component.icon()).toBe('test-value');
  });

  it('should reflect the highlight input', () => {
    fixture.componentRef.setInput('highlight', 'test-value');
    fixture.detectChanges();
    expect(component.highlight()).toBe('test-value');
  });

  it('should reflect the href input', () => {
    fixture.componentRef.setInput('href', 'test-value');
    fixture.detectChanges();
    expect(component.href()).toBe('test-value');
  });

  it('should reflect the route input', () => {
    fixture.componentRef.setInput('route', 'test-value');
    fixture.detectChanges();
    expect(component.route()).toBe('test-value');
  });

  it('should call onNavigate without throwing', () => {
    expect(() => component['onNavigate']({ preventDefault: () => {}, stopPropagation: () => {}, target: { value: '', checked: false }, currentTarget: { value: '', checked: false } } as any)).not.toThrow();
  });
});
