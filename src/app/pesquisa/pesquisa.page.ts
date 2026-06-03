import { Component, OnInit, ViewChild } from '@angular/core';
import { AlertController, ToastController, IonModal } from '@ionic/angular';
import { LivroService } from '../services/livro';
import { LivroPessoalService } from '../services/livro-pessoal';
import { AuthService } from '../services/auth';
import { ActivatedRoute, Router } from '@angular/router';
import { Livro } from '../models/livro';
import { Posse } from '../enums/posse';

type FiltroDescobrir = 'todos' | 'desejos';

@Component({
    selector: 'app-pesquisa',
    templateUrl: './pesquisa.page.html',
    styleUrls: ['./pesquisa.page.scss'],
    standalone: false
})
export class PesquisaPage implements OnInit {
    @ViewChild('modalRegisto') modal!: IonModal;

    public livros: Livro[] = [];
    public generos: string[] = [];

    public aCarregar: boolean = true;

    public termoPesquisa: string = '';
    public filtroAtual: FiltroDescobrir = 'todos';
    public generoFiltro: string = '';
    public exibirFiltroGenero: boolean = false;

    public idUtilizador!: number;
    
    public livrosPosse: Map<number, Posse> = new Map();
    public Posse = Posse;

    constructor(
        private livroService: LivroService,
        private livroPessoalService: LivroPessoalService,
        private authService: AuthService,
        private router: Router,
        private route: ActivatedRoute,
        private alertController: AlertController,
        private toastController: ToastController
    ) {}

    async ngOnInit() {
        this.aplicarFiltroDaRota();
        await this.carregarUtilizador();
        await this.carregarDados();
    }

    async ionViewWillEnter() {
        this.aplicarFiltroDaRota();
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
        const [livros, livrosPessoais, generos] = await Promise.all([
            this.livroService.getLivros(),
            this.livroPessoalService.getLivroPessoal(this.idUtilizador),
            this.livroService.getGeneros()
        ]);
        this.livros = livros;
        this.generos = generos;
        this.livrosPosse.clear();
        for (const registo of livrosPessoais) {
            this.livrosPosse.set(registo.idLivro, registo.posse);
        }
        this.aCarregar = false;
    }

    public get livrosFiltrados(): Livro[] {
        const texto = this.termoPesquisa.toLowerCase().trim();
        return this.livros.filter(livro => {
            const correspondeTexto = texto === '' ||
                livro.titulo.toLowerCase().includes(texto) ||
                livro.autor.toLowerCase().includes(texto);
            const correspondeFiltro = this.filtroAtual === 'todos' ||
                this.obterPosse(livro.id) === Posse.DESEJADO;
            const correspondeGenero = this.generoFiltro === '' || 
                (livro.generos && livro.generos.includes(this.generoFiltro));
            return correspondeTexto && correspondeFiltro && correspondeGenero;
        });
    }

    public filtrarLivros(event: any) {
        this.termoPesquisa = event?.target?.value ?? '';
    }

    public alterarFiltro(event: any) {
        this.filtroAtual = event.detail.value as FiltroDescobrir;
    }

    private aplicarFiltroDaRota() {
        const filtro = this.route.snapshot.queryParamMap.get('filtro');
        this.filtroAtual = filtro === 'desejos' ? 'desejos' : this.filtroAtual;
    }

    public obterPosse(livroId: number): Posse {
        return this.livrosPosse.get(livroId) ?? Posse.NENHUMA;
    }

    public abrirDetalhe(livroId: number) {
        this.router.navigate(['/tabs/livro/detalhe', livroId]);
    }

    public async livroRegistado() {
        await this.carregarDados();
        this.fecharModalRegisto();
    }

    public fecharModalRegisto() {
        this.modal.dismiss();
    }

    private async mostrarToast(mensagem: string) {
        const toast = await this.toastController.create({
            message: mensagem,
            duration: 1800,
            color: 'success',
            icon: 'checkmark-circle-outline'
        });
        await toast.present();
    }

    public async alternarListaDeDesejos(event: Event, livroId: number) {
        event.stopPropagation();
        const posseAtual = this.obterPosse(livroId);
        const novaPosse = posseAtual === Posse.DESEJADO ? Posse.NENHUMA : Posse.DESEJADO;

        if (posseAtual === Posse.DESEJADO) {
            const confirmado = await this.confirmarRemoverDosDesejos();
            if (!confirmado) return;
        }

        await this.livroPessoalService.definirPosse(this.idUtilizador, livroId, novaPosse);
        await this.carregarDados();
        await this.mostrarToast(novaPosse === Posse.DESEJADO ? 'Livro adicionado aos desejos.' : 'Livro removido dos desejos.');
    }

    public labelMarcador(livroId: number): string {
        return this.obterPosse(livroId) === Posse.DESEJADO ? 'Remover dos desejos' : 'Adicionar aos desejos';
    }

    private async confirmarRemoverDosDesejos(): Promise<boolean> {
        const alerta = await this.alertController.create({
            header: 'Remover dos desejos?',
            message: 'O livro deixa de aparecer na tua lista de desejos.',
            buttons: [
                { text: 'Cancelar', role: 'cancel' },
                { text: 'Remover', role: 'destructive' }
            ]
        });
        await alerta.present();
        const resultado = await alerta.onDidDismiss();
        return resultado.role === 'destructive';
    }
}
