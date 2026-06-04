import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, NavController, ToastController } from '@ionic/angular';
import { Livro } from '../models/livro';
import { LivroPessoal } from '../models/livro-pessoal';
import { AuthService } from '../services/auth';
import { LivroService } from '../services/livro';
import { LivroPessoalService } from '../services/livro-pessoal';

interface ComentarioComunidade {
    nome: string;
    avaliacao: number;
    comentario: string;
    dataAvaliacao: string | null;
    dataLegivel: string;
    pertenceAoUtilizadorAtual: boolean;
}

@Component({
    selector: 'app-comentarios',
    templateUrl: './comentarios.page.html',
    styleUrls: ['./comentarios.page.scss'],
    standalone: false
})
export class ComentariosPage implements OnInit {
    public idLivro!: number;
    public idUtilizador!: number;
    public livro: Livro | null = null;
    public avaliacaoPessoal: LivroPessoal | null = null;
    public comentariosComunidade: ComentarioComunidade[] = [];
    public avaliacaoAtual = 0;
    public comentarioAtual = '';
    public mensagemErro = '';
    public modalAberto = false;
    public aCarregar = true;
    public totalAvaliacoes = 0;
    public mediaAvaliacoes = 0;
    public avaliacaoMediaArredondada = 0;
    public estrelas = [1, 2, 3, 4, 5];

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private authService: AuthService,
        private livroService: LivroService,
        private livroPessoalService: LivroPessoalService,
        private toastController: ToastController,
        private alertController: AlertController,
        private navController: NavController
    ) { }

    async ngOnInit() {
        const idParam = this.route.snapshot.paramMap.get('id');

        if (!idParam) {
            this.router.navigateByUrl('/tabs/biblioteca');
            return;
        }

        this.idLivro = Number(idParam);
        await this.carregarUtilizador();
        await this.carregarPagina();
        this.aCarregar = false;

        if (this.deveAbrirModalAutomaticamente()) {
            await this.abrirModalComentario();
        }
    }

    public voltarDetalhe() {
        this.router.navigateByUrl(`/tabs/livro/detalhe/${this.idLivro}`);
    }

    public setAvaliacao(nota: number) {
        this.avaliacaoAtual = nota;
        this.mensagemErro = '';
    }

    public async abrirModalComentario() {
        this.avaliacaoAtual = this.avaliacaoPessoal?.avaliacao ?? 0;
        this.comentarioAtual = this.avaliacaoPessoal?.comentario ?? '';
        this.mensagemErro = '';
        this.modalAberto = true;
    }

    public fecharModalComentario() {
        this.modalAberto = false;
        this.mensagemErro = '';
    }

    public async guardarComentario() {
        if (this.avaliacaoAtual < 1) {
            this.mensagemErro = 'Escolhe pelo menos 1 estrela para comentar.';
            return;
        }

        await this.livroPessoalService.adicionarAvaliacao(
            this.idUtilizador,
            this.idLivro,
            this.avaliacaoAtual,
            this.comentarioAtual
        );
        await this.livroPessoalService.definirLido(this.idUtilizador, this.idLivro, true);
        await this.carregarPagina();
        this.modalAberto = false;
        await this.mostrarToast('Avaliação guardada.');
    }

    public async apagarComentario() {
        const confirmado = await this.confirmarApagarAvaliacao();

        if (!confirmado) {
            return;
        }

        await this.livroPessoalService.apagarAvaliacao(this.idUtilizador, this.idLivro);
        this.avaliacaoAtual = 0;
        this.comentarioAtual = '';
        await this.carregarPagina();
        this.modalAberto = false;
        await this.mostrarToast('Avaliação apagada.');
    }

    public temAvaliacaoPessoal(): boolean {
        return (this.avaliacaoPessoal?.avaliacao ?? 0) > 0 || !!this.avaliacaoPessoal?.comentario?.trim();
    }

    public temComentarioPessoal(): boolean {
        return !!this.avaliacaoPessoal?.comentario?.trim();
    }

    public temAvaliacoesLivro(): boolean {
        return this.totalAvaliacoes > 0;
    }

    public temComentariosComunidade(): boolean {
        return this.comentariosComunidade.length > 0;
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

    private async carregarPagina() {
        const [livros, registosPessoais, avaliacoesLivro, utilizadores] = await Promise.all([
            this.livroService.getLivros(),
            this.livroPessoalService.getLivrosPessoais(this.idUtilizador),
            this.livroPessoalService.getAvaliacoesLivro(this.idLivro),
            this.authService.getUtilizadoresPublicos()
        ]);

        this.livro = livros.find(livro => livro.id === this.idLivro) ?? null;
        this.avaliacaoPessoal = registosPessoais.find(registo => registo.idLivro === this.idLivro) ?? null;
        this.calcularResumoGlobal(avaliacoesLivro);
        this.comentariosComunidade = avaliacoesLivro
            .filter(registo => !!registo.comentario?.trim() && (registo.avaliacao ?? 0) > 0)
            .map(registo => this.criarComentario(registo, utilizadores))
            .sort((a, b) => this.obterTimestamp(b.dataAvaliacao) - this.obterTimestamp(a.dataAvaliacao));
    }

    private calcularResumoGlobal(avaliacoesLivro: LivroPessoal[]) {
        const avaliacoesValidas = avaliacoesLivro
            .map(registo => registo.avaliacao)
            .filter((avaliacao): avaliacao is number => avaliacao !== null && avaliacao > 0);

        this.totalAvaliacoes = avaliacoesValidas.length;
        this.mediaAvaliacoes = this.totalAvaliacoes === 0
            ? 0
            : avaliacoesValidas.reduce((total, avaliacao) => total + avaliacao, 0) / this.totalAvaliacoes;
        this.avaliacaoMediaArredondada = Math.round(this.mediaAvaliacoes);
    }

    private criarComentario(
        registo: LivroPessoal,
        utilizadores: { id: number; nome: string }[]
    ): ComentarioComunidade {
        const utilizador = utilizadores.find(u => u.id === registo.idUtilizador);
        const dataAvaliacao = registo.dataAvaliacao ?? null;

        return {
            nome: utilizador?.nome || 'Utilizador',
            avaliacao: registo.avaliacao || 0,
            comentario: registo.comentario?.trim() || '',
            dataAvaliacao,
            dataLegivel: this.formatarDataRelativa(dataAvaliacao),
            pertenceAoUtilizadorAtual: registo.idUtilizador === this.idUtilizador
        };
    }

    private obterTimestamp(data: string | null): number {
        if (!data) {
            return 0;
        }

        const timestamp = new Date(data).getTime();
        return Number.isNaN(timestamp) ? 0 : timestamp;
    }

    private formatarDataRelativa(data: string | null): string {
        const timestamp = this.obterTimestamp(data);

        if (timestamp === 0) {
            return 'Sem data';
        }

        const agora = new Date().getTime();
        const dias = Math.max(0, Math.floor((agora - timestamp) / (1000 * 60 * 60 * 24)));

        if (dias === 0) {
            return 'Hoje';
        }

        if (dias === 1) {
            return 'Há 1 dia';
        }

        return `Há ${dias} dias`;
    }

    private deveAbrirModalAutomaticamente(): boolean {
        return this.route.snapshot.queryParamMap.get('abrirModal') === '1';
    }

    private async confirmarApagarAvaliacao(): Promise<boolean> {
        const alerta = await this.alertController.create({
            header: 'Apagar avaliação?',
            message: 'Isto vai apagar as estrelas, o comentário e a data desta avaliação.',
            buttons: [
                {
                    text: 'Cancelar',
                    role: 'cancel'
                },
                {
                    text: 'Apagar',
                    role: 'confirm'
                }
            ]
        });

        await alerta.present();
        const resultado = await alerta.onDidDismiss();
        return resultado.role === 'confirm';
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

    public voltar() {
        this.navController.back();
    }
}
