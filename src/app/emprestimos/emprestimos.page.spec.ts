import { EmprestimosPage } from './emprestimos.page';

describe('EmprestimosPage', () => {
  let component: EmprestimosPage;

  beforeEach(() => {
    component = new EmprestimosPage(
      {} as any, // Router
      {} as any, // AuthService
      {} as any, // LivroPessoalService
      {} as any, // LivroService
      {} as any  // UtilizadorService
    );
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('formata datas em dd/mm/aaaa', () => {
    expect(component.formatarData(new Date(2026, 4, 8))).toBe('08/05/2026');
  });

  it('apresenta o texto de urgência correto', () => {
    expect(component.textoUrgencia('atrasado')).toBe('Atrasado');
    expect(component.textoUrgencia('hoje')).toBe('Entrega hoje');
    expect(component.textoUrgencia('aTempo')).toBe('Ativo');
  });

  it('abre e fecha o modal de registo partilhado', () => {
    expect(component.modalRegistoAberto).toBeFalse();

    component.abrirRegisto();
    expect(component.modalRegistoAberto).toBeTrue();

    component.fecharRegisto();
    expect(component.modalRegistoAberto).toBeFalse();
  });
});
