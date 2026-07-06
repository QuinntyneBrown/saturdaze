import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TagGroup } from './tag-group';

describe('TagGroup', () => {
  let component: TagGroup;
  let fixture: ComponentFixture<TagGroup>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TagGroup],
    }).compileComponents();

    fixture = TestBed.createComponent(TagGroup);
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
