import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, NavController, ToastController } from '@ionic/angular';
import { LivroService, LivroSemelhante } from '../services/livro';
import { LivroPessoalService } from '../services/livro-pessoal';
import { Livro } from '../models/livro';
import { AuthService } from '../services/auth';
import { Posse } from '../enums/posse';
import { LivroPessoal } from '../models/livro-pessoal';
import { LivroDisponivel } from '../shared/form-emprestimo/form-emprestimo.component';
import { Share } from '@capacitor/share';

@Component({
    selector: 'app-detalhe',
    templateUrl: './detalhe.page.html',
    styleUrls: ['./detalhe.page.scss'],
    standalone: false
})
export class DetalhePage implements OnInit {
    public livro: Livro | null = null;
    public avaliacaoAtual: number = 0;
    public totalAvaliacoes: number = 0;
    public mediaAvaliacoes: number = 0;
    public avaliacaoMediaArredondada: number = 0;
    public distribuicaoAvaliacoes: { estrelas: number; total: number }[] = [];
    public livrosSemelhantes: LivroSemelhante[] = [];
    public mensagemErroAvaliacao: string = '';
    public aCarregar: boolean = true;
    public erroCarregamento: boolean = false;
    public estrelas = [1, 2, 3, 4, 5];

    public idUtilizador!: number;

    // Estado pessoal do livro (três eixos independentes)
    public posse: Posse = Posse.NENHUMA;
    public lido: boolean = false;
    public temEmprestimo: boolean = false;

    public modalEmprestimoAberto: boolean = false;

    constructor(
        private route: ActivatedRoute,
        private livroService: LivroService,
        private livroPessoalService: LivroPessoalService,
        private authService: AuthService,
        private router: Router,
        private toastController: ToastController,
        private alertController: AlertController,
        private navController: NavController
    ) {
    }
    /** Inicializa a página, carrega os dados do livro, estado pessoal e recomendações */
    async ngOnInit() {
        const idParam = this.route.snapshot.paramMap.get('id');

        if (idParam) {
            const idLivro = Number(idParam);

            await this.carregarUtilizador();
            const livros = await this.livroService.getLivros();
            const livro = livros.find(l => l.id === idLivro);

            if (livro) {
                this.livro = livro;
                await this.carregarEstadoPessoal();
                await this.carregarAvaliacoes();
                await this.carregarSemelhantes();
            } else {
                this.erroCarregamento = true;
            }
        } else {
            this.erroCarregamento = true;
        }

        this.aCarregar = false;
    }
    /** Atualiza o estado pessoal do livro ao retornar à página */
    async ionViewWillEnter() {
        if (this.livro && this.idUtilizador != null) {
            await this.carregarEstadoPessoal();
        }
    }
    /** Obtém o ID do utilizador atual */
    private async carregarUtilizador() {
        await this.authService.esperarPronto();
        const id = this.authService.getIdUtilizador();
        if (id == null) {
            this.router.navigateByUrl('/');
            return;
        }
        this.idUtilizador = id;
    }
    /** Carrega o estado de posse, leitura e empréstimo do livro para o utilizador */
    private async carregarEstadoPessoal() {
        if (!this.livro) {
            return;
        }
        const registos = await this.livroPessoalService.getLivrosPessoais(this.idUtilizador);
        const registo = registos.find(r => r.idLivro === this.livro!.id);
        this.posse = registo?.posse ?? Posse.NENHUMA;
        this.lido = registo?.lido ?? false;
        this.temEmprestimo = !!registo?.emprestimo;
        // Dica permanente enquanto o livro não está lido: avaliar fica bloqueado.
        this.mensagemErroAvaliacao = this.lido ? '' : 'Marca o livro como lido para o avaliares.';
    }

    public voltar() {
        this.navController.back();
    }

    // --- Estado derivado para o template ---

    public get estaNaBiblioteca(): boolean {
        return this.posse === Posse.NA_BIBLIOTECA;
    }

    public get estaNosDesejos(): boolean {
        return this.posse === Posse.DESEJADO;
    }

