import { LivroPessoalService } from './livro-pessoal';
import { LivroStatus } from '../enums/livro-status';

/**
 * Storage falso em memória para testar o LivroPessoalService sem Ionic Storage real.
 */
function criarStorageFalso() {
  const dados = new Map<string, any>();
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
    await service.atualizarStatus(ID_UTILIZADOR, ID_LIVRO, LivroStatus.LIDO);
    const dataDevolucao = new Date(2099, 0, 1);

    await service.registarEmprestimo(ID_UTILIZADOR, ID_LIVRO, ID_AMIGO, dataDevolucao);

    const registos = await service.getLivroPessoal(ID_UTILIZADOR);
    const registo = registos.find(r => r.idLivro === ID_LIVRO);

    expect(registo?.emprestimo).toBeTruthy();
    expect(registo?.emprestimo?.idRecipiente).toBe(ID_AMIGO);
    expect(registo?.emprestimo?.dataEmprestimo instanceof Date).toBeTrue();
    expect(registo?.emprestimo?.dataDevolucao instanceof Date).toBeTrue();
  });

  it('conclui um empréstimo libertando o livro mas mantendo o estado de leitura', async () => {
    await service.atualizarStatus(ID_UTILIZADOR, ID_LIVRO, LivroStatus.LIDO);
    await service.registarEmprestimo(ID_UTILIZADOR, ID_LIVRO, ID_AMIGO, new Date(2099, 0, 1));

    await service.concluirEmprestimo(ID_UTILIZADOR, ID_LIVRO);

    const registos = await service.getLivroPessoal(ID_UTILIZADOR);
    const registo = registos.find(r => r.idLivro === ID_LIVRO);

    expect(registo?.emprestimo).toBeNull();
    expect(registo?.status).toBe(LivroStatus.LIDO);
  });

  it('atualiza a data de devolução de um empréstimo ativo', async () => {
    await service.atualizarStatus(ID_UTILIZADOR, ID_LIVRO, LivroStatus.LIDO);
    await service.registarEmprestimo(ID_UTILIZADOR, ID_LIVRO, ID_AMIGO, new Date(2099, 0, 1));
    const novaData = new Date(2099, 5, 15);

    await service.atualizarDataDevolucao(ID_UTILIZADOR, ID_LIVRO, novaData);

    const registos = await service.getLivroPessoal(ID_UTILIZADOR);
    const registo = registos.find(r => r.idLivro === ID_LIVRO);

    expect(registo?.emprestimo?.dataDevolucao.getTime()).toBe(novaData.getTime());
  });
});
