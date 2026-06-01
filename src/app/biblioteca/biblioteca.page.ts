import { Component, OnInit } from '@angular/core';
import { LivroService } from '../services/livro';
import { LivroPessoalService } from '../services/livro-pessoal';
import { LivroStatus } from '../enums/livro-status';
import { LivroExibido } from '../models/livro-exibido';
import { AuthService } from '../services/auth';
import { Router } from '@angular/router';

@Component({
    selector: 'app-biblioteca',
    templateUrl: './biblioteca.page.html',
    styleUrls: ['./biblioteca.page.scss'],
    standalone: false
})

export class BibliotecaPage implements OnInit {
    public livrosExibicao: LivroExibido[] = [];
    public filtroAtual: LivroStatus = LivroStatus.DESEJADO;
    public aCarregar: boolean = true;

    public idUtilizador!: number;

    public LivroStatus = LivroStatus;

    constructor(
        private livroService: LivroService,
        private livroPessoalService: LivroPessoalService,
        private authService: AuthService,
        private router: Router
    ) {
    }

    async ngOnInit() {
        await this.carregarLivrosPessoais();
        await this.carregarUtilizador();
    }

    async ionViewWillEnter() {
        await this.carregarLivrosPessoais();
        await this.carregarUtilizador();
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

        this.livrosExibicao = registosPessoais.map(pessoal => {
            const dadosLivro = livros.find(livro => livro.id === pessoal.idLivro);
            if (!dadosLivro) return null;

            return {
                id: dadosLivro.id,
                titulo: dadosLivro.titulo,
                autor: dadosLivro.autor,
                capa: dadosLivro.capa,
                status: pessoal.status,
                avaliacao: pessoal.avaliacao
            };
        }).filter(item => item !== null) as LivroExibido[];

        this.aCarregar = false;
    }

    get livrosFiltrados() {
        return this.livrosExibicao.filter(livro => livro.status === this.filtroAtual);
    }

    alterarFiltro(event: any) {
        this.filtroAtual = Number(event.detail.value);
    }
}