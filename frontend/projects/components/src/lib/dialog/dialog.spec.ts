import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Dialog } from './dialog';

describe('Dialog', () => {
  let component: Dialog;
  let fixture: ComponentFixture<Dialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dialog],
    }).compileComponents();

    fixture = TestBed.createComponent(Dialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render component', () => {
    expect(fixture.nativeElement).toBeTruthy();
  });

  it('should reflect the static input', () => {
    fixture.componentRef.setInput('static', true);
    fixture.detectChanges();
    expect(component.staticMode()).toBe(true);
    fixture.componentRef.setInput('static', false);
    fixture.detectChanges();
    expect(component.staticMode()).toBe(false);
  });

  it('should reflect the title input', () => {
    fixture.componentRef.setInput('title', 'test-value');
    fixture.detectChanges();
    expect(component.dialogTitle()).toBe('test-value');
  });

  it('should reflect the subtitle input', () => {
    fixture.componentRef.setInput('subtitle', 'test-value');
    fixture.detectChanges();
    expect(component.subtitle()).toBe('test-value');
  });

  it('gives the heading an id and no longer nests a dialog role', () => {
    const el = fixture.nativeElement as HTMLElement;
    const h2 = el.querySelector('h2') as HTMLElement;
    expect(h2.id).toMatch(/^sd-dialog-title-\d+$/);
    expect(el.querySelector('[role="dialog"]')).toBeNull();
  });

  it('labels the surrounding CDK container with the heading', async () => {
    const container = document.createElement('div');
    container.setAttribute('role', 'dialog');
    document.body.appendChild(container);
    container.appendChild(fixture.nativeElement);
    try {
      const again = TestBed.createComponent(Dialog);
      container.appendChild(again.nativeElement);
      again.detectChanges();
      await again.whenStable();
      const h2 = (again.nativeElement as HTMLElement).querySelector('h2') as HTMLElement;
      expect(container.getAttribute('aria-labelledby')).toBe(h2.id);
    } finally {
      container.remove();
    }
  });
});