    public get livroFixoEmprestimo(): LivroDisponivel | null {
        return this.livro
            ? { id: this.livro.id, titulo: this.livro.titulo, autor: this.livro.autor, capa: this.livro.capa }
            : null;
    }

    // --- Ação: biblioteca (toggle de posse) ---
    /** Adiciona o livro à biblioteca pessoal do utilizador */
    async adicionarABiblioteca() {
        if (!this.livro) {
            return;
        }
        await this.livroPessoalService.definirPosse(this.idUtilizador, this.livro.id, Posse.NA_BIBLIOTECA);
        await this.carregarEstadoPessoal();
        await this.mostrarToast('Livro adicionado à biblioteca.');
    }
    /** Remove o livro da biblioteca pessoal, após validação */
    async removerDaBiblioteca() {
        if (!this.livro) {
            return;
        }
        if (this.temEmprestimo) {
            await this.avisarEmprestimoAtivo();
            return;
        }
        const confirmado = await this.confirmarAcao(
            'Remover da biblioteca?',
            'O livro sai da tua biblioteca, mas o estado de leitura e a avaliação ficam guardados.',
            'Remover'
        );
        if (!confirmado) {
            return;
        }
        // Remover só mexe na posse: mantém o estado de leitura e a avaliação.
        await this.livroPessoalService.definirPosse(this.idUtilizador, this.livro.id, Posse.NENHUMA);
        await this.carregarEstadoPessoal();
        await this.mostrarToast('Livro removido da biblioteca.');
    }
    /** Exibe um alerta informando que o livro não pode ser removido pois está emprestado */
    private async avisarEmprestimoAtivo() {
        const alerta = await this.alertController.create({
            header: 'Livro emprestado',
            message: 'Este livro está emprestado. Conclui o empréstimo antes de o removeres da biblioteca.',
            buttons: ['Entendido']
        });
        await alerta.present();
    }

    // --- Ação: leitura (toggle independente) ---
    /** Atualiza o estado do livro para lido */
    async marcarComoLido() {
        if (!this.livro) {
            return;
        }
        await this.livroPessoalService.definirLido(this.idUtilizador, this.livro.id, true);
        await this.carregarEstadoPessoal();
        await this.mostrarToast('Livro marcado como lido.');
    }
    /** Atualiza o estado do livro para não lido */
    async marcarComoNaoLido() {
        if (!this.livro) {
            return;
        }
        await this.livroPessoalService.definirLido(this.idUtilizador, this.livro.id, false);
        await this.carregarEstadoPessoal();
        await this.mostrarToast('Livro marcado como não lido.');
    }

    // --- Ação: desejos (toggle, só quando não está na biblioteca) ---
    /** Adiciona o livro à lista de desejos do utilizador */
    async adicionarAListaDeDesejos() {
        if (!this.livro) {
            return;
        }
        await this.livroPessoalService.definirPosse(this.idUtilizador, this.livro.id, Posse.DESEJADO);
        await this.carregarEstadoPessoal();
        await this.mostrarToast('Livro adicionado à lista de desejos.');
    }
    /** Remove o livro da lista de desejos, após confirmação */
    async removerDaListaDeDesejos() {
        if (!this.livro) {
            return;
        }
        const confirmado = await this.confirmarAcao(
            'Remover dos desejos?',
            'O livro deixa de aparecer na tua lista de desejos.',
            'Remover'
        );
        if (!confirmado) {
            return;
        }
        await this.livroPessoalService.definirPosse(this.idUtilizador, this.livro.id, Posse.NENHUMA);
        await this.carregarEstadoPessoal();
        await this.mostrarToast('Livro removido da lista de desejos.');
    }

    // --- Ação: empréstimo ---
    /** Abre o modal para registar um empréstimo do livro */
    public abrirEmprestimo() {
        if (!this.estaNaBiblioteca || this.temEmprestimo) {
            return;
        }
        this.modalEmprestimoAberto = true;
    }
    /** Fecha o modal de empréstimo */
    public fecharEmprestimo() {
        this.modalEmprestimoAberto = false;
    }
    /** Atualiza o estado pessoal após um empréstimo ser registado com sucesso */
    public async onEmprestimoRegistado() {
        this.modalEmprestimoAberto = false;
        await this.carregarEstadoPessoal();
    }
    /** Navega para a página de detalhes de um empréstimo específico */
    public verEmprestimo() {
        if (this.livro) {
            this.router.navigate(['/tabs/emprestimos/detalhe', this.livro.id]);
        }
    }

