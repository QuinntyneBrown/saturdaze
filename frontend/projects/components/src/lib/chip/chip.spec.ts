import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Chip } from './chip';

describe('Chip', () => {
  let component: Chip;
  let fixture: ComponentFixture<Chip>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Chip],
    }).compileComponents();

    fixture = TestBed.createComponent(Chip);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render component', () => {
    expect(fixture.nativeElement).toBeTruthy();
  });

  it('should reflect the tone input', () => {
    fixture.componentRef.setInput('tone', {} as any);
    fixture.detectChanges();
    expect(() => component.tone()).not.toThrow();
  });
});
