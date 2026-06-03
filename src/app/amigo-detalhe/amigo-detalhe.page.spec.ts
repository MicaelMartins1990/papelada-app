import { AmigoDetalhePage } from './amigo-detalhe.page';

describe('AmigoDetalhePage', () => {
  let component: AmigoDetalhePage;

  beforeEach(() => {
    component = new AmigoDetalhePage(
      {} as any, // ActivatedRoute
      {} as any, // Router
      {} as any, // NavController
      {} as any, // AuthService
      {} as any, // UtilizadorService
      {} as any  // ToastController
    );
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
