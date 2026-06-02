import { LivroPessoalService } from './livro-pessoal';

describe('LivroPessoalService', () => {
  it('should be created', () => {
    const service = new LivroPessoalService(
      { create: jasmine.createSpy('create').and.resolveTo({ get: async () => [], set: async () => undefined }) } as any
    );

    expect(service).toBeTruthy();
  });
});
