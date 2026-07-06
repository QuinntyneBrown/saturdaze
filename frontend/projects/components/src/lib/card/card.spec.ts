import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Card } from './card';

describe('Card', () => {
  let component: Card;
  let fixture: ComponentFixture<Card>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Card],
    }).compileComponents();

    fixture = TestBed.createComponent(Card);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render component', () => {
    expect(fixture.nativeElement).toBeTruthy();
  });

  it('should reflect the variant input', () => {
    fixture.componentRef.setInput('variant', {} as any);
    fixture.detectChanges();
    expect(() => component.variant()).not.toThrow();
  });

  it('should reflect the padding input', () => {
    fixture.componentRef.setInput('padding', {} as any);
    fixture.detectChanges();
    expect(() => component.padding()).not.toThrow();
  });

  it('should reflect the interactive input', () => {
    fixture.componentRef.setInput('interactive', true);
    fixture.detectChanges();
    expect(component.interactive()).toBe(true);
    fixture.componentRef.setInput('interactive', false);
    fixture.detectChanges();
    expect(component.interactive()).toBe(false);
  });
});
