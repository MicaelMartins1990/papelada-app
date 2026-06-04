import { Component } from '@angular/core';
import { AuthService } from '../services/auth';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { Resultado } from '../enums/resultado';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false
})
export class LoginPage {

    username = '';
    password = '';
    verificandoSessao = true;

    constructor(private authService: AuthService, private router: Router, private toastController: ToastController) { }
    /** Verifica automaticamente se já existe uma sessão ativa ao entrar na página */
    async ionViewWillEnter() {
        this.verificandoSessao = true; // Garante que esconde sempre que entramos aqui
        // Espera que a BD inicie
        await this.authService.esperarPronto();
        
        // Verifica se há um ID de utilizador guardado
        const idAtual = this.authService.getIdUtilizador();

        if (idAtual !== null) {
            // Se houver, salta diretamente para a app
            this.router.navigate(['/tabs/pesquisa'], { replaceUrl: true });
        }else {
            this.verificandoSessao = false; // Mostra o formulário de login
        }
    }
    /** Valida as credenciais e efetua o login no serviço de autenticação */
    async login() {
        if (!this.username || !this.password) {
            this.showToast('Por favor preencha todos os campos.');
            return;
        }
        const resultado = await this.authService.login(this.username, this.password);
        // Trata os diferentes resultados do serviço de autenticação
        switch (resultado) {
            case Resultado.EXITO:
                this.router.navigateByUrl('/tabs/pesquisa');
                break;
            case Resultado.NAO_ENCONTRADO:
                this.showToast('Utilizador ou palavra-passe estão incorretos.');
                break;
            default:
                this.showToast('Erro desconhecido ao iniciar sessão');
        }
    }
    /** Exibe uma mensagem rápida no ecrã para informar o utilizador */
    async showToast(message: string) {
        const toast = await this.toastController.create({ message: message, duration: 2000 });
        toast.present();
    }
}
