import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AmigoDetalhePageRoutingModule } from './amigo-detalhe-routing.module';

import { AmigoDetalhePage } from './amigo-detalhe.page';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AmigoDetalhePageRoutingModule,
    SharedModule
  ],
  declarations: [AmigoDetalhePage]
})
export class AmigoDetalhePageModule {}
