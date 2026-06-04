import { Component, OnInit, ViewChild } from '@angular/core';
import { IonModal } from '@ionic/angular';
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
    @ViewChild('modalAdicionarLivro') modalAdicionarLivro!: IonModal;
    @ViewChild('modalRegistoLivro') modalRegistoLivro!: IonModal;

    public livrosExibicao: LivroExibido[] = [];
    public generos: string[] = [];

    public filtroAtual: FiltroEstante = 'todos';
    public termoPesquisa: string = '';
    public generoFiltro: string = '';
    public exibirFiltroGenero: boolean = false;

    public aCarregar: boolean = true;

    public idUtilizador!: number;

    public estrelas = [1,2,3,4,5];

    constructor(
        private livroService: LivroService,
        private livroPessoalService: LivroPessoalService,
        private authService: AuthService,
        private router: Router
    ) {
    }
    /** Inicializa a página carregando o utilizador e os seus livros pessoais */
    async ngOnInit() {
        await this.carregarUtilizador();
        await this.carregarLivrosPessoais();
    }
    /** Atualiza os dados sempre que o utilizador entra na página */
    async ionViewWillEnter() {
        await this.carregarUtilizador();
        await this.carregarLivrosPessoais();
    }
    /** Obtém o ID do utilizador atual através do serviço de autenticação */
    private async carregarUtilizador() {
        await this.authService.esperarPronto();
        const id = this.authService.getIdUtilizador();
        if (id == null) {
            this.router.navigateByUrl('/');
            return;
        }
        this.idUtilizador = id;
    }
    /** Pesquisa os livros globais e pessoais, filtrando apenas os que estão na biblioteca */
    async carregarLivrosPessoais() {
        this.aCarregar = true;

        const [livros, registosPessoais, generos] = await Promise.all([
            this.livroService.getLivros(),
            this.livroPessoalService.getLivrosPessoais(this.idUtilizador),
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
    /** Retorna a lista de livros após aplicar filtros de categoria e texto de pesquisa */
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
    /** Atualiza o filtro selecionado (todos, por ler, lidos ou emprestados) */
    alterarFiltro(event: any) {
        this.filtroAtual = event.detail.value as FiltroEstante;
    }
    /** Atualiza o termo de pesquisa de acordo com a entrada do utilizador */
    filtrarLivros(event: any) {
        this.termoPesquisa = event?.target?.value ?? event?.detail?.value ?? '';
    }
    /** Fecha o modal de adicionar livro */
    public async fecharModalAdicionarLivro() {
        await this.modalAdicionarLivro.dismiss();
    }
    /** Fecha o modal e navega para a página de pesquisa de novos livros */
    public async procurarLivros() {
        await this.fecharModalAdicionarLivro();
        await this.router.navigateByUrl('/tabs/pesquisa');
    }
    /** Fecha o modal de adicionar e abre o modal de registo manual de livro */
    public async abrirRegistoLivro() {
        await this.fecharModalAdicionarLivro();
        await this.modalRegistoLivro.present();
    }
    /** Fecha o modal de registo manual */
    public async fecharModalRegistoLivro() {
        await this.modalRegistoLivro.dismiss();
    }
    /** Atualiza a estante após o registo de um novo livro e fecha o modal */
    public async livroRegistado() {
        await this.carregarLivrosPessoais();
        await this.fecharModalRegistoLivro();
    }
    /** Devolve a mensagem apropriada quando não existem livros para exibir */
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
