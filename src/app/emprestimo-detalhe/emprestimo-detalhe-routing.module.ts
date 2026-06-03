import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { EmprestimoDetalhePage } from './emprestimo-detalhe.page';

const routes: Routes = [
  {
    path: '',
    component: EmprestimoDetalhePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EmprestimoDetalhePageRoutingModule {}
