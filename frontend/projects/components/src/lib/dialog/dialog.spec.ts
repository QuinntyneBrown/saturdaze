import { DialogRef } from '@angular/cdk/dialog';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Dialog } from './dialog';

@Component({
  standalone: true,
  imports: [Dialog],
  template: `
    <sd-dialog title="Rename weekend" wide>
      <p class="body">Give it a name.</p>
      <button slot="actions-left" class="remove">Remove</button>
      <button slot="actions" class="save">Save</button>
    </sd-dialog>
  `,
})
class HostCmp {}

describe('Dialog', () => {
  let fixture: ComponentFixture<Dialog>;
  let host: HTMLElement;

  const closeBtn = (): HTMLButtonElement =>
    host.querySelector('sd-button.dialog__close .btn') as HTMLButtonElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Dialog, HostCmp] }).compileComponents();
    fixture = TestBed.createComponent(Dialog);
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  it('creates a panel with a heading and a close button', () => {
    expect(fixture.componentInstance).toBeTruthy();
    expect(host.classList.contains('dialog')).toBe(true);
    expect(host.querySelector('.dialog__panel .dialog__header .dialog__title')).not.toBeNull();
    expect(host.querySelector('.dialog__body')).not.toBeNull();
    expect(host.querySelector('.dialog__actions .dialog__actions-left')).not.toBeNull();
    expect(closeBtn().getAttribute('aria-label')).toBe('Close');
    expect(closeBtn().classList.contains('btn--icon')).toBe(true);
    expect(closeBtn().querySelector('sd-icon')?.getAttribute('name')).toBe('close');
    expect(host.querySelector('.dialog__sub')).toBeNull();
    for (const attr of ['static', 'wide', 'title', 'subtitle']) {
      expect(host.hasAttribute(attr)).toBe(false);
    }
  });

  it('renders title and subtitle and mirrors them to the host', () => {
    fixture.componentRef.setInput('title', 'Rate Saturday');
    fixture.componentRef.setInput('subtitle', 'How did it go?');
    fixture.componentRef.setInput('closeLabel', 'Dismiss');
    fixture.detectChanges();
    expect(host.querySelector('h2.dialog__title')?.textContent?.trim()).toBe('Rate Saturday');
    expect(host.querySelector('.dialog__sub')?.textContent?.trim()).toBe('How did it go?');
    expect(closeBtn().getAttribute('aria-label')).toBe('Dismiss');
    expect(host.getAttribute('title')).toBe('Rate Saturday');
    expect(host.getAttribute('subtitle')).toBe('How did it go?');
  });

  it('mirrors static and wide to host classes and attributes', () => {
    fixture.componentRef.setInput('static', true);
    fixture.componentRef.setInput('wide', true);
    fixture.detectChanges();
    expect(host.classList.contains('dialog--specimen')).toBe(true);
    expect(host.classList.contains('dialog--wide')).toBe(true);
    expect(host.getAttribute('static')).toBe('');
    expect(host.getAttribute('wide')).toBe('');
  });

  it('emits closed when the × is pressed', () => {
    const spy = vi.fn();
    fixture.componentInstance.closed.subscribe(spy);
    closeBtn().click();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('gives the heading an id and does not nest a dialog role of its own', () => {
    const h2 = host.querySelector('h2') as HTMLElement;
    expect(h2.id).toMatch(/^sd-dialog-title-\d+$/);
    expect(host.querySelector('[role="dialog"]')).toBeNull();
    expect(host.hasAttribute('role')).toBe(false);
  });

  it('labels the surrounding CDK container with its heading', async () => {
    const container = document.createElement('div');
    container.setAttribute('role', 'dialog');
    document.body.appendChild(container);
    try {
      const again = TestBed.createComponent(Dialog);
      container.appendChild(again.nativeElement);
      again.detectChanges();
      await again.whenStable();
      const h2 = (again.nativeElement as HTMLElement).querySelector('h2') as HTMLElement;
      expect(container.getAttribute('aria-labelledby')).toBe(h2.id);
      again.destroy();
    } finally {
      container.remove();
    }
  });

  it('leaves an existing aria-labelledby on the container alone', async () => {
    const container = document.createElement('div');
    container.setAttribute('role', 'alertdialog');
    container.setAttribute('aria-labelledby', 'custom');
    document.body.appendChild(container);
    try {
      const again = TestBed.createComponent(Dialog);
      container.appendChild(again.nativeElement);
      again.detectChanges();
      await again.whenStable();
      expect(container.getAttribute('aria-labelledby')).toBe('custom');
      again.destroy();
    } finally {
      container.remove();
    }
  });

  it('projects body, left action and actions into their regions', () => {
    const wrapper = TestBed.createComponent(HostCmp);
    wrapper.detectChanges();
    const el = (wrapper.nativeElement as HTMLElement).querySelector('sd-dialog') as HTMLElement;
    expect(el.querySelector('.dialog__body .body')?.textContent).toBe('Give it a name.');
    expect(el.querySelector('.dialog__actions-left .remove')?.textContent).toBe('Remove');
    const actions = el.querySelector('.dialog__actions') as HTMLElement;
    expect(actions.lastElementChild?.classList.contains('save')).toBe(true);
    expect(el.classList.contains('dialog--wide')).toBe(true);
    expect(el.querySelector('.dialog__title')?.textContent?.trim()).toBe('Rename weekend');
  });
});

describe('Dialog inside a CDK dialog', () => {
  it('closes the CDK ref when the × is pressed', async () => {
    const ref = { close: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [Dialog],
      providers: [{ provide: DialogRef, useValue: ref }],
    }).compileComponents();
    const fixture = TestBed.createComponent(Dialog);
    fixture.detectChanges();
    const spy = vi.fn();
    fixture.componentInstance.closed.subscribe(spy);

    const btn = (fixture.nativeElement as HTMLElement).querySelector(
      'sd-button.dialog__close .btn',
    ) as HTMLButtonElement;
    btn.click();

    expect(spy).toHaveBeenCalledTimes(1);
    expect(ref.close).toHaveBeenCalledTimes(1);
  });
});
