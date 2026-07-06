import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VoteRow } from './vote-row';

describe('VoteRow', () => {
  let component: VoteRow;
  let fixture: ComponentFixture<VoteRow>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VoteRow],
    }).compileComponents();

    fixture = TestBed.createComponent(VoteRow);
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

  it('should reflect the vote input', () => {
    fixture.componentRef.setInput('vote', {} as any);
    fixture.detectChanges();
    expect(() => component.vote()).not.toThrow();
  });

  it('should expose the voteChange output', () => {
    expect(() => {
      const sub = component.voteChange.subscribe(() => {});
      sub.unsubscribe();
    }).not.toThrow();
  });
});
