import { UtilizadorService } from './utilizador';

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
  } as any;
}

describe('Utilizador', () => {
  let service: UtilizadorService;

  beforeEach(() => {
    service = new UtilizadorService(
      criarStorageFalso(),
      { getLivros: jasmine.createSpy('getLivros').and.resolveTo([]) } as any
    );
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
