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
    public generos: string[] = [];

    public filtroAtual: FiltroEstante = 'todos';
    public termoPesquisa: string = '';
    public generoFiltro: string = '';
    public exibirFiltroGenero: boolean = false;

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

        const [livros, registosPessoais, generos] = await Promise.all([
            this.livroService.getLivros(),
            this.livroPessoalService.getLivroPessoal(this.idUtilizador),
            this.livroService.getGeneros()
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
                    avaliacao: pessoal.avaliacao,
                    generos: dadosLivro.generos
                };
            })
            .filter(item => item !== null) as LivroExibido[];
        this.generos = generos;
        this.aCarregar = false;
    }

    get livrosFiltrados(): LivroExibido[] {
        let livrosPorFiltro: LivroExibido[];
        switch (this.filtroAtual) {
            case 'porLer':
                livrosPorFiltro = this.livrosExibicao.filter(livro => !livro.lido);
                break;
            case 'lidos':
                livrosPorFiltro = this.livrosExibicao.filter(livro => livro.lido);
                break;
            case 'emprestados':
                livrosPorFiltro = this.livrosExibicao.filter(livro => livro.emprestado);
                break;
            default:
                livrosPorFiltro = this.livrosExibicao;
        }

        const termo = this.termoPesquisa.toLowerCase().trim();

        return livrosPorFiltro.filter(livro =>
            (
                termo === '' ||
                livro.titulo.toLowerCase().includes(termo) ||
                livro.autor.toLowerCase().includes(termo)
            ) &&
            (
                this.generoFiltro === '' || 
                (livro.generos && livro.generos.includes(this.generoFiltro))
            )
        );
    }

    alterarFiltro(event: any) {
        this.filtroAtual = event.detail.value as FiltroEstante;
    }

    filtrarLivros(event: any) {
        this.termoPesquisa = event?.target?.value ?? event?.detail?.value ?? '';
    }

    get mensagemVazio(): string {
        if (this.termoPesquisa.trim() !== '') {
            return 'Nenhum livro corresponde à pesquisa.';
        }

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
