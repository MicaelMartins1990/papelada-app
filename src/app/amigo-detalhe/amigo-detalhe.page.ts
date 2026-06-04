import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UtilizadorService } from '../services/utilizador';
import { Utilizador } from '../models/utilizador';
import { DadosLeitura } from '../models/dados-leitura';
import { AuthService } from '../services/auth';
import { Resultado } from '../enums/resultado';
import { AlertController, NavController, ToastController } from '@ionic/angular';

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
    public modalEmprestimoAberto: boolean = false;
    
    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private navController: NavController,
        private authService: AuthService,
        private utilizadorService: UtilizadorService,
        private toastController: ToastController,
        private alertController: AlertController
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
        const confirmado = await this.confirmarRemoverAmigo();
        if (!confirmado) return;

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

    private async confirmarRemoverAmigo(): Promise<boolean> {
        const alerta = await this.alertController.create({
            header: 'Remover amigo?',
            message: 'Este utilizador deixa de aparecer na tua lista de amigos.',
            buttons: [
                { text: 'Cancelar', role: 'cancel' },
                { text: 'Remover', role: 'destructive' }
            ]
        });
        await alerta.present();
        const resultado = await alerta.onDidDismiss();
        return resultado.role === 'destructive';
    }

    // --- Ação: empréstimo ---

    /** Amigo pré-fixado para o formulário de empréstimo (o amigo deste perfil). */
    public get amigoFixoEmprestimo(): Utilizador | null {
        return this.amigo;
    }

    public abrirEmprestimo() {
        this.modalEmprestimoAberto = true;
    }

    public fecharEmprestimo() {
        this.modalEmprestimoAberto = false;
    }

    public async onEmprestimoRegistado() {
        this.modalEmprestimoAberto = false;
        await this.showToast('Empréstimo registado com sucesso.');
    }
}
