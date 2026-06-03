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
      getLivroPessoal: jasmine.createSpy('getLivroPessoal').and.resolveTo([])
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
