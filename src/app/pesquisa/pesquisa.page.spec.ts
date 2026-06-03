import { PesquisaPage } from './pesquisa.page';

describe('PesquisaPage', () => {
  it('should create', () => {
    const page = new PesquisaPage(
      {} as any,
      {} as any,
      {} as any,
      { navigateByUrl: jasmine.createSpy('navigateByUrl') } as any,
      {} as any,
      {} as any
    );

    expect(page).toBeTruthy();
  });
});
