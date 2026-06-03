import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { AuthService } from '../services/auth';
import { LivroPessoalService } from '../services/livro-pessoal';
import { LivroService } from '../services/livro';
import { UtilizadorService } from '../services/utilizador';
import { Utilizador } from '../models/utilizador';
import { LivroStatus } from '../enums/livro-status';

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

interface LivroDisponivel {
    id: number;
    titulo: string;
    autor: string;
    capa: string;
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

    // Dados para o formulário de registo
    public livrosDisponiveis: LivroDisponivel[] = [];
    public amigos: Utilizador[] = [];

    // Estado dos modais
    public modalRegistoAberto: boolean = false;
    public modalLivroAberto: boolean = false;
    public termoPesquisaLivro: string = '';

    // Formulário de registo
    public livroSelecionado: LivroDisponivel | null = null;
    public idAmigoSelecionado: number | null = null;
    public dataDevolucaoSelecionada: string | null = null;

    public erroLivro: string = '';
    public erroAmigo: string = '';
    public erroData: string = '';

    public readonly hojeIso: string = this.dataIsoHoje();

    constructor(
        private router: Router,
        private toastController: ToastController,
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
        const [registos, livros, idsAmigos] = await Promise.all([
            this.livroPessoalService.getLivroPessoal(this.idUtilizador),
            this.livroService.getLivros(),
            this.utilizadorService.getAmigos(this.idUtilizador)
        ]);

        this.amigos = await this.utilizadorService.getDadosUtilizadores(idsAmigos);

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

        // Livros disponíveis para emprestar: possuídos (por ler ou lidos) e não emprestados
        this.livrosDisponiveis = registos
            .filter(registo =>
                (registo.status === LivroStatus.POR_LER || registo.status === LivroStatus.LIDO) &&
                registo.emprestimo === null)
            .map(registo => {
                const livro = livrosPorId.get(registo.idLivro);
                return livro
                    ? { id: livro.id, titulo: livro.titulo, autor: livro.autor, capa: livro.capa }
                    : null;
            })
            .filter((livro): livro is LivroDisponivel => livro !== null);
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

    public get livrosDisponiveisFiltrados(): LivroDisponivel[] {
        const termo = this.termoPesquisaLivro.toLowerCase().trim();
        if (!termo) return this.livrosDisponiveis;
        return this.livrosDisponiveis.filter(livro =>
            livro.titulo.toLowerCase().includes(termo) ||
            livro.autor.toLowerCase().includes(termo));
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

    // --- Modal de registo ---

    public abrirRegisto() {
        this.limparFormulario();
        this.modalRegistoAberto = true;
    }

    public fecharRegisto() {
        this.modalRegistoAberto = false;
        this.limparFormulario();
    }

    private limparFormulario() {
        this.livroSelecionado = null;
        this.idAmigoSelecionado = null;
        this.dataDevolucaoSelecionada = null;
        this.erroLivro = '';
        this.erroAmigo = '';
        this.erroData = '';
        this.termoPesquisaLivro = '';
    }

    public abrirPickerLivro() {
        this.termoPesquisaLivro = '';
        this.modalLivroAberto = true;
    }

    public fecharPickerLivro() {
        this.modalLivroAberto = false;
    }

    public pesquisarLivro(event: any) {
        this.termoPesquisaLivro = event?.target?.value ?? '';
    }

    public selecionarLivro(livro: LivroDisponivel) {
        this.livroSelecionado = livro;
        this.erroLivro = '';
        this.modalLivroAberto = false;
    }

    public get formularioCompleto(): boolean {
        return !!this.livroSelecionado &&
            this.idAmigoSelecionado != null &&
            !!this.dataDevolucaoSelecionada;
    }

    public async registar() {
        if (!this.validar()) return;
        try {
            const dataDevolucao = new Date(this.dataDevolucaoSelecionada!);
            await this.livroPessoalService.registarEmprestimo(
                this.idUtilizador,
                this.livroSelecionado!.id,
                this.idAmigoSelecionado!,
                dataDevolucao
            );
            this.modalRegistoAberto = false;
            this.limparFormulario();
            await this.carregarDados();
            await this.mostrarToast('Empréstimo registado com sucesso.', 'success');
        } catch {
            await this.mostrarToast('Não foi possível registar o empréstimo. Tenta novamente.', 'danger');
        }
    }

    private validar(): boolean {
        this.erroLivro = '';
        this.erroAmigo = '';
        this.erroData = '';
        let valido = true;

        if (!this.livroSelecionado) {
            this.erroLivro = 'Escolhe um livro para emprestar.';
            valido = false;
        }
        if (this.idAmigoSelecionado == null) {
            this.erroAmigo = 'Escolhe o amigo que vai receber o livro.';
            valido = false;
        }
        if (!this.dataDevolucaoSelecionada) {
            this.erroData = 'Escolhe a data de devolução.';
            valido = false;
        } else if (this.dataAnteriorAHoje(new Date(this.dataDevolucaoSelecionada))) {
            this.erroData = 'A data de devolução não pode ser no passado.';
            valido = false;
        }
        return valido;
    }

    // --- Helpers de data ---

    private calcularUrgencia(dataDevolucao: Date): Urgencia {
        const hoje = this.inicioDoDia(new Date());
        const devolucao = this.inicioDoDia(dataDevolucao);
        if (devolucao.getTime() < hoje.getTime()) return 'atrasado';
        if (devolucao.getTime() === hoje.getTime()) return 'hoje';
        return 'aTempo';
    }

    private dataAnteriorAHoje(data: Date): boolean {
        return this.inicioDoDia(data).getTime() < this.inicioDoDia(new Date()).getTime();
    }

    private inicioDoDia(data: Date): Date {
        const copia = new Date(data);
        copia.setHours(0, 0, 0, 0);
        return copia;
    }

    private dataIsoHoje(): string {
        const hoje = new Date();
        const ano = hoje.getFullYear();
        const mes = String(hoje.getMonth() + 1).padStart(2, '0');
        const dia = String(hoje.getDate()).padStart(2, '0');
        return `${ano}-${mes}-${dia}`;
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

    private async mostrarToast(mensagem: string, cor: 'success' | 'danger' | 'medium' = 'medium') {
        const toast = await this.toastController.create({
            message: mensagem,
            duration: 2000,
            color: cor,
            position: 'bottom'
        });
        await toast.present();
    }
}
