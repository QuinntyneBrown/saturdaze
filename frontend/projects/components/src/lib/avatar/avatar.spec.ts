import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Avatar } from './avatar';

describe('Avatar', () => {
  let component: Avatar;
  let fixture: ComponentFixture<Avatar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Avatar],
    }).compileComponents();

    fixture = TestBed.createComponent(Avatar);
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

  it('should reflect the tone input', () => {
    fixture.componentRef.setInput('tone', {} as any);
    fixture.detectChanges();
    expect(() => component.tone()).not.toThrow();
  });

  it('should reflect the size input', () => {
    fixture.componentRef.setInput('size', {} as any);
    fixture.detectChanges();
    expect(() => component.size()).not.toThrow();
  });
});
