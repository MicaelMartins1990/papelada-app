import { PerfilPage } from './perfil.page';

describe('PerfilPage', () => {
  it('should create', () => {
    const page = new PerfilPage(
      { logout: jasmine.createSpy('logout') } as any,
      { navigateByUrl: jasmine.createSpy('navigateByUrl') } as any,
      { getLivrosPessoais: jasmine.createSpy('getLivrosPessoais').and.resolveTo([]) } as any,
      { create: jasmine.createSpy('create') } as any
    );

    expect(page).toBeTruthy();
  });
});
