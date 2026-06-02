import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ComentariosPage } from './comentarios.page';

const routes: Routes = [
  {
    path: '',
    component: ComentariosPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ComentariosPageRoutingModule {}
