import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RestaurantCard } from './restaurant-card';

describe('RestaurantCard', () => {
  let component: RestaurantCard;
  let fixture: ComponentFixture<RestaurantCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RestaurantCard],
    }).compileComponents();

    fixture = TestBed.createComponent(RestaurantCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render component', () => {
    expect(fixture.nativeElement).toBeTruthy();
  });

  it('should reflect the name input', () => {
    fixture.componentRef.setInput('name', 'test-value');
    fixture.detectChanges();
    expect(component.name()).toBe('test-value');
  });

  it('should reflect the styleAttr input', () => {
    fixture.componentRef.setInput('styleAttr', 'test-value');
    fixture.detectChanges();
    expect(component.styleAttr()).toBe('test-value');
  });

  it('should reflect the near input', () => {
    fixture.componentRef.setInput('near', 'test-value');
    fixture.detectChanges();
    expect(component.near()).toBe('test-value');
  });

  it('should reflect the drive input', () => {
    fixture.componentRef.setInput('drive', 'test-value');
    fixture.detectChanges();
    expect(component.drive()).toBe('test-value');
  });

  it('should reflect the wifeapproved input', () => {
    fixture.componentRef.setInput('wifeapproved', true);
    fixture.detectChanges();
    expect(component.wifeapproved()).toBe(true);
    fixture.componentRef.setInput('wifeapproved', false);
    fixture.detectChanges();
    expect(component.wifeapproved()).toBe(false);
  });

  it('should reflect the icon input', () => {
    fixture.componentRef.setInput('icon', 'test-value');
    fixture.detectChanges();
    expect(component.icon()).toBe('test-value');
  });
});
