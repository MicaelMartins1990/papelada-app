import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UtilizadorService } from '../services/utilizador';
import { Utilizador } from '../models/utilizador';
import { DadosLeitura } from '../models/dados-leitura';
import { AuthService } from '../services/auth';
import { Resultado } from '../enums/resultado';
import { NavController, ToastController } from '@ionic/angular';

@Component({
    selector: 'app-amigo-detalhe',
    templateUrl: './amigo-detalhe.page.html',
    styleUrls: ['./amigo-detalhe.page.scss'],
    standalone: false
})
export class AmigoDetalhePage implements OnInit {

    public idUtilizador!: number;
    public amigo: Utilizador | null = null;
    public dadosLeitura: DadosLeitura | null = null;
    
    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private navController: NavController,
        private authService: AuthService,
        private utilizadorService: UtilizadorService,
        private toastController: ToastController
    ) { 
    }

    async ngOnInit() {
        await Promise.all([
            this.carregarUtilizador(),
            this.utilizadorService.esperarPronto()
        ]);
        const idAmigo = this.route.snapshot.paramMap.get('id');
        if (!idAmigo) return;
        const idNum = parseInt(idAmigo);
        this.amigo = await this.utilizadorService.getUtilizador(idNum);
        if (!this.amigo) return;
        this.dadosLeitura = await this.utilizadorService.getDadosLeitura(idNum);
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

    public async removerAmigo() {
        if (!this.amigo) return;
        const resultado = await this.utilizadorService.removerAmigo(this.idUtilizador, this.amigo.id);

        if (resultado === Resultado.EXITO) {
            this.navController.back();
        }

        switch (resultado) {
            case Resultado.NAO_ENCONTRADO:
                this.showToast('Utilizador não encontrado.');
                break;
            default:
                this.showToast('Erro desconhecido ao remover amigo.');
        }
    }

    async showToast(message: string) {
        const toast = await this.toastController.create({ message: message, duration: 2000 });
        toast.present();
    }
}
