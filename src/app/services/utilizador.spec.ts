import { UtilizadorService } from './utilizador';
import { Utilizador } from '../models/utilizador';

/**
 * Storage falso em memória para testar o UtilizadorService sem Ionic Storage real.
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
    dados,
  } as any;
}

describe('Utilizador', () => {
  let service: UtilizadorService;
  let storageFalso: any;

  beforeEach(() => {
    storageFalso = criarStorageFalso();
    service = new UtilizadorService(
      storageFalso,
      { getLivros: jasmine.createSpy('getLivros').and.resolveTo([]) } as any
    );
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('pesquisa utilizadores por username sem @', async () => {
    storageFalso.dados.set('utilizadores', criarUtilizadores());

    const resultado = await service.pesquisarUtilizadores('mari');

    expect(resultado.map(utilizador => utilizador.username)).toEqual(['maria']);
  });

  it('pesquisa utilizadores por username com @', async () => {
    storageFalso.dados.set('utilizadores', criarUtilizadores());

    const resultado = await service.pesquisarUtilizadores('@jo');

    expect(resultado.map(utilizador => utilizador.username)).toEqual(['joao']);
  });

  it('pesquisa utilizadores por nome', async () => {
    storageFalso.dados.set('utilizadores', criarUtilizadores());

    const resultado = await service.pesquisarUtilizadores('ana');

    expect(resultado.map(utilizador => utilizador.nome)).toEqual(['Ana Silva']);
  });
});

function criarUtilizadores(): Utilizador[] {
  return [
    { id: 1, nome: 'Maria Costa', username: 'maria', passwordHash: 'hash', avatar: '#AE2A2A' },
    { id: 2, nome: 'João Pereira', username: 'joao', passwordHash: 'hash', avatar: '#AE2A2A' },
    { id: 3, nome: 'Ana Silva', username: 'asilva', passwordHash: 'hash', avatar: '#AE2A2A' },
  ];
}
