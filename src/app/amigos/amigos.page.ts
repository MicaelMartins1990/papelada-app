import { Component, OnInit, ViewChild } from '@angular/core';
import { UtilizadorService } from '../services/utilizador';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { Resultado } from '../enums/resultado';
import { IonModal, ToastController } from '@ionic/angular';
import { Utilizador } from '../models/utilizador';

@Component({
    selector: 'app-amigos',
    templateUrl: './amigos.page.html',
    styleUrls: ['./amigos.page.scss'],
    standalone: false
})

export class AmigosPage implements OnInit {
    @ViewChild('modal') modal!: IonModal;

    public idUtilizador!: number;
    public aCarregar: boolean = true;

    public usernameInput: string = '';

    public amigos: Utilizador[] = [];
    public amigosFiltrados: Utilizador[] = [];
    public sugestoesAmigos: Utilizador[] = [];
    public aPesquisarUtilizadores: boolean = false;

    constructor(
        private utilizadorService: UtilizadorService,
        private authService: AuthService,
        private router: Router,
        private toastController: ToastController
    ) {}
    /** Inicializa a página carregando o utilizador e os seus amigos */
    async ngOnInit() {
        await this.carregarUtilizador();
        await this.carregarDados();
    }
    /** Atualiza os dados sempre que o utilizador entra na página */
    async ionViewWillEnter() {
        await this.carregarUtilizador();
        await this.carregarDados();
    }
    /** Obtém o ID do utilizador atual através do serviço de autenticação */
    private async carregarUtilizador() {
        await this.authService.esperarPronto();
        const id = this.authService.getIdUtilizador();
        if (id == null) {
            this.router.navigateByUrl('/');
            return;
        }
        this.idUtilizador = id;
    }
    /** pesquisa a lista de amigos do serviço e prepara a listagem filtrada */
    private async carregarDados() {
        this.aCarregar = true;
        if (this.idUtilizador == null) {
            this.router.navigateByUrl('/');
            return;
        }
        const idAmigos = await this.utilizadorService.getAmigos(this.idUtilizador);
        this.amigos = await this.utilizadorService.getDadosUtilizadores(idAmigos);
        this.amigosFiltrados = [...this.amigos];
        this.aCarregar = false;
    }
    /** Filtra a lista de amigos com base no nome ou username inserido */
    public filtrarAmigos(event: any) {
        const texto = event.target.value ? event.target.value.toLowerCase().trim() : '';
        const usernamePesquisa = texto.startsWith('@') ? texto.substring(1) : texto;
        if (texto === '') {
            this.amigosFiltrados = this.amigos;
        } else {
            this.amigosFiltrados = this.amigos.filter(amigo =>
                amigo.nome.toLowerCase().includes(texto) ||
                amigo.username.toLowerCase().includes(usernamePesquisa)
            );
        }
    }
    /** Tenta adicionar um novo amigo utilizando o username inserido */
    public async adicionarAmigo() {
        await this.adicionarAmigoPorUsername(this.usernameInput);
    }
    /** Adiciona diretamente o utilizador escolhido na lista de sugestões */
    public async adicionarSugestao(amigo: Utilizador) {
        await this.adicionarAmigoPorUsername(amigo.username);
    }
    /** Pesquisa utilizadores enquanto o username é escrito no modal */
    public async pesquisarUtilizadoresAdicionar() {
        const termo = this.usernameInput.trim();
        if (!termo) {
            this.sugestoesAmigos = [];
            return;
        }

        this.aPesquisarUtilizadores = true;
        const utilizadores = await this.utilizadorService.pesquisarUtilizadores(termo);
        const idsAmigos = new Set(this.amigos.map(amigo => amigo.id));
        this.sugestoesAmigos = utilizadores.filter(utilizador =>
            utilizador.id !== this.idUtilizador &&
            !idsAmigos.has(utilizador.id)
        );
        this.aPesquisarUtilizadores = false;
    }
    /** Indica se a pesquisa do modal tem texto suficiente para mostrar estado */
    public get temPesquisaAdicionar(): boolean {
        return this.usernameInput.trim().length > 0;
    }
    /** Tenta adicionar um novo amigo utilizando um username */
    private async adicionarAmigoPorUsername(usernameOriginal: string) {
        let username = usernameOriginal.trim();
        if (username.startsWith('@')) username = username.substring(1);

        if (!username) {
            this.showToast('Por favor insira um username.');
            return;
        }

        const resultado = await this.utilizadorService.adicionarAmigo(this.idUtilizador, username);

        if (resultado === Resultado.EXITO) {
            await this.carregarDados();
            this.fecharModal();
            return;
        }

        switch (resultado) {
            case Resultado.NAO_ENCONTRADO:
                this.showToast('Utilizador não encontrado.');
                break;
            case Resultado.JA_EXISTE:
                this.showToast('Esse utilizador já é teu amigo.');
                break;
            case Resultado.MESMO_UTILIZADOR:
                this.showToast('Não podes adicionar a ti mesmo como amigo.');
                break;
            default:
                this.showToast('Erro desconhecido a registar amigo.');
        }
    }
    /** Exibe uma mensagem rápida no ecrã */
    async showToast(message: string) {
        const toast = await this.toastController.create({ message: message, duration: 2000 });
        toast.present();
    }
    /** Fecha o modal e limpa o campo de input */
    public fecharModal() {
        this.usernameInput = '';
        this.sugestoesAmigos = [];
        this.aPesquisarUtilizadores = false;
        this.modal.dismiss();
    }
}
