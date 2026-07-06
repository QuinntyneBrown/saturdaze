import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TopBar } from './top-bar';

describe('TopBar', () => {
  let component: TopBar;
  let fixture: ComponentFixture<TopBar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TopBar],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TopBar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render component', () => {
    expect(fixture.nativeElement).toBeTruthy();
  });

  it('should reflect the title input', () => {
    fixture.componentRef.setInput('title', 'test-value');
    fixture.detectChanges();
    expect(component.titleAttr()).toBe('test-value');
  });

  it('should reflect the back input', () => {
    fixture.componentRef.setInput('back', true);
    fixture.detectChanges();
    expect(() => component.back()).not.toThrow();
  });
});
