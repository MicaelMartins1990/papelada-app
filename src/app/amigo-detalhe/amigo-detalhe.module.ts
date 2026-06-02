import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AmigoDetalhePageRoutingModule } from './amigo-detalhe-routing.module';

import { AmigoDetalhePage } from './amigo-detalhe.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AmigoDetalhePageRoutingModule
  ],
  declarations: [AmigoDetalhePage]
})
export class AmigoDetalhePageModule {}
