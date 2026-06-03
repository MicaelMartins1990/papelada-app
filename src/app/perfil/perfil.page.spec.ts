import { PerfilPage } from './perfil.page';

describe('PerfilPage', () => {
  it('should create', () => {
    const page = new PerfilPage(
      { logout: jasmine.createSpy('logout') } as any,
      { navigateByUrl: jasmine.createSpy('navigateByUrl') } as any,
      { getLivroPessoal: jasmine.createSpy('getLivroPessoal').and.resolveTo([]) } as any
    );

    expect(page).toBeTruthy();
  });
});
