import { Component } from '@angular/core';
import { AuthService } from '../services/auth';
import { Router } from '@angular/router';
import { DadosLeitura } from '../models/dados-leitura';
import { UtilizadorService } from '../services/utilizador';
import { AlertController } from '@ionic/angular'; 
import { Livro } from '../models/livro';
import { AVATAR_PADRAO } from '../services/auth';

@Component({
    selector: 'app-perfil',
    templateUrl: './perfil.page.html',
    styleUrls: ['./perfil.page.scss'],
    standalone: false
})
export class PerfilPage {
    public nomeUtilizador: string = '';
    public usernameUtilizador: string = '';
    public inicial: string = ''; 
    public dadosLeitura: DadosLeitura | null = null;
    public livrosDesejados: Livro[] = [];

    public isModalOpen: boolean = false;
    public novoNome: string = '';
    
    public avataresDisponiveis: string[] = ['#8c5a47', '#2b8b3b', '#3b5998', '#e91e63', '#ff9800'];
    public avatarAtual: string = AVATAR_PADRAO;
    public avatarEmEdicao: string = AVATAR_PADRAO;
    private idUtilizador: number | null = null;

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
            this.idUtilizador = idAtual;
            const user = await this.utilizadorService.getUtilizador(idAtual);
            if (user) {
                this.nomeUtilizador = user.nome;
                this.usernameUtilizador = user.username;
                this.avatarAtual = user.avatar || AVATAR_PADRAO;
                this.inicial = this.nomeUtilizador.charAt(0).toUpperCase();
            }
            const [dadosLeitura, livrosDesejados] = await Promise.all([
                this.utilizadorService.getDadosLeitura(idAtual),
                this.utilizadorService.getLivrosDesejadosComCapa(idAtual)
            ]);
            this.dadosLeitura = dadosLeitura;
            this.livrosDesejados = livrosDesejados;
        }
    }

    abrirModal() {
        this.novoNome = this.nomeUtilizador;
        this.avatarEmEdicao = this.avatarAtual;
        this.isModalOpen = true;
    }

    fecharModal() {
        this.isModalOpen = false;
    }

    selecionarAvatar(cor: string) {
        this.avatarEmEdicao = cor;
    }

    async guardarPerfil() {
        if (this.idUtilizador === null) return;

        const nomeAtualizado = this.novoNome.trim() || this.nomeUtilizador;
        const utilizadorAtualizado = await this.utilizadorService.atualizarPerfil(
            this.idUtilizador,
            nomeAtualizado,
            this.avatarEmEdicao
        );

        if (utilizadorAtualizado) {
            this.nomeUtilizador = utilizadorAtualizado.nome;
            this.usernameUtilizador = utilizadorAtualizado.username;
            this.avatarAtual = utilizadorAtualizado.avatar;
            this.inicial = this.nomeUtilizador.charAt(0).toUpperCase();
        }
        this.fecharModal();
    }

    abrirListaDesejos() {
        this.router.navigate(['/tabs/pesquisa'], { queryParams: { filtro: 'desejos' } });
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
