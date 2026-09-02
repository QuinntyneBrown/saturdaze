import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { SHARED_WEEKEND_SERVICE, type SharedWeekend } from 'api';
import { SampleWeekendPage } from './sample-weekend.page';

const shared: SharedWeekend = {
  weekendOf: '2026-05-16',
  blocks: [
    { day: 'Saturday', kind: 'Commitment', title: 'Swim', isLocked: true, startTime: '09:00:00' },
    { day: 'Saturday', kind: 'Activity', title: 'Terre Bleu', isLocked: false, startTime: '11:00:00' },
    { day: 'Sunday', kind: 'Meal', title: 'Brunch', isLocked: false, startTime: '10:00:00' },
  ],
};

describe('SampleWeekendPage', () => {
  let component: SampleWeekendPage;
  let fixture: ComponentFixture<SampleWeekendPage>;
  let service: any;

  async function build(query: Record<string, string>, load = () => Promise.resolve(shared)) {
    service = { load: vi.fn(load) };
    const params = convertToParamMap(query);
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [SampleWeekendPage],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: ActivatedRoute, useValue: {
          snapshot: { paramMap: convertToParamMap({}), queryParamMap: params, params: {}, queryParams: query, data: {} },
          paramMap: of(convertToParamMap({})), queryParamMap: of(params),
          params: of({}), queryParams: of(query), data: of({}),
        } },
        { provide: SHARED_WEEKEND_SERVICE, useValue: service },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(SampleWeekendPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('renders the static sample without a share token', async () => {
    await build({});
    expect(service.load).not.toHaveBeenCalled();
    expect(component['isShared']()).toBe(false);
    expect(component['bannerTitle']()).toBe('This is a sample weekend for the Browns.');
    expect(component['forecastSubtitle']()).toBe('Sat 17 May – Sun 18 May');
  });

  it('loads the shared weekend through the service token and projects it', async () => {
    await build({ share: 'tok' });
    expect(service.load).toHaveBeenCalledWith('tok');
    expect(component['isShared']()).toBe(true);
    expect(component['bannerTitle']()).toBe('Someone shared this Saturdaze weekend with you.');
    expect(component['heroGreeting']()).toBe('Weekend preview');
    expect(component['forecastSubtitle']()).toBe('Sat 16 May – Sun 17 May');
    expect(component['saturdayHighlight']()).toBe('Terre Bleu');
    expect(component['sundayHighlight']()).toBe('Brunch');
    expect(component['saturdayLock']()).toBe('9:00 swim');
    expect(component['sundayLock']()).toBe('10:30 church');
  });

  it('logs and keeps the sample when the link is invalid', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    await build({ share: 'bad' }, () => Promise.reject(new Error('404')));
    expect(component['isShared']()).toBe(false);
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });
});