    // --- Avaliações ---
    /** Navega para a página de comentários para o utilizador avaliar o livro */
    public abrirAvaliacao() {
        if (!this.livro) {
            return;
        }

        // Avaliar só é possível depois de o livro estar marcado como lido.
        if (!this.lido) {
            this.mensagemErroAvaliacao = 'Marca o livro como lido para o avaliares.';
            return;
        }

        this.router.navigate(['/tabs/livro/comentarios', this.livro.id], {
            queryParams: { abrirModal: '1' }
        });
    }
    /** Navega para a página que lista todos os comentários do livro */
    public abrirComentarios() {
        if (this.livro) {
            this.router.navigate(['/tabs/livro/comentarios', this.livro.id]);
        }
    }

    // --- Livros semelhantes (recomendação por género) ---
    /** Carrega livros semelhantes com base nos géneros literários */
    private async carregarSemelhantes() {
        if (!this.livro) {
            return;
        }
        const registos = await this.livroPessoalService.getLivrosPessoais(this.idUtilizador);
        this.livrosSemelhantes = await this.livroService.getLivrosSemelhantes(this.livro, registos);
    }
    /** Navega para a página de detalhes de outro livro ao clicar numa recomendação */
    public abrirLivro(id: number) {
        this.router.navigate(['/tabs/livro/detalhe', id]);
    }
    /** pesquisa as avaliações existentes para o livro atual */
    private async carregarAvaliacoes() {
        if (!this.livro) {
            return;
        }

        const avaliacoesLivro = await this.livroPessoalService.getAvaliacoesLivro(this.livro.id);
        this.calcularResumoGlobal(avaliacoesLivro);
    }
    /** Calcula a média, total e a distribuição de estrelas das avaliações do livro */
    private calcularResumoGlobal(avaliacoesLivro: LivroPessoal[]) {
        const avaliacoesValidas = avaliacoesLivro
            .map(registo => registo.avaliacao)
            .filter((avaliacao): avaliacao is number => avaliacao !== null && avaliacao > 0);

        this.totalAvaliacoes = avaliacoesValidas.length;
        this.mediaAvaliacoes = this.totalAvaliacoes === 0
            ? 0
            : avaliacoesValidas.reduce((total, avaliacao) => total + avaliacao, 0) / this.totalAvaliacoes;
        this.avaliacaoMediaArredondada = Math.round(this.mediaAvaliacoes);
        this.distribuicaoAvaliacoes = this.estrelas.map(estrelas => ({
            estrelas,
            total: avaliacoesValidas.filter(avaliacao => avaliacao === estrelas).length
        }));
    }
    /** Exibe uma mensagem de confirmação temporária */
    private async mostrarToast(mensagem: string) {
        const toast = await this.toastController.create({
            message: mensagem,
            duration: 1800,
            color: 'success',
            icon: 'checkmark-circle-outline'
        });
        await toast.present();
    }
    /** Exibe um alerta de confirmação para ações destrutivas (ex: remover livro) */
    private async confirmarAcao(header: string, message: string, confirmText: string): Promise<boolean> {
        const alerta = await this.alertController.create({
            header,
            message,
            buttons: [
                { text: 'Cancelar', role: 'cancel' },
                { text: confirmText, role: 'destructive' }
            ]
        });
        await alerta.present();
        const resultado = await alerta.onDidDismiss();
        return resultado.role === 'destructive';
    }

    // --- Compartilhamento por e-mail ---
    /** Abre o menu nativo do dispositivo para compartilhar o livro com outras pessoas */
    public async compartilharEmail() {
        if (!this.livro) return;
        await Share.share({
            title: this.livro.titulo,
            text: `Confira o livro ${this.livro.titulo} na Papelada!\nAbra no app: papelada://tabs/livro/detalhe/${this.livro.id}`,
            dialogTitle: 'Compartilhar',
        });
    }
}
