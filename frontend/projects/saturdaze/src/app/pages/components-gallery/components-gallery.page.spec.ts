import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentsGalleryPage } from './components-gallery.page';

describe('ComponentsGalleryPage', () => {
  let component: ComponentsGalleryPage;
  let fixture: ComponentFixture<ComponentsGalleryPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComponentsGalleryPage],
    }).compileComponents();

    fixture = TestBed.createComponent(ComponentsGalleryPage);
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
