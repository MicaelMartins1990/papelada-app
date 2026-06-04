import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { LivroPessoalService } from '../services/livro-pessoal';
import { LivroService } from '../services/livro';
import { UtilizadorService } from '../services/utilizador';

type Urgencia = 'atrasado' | 'hoje' | 'aTempo';

interface EmprestimoAtivo {
    idLivro: number;
    titulo: string;
    autor: string;
    capa: string;
    idRecipiente: number;
    nomeRecipiente: string;
    recipienteConhecido: boolean;
    dataEmprestimo: Date;
    dataDevolucao: Date;
    urgencia: Urgencia;
}

@Component({
    selector: 'app-emprestimos',
    templateUrl: './emprestimos.page.html',
    styleUrls: ['./emprestimos.page.scss'],
    standalone: false
})
export class EmprestimosPage implements OnInit {

    public idUtilizador!: number;
    public aCarregar: boolean = true;

    // Lista de empréstimos ativos
    public emprestimosAtivos: EmprestimoAtivo[] = [];
    public emprestimosFiltrados: EmprestimoAtivo[] = [];
    public termoPesquisa: string = '';

    // Estado do modal de registo (o formulário vive no componente partilhado)
    public modalRegistoAberto: boolean = false;

    constructor(
        private router: Router,
        private authService: AuthService,
        private livroPessoalService: LivroPessoalService,
        private livroService: LivroService,
        private utilizadorService: UtilizadorService
    ) { }
    /** Inicializa a página carregando os dados do utilizador e os seus empréstimos ativos */
    async ngOnInit() {
        await this.inicializar();
    }
    /** Atualiza os dados sempre que o utilizador entra na página */
    async ionViewWillEnter() {
        await this.inicializar();
    }
    /** Configura o ID do utilizador e inicia o carregamento dos empréstimos */
    private async inicializar() {
        this.aCarregar = true;
        await this.authService.esperarPronto();
        const id = this.authService.getIdUtilizador();
        if (id == null) {
            this.router.navigateByUrl('/');
            return;
        }
        this.idUtilizador = id;
        await this.carregarDados();
        this.aCarregar = false;
    }
    /** Pesquisa a lista de empréstimos e associa os detalhes dos livros e dos recipientes */
    private async carregarDados() {
        const [registos, livros] = await Promise.all([
            this.livroPessoalService.getLivrosPessoais(this.idUtilizador),
            this.livroService.getLivros()
        ]);

        const livrosPorId = new Map(livros.map(livro => [livro.id, livro]));

        // Empréstimos ativos: registos com empréstimo associado
        const ativos = registos.filter(registo => registo.emprestimo !== null);
        const idsRecipientes = Array.from(new Set(ativos.map(registo => registo.emprestimo!.idRecipiente)));
        const recipientes = await this.utilizadorService.getDadosUtilizadores(idsRecipientes);
        const recipientePorId = new Map(recipientes.map(utilizador => [utilizador.id, utilizador]));

        this.emprestimosAtivos = ativos.map(registo => {
            const emprestimo = registo.emprestimo!;
            const livro = livrosPorId.get(registo.idLivro);
            const recipiente = recipientePorId.get(emprestimo.idRecipiente) || null;
            const dataDevolucao = new Date(emprestimo.dataDevolucao);

            return {
                idLivro: registo.idLivro,
                titulo: livro?.titulo ?? 'Livro desconhecido',
                autor: livro?.autor ?? '',
                capa: livro?.capa ?? '',
                idRecipiente: emprestimo.idRecipiente,
                nomeRecipiente: recipiente?.nome ?? 'Amigo removido',
                recipienteConhecido: recipiente !== null,
                dataEmprestimo: new Date(emprestimo.dataEmprestimo),
                dataDevolucao: dataDevolucao,
                urgencia: this.calcularUrgencia(dataDevolucao)
            };
        });
        this.aplicarPesquisa();
    }

    // --- Pesquisa na lista de ativos ---
    /** Atualiza o termo de pesquisa e filtra a lista de empréstimos */
    public pesquisar(event: any) {
        this.termoPesquisa = event?.target?.value ?? '';
        this.aplicarPesquisa();
    }
    /** Filtra os empréstimos pelo título do livro ou nome do recipiente */
    private aplicarPesquisa() {
        const termo = this.termoPesquisa.toLowerCase().trim();
        this.emprestimosFiltrados = termo === ''
            ? [...this.emprestimosAtivos]
            : this.emprestimosAtivos.filter(emprestimo =>
                emprestimo.titulo.toLowerCase().includes(termo) ||
                emprestimo.nomeRecipiente.toLowerCase().includes(termo));
    }

    // --- Navegação ---
    /** Abre a página de detalhes de um empréstimo específico */
    public abrirDetalhe(idLivro: number) {
        this.router.navigate(['/tabs/emprestimos/detalhe', idLivro]);
    }
    /** Abre a página de detalhes de um amigo (se ele ainda existir no sistema) */
    public abrirAmigo(event: Event, idAmigo: number, conhecido: boolean) {
        event.stopPropagation();
        if (!conhecido) return;
        this.router.navigate(['/tabs/amigos/detalhe', idAmigo]);
    }

    // --- Modal de registo (formulário no componente partilhado) ---
    /** Abre o modal para registar um novo empréstimo */
    public abrirRegisto() {
        this.modalRegistoAberto = true;
    }
    /** Fecha o modal de registo de empréstimo */
    public fecharRegisto() {
        this.modalRegistoAberto = false;
    }
    /** Fecha o modal e atualiza a lista após um novo empréstimo ser registado */
    public async onEmprestimoRegistado() {
        this.modalRegistoAberto = false;
        await this.carregarDados();
    }

    /** Define o nível de urgência do empréstimo baseando-se na data de devolução */
    private calcularUrgencia(dataDevolucao: Date): Urgencia {
        const hoje = this.inicioDoDia(new Date());
        const devolucao = this.inicioDoDia(dataDevolucao);
        if (devolucao.getTime() < hoje.getTime()) return 'atrasado';
        if (devolucao.getTime() === hoje.getTime()) return 'hoje';
        return 'aTempo';
    }
    /** Normaliza uma data para o início do dia (00:00:00) */
    private inicioDoDia(data: Date): Date {
        const copia = new Date(data);
        copia.setHours(0, 0, 0, 0);
        return copia;
    }

    /** Formata uma data no formato DD/MM/YYYY */
    public formatarData(data: Date): string {
        const d = new Date(data);
        const dia = String(d.getDate()).padStart(2, '0');
        const mes = String(d.getMonth() + 1).padStart(2, '0');
        return `${dia}/${mes}/${d.getFullYear()}`;
    }
    /** Retorna o texto descritivo para o nível de urgência */
    public textoUrgencia(urgencia: Urgencia): string {
        switch (urgencia) {
            case 'atrasado': return 'Atrasado';
            case 'hoje': return 'Entrega hoje';
            default: return 'Ativo';
        }
    }
}
