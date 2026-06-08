import { AmigosPage } from './amigos.page';
import { Utilizador } from '../models/utilizador';

describe('AmigosPage', () => {
  let component: AmigosPage;
  let utilizadorService: any;

  beforeEach(() => {
    utilizadorService = {
      pesquisarUtilizadores: jasmine.createSpy('pesquisarUtilizadores').and.resolveTo([]),
    };
    component = new AmigosPage(
      utilizadorService as any, // UtilizadorService
      {} as any, // AuthService
      {} as any, // Router
      {} as any  // ToastController
    );
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('exclui o próprio utilizador e amigos existentes das sugestões', async () => {
    component.idUtilizador = 1;
    component.amigos = [criarUtilizador(2, 'Maria Costa', 'maria')];
    component.usernameInput = 'ma';
    utilizadorService.pesquisarUtilizadores.and.resolveTo([
      criarUtilizador(1, 'Utilizador Atual', 'atual'),
      criarUtilizador(2, 'Maria Costa', 'maria'),
      criarUtilizador(3, 'Marta Silva', 'marta'),
    ]);

    await component.pesquisarUtilizadoresAdicionar();

    expect(component.sugestoesAmigos.map(amigo => amigo.id)).toEqual([3]);
  });
});

function criarUtilizador(id: number, nome: string, username: string): Utilizador {
  return {
    id,
    nome,
    username,
    passwordHash: 'hash',
    avatar: '#AE2A2A',
  };
}
