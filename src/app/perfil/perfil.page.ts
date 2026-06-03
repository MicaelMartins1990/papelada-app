import { Component } from '@angular/core';
import { AuthService } from '../services/auth';
import { Router } from '@angular/router';
import { DadosLeitura } from '../models/dados-leitura';
import { UtilizadorService } from '../services/utilizador';
import { AlertController } from '@ionic/angular'; 

@Component({
    selector: 'app-perfil',
    templateUrl: './perfil.page.html',
    styleUrls: ['./perfil.page.scss'],
    standalone: false
})
export class PerfilPage {
    public nomeUtilizador: string = '';
    public inicial: string = ''; 
    public dadosLeitura: DadosLeitura | null = null;

    public isModalOpen: boolean = false;
    public novoNome: string = '';
    
    public avataresDisponiveis: string[] = ['#8c5a47', '#2b8b3b', '#3b5998', '#e91e63', '#ff9800'];
    public avatarAtual: string = '#8c5a47'; 

    constructor(
        private authService: AuthService, 
        private router: Router,
        private utilizadorService: UtilizadorService,
        private alertController: AlertController 
    ) { }

    async ionViewWillEnter() {
        await this.authService.esperarPronto();
        const idAtual = this.authService.getIdUtilizador();
    
        if (idAtual !== null) {
            const listaUsers = await this.authService.getUtilizadoresPublicos();
            const user = listaUsers.find(u => u.id === idAtual);
            if (user) {
                this.nomeUtilizador = user.nome;
                this.inicial = this.nomeUtilizador.charAt(0).toUpperCase();
            }
            this.dadosLeitura = await this.utilizadorService.getDadosLeitura(idAtual);
        }
    }

    abrirModal() {
        this.novoNome = this.nomeUtilizador;
        this.isModalOpen = true;
    }

    fecharModal() {
        this.isModalOpen = false;
    }

    selecionarAvatar(cor: string) {
        this.avatarAtual = cor;
    }

    guardarPerfil() {
        this.nomeUtilizador = this.novoNome;
        this.inicial = this.nomeUtilizador.charAt(0).toUpperCase();
        this.fecharModal();
    }

    // A função de logout agora abre primeiro um alerta
    async logout() {
        const alerta = await this.alertController.create({
            header: 'Terminar Sessão',
            message: 'Tens a certeza que pretendes sair da tua conta?',
            buttons: [
                {
                    text: 'Cancelar',
                    role: 'cancel', 
                },
                {
                    text: 'Sair',
                    role: 'destructive', 
                    handler: async () => {
                        
                        await this.authService.logout();
                        this.router.navigateByUrl(''); 
                    }
                }
            ]
        });

        await alerta.present();
    }
}