import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Hero } from './hero';

describe('Hero', () => {
  let component: Hero;
  let fixture: ComponentFixture<Hero>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Hero],
    }).compileComponents();

    fixture = TestBed.createComponent(Hero);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render component', () => {
    expect(fixture.nativeElement).toBeTruthy();
  });

  it('should reflect the greeting input', () => {
    fixture.componentRef.setInput('greeting', 'test-value');
    fixture.detectChanges();
    expect(component.greeting()).toBe('test-value');
  });

  it('should reflect the subtitle input', () => {
    fixture.componentRef.setInput('subtitle', 'test-value');
    fixture.detectChanges();
    expect(component.subtitle()).toBe('test-value');
  });

  it('should reflect the cta input', () => {
    fixture.componentRef.setInput('cta', 'test-value');
    fixture.detectChanges();
    expect(component.cta()).toBe('test-value');
  });

  it('should expose the ctaClick output', () => {
    expect(() => {
      const sub = component.ctaClick.subscribe(() => {});
      sub.unsubscribe();
    }).not.toThrow();
  });
});
