import { Component } from '@angular/core';
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
export class CriarContaPage {
    nome = '';
    username = '';
    password = '';

    constructor(private authService: AuthService, private router: Router, private toastController: ToastController) { }
    /** Valida os campos do formulário e tenta registar uma nova conta */
    async criarConta() {
        if (!this.nome || !this.username || !this.password) {
            this.showToast('Por favor preencha todos os campos.');
            return;
        }
        const resultado = await this.authService.criarConta(this.nome, this.username, this.password);

        switch (resultado) {
            case Resultado.EXITO:
                // Redireciona para a página inicial em caso de sucesso
                this.router.navigateByUrl('/');
                break;
            case Resultado.JA_EXISTE:
                this.showToast('Um utilizador com este username já existe.');
                break;
            default:
                this.showToast('Erro desconhecido ao criar conta');
        }
    }
    /** Exibe uma mensagem rápidano ecrã para informar o utilizador */
    async showToast(message: string) {
        const toast = await this.toastController.create({ message: message, duration: 2000 });
        toast.present();
    }
}
