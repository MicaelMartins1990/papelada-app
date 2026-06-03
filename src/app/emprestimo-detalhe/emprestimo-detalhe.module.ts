import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { EmprestimoDetalhePageRoutingModule } from './emprestimo-detalhe-routing.module';

import { EmprestimoDetalhePage } from './emprestimo-detalhe.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    EmprestimoDetalhePageRoutingModule
  ],
  declarations: [EmprestimoDetalhePage]
})
export class EmprestimoDetalhePageModule {}
