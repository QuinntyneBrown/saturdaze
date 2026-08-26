import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DialogsPage } from './dialogs.page';

describe('DialogsPage', () => {
  let component: DialogsPage;
  let fixture: ComponentFixture<DialogsPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogsPage],
    }).compileComponents();

    fixture = TestBed.createComponent(DialogsPage);
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
