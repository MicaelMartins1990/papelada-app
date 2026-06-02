import { LoginPage } from './login.page';

describe('LoginPage', () => {
  it('should create', () => {
    const page = new LoginPage(
      {} as any,
      { navigateByUrl: jasmine.createSpy('navigateByUrl') } as any,
      { create: jasmine.createSpy('create') } as any
    );

    expect(page).toBeTruthy();
  });
});
