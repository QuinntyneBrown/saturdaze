import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SplitView } from './split-view';

describe('SplitView', () => {
  let component: SplitView;
  let fixture: ComponentFixture<SplitView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SplitView],
    }).compileComponents();

    fixture = TestBed.createComponent(SplitView);
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
