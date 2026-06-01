import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { Resultado } from '../enums/resultado';

@Component({
    selector: 'app-criar-conta',
    templateUrl: './criar-conta.page.html',
    styleUrls: ['./criar-conta.page.scss'],
    standalone: false
})
export class CriarContaPage implements OnInit {
    nome = '';
    username = '';
    password = '';

    constructor(private authService: AuthService, private router: Router, private toastController: ToastController) { }

    ngOnInit() {
    }

    async criarConta() {
        if (!this.nome || !this.username || !this.password) {
            this.showToast('Por favor preencha todos os campos.');
            return;
        }
        const resultado = await this.authService.criarConta(this.nome, this.username, this.password);

        switch (resultado) {
            case Resultado.EXITO:
                this.router.navigateByUrl('/');
                break;
            case Resultado.JA_EXISTE:
                this.showToast('Um utilizador com este username já existe.');
                break;
            default:
                this.showToast('Erro desconhecido ao criar conta');
        }
    }

    async showToast(message: string) {
        const toast = await this.toastController.create({ message: message, duration: 2000 });
        toast.present();
    }
}
