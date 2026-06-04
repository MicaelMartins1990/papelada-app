import { ComentariosPage } from './comentarios.page';

describe('ComentariosPage', () => {
  let page: ComentariosPage;
  let router: { navigateByUrl: jasmine.Spy };
  let livroPessoalService: any;
  let alertDismissRole: string;

  beforeEach(() => {
    router = { navigateByUrl: jasmine.createSpy('navigateByUrl') };
    alertDismissRole = 'confirm';
    livroPessoalService = {
      getLivrosPessoais: jasmine.createSpy('getLivrosPessoais').and.resolveTo([
        {
          idLivro: 3,
          idUtilizador: 1,
          status: 'lido',
          avaliacao: 4,
          comentario: 'Boa leitura',
          dataAvaliacao: '2026-06-01T10:00:00.000Z',
          emprestimo: null
        }
      ]),
      getAvaliacoesLivro: jasmine.createSpy('getAvaliacoesLivro').and.resolveTo([
        {
          idLivro: 3,
          idUtilizador: 1,
          status: 'lido',
          avaliacao: 4,
          comentario: 'Boa leitura',
          dataAvaliacao: '2026-06-01T10:00:00.000Z',
          emprestimo: null
        },
        {
          idLivro: 3,
          idUtilizador: 2,
          status: 'lido',
          avaliacao: 5,
          comentario: null,
          dataAvaliacao: '2026-06-02T10:00:00.000Z',
          emprestimo: null
        }
      ]),
      adicionarAvaliacao: jasmine.createSpy('adicionarAvaliacao').and.resolveTo(),
      definirLido: jasmine.createSpy('definirLido').and.resolveTo(),
      apagarAvaliacao: jasmine.createSpy('apagarAvaliacao').and.resolveTo()
    };

    page = new ComentariosPage(
      {
        snapshot: {
          paramMap: { get: () => '3' },
          queryParamMap: { get: () => '1' }
        }
      } as any,
      router as any,
      {
        esperarPronto: jasmine.createSpy('esperarPronto').and.resolveTo(),
        getIdUtilizador: jasmine.createSpy('getIdUtilizador').and.returnValue(1),
        getUtilizadoresPublicos: jasmine.createSpy('getUtilizadoresPublicos').and.resolveTo([
          { id: 1, nome: 'Flávio' },
          { id: 2, nome: 'Micael' }
        ])
      } as any,
      {
        getLivros: jasmine.createSpy('getLivros').and.resolveTo([
          {
            id: 3,
            titulo: 'O Nome da Rosa',
            autor: 'Umberto Eco',
            capa: 'capa.png'
          }
        ])
      } as any,
      livroPessoalService,
      {
        create: jasmine.createSpy('create').and.resolveTo({
          present: jasmine.createSpy('present').and.resolveTo()
        })
      } as any,
      {
        create: jasmine.createSpy('create').and.resolveTo({
          present: jasmine.createSpy('present').and.resolveTo(),
          onDidDismiss: jasmine.createSpy('onDidDismiss').and.callFake(() => Promise.resolve({ role: alertDismissRole }))
        })
      } as any
    );
  });

  it('loads book context and opens the modal automatically from route flag', async () => {
    await page.ngOnInit();

    expect(page.livro?.titulo).toBe('O Nome da Rosa');
    expect(page.modalAberto).toBeTrue();
    expect(page.avaliacaoAtual).toBe(4);
    expect(page.comentarioAtual).toBe('Boa leitura');
    expect(page.totalAvaliacoes).toBe(2);
    expect(page.avaliacaoMediaArredondada).toBe(5);
  });

  it('detects personal review and written community comments separately', async () => {
    await page.ngOnInit();

    expect(page.temAvaliacaoPessoal()).toBeTrue();
    expect(page.temComentarioPessoal()).toBeTrue();
    expect(page.temAvaliacoesLivro()).toBeTrue();
    expect(page.comentariosComunidade.length).toBe(1);
    expect(page.comentariosComunidade[0].pertenceAoUtilizadorAtual).toBeTrue();
  });

  it('requires confirmation before deleting the whole review', async () => {
    await page.ngOnInit();

    await page.apagarComentario();

    expect(livroPessoalService.apagarAvaliacao).toHaveBeenCalledWith(1, 3);
  });

  it('does not delete the review when confirmation is cancelled', async () => {
    alertDismissRole = 'cancel';
    await page.ngOnInit();

    await page.apagarComentario();

    expect(livroPessoalService.apagarAvaliacao).not.toHaveBeenCalled();
  });
});
