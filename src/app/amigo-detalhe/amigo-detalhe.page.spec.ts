import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AmigoDetalhePage } from './amigo-detalhe.page';

describe('AmigoDetalhePage', () => {
  let component: AmigoDetalhePage;
  let fixture: ComponentFixture<AmigoDetalhePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AmigoDetalhePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
