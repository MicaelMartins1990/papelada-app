import { Component, OnInit, ViewChild } from '@angular/core';
import { AlertController, ToastController, IonModal } from '@ionic/angular';
import { LivroService } from '../services/livro';
import { LivroPessoalService } from '../services/livro-pessoal';
import { AuthService } from '../services/auth';
import { ActivatedRoute, Router } from '@angular/router';
import { Livro } from '../models/livro';
import { Posse } from '../enums/posse';
import { LivroExibido } from '../models/livro-exibido';
import { LivroPessoal } from '../models/livro-pessoal';

type FiltroDescobrir = 'todos' | 'desejos';

@Component({
    selector: 'app-pesquisa',
    templateUrl: './pesquisa.page.html',
    styleUrls: ['./pesquisa.page.scss'],
    standalone: false
})
export class PesquisaPage implements OnInit {
    @ViewChild('modalRegisto') modal!: IonModal;

    public livros: LivroExibido[] = [];
    public generos: string[] = [];
    public livrosPessoais: LivroPessoal[] = [];

    public aCarregar: boolean = true;

    public termoPesquisa: string = '';
    public filtroAtual: FiltroDescobrir = 'todos';
    public generoFiltro: string = '';
    public exibirFiltroGenero: boolean = false;

    public idUtilizador!: number;
    
    public livrosPosse: Map<number, Posse> = new Map();
    public Posse = Posse;

    public estrelas = [1, 2, 3, 4, 5];

    constructor(
        private livroService: LivroService,
        private livroPessoalService: LivroPessoalService,
        private authService: AuthService,
        private router: Router,
        private route: ActivatedRoute,
        private alertController: AlertController,
        private toastController: ToastController
    ) {}
    /** Inicializa a página, aplica filtros da rota e carrega os dados */
    async ngOnInit() {
        this.aplicarFiltroDaRota();
        await this.carregarUtilizador();
        await this.carregarDados();
    }
    /** Atualiza os dados sempre que o utilizador entra na página */
    async ionViewWillEnter() {
        this.aplicarFiltroDaRota();
        await this.carregarUtilizador();
        await this.carregarDados();
    }
    /** Obtém o ID do utilizador autenticado */
    private async carregarUtilizador() {
        await this.authService.esperarPronto();
        const id = this.authService.getIdUtilizador();
        if (id == null) {
            this.router.navigateByUrl('/');
            return;
        }
        this.idUtilizador = id;
    }
    /** Pesquisa todos os livros, géneros e registos pessoais para exibir na página */
    private async carregarDados() {
        this.aCarregar = true;
        if (this.idUtilizador == null) {
            this.router.navigateByUrl('/');
            return;
        }
        const [livros, livrosPessoais, generos] = await Promise.all([
            this.livroService.getLivros(),
            this.livroPessoalService.getLivrosPessoais(this.idUtilizador),
            this.livroService.getGeneros()
        ]);
        this.livrosPessoais = livrosPessoais;
        this.livros = await Promise.all(livros.map(async livro => await this.livroPessoalService.getDadosExibicao(livro, this.idUtilizador, livrosPessoais)));
        this.generos = generos;
        this.livrosPosse.clear();
        for (const registo of livrosPessoais) {
            this.livrosPosse.set(registo.idLivro, registo.posse);
        }
        this.aCarregar = false;
    }
    /** Retorna a lista de livros após aplicar pesquisa, filtros de categoria e estado de posse */
    public get livrosFiltrados(): LivroExibido[] {
        const texto = this.termoPesquisa.toLowerCase().trim();
        return this.livros.filter(livro => {
            const correspondeTexto = texto === '' ||
                livro.titulo.toLowerCase().includes(texto) ||
                livro.autor.toLowerCase().includes(texto);
            const correspondeFiltro = this.filtroAtual === 'todos' ||
                livro.posse === Posse.DESEJADO;
            const correspondeGenero = this.generoFiltro === '' || 
                (livro.generos && livro.generos.includes(this.generoFiltro));
            return correspondeTexto && correspondeFiltro && correspondeGenero;
        });
    }
    /** Atualiza o termo de pesquisa inserido pelo utilizador */
    public filtrarLivros(event: any) {
        this.termoPesquisa = event?.target?.value ?? '';
    }
    /** Define o filtro atual (todos ou apenas desejos) */
    public alterarFiltro(event: any) {
        this.filtroAtual = event.detail.value as FiltroDescobrir;
    }
    /** Verifica na URL se existe algum filtro para aplicar automaticamente */
    private aplicarFiltroDaRota() {
        const filtro = this.route.snapshot.queryParamMap.get('filtro');
        this.filtroAtual = filtro === 'desejos' ? 'desejos' : this.filtroAtual;
    }
    /** Retorna o estado de posse de um livro específico */
    public obterPosse(livroId: number): Posse {
        return this.livrosPosse.get(livroId) ?? Posse.NENHUMA;
    }
    /** Navega para a página de detalhes de um livro */
    public abrirDetalhe(livroId: number) {
        this.router.navigate(['/tabs/livro/detalhe', livroId]);
    }
    /** Atualiza os dados após registar um livro manualmente no modal */
    public async livroRegistado() {
        await this.carregarDados();
        this.fecharModalRegisto();
    }
    /** Fecha o modal de registo manual de livro */
    public fecharModalRegisto() {
        this.modal.dismiss();
    }
    /** Exibe uma mensagem temporária (toast) de sucesso */
    private async mostrarToast(mensagem: string) {
        const toast = await this.toastController.create({
            message: mensagem,
            duration: 1800,
            color: 'success',
            icon: 'checkmark-circle-outline'
        });
        await toast.present();
    }
    /** Alterna o estado de um livro na lista de desejos (adicionar/remover) */
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
    /** Retorna o rótulo para o botão da lista de desejos */
    public labelMarcador(livroId: number): string {
        return this.obterPosse(livroId) === Posse.DESEJADO ? 'Remover dos desejos' : 'Adicionar aos desejos';
    }
    /** Alerta de confirmação para remover um livro da lista de desejos */
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
