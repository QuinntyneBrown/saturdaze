import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthCard } from './auth-card';

describe('AuthCard', () => {
  let component: AuthCard;
  let fixture: ComponentFixture<AuthCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthCard],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthCard);
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
