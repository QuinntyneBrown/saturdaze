import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Icon } from './icon';

describe('Icon', () => {
  let component: Icon;
  let fixture: ComponentFixture<Icon>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Icon],
      providers: [
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Icon);
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

  it('should reflect the size input', () => {
    fixture.componentRef.setInput('size', 3);
    fixture.detectChanges();
    expect(component.size()).toBe(3);
  });

  it('renders the check and mail glyphs instead of the sparkle fallback', () => {
    const sparkle = (fixture.nativeElement as HTMLElement).innerHTML;
    fixture.componentRef.setInput('name', 'check');
    fixture.detectChanges();
    const check = (fixture.nativeElement as HTMLElement).innerHTML;
    expect(check).not.toBe(sparkle);
    expect(check).toContain('M5 12l5 5 9-11');
    fixture.componentRef.setInput('name', 'mail');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).innerHTML).toContain('M3 7l9 6 9-6');
  });
});
