import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { FormEmprestimoComponent } from './form-emprestimo/form-emprestimo.component';
import { RegistarLivroComponent } from './registar-livro/registar-livro.component';

@NgModule({
    declarations: [
        FormEmprestimoComponent,
        RegistarLivroComponent
    ],
    imports: [
        CommonModule,
        FormsModule,
        IonicModule
    ],
    exports: [
        FormEmprestimoComponent,
        RegistarLivroComponent
    ]
})
export class SharedModule { }
