import { EmprestimosPage } from './emprestimos.page';

describe('EmprestimosPage', () => {
  let component: EmprestimosPage;

  beforeEach(() => {
    component = new EmprestimosPage(
      {} as any, // Router
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

  it('formata datas em dd/mm/aaaa', () => {
    expect(component.formatarData(new Date(2026, 4, 8))).toBe('08/05/2026');
  });

  it('apresenta o texto de urgência correto', () => {
    expect(component.textoUrgencia('atrasado')).toBe('Atrasado');
    expect(component.textoUrgencia('hoje')).toBe('Entrega hoje');
    expect(component.textoUrgencia('aTempo')).toBe('Ativo');
  });

  it('só considera o formulário completo com livro, amigo e data', () => {
    expect(component.formularioCompleto).toBeFalse();

    component.livroSelecionado = { id: 1, titulo: 'A', autor: 'B', capa: '' };
    component.idAmigoSelecionado = 2;
    component.dataDevolucaoSelecionada = '2099-01-01';

    expect(component.formularioCompleto).toBeTrue();
  });

  it('filtra os livros disponíveis por título ou autor', () => {
    component.livrosDisponiveis = [
      { id: 1, titulo: 'Duna', autor: 'Frank Herbert', capa: '' },
      { id: 2, titulo: 'O Nome da Rosa', autor: 'Umberto Eco', capa: '' }
    ];

    component.termoPesquisaLivro = 'duna';
    expect(component.livrosDisponiveisFiltrados.length).toBe(1);

    component.termoPesquisaLivro = 'eco';
    expect(component.livrosDisponiveisFiltrados.length).toBe(1);

    component.termoPesquisaLivro = '';
    expect(component.livrosDisponiveisFiltrados.length).toBe(2);
  });
});
