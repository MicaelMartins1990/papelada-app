import { Component, OnInit } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { LivroService } from '../services/livro';
import { LivroPessoalService } from '../services/livro-pessoal';
import { AuthService } from '../services/auth';
import { Router } from '@angular/router';
import { Livro } from '../models/livro';
import { LivroStatus } from '../enums/livro-status';

@Component({
    selector: 'app-pesquisa',
    templateUrl: './pesquisa.page.html',
    styleUrls: ['./pesquisa.page.scss'],
    standalone: false
})

export class PesquisaPage implements OnInit {
    public livros: Livro[] = [];
    public livrosFiltrados: Livro[] = [];
    public aCarregar: boolean = true;

    public idUtilizador!: number;

    public livrosStatus: Map<number, LivroStatus> = new Map();
    public LivroStatus = LivroStatus;

    constructor(
        private livroService: LivroService,
        private livroPessoalService: LivroPessoalService,
        private authService: AuthService,
        private router: Router,
        private alertController: AlertController
    ) {
    }

    async ngOnInit() {
        await this.carregarUtilizador();
        await this.carregarDados();
    }

    async ionViewWillEnter() {
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

        const [livros, livrosPessoais] = await Promise.all([
            this.livroService.getLivros(),
            this.livroPessoalService.getLivroPessoal(this.idUtilizador)
        ]);

        this.livros = livros;
        this.livrosFiltrados = [...this.livros];

        this.livrosStatus.clear();
        for (const registo of livrosPessoais) {
            this.livrosStatus.set(registo.idLivro, registo.status);
        }

        this.aCarregar = false;
    }

    public filtrarLivros(event: any) {
        const texto = event.target.value ? event.target.value.toLowerCase().trim() : '';

        if (texto === '') {
            this.livrosFiltrados = this.livros;
        } else {
            this.livrosFiltrados = this.livros.filter(livro =>
                livro.titulo.toLowerCase().includes(texto) ||
                livro.autor.toLowerCase().includes(texto)
            );
        }
    }

    public obterStatus(livroId: number): LivroStatus {
        return this.livrosStatus.get(livroId) ?? LivroStatus.NAO_POSSUIDO;
    }

    public async adicionarAListaDeDesejos(livroId: number) {
        await this.livroPessoalService.atualizarStatus(this.idUtilizador, livroId, LivroStatus.DESEJADO);
        await this.carregarDados();
        alert('Livro adicionado à tua Lista de Desejos!');
    }

    public async registarLivro() {
        const alertPrompt = await this.alertController.create({
            header: 'Registar Novo Livro',
            inputs: [
                { name: 'titulo', type: 'text', placeholder: 'Título do Livro' },
                { name: 'autor', type: 'text', placeholder: 'Autor' }
            ],
            buttons: [
                { text: 'Cancelar', role: 'cancel' },
                {
                    text: 'Registar',
                    handler: async (dados) => {
                        if (dados.titulo && dados.autor) {
                            await this.livroService.registarLivro(dados.titulo, dados.autor);
                            await this.carregarDados();
                        }
                    }
                }
            ]
        });

        await alertPrompt.present();
    }
}