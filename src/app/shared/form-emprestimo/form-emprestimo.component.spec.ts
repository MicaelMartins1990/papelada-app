import { FormEmprestimoComponent } from './form-emprestimo.component';

describe('FormEmprestimoComponent', () => {
  let component: FormEmprestimoComponent;

  beforeEach(() => {
    component = new FormEmprestimoComponent(
      {} as any,
      {} as any,
      {} as any,
      {} as any
    );
  });

  it('só considera o formulário completo com livro, amigo e data', () => {
    expect(component.formularioCompleto).toBeFalse();

    component.livroSelecionado = { id: 1, titulo: 'A', autor: 'B', capa: '' };
    component.idAmigoSelecionado = 2;
    component.dataDevolucaoSelecionada = '2099-01-01';

    expect(component.formularioCompleto).toBeTrue();
  });

  it('arranca com a data de devolução sugerida em hoje + 1 mês', () => {
    const esperada = new Date();
    esperada.setMonth(esperada.getMonth() + 1);
    const iso = `${esperada.getFullYear()}-${String(esperada.getMonth() + 1).padStart(2, '0')}-${String(esperada.getDate()).padStart(2, '0')}`;

    expect(component.dataDevolucaoSelecionada).toBe(iso);
    expect(component.dataSugerida).toBeTrue();
  });

  it('fica completo assim que livro e amigo estão selecionados (data já sugerida)', () => {
    component.livroSelecionado = { id: 1, titulo: 'A', autor: 'B', capa: '' };
    component.idAmigoSelecionado = 2;

    expect(component.formularioCompleto).toBeTrue();
  });

  it('a data sugerida não é anterior a hoje', () => {
    const anterior = (component as any).dataAnteriorAHoje(new Date(component.dataDevolucaoSelecionada!));
    expect(anterior).toBeFalse();
  });

  it('deixa de marcar a data como sugerida quando o utilizador escolhe outra', () => {
    expect(component.dataSugerida).toBeTrue();

    component.aoMudarData({ detail: { value: '2099-12-31' } });

    expect(component.dataSugerida).toBeFalse();
  });

  it('mantém a data como sugerida se o evento repetir o valor sugerido', () => {
    component.aoMudarData({ detail: { value: component.dataDevolucaoSelecionada } });

    expect(component.dataSugerida).toBeTrue();
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

  it('usa o livro fixo como selecionado e bloqueia o picker', async () => {
    component.livroFixo = { id: 3, titulo: 'Livro fixo', autor: 'Autora', capa: '' };
    (component as any).livroPessoalService = {
      getLivrosPessoais: jasmine.createSpy('getLivrosPessoais').and.resolveTo([])
    };
    (component as any).livroService = {
      getLivros: jasmine.createSpy('getLivros').and.resolveTo([])
    };
    (component as any).utilizadorService = {
      esperarPronto: jasmine.createSpy('esperarPronto').and.resolveTo(undefined),
      getAmigos: jasmine.createSpy('getAmigos').and.resolveTo([]),
      getDadosUtilizadores: jasmine.createSpy('getDadosUtilizadores').and.resolveTo([])
    };

    await component.ngOnInit();
    component.abrirPickerLivro();

    expect(component.livroSelecionado?.id).toBe(3);
    expect(component.temLivroFixo).toBeTrue();
    expect(component.modalLivroAberto).toBeFalse();
  });
});
