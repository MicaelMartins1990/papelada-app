import { EmprestimoDetalhePage } from './emprestimo-detalhe.page';

describe('EmprestimoDetalhePage', () => {
  let component: EmprestimoDetalhePage;

  beforeEach(() => {
    component = new EmprestimoDetalhePage(
      {} as any, // ActivatedRoute
      {} as any, // Router
      {} as any, // NavController
      {} as any, // AlertController
      {} as any, // ToastController
      {} as any, // AuthService
      {} as any, // LivroPessoalService
      {} as any, // LivroService
      {} as any  // UtilizadorService
    );
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('formata a data por extenso em português', () => {
    expect(component.formatarDataLonga(new Date(2026, 4, 8))).toBe('8 de Maio de 2026');
  });

  it('devolve string vazia quando não há data', () => {
    expect(component.formatarDataLonga(null)).toBe('');
  });
});
