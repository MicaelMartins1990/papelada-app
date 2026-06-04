import { of } from 'rxjs';
import { LivroService } from './livro';
import { Livro } from '../models/livro';
import { LivroPessoal } from '../models/livro-pessoal';
import { Posse } from '../enums/posse';

describe('LivroService', () => {
  it('should be created', () => {
    const service = new LivroService(
      { get: jasmine.createSpy('get').and.returnValue(of('capa-teste')) } as any,
      { create: jasmine.createSpy('create').and.resolveTo({ get: async () => [], set: async () => undefined }) } as any
    );

    expect(service).toBeTruthy();
  });

  it('loads initial books from json when storage is empty', async () => {
    const storageSet = jasmine.createSpy('set').and.resolveTo();
    const service = new LivroService(
      {
        get: jasmine.createSpy('get').and.callFake((url: string) => {
          if (url === 'assets/data/capa-teste.txt') {
            return of('capa-teste');
          }

          return of([
            {
              id: '1',
              titulo: 'O Nome da Rosa',
              autor: 'Umberto Eco',
              capa: 'capa.png',
              status: 'quero_ler'
            }
          ]);
        })
      } as any,
      {
        create: jasmine.createSpy('create').and.resolveTo({
          get: async () => [],
          set: storageSet
        })
      } as any
    );

    const livros = await service.getLivros();

    expect(livros).toEqual([
      {
        id: 1,
        titulo: 'O Nome da Rosa',
        autor: 'Umberto Eco',
        capa: 'capa.png',
        inicial: true,
        generos: []
      }
    ]);
    expect(storageSet).toHaveBeenCalledWith('livros', livros);
  });

  it('keeps saved books and adds missing initial books', async () => {
    const storageSet = jasmine.createSpy('set').and.resolveTo();
    const service = new LivroService(
      {
        get: jasmine.createSpy('get').and.callFake((url: string) => {
          if (url === 'assets/data/capa-teste.txt') {
            return of('capa-teste');
          }

          return of([
            {
              id: '1',
              titulo: 'O Nome da Rosa',
              autor: 'Umberto Eco',
              capa: 'capa.png'
            }
          ]);
        })
      } as any,
      {
        create: jasmine.createSpy('create').and.resolveTo({
          get: async () => [
            {
              id: 8,
              titulo: 'Livro Registado',
              autor: 'Autor',
              capa: 'registado.png'
            }
          ],
          set: storageSet
        })
      } as any
    );

    const livros = await service.getLivros();

    expect(livros.map(livro => livro.id)).toEqual([8, 1]);
    expect(storageSet).toHaveBeenCalledWith('livros', livros);
  });

  describe('getLivrosSemelhantes', () => {
    const catalogo = [
      { id: 1, titulo: 'Base', autor: 'A', capa: '1.png', generos: ['Fantasia', 'Aventura'] },
      { id: 2, titulo: 'Dois Generos', autor: 'B', capa: '2.png', generos: ['Fantasia', 'Aventura'] },
      { id: 3, titulo: 'Um Genero', autor: 'C', capa: '3.png', generos: ['Fantasia', 'Terror'] },
      { id: 4, titulo: 'Sem Match', autor: 'D', capa: '4.png', generos: ['Biografia'] },
      { id: 5, titulo: 'Possuido', autor: 'E', capa: '5.png', generos: ['Fantasia', 'Aventura'] }
    ];

    const livroBase: Livro = {
      id: 1, titulo: 'Base', autor: 'A', capa: '1.png', inicial: true, generos: ['Fantasia', 'Aventura']
    };

    function criarServico(): LivroService {
      return new LivroService(
        // http: livros.json devolve vazio para não juntar livros iniciais ao catálogo guardado
        { get: jasmine.createSpy('get').and.returnValue(of([])) } as any,
        {
          create: jasmine.createSpy('create').and.resolveTo({
            get: async (chave: string) => (chave === 'livros' ? catalogo : null),
            set: async () => undefined
          })
        } as any
      );
    }

    function registo(idLivro: number, posse: Posse): LivroPessoal {
      return {
        idLivro, idUtilizador: 1, posse, lido: false,
        avaliacao: null, comentario: null, dataAvaliacao: null, emprestimo: null
      };
    }

    it('orders by number of shared genres, excluding self and unmatched books', async () => {
      const service = criarServico();

      const resultado = await service.getLivrosSemelhantes(livroBase, []);

      // Score 2 (ids 2 e 5) antes de score 1 (id 3); empate desfeito por título
      // ('Dois Generos' < 'Possuido'). id 1 (próprio) e id 4 (sem match) ficam fora.
      expect(resultado.map(r => r.livro.id)).toEqual([2, 5, 3]);
      expect(resultado[0].generosPartilhados).toEqual(['Fantasia', 'Aventura']);
      expect(resultado[2].generosPartilhados).toEqual(['Fantasia']);
    });

    it('excludes books in the library or wishlist', async () => {
      const service = criarServico();

      const resultado = await service.getLivrosSemelhantes(livroBase, [
        registo(5, Posse.NA_BIBLIOTECA),
        registo(3, Posse.DESEJADO)
      ]);

      expect(resultado.map(r => r.livro.id)).toEqual([2]);
    });

    it('returns empty when the base book has no genres', async () => {
      const service = criarServico();

      const resultado = await service.getLivrosSemelhantes({ ...livroBase, generos: [] }, []);

      expect(resultado).toEqual([]);
    });

    it('respects the limit', async () => {
      const service = criarServico();

      const resultado = await service.getLivrosSemelhantes(livroBase, [], 1);

      expect(resultado.length).toBe(1);
      expect(resultado[0].livro.id).toBe(2);
    });
  });
});
