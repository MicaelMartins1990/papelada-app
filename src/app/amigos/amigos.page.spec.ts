import { AmigosPage } from './amigos.page';

describe('AmigosPage', () => {
  let component: AmigosPage;

  beforeEach(() => {
    component = new AmigosPage(
      {} as any, // UtilizadorService
      {} as any, // AuthService
      {} as any, // Router
      {} as any  // ToastController
    );
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
