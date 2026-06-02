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

    constructor(
        private utilizadorService: UtilizadorService,
        private authService: AuthService,
        private router: Router,
        private toastController: ToastController
    ) {}

    async ngOnInit() {
        await this.carregarUtilizador();
        await this.carregarDados();
    }

    async ionViewWillEnter() {
        await this.carregarUtilizador();
        await this.carregarDados();
    }

    private async carregarUtilizador() {
        await this.authService.esperarPronto();
        const id = this.authService.getIdUtilizador();
        if (id == null) {
            this.router.navigateByUrl('/');
            return;
        }
        this.idUtilizador = id;
    }

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

    public filtrarAmigos(event: any) {
        const texto = event.target.value ? event.target.value.toLowerCase().trim() : '';
        if (texto === '') {
            this.amigosFiltrados = this.amigos;
        } else {
            this.amigosFiltrados = this.amigos.filter(amigo =>
                amigo.nome.toLowerCase().includes(texto)
            );
        }
    }

    public async adicionarAmigo() {
        let username = this.usernameInput.trim();
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

    async showToast(message: string) {
        const toast = await this.toastController.create({ message: message, duration: 2000 });
        toast.present();
    }

    public fecharModal() {
        this.usernameInput = '';
        this.modal.dismiss();
    }
}