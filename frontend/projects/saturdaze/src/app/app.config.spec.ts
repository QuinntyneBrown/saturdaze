import { appConfig } from './app.config';

describe('app.config', () => {
  it('should declare providers in appConfig', () => {
    expect((appConfig as any).providers.length).toBeGreaterThan(0);
  });

  it('should run the zero-dependency provider factories of appConfig', () => {
    expect(() => {
      for (const provider of (appConfig as any).providers as any[]) {
        if (provider && provider.useFactory && (!provider.deps || provider.deps.length === 0)) {
          provider.useFactory();
        }
      }
    }).not.toThrow();
  });
});
