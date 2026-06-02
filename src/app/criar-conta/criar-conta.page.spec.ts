import { CriarContaPage } from './criar-conta.page';

describe('CriarContaPage', () => {
  it('should create', () => {
    const page = new CriarContaPage(
      {} as any,
      { navigateByUrl: jasmine.createSpy('navigateByUrl') } as any,
      { create: jasmine.createSpy('create') } as any
    );

    expect(page).toBeTruthy();
  });
});
