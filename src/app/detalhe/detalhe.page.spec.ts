import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DetalhePage } from './detalhe.page';

describe('DetalhePage', () => {
  let component: DetalhePage;
  let fixture: ComponentFixture<DetalhePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DetalhePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
