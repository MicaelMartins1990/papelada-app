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

    async ngOnInit() {
        await this.inicializar();
    }

    async ionViewWillEnter() {
        await this.inicializar();
    }

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

    public pesquisar(event: any) {
        this.termoPesquisa = event?.target?.value ?? '';
        this.aplicarPesquisa();
    }

    private aplicarPesquisa() {
        const termo = this.termoPesquisa.toLowerCase().trim();
        this.emprestimosFiltrados = termo === ''
            ? [...this.emprestimosAtivos]
            : this.emprestimosAtivos.filter(emprestimo =>
                emprestimo.titulo.toLowerCase().includes(termo) ||
                emprestimo.nomeRecipiente.toLowerCase().includes(termo));
    }

    // --- Navegação ---

    public abrirDetalhe(idLivro: number) {
        this.router.navigate(['/tabs/emprestimos/detalhe', idLivro]);
    }

    public abrirAmigo(event: Event, idAmigo: number, conhecido: boolean) {
        event.stopPropagation();
        if (!conhecido) return;
        this.router.navigate(['/tabs/amigos/detalhe', idAmigo]);
    }

    // --- Modal de registo (formulário no componente partilhado) ---

    public abrirRegisto() {
        this.modalRegistoAberto = true;
    }

    public fecharRegisto() {
        this.modalRegistoAberto = false;
    }

    public async onEmprestimoRegistado() {
        this.modalRegistoAberto = false;
        await this.carregarDados();
    }

    // --- Helpers de data ---

    private calcularUrgencia(dataDevolucao: Date): Urgencia {
        const hoje = this.inicioDoDia(new Date());
        const devolucao = this.inicioDoDia(dataDevolucao);
        if (devolucao.getTime() < hoje.getTime()) return 'atrasado';
        if (devolucao.getTime() === hoje.getTime()) return 'hoje';
        return 'aTempo';
    }

    private inicioDoDia(data: Date): Date {
        const copia = new Date(data);
        copia.setHours(0, 0, 0, 0);
        return copia;
    }

    public formatarData(data: Date): string {
        const d = new Date(data);
        const dia = String(d.getDate()).padStart(2, '0');
        const mes = String(d.getMonth() + 1).padStart(2, '0');
        return `${dia}/${mes}/${d.getFullYear()}`;
    }

    public textoUrgencia(urgencia: Urgencia): string {
        switch (urgencia) {
            case 'atrasado': return 'Atrasado';
            case 'hoje': return 'Entrega hoje';
            default: return 'Ativo';
        }
    }
}
