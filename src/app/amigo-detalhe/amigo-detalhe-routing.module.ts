import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AmigoDetalhePage } from './amigo-detalhe.page';

const routes: Routes = [
  {
    path: '',
    component: AmigoDetalhePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AmigoDetalhePageRoutingModule {}
