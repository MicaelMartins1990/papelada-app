import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { DetalhePageRoutingModule } from './detalhe-routing.module';

import { DetalhePage } from './detalhe.page';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DetalhePageRoutingModule,
    SharedModule
  ],
  declarations: [DetalhePage]
})
export class DetalhePageModule {}
