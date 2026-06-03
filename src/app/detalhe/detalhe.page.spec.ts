import { DetalhePage } from './detalhe.page';

describe('DetalhePage', () => {
  let router: { navigate: jasmine.Spy };
  let page: DetalhePage;

  beforeEach(() => {
    router = { navigate: jasmine.createSpy('navigate') };
    page = new DetalhePage(
      { snapshot: { paramMap: { get: () => '1' } } } as any,
      {} as any,
      {} as any,
      {} as any,
      router as any,
      {} as any,
      {} as any
    );
  });

  it('navigates to comments with modal flag when evaluating', () => {
    page.livro = {
      id: 7,
      titulo: 'O Nome da Rosa',
      autor: 'Umberto Eco',
      capa: 'capa.png'
    };

    page.abrirAvaliacao();

    expect(router.navigate).toHaveBeenCalledWith(['/tabs/livro/comentarios', 7], {
      queryParams: { abrirModal: '1' }
    });
  });

  it('navigates to comments without modal flag when viewing comments', () => {
    page.livro = {
      id: 7,
      titulo: 'O Nome da Rosa',
      autor: 'Umberto Eco',
      capa: 'capa.png'
    };

    page.abrirComentarios();

    expect(router.navigate).toHaveBeenCalledWith(['/tabs/livro/comentarios', 7]);
  });

  it('rounds the global average for the visual star row', () => {
    (page as any).calcularResumoGlobal([
      { avaliacao: 4 },
      { avaliacao: 5 },
      { avaliacao: null },
      { avaliacao: 0 }
    ]);

    expect(page.totalAvaliacoes).toBe(2);
    expect(page.mediaAvaliacoes).toBe(4.5);
    expect(page.avaliacaoMediaArredondada).toBe(5);
  });
});
