import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { EmprestimosPageRoutingModule } from './emprestimos-routing.module';

import { EmprestimosPage } from './emprestimos.page';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    EmprestimosPageRoutingModule,
    SharedModule
  ],
  declarations: [EmprestimosPage]
})
export class EmprestimosPageModule {}
