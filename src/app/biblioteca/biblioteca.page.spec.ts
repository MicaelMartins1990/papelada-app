import { BibliotecaPage } from './biblioteca.page';

describe('BibliotecaPage', () => {
  it('should create', () => {
    const page = new BibliotecaPage(
      {} as any,
      {} as any,
      {} as any,
      { navigateByUrl: jasmine.createSpy('navigateByUrl') } as any
    );

    expect(page).toBeTruthy();
  });
});
