import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { FormEmprestimoComponent } from './form-emprestimo/form-emprestimo.component';

@NgModule({
    declarations: [FormEmprestimoComponent],
    imports: [
        CommonModule,
        FormsModule,
        IonicModule
    ],
    exports: [FormEmprestimoComponent]
})
export class SharedModule { }
