import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VoteCell, VoteRow } from './vote-row';

const VOTES: readonly VoteCell[] = [
  { name: 'Quinn', tone: 'primary', vote: 'none' },
  { name: 'Sara', tone: 'leaf', vote: 'up' },
  { name: 'Eli', tone: 'sky', vote: 'down' },
];

describe('VoteRow', () => {
  let fixture: ComponentFixture<VoteRow>;
  let host: HTMLElement;

  const cells = (): HTMLElement[] => Array.from(host.querySelectorAll('.vote-row__cell'));
  const up = (i: number): HTMLButtonElement =>
    cells()[i]?.querySelector('.vote-row__btn--up') as HTMLButtonElement;
  const down = (i: number): HTMLButtonElement =>
    cells()[i]?.querySelector('.vote-row__btn--down') as HTMLButtonElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [VoteRow] }).compileComponents();
    fixture = TestBed.createComponent(VoteRow);
    fixture.componentRef.setInput('votes', VOTES);
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  it('creates a labelled group with one cell per member', () => {
    expect(fixture.componentInstance).toBeTruthy();
    expect(host.classList.contains('vote-row')).toBe(true);
    expect(host.getAttribute('role')).toBe('group');
    expect(host.getAttribute('aria-label')).toBe('Family vote');
    expect(host.getAttribute('disabled')).toBeNull();
    expect(cells().length).toBe(3);
    expect(cells().map((c) => c.querySelector('.vote-row__name')?.textContent?.trim())).toEqual([
      'Quinn',
      'Sara',
      'Eli',
    ]);
  });

  it('draws a medium avatar in each member tone', () => {
    const avatars = cells().map((c) => c.querySelector('sd-avatar') as HTMLElement);
    expect(avatars.map((a) => a.getAttribute('name'))).toEqual(['Quinn', 'Sara', 'Eli']);
    expect(avatars.map((a) => a.getAttribute('tone'))).toEqual(['primary', 'leaf', 'sky']);
    expect(avatars.every((a) => a.getAttribute('size') === 'md')).toBe(true);
    expect(avatars.map((a) => a.textContent?.trim())).toEqual(['Q', 'S', 'E']);
  });

  it('names each thumb and reflects the current vote in aria-pressed', () => {
    expect(up(0).getAttribute('aria-label')).toBe('Quinn votes yes');
    expect(down(0).getAttribute('aria-label')).toBe('Quinn votes no');
    expect(up(0).querySelector('sd-icon')?.getAttribute('name')).toBe('thumbs_up');
    expect(down(0).querySelector('sd-icon')?.getAttribute('name')).toBe('thumbs_down');
    expect([up(0), down(0)].map((b) => b.getAttribute('aria-pressed'))).toEqual(['false', 'false']);
    expect([up(1), down(1)].map((b) => b.getAttribute('aria-pressed'))).toEqual(['true', 'false']);
    expect([up(2), down(2)].map((b) => b.getAttribute('aria-pressed'))).toEqual(['false', 'true']);
    expect(host.querySelectorAll('.vote-row__btn[type="button"]').length).toBe(6);
  });

  it('uses the label input as the accessible name', () => {
    fixture.componentRef.setInput('label', 'Family vote for Pizza Nova');
    fixture.detectChanges();
    expect(host.getAttribute('aria-label')).toBe('Family vote for Pizza Nova');
  });

  it('emits the member index and the next vote, clearing a repeated vote', () => {
    const spy = vi.fn();
    fixture.componentInstance.voteChange.subscribe(spy);

    up(0).click();
    expect(spy).toHaveBeenLastCalledWith({ index: 0, vote: 'up' });
    down(0).click();
    expect(spy).toHaveBeenLastCalledWith({ index: 0, vote: 'down' });
    up(1).click();
    expect(spy).toHaveBeenLastCalledWith({ index: 1, vote: 'none' });
    up(2).click();
    expect(spy).toHaveBeenLastCalledWith({ index: 2, vote: 'up' });
    down(2).click();
    expect(spy).toHaveBeenLastCalledWith({ index: 2, vote: 'none' });
  });

  it('disables every thumb and swallows votes when disabled', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    const spy = vi.fn();
    fixture.componentInstance.voteChange.subscribe(spy);

    expect(host.getAttribute('disabled')).toBe('');
    const buttons = Array.from(host.querySelectorAll<HTMLButtonElement>('.vote-row__btn'));
    expect(buttons.every((b) => b.disabled)).toBe(true);
    up(0).click();
    expect(spy).not.toHaveBeenCalled();
  });
});
