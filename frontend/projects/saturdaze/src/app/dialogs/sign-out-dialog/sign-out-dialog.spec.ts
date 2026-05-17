import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  SignOutDialog,
  SignOutDialogData,
  SignOutDialogResult,
} from './sign-out-dialog';

/**
 * Unit coverage for the dialog's contract: render the injected email and
 * resolve the parent `DialogRef` with `'confirm'` when confirmed, `undefined`
 * when cancelled. End-to-end DOM-level confirmation lives in
 * `e2e/tests/sign-out.spec.ts` (real CDK Dialog, real overlay).
 */
describe('SignOutDialog', () => {
  let closeSpy: ReturnType<typeof vi.fn<(result?: SignOutDialogResult) => void>>;

  beforeEach(() => {
    closeSpy = vi.fn<(result?: SignOutDialogResult) => void>();
    TestBed.configureTestingModule({
      imports: [SignOutDialog],
      providers: [
        {
          provide: DialogRef,
          useValue: { close: closeSpy } as Partial<DialogRef<SignOutDialogResult>>,
        },
        {
          provide: DIALOG_DATA,
          useValue: { email: 'quinntynebrown@gmail.com' } satisfies SignOutDialogData,
        },
      ],
    });
  });

  it('renders the dialog title, reassurance copy and injected email', () => {
    const fixture = TestBed.createComponent(SignOutDialog);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent ?? '';
    expect(text).toContain('Sign out?');
    expect(text).toContain("I'll forget you on this device");
    expect(text).toContain("You'll need to sign back in");
    expect(text).toContain('quinntynebrown@gmail.com');
  });

  it('confirm() closes the dialog with the "confirm" result', () => {
    const fixture = TestBed.createComponent(SignOutDialog);
    fixture.detectChanges();

    // `confirm` is `protected` on the class; bracket access is the test-only
    // escape hatch. The behaviour is what the danger button binds to in the
    // template — the e2e covers the click → method wiring.
    (fixture.componentInstance as unknown as { confirm: () => void }).confirm();

    expect(closeSpy).toHaveBeenCalledExactlyOnceWith('confirm');
  });

  it('cancel() closes the dialog with no result', () => {
    const fixture = TestBed.createComponent(SignOutDialog);
    fixture.detectChanges();

    (fixture.componentInstance as unknown as { cancel: () => void }).cancel();

    expect(closeSpy).toHaveBeenCalledExactlyOnceWith();
  });
});
