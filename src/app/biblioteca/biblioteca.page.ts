import { Component, OnInit } from '@angular/core';
import { LivroService } from '../services/livro';
import { LivroPessoalService } from '../services/livro-pessoal';
import { Posse } from '../enums/posse';
import { LivroExibido } from '../models/livro-exibido';
import { AuthService } from '../services/auth';
import { Router } from '@angular/router';

type FiltroEstante = 'todos' | 'porLer' | 'lidos' | 'emprestados';

@Component({
    selector: 'app-biblioteca',
    templateUrl: './biblioteca.page.html',
    styleUrls: ['./biblioteca.page.scss'],
    standalone: false
})

export class BibliotecaPage implements OnInit {
    public livrosExibicao: LivroExibido[] = [];
    public filtroAtual: FiltroEstante = 'todos';
    public aCarregar: boolean = true;

    public idUtilizador!: number;

    constructor(
        private livroService: LivroService,
        private livroPessoalService: LivroPessoalService,
        private authService: AuthService,
        private router: Router
    ) {
    }

    async ngOnInit() {
        await this.carregarUtilizador();
        await this.carregarLivrosPessoais();
    }

    async ionViewWillEnter() {
        await this.carregarUtilizador();
        await this.carregarLivrosPessoais();
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

    async carregarLivrosPessoais() {
        this.aCarregar = true;

        const [livros, registosPessoais] = await Promise.all([
            this.livroService.getLivros(),
            this.livroPessoalService.getLivroPessoal(this.idUtilizador)
        ]);

        // A Estante mostra apenas livros possuídos (na biblioteca).
        this.livrosExibicao = registosPessoais
            .filter(pessoal => pessoal.posse === Posse.NA_BIBLIOTECA)
            .map(pessoal => {
                const dadosLivro = livros.find(livro => livro.id === pessoal.idLivro);
                if (!dadosLivro) return null;

                return {
                    id: dadosLivro.id,
                    titulo: dadosLivro.titulo,
                    autor: dadosLivro.autor,
                    capa: dadosLivro.capa,
                    posse: pessoal.posse,
                    lido: pessoal.lido,
                    emprestado: pessoal.emprestimo !== null,
                    avaliacao: pessoal.avaliacao
                };
            })
            .filter(item => item !== null) as LivroExibido[];

        this.aCarregar = false;
    }

    get livrosFiltrados(): LivroExibido[] {
        switch (this.filtroAtual) {
            case 'porLer':
                return this.livrosExibicao.filter(livro => !livro.lido);
            case 'lidos':
                return this.livrosExibicao.filter(livro => livro.lido);
            case 'emprestados':
                return this.livrosExibicao.filter(livro => livro.emprestado);
            default:
                return this.livrosExibicao;
        }
    }

    alterarFiltro(event: any) {
        this.filtroAtual = event.detail.value as FiltroEstante;
    }

    get mensagemVazio(): string {
        switch (this.filtroAtual) {
            case 'porLer':
                return 'Não tens livros por ler na tua estante.';
            case 'lidos':
                return 'Ainda não marcaste livros da estante como lidos.';
            case 'emprestados':
                return 'Não tens livros emprestados neste momento.';
            default:
                return 'Ainda não tens livros na tua estante.';
        }
    }
}
