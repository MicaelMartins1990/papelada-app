import { TestBed } from '@angular/core/testing';

import { UtilizadorService } from './utilizador';

describe('Utilizador', () => {
  let service: UtilizadorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UtilizadorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
