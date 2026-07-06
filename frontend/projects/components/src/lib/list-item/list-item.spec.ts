import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ListItem } from './list-item';

describe('ListItem', () => {
  let component: ListItem;
  let fixture: ComponentFixture<ListItem>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListItem],
    }).compileComponents();

    fixture = TestBed.createComponent(ListItem);
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
    expect(component.rowTitle()).toBe('test-value');
  });

  it('should reflect the subtitle input', () => {
    fixture.componentRef.setInput('subtitle', 'test-value');
    fixture.detectChanges();
    expect(component.subtitle()).toBe('test-value');
  });

  it('should reflect the href input', () => {
    fixture.componentRef.setInput('href', 'test-value');
    fixture.detectChanges();
    expect(component.href()).toBe('test-value');
  });

  it('should reflect the compact input', () => {
    fixture.componentRef.setInput('compact', true);
    fixture.detectChanges();
    expect(component.compact()).toBe(true);
    fixture.componentRef.setInput('compact', false);
    fixture.detectChanges();
    expect(component.compact()).toBe(false);
  });

  it('should reflect the flat input', () => {
    fixture.componentRef.setInput('flat', true);
    fixture.detectChanges();
    expect(component.flat()).toBe(true);
    fixture.componentRef.setInput('flat', false);
    fixture.detectChanges();
    expect(component.flat()).toBe(false);
  });
});
