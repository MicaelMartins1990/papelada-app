import { Component, OnInit } from '@angular/core';
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
export class LoginPage implements OnInit {

    username = '';
    password = '';

    constructor(private authService: AuthService, private router: Router, private toastController: ToastController) { }

    ngOnInit() {
    }

    async login() {
        if (!this.username || !this.password) {
            this.showToast('Por favor preencha todos os campos.');
            return;
        }
        const resultado = await this.authService.login(this.username, this.password);

        switch (resultado) {
            case Resultado.EXITO:
                this.router.navigateByUrl('/tabs/pesquisa');
                break;
            case Resultado.NAO_ENCONTRADO:
                this.showToast('Username ou password estão incorretos.');
                break;
            default:
                this.showToast('Erro desconhecido ao iniciar sessão');
        }
    }

    async showToast(message: string) {
        const toast = await this.toastController.create({ message: message, duration: 2000 });
        toast.present();
    }

    async clearData() {
        await this.authService.clearData()
    }
}
