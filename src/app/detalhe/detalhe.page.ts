import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { LivroService } from '../services/livro';
import { LivroPessoalService } from '../services/livro-pessoal';
import { Livro } from '../models/livro';
import { AuthService } from '../services/auth';
import { LivroStatus } from '../enums/livro-status';
import { LivroPessoal } from '../models/livro-pessoal';

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
    public mensagemErroAvaliacao: string = '';
    public aCarregar: boolean = true;
    public estrelas = [1, 2, 3, 4, 5];

    public idUtilizador!: number;

    constructor(
        private route: ActivatedRoute,
        private livroService: LivroService,
        private livroPessoalService: LivroPessoalService,
        private authService: AuthService,
        private router: Router,
        private toastController: ToastController
    ) {
    }

    async ngOnInit() {
        const idParam = this.route.snapshot.paramMap.get('id');

        if (idParam) {
            const idLivro = Number(idParam);
            
            await this.carregarUtilizador();
            const livros = await this.livroService.getLivros();
            const livro = livros.find(l => l.id === idLivro);

            if (livro) {
                this.livro = livro;
                await this.carregarAvaliacoes();
            }
        }

        this.aCarregar = false;
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

    public abrirAvaliacao() {
        if (!this.livro) {
            return;
        }

        this.router.navigate(['/comentarios', this.livro.id], {
            queryParams: { abrirModal: '1' }
        });
    }

    async marcarComoLido() {
        if (!this.livro) {
            return;
        }

        await this.livroPessoalService.atualizarStatus(this.idUtilizador, this.livro.id, LivroStatus.LIDO);
        await this.mostrarToast('Livro marcado como lido.');
    }

    async adicionarAListaDeDesejos() {
        if (!this.livro) {
            return;
        }

        await this.livroPessoalService.atualizarStatus(this.idUtilizador, this.livro.id, LivroStatus.DESEJADO);
        await this.mostrarToast('Livro adicionado à lista de desejos.');
    }

    async removerDaBiblioteca() {
        if (!this.livro) {
            return;
        }

        await this.livroPessoalService.atualizarStatus(this.idUtilizador, this.livro.id, LivroStatus.NAO_POSSUIDO);
        await this.mostrarToast('Livro removido da biblioteca.');
    }

    public irParaEmprestimos() {
        this.router.navigateByUrl('/tabs/emprestimos');
    }

    public abrirComentarios() {
        if (this.livro) {
            this.router.navigate(['/comentarios', this.livro.id]);
        }
    }

    private async carregarAvaliacoes() {
        if (!this.livro) {
            return;
        }

        const avaliacoesLivro = await this.livroPessoalService.getAvaliacoesLivro(this.livro.id);
        this.calcularResumoGlobal(avaliacoesLivro);
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
        this.distribuicaoAvaliacoes = this.estrelas.map(estrelas => ({
            estrelas,
            total: avaliacoesValidas.filter(avaliacao => avaliacao === estrelas).length
        }));
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
}
