import { AuthServiceGuard } from './auth-guard';

describe('AuthServiceGuard', () => {
  it('allows navigation when the user is logged in', async () => {
    const guard = new AuthServiceGuard(
      {
        esperarPronto: jasmine.createSpy('esperarPronto').and.resolveTo(),
        estaLogado: jasmine.createSpy('estaLogado').and.returnValue(true)
      } as any,
      { navigateByUrl: jasmine.createSpy('navigateByUrl') } as any
    );

    await expectAsync(guard.canActivate()).toBeResolvedTo(true);
  });

  it('redirects when the user is not logged in', async () => {
    const router = { navigateByUrl: jasmine.createSpy('navigateByUrl') };
    const guard = new AuthServiceGuard(
      {
        esperarPronto: jasmine.createSpy('esperarPronto').and.resolveTo(),
        estaLogado: jasmine.createSpy('estaLogado').and.returnValue(false)
      } as any,
      router as any
    );

    await expectAsync(guard.canActivate()).toBeResolvedTo(false);
    expect(router.navigateByUrl).toHaveBeenCalledWith('');
  });
});
