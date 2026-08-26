import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BottomNav } from './bottom-nav';

describe('BottomNav', () => {
  let component: BottomNav;
  let fixture: ComponentFixture<BottomNav>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BottomNav],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BottomNav);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render component', () => {
    expect(fixture.nativeElement).toBeTruthy();
  });

  it('should reflect the active input', () => {
    fixture.componentRef.setInput('active', {} as any);
    fixture.detectChanges();
    expect(() => component.active()).not.toThrow();
  });

  it('should call onNavigate without throwing', () => {
    expect(() => component['onNavigate']({ preventDefault: () => {}, stopPropagation: () => {}, target: { value: '', checked: false }, currentTarget: { value: '', checked: false } } as any, 'test-value')).not.toThrow();
  });

  it('should call isActive without throwing', () => {
    expect(() => component['isActive']("home")).not.toThrow();
  });
});
