import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WeatherDay } from './weather-day';

describe('WeatherDay', () => {
  let component: WeatherDay;
  let fixture: ComponentFixture<WeatherDay>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WeatherDay],
    }).compileComponents();

    fixture = TestBed.createComponent(WeatherDay);
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

  it('should reflect the icon input', () => {
    fixture.componentRef.setInput('icon', 'test-value');
    fixture.detectChanges();
    expect(component.icon()).toBe('test-value');
  });

  it('should reflect the hi input', () => {
    fixture.componentRef.setInput('hi', 'test-value');
    fixture.detectChanges();
    expect(component.hi()).toBe('test-value');
  });

  it('should reflect the lo input', () => {
    fixture.componentRef.setInput('lo', 'test-value');
    fixture.detectChanges();
    expect(component.lo()).toBe('test-value');
  });

  it('should reflect the note input', () => {
    fixture.componentRef.setInput('note', 'test-value');
    fixture.detectChanges();
    expect(component.note()).toBe('test-value');
  });
});
