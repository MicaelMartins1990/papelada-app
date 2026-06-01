import { TestBed } from '@angular/core/testing';

import { LivroPessoal, LivroPessoalService } from './livro-pessoal';

describe('LivroPessoal', () => {
  let service: LivroPessoalService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LivroPessoalService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
