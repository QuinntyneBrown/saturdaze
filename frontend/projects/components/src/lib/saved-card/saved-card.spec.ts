import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SavedCard } from './saved-card';

describe('SavedCard', () => {
  let component: SavedCard;
  let fixture: ComponentFixture<SavedCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SavedCard],
    }).compileComponents();

    fixture = TestBed.createComponent(SavedCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render component', () => {
    expect(fixture.nativeElement).toBeTruthy();
  });

  it('should reflect the date input', () => {
    fixture.componentRef.setInput('date', 'test-value');
    fixture.detectChanges();
    expect(component.date()).toBe('test-value');
  });

  it('should reflect the title input', () => {
    fixture.componentRef.setInput('title', 'test-value');
    fixture.detectChanges();
    expect(component.cardTitle()).toBe('test-value');
  });

  it('should reflect the rating input', () => {
    fixture.componentRef.setInput('rating', 3);
    fixture.detectChanges();
    expect(component.rating()).toBe(3);
  });

  it('should reflect the highlights input', () => {
    fixture.componentRef.setInput('highlights', 'test-value');
    fixture.detectChanges();
    expect(component.highlights()).toBe('test-value');
  });

  it('should reflect the favourite input', () => {
    fixture.componentRef.setInput('favourite', true);
    fixture.detectChanges();
    expect(component.favourite()).toBe(true);
    fixture.componentRef.setInput('favourite', false);
    fixture.detectChanges();
    expect(component.favourite()).toBe(false);
  });
});
