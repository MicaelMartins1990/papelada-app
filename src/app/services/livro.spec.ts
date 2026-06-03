import { of } from 'rxjs';
import { LivroService } from './livro';

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
});
