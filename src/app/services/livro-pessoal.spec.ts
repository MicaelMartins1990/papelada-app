import { LivroPessoalService, migrarRegistoLivroPessoal } from './livro-pessoal';
import { Posse } from '../enums/posse';

/**
 * Valores do enum legado `LivroStatus`, só para construir registos antigos nos testes de migração.
 */
const LEGACY = { NAO_POSSUIDO: 0, DESEJADO: 1, POR_LER: 2, LIDO: 3 };

/**
 * Storage falso em memória para testar o LivroPessoalService sem Ionic Storage real.
 */
function criarStorageFalso(dadosIniciais?: Map<string, any>) {
  const dados = dadosIniciais ?? new Map<string, any>();
  const storageInterno = {
    get: async (chave: string) => dados.get(chave),
    set: async (chave: string, valor: any) => { dados.set(chave, valor); },
    keys: async () => Array.from(dados.keys()),
  };
  return {
    create: jasmine.createSpy('create').and.resolveTo(storageInterno),
  } as any;
}

describe('LivroPessoalService', () => {
  let service: LivroPessoalService;
  const ID_UTILIZADOR = 1;
  const ID_LIVRO = 10;
  const ID_AMIGO = 2;

  beforeEach(() => {
    service = new LivroPessoalService(criarStorageFalso());
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('regista um empréstimo com data de início definida automaticamente', async () => {
    await service.definirPosse(ID_UTILIZADOR, ID_LIVRO, Posse.NA_BIBLIOTECA);
    const dataDevolucao = new Date(2099, 0, 1);

    await service.registarEmprestimo(ID_UTILIZADOR, ID_LIVRO, ID_AMIGO, dataDevolucao);

    const registos = await service.getLivrosPessoais(ID_UTILIZADOR);
    const registo = registos.find(r => r.idLivro === ID_LIVRO);

    expect(registo?.emprestimo).toBeTruthy();
    expect(registo?.emprestimo?.idRecipiente).toBe(ID_AMIGO);
    expect(registo?.emprestimo?.dataEmprestimo instanceof Date).toBeTrue();
    expect(registo?.emprestimo?.dataDevolucao instanceof Date).toBeTrue();
  });

  it('conclui um empréstimo libertando o livro mas mantendo o estado de leitura', async () => {
    await service.definirPosse(ID_UTILIZADOR, ID_LIVRO, Posse.NA_BIBLIOTECA);
    await service.definirLido(ID_UTILIZADOR, ID_LIVRO, true);
    await service.registarEmprestimo(ID_UTILIZADOR, ID_LIVRO, ID_AMIGO, new Date(2099, 0, 1));

    await service.concluirEmprestimo(ID_UTILIZADOR, ID_LIVRO);

    const registos = await service.getLivrosPessoais(ID_UTILIZADOR);
    const registo = registos.find(r => r.idLivro === ID_LIVRO);

    expect(registo?.emprestimo).toBeNull();
    expect(registo?.lido).toBeTrue();
    expect(registo?.posse).toBe(Posse.NA_BIBLIOTECA);
  });

  it('atualiza a data de devolução de um empréstimo ativo', async () => {
    await service.definirPosse(ID_UTILIZADOR, ID_LIVRO, Posse.NA_BIBLIOTECA);
    await service.registarEmprestimo(ID_UTILIZADOR, ID_LIVRO, ID_AMIGO, new Date(2099, 0, 1));
    const novaData = new Date(2099, 5, 15);

    await service.atualizarDataDevolucao(ID_UTILIZADOR, ID_LIVRO, novaData);

    const registos = await service.getLivrosPessoais(ID_UTILIZADOR);
    const registo = registos.find(r => r.idLivro === ID_LIVRO);

    expect(registo?.emprestimo?.dataDevolucao.getTime()).toBe(novaData.getTime());
  });

  describe('mutações por eixo são independentes', () => {
    it('definir lido não altera a posse', async () => {
      await service.definirPosse(ID_UTILIZADOR, ID_LIVRO, Posse.DESEJADO);
      await service.definirLido(ID_UTILIZADOR, ID_LIVRO, true);

      const registo = (await service.getLivrosPessoais(ID_UTILIZADOR)).find(r => r.idLivro === ID_LIVRO);
      expect(registo?.posse).toBe(Posse.DESEJADO);
      expect(registo?.lido).toBeTrue();
    });

    it('definir posse não altera o estado de leitura nem a avaliação', async () => {
      await service.definirLido(ID_UTILIZADOR, ID_LIVRO, true);
      await service.adicionarAvaliacao(ID_UTILIZADOR, ID_LIVRO, 4, 'bom');
      await service.definirPosse(ID_UTILIZADOR, ID_LIVRO, Posse.NENHUMA);

      const registo = (await service.getLivrosPessoais(ID_UTILIZADOR)).find(r => r.idLivro === ID_LIVRO);
      expect(registo?.lido).toBeTrue();
      expect(registo?.avaliacao).toBe(4);
      expect(registo?.comentario).toBe('bom');
    });

    it('permite lido sem posse (li mas não tenho)', async () => {
      await service.definirLido(ID_UTILIZADOR, ID_LIVRO, true);
      const registo = (await service.getLivrosPessoais(ID_UTILIZADOR)).find(r => r.idLivro === ID_LIVRO);
      expect(registo?.posse).toBe(Posse.NENHUMA);
      expect(registo?.lido).toBeTrue();
    });
  });
});

describe('migrarRegistoLivroPessoal', () => {
  function legado(status: number, extra: any = {}) {
    return { idLivro: 10, idUtilizador: 1, status, avaliacao: null, comentario: null, dataAvaliacao: null, emprestimo: null, ...extra };
  }

  it('NAO_POSSUIDO → posse=NENHUMA, lido=false', () => {
    const m = migrarRegistoLivroPessoal(legado(LEGACY.NAO_POSSUIDO));
    expect(m.posse).toBe(Posse.NENHUMA);
    expect(m.lido).toBeFalse();
    expect((m as any).status).toBeUndefined();
  });

  it('DESEJADO → posse=DESEJADO, lido=false', () => {
    const m = migrarRegistoLivroPessoal(legado(LEGACY.DESEJADO));
    expect(m.posse).toBe(Posse.DESEJADO);
    expect(m.lido).toBeFalse();
  });

  it('POR_LER → posse=NA_BIBLIOTECA, lido=false', () => {
    const m = migrarRegistoLivroPessoal(legado(LEGACY.POR_LER));
    expect(m.posse).toBe(Posse.NA_BIBLIOTECA);
    expect(m.lido).toBeFalse();
  });

  it('LIDO → posse=NA_BIBLIOTECA, lido=true', () => {
    const m = migrarRegistoLivroPessoal(legado(LEGACY.LIDO));
    expect(m.posse).toBe(Posse.NA_BIBLIOTECA);
    expect(m.lido).toBeTrue();
  });

  it('preserva empréstimo e avaliação ao migrar', () => {
    const emprestimo = { idRecipiente: 2, dataEmprestimo: new Date(2099, 0, 1), dataDevolucao: new Date(2099, 1, 1) };
    const m = migrarRegistoLivroPessoal(legado(LEGACY.LIDO, { emprestimo, avaliacao: 5, comentario: 'top', dataAvaliacao: '2026-01-01' }));
    expect(m.emprestimo).toBe(emprestimo as any);
    expect(m.avaliacao).toBe(5);
    expect(m.comentario).toBe('top');
    expect(m.dataAvaliacao).toBe('2026-01-01');
  });

  it('registo já migrado passa sem alteração', () => {
    const novo = { idLivro: 10, idUtilizador: 1, posse: Posse.DESEJADO, lido: true, avaliacao: null, comentario: null, dataAvaliacao: null, emprestimo: null };
    const m = migrarRegistoLivroPessoal({ ...novo });
    expect(m.posse).toBe(Posse.DESEJADO);
    expect(m.lido).toBeTrue();
  });
});
