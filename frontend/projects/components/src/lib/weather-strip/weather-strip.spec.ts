import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WeatherStrip } from './weather-strip';

describe('WeatherStrip', () => {
  let component: WeatherStrip;
  let fixture: ComponentFixture<WeatherStrip>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WeatherStrip],
    }).compileComponents();

    fixture = TestBed.createComponent(WeatherStrip);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render component', () => {
    expect(fixture.nativeElement).toBeTruthy();
  });
});
