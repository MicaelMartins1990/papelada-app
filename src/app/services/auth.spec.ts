import { AuthService } from './auth';

describe('AuthService', () => {
  it('should be created', () => {
    const service = new AuthService(
      {
        create: jasmine.createSpy('create').and.resolveTo({
          get: async () => null,
          set: async () => undefined,
          remove: async () => undefined
        })
      } as any
    );

    expect(service).toBeTruthy();
  });
});
