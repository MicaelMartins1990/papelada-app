import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { LivroPessoalService } from '../../services/livro-pessoal';
import { LivroService } from '../../services/livro';
import { UtilizadorService } from '../../services/utilizador';
import { Utilizador } from '../../models/utilizador';
import { Posse } from '../../enums/posse';

export interface LivroDisponivel {
    id: number;
    titulo: string;
    autor: string;
    capa: string;
}

/**
 * Formulário partilhado de registo de empréstimo (livro + amigo + data).
 * Usado na página de Empréstimos (livro escolhido via picker) e na página de
 * Detalhe (livro pré-fixado via `livroFixo`, escondendo o picker).
 */
@Component({
    selector: 'app-form-emprestimo',
    templateUrl: './form-emprestimo.component.html',
    styleUrls: ['./form-emprestimo.component.scss'],
    standalone: false
})
export class FormEmprestimoComponent implements OnInit {
    /** Utilizador autenticado que está a emprestar. */
    @Input() idUtilizador!: number;
    /** Quando definido, o livro fica fixo e o picker de livro não é apresentado. */
    @Input() livroFixo: LivroDisponivel | null = null;
    /** Quando definido, o amigo fica fixo e o picker de amigo não é apresentado. */
    @Input() amigoFixo: Utilizador | null = null;

    /** Emitido após registar o empréstimo com sucesso. */
    @Output() registado = new EventEmitter<void>();
    /** Emitido quando o utilizador cancela/fecha o formulário. */
    @Output() cancelado = new EventEmitter<void>();

    public aCarregar: boolean = true;
    public livrosDisponiveis: LivroDisponivel[] = [];
    public amigos: Utilizador[] = [];

    public modalLivroAberto: boolean = false;
    public termoPesquisaLivro: string = '';

    public modalAmigoAberto: boolean = false;
    public termoPesquisaAmigo: string = '';

    public livroSelecionado: LivroDisponivel | null = null;
    public idAmigoSelecionado: number | null = null;

    /** Data de devolução sugerida (hoje + 1 mês) com que o formulário arranca. */
    public readonly dataSugeridaIso: string = this.dataIsoSugerida();
    public dataDevolucaoSelecionada: string | null = this.dataSugeridaIso;
    /** Verdadeiro enquanto a data continua a ser a sugestão automática (mostra o aviso). */
    public dataSugerida: boolean = true;

    public erroLivro: string = '';
    public erroAmigo: string = '';
    public erroData: string = '';

    public readonly hojeIso: string = this.dataIsoHoje();

    constructor(
        private toastController: ToastController,
        private livroPessoalService: LivroPessoalService,
        private livroService: LivroService,
        private utilizadorService: UtilizadorService
    ) { }

    async ngOnInit() {
        await this.carregar();
    }

    private async carregar() {
        this.aCarregar = true;
        await this.utilizadorService.esperarPronto();
        const [registos, livros, idsAmigos] = await Promise.all([
            this.livroPessoalService.getLivrosPessoais(this.idUtilizador),
            this.livroService.getLivros(),
            this.utilizadorService.getAmigos(this.idUtilizador)
        ]);

        this.amigos = await this.utilizadorService.getDadosUtilizadores(idsAmigos);

        const livrosPorId = new Map(livros.map(livro => [livro.id, livro]));

        // Livros disponíveis para emprestar: na biblioteca e não emprestados.
        this.livrosDisponiveis = registos
            .filter(registo => registo.posse === Posse.NA_BIBLIOTECA && registo.emprestimo === null)
            .map(registo => {
                const livro = livrosPorId.get(registo.idLivro);
                return livro
                    ? { id: livro.id, titulo: livro.titulo, autor: livro.autor, capa: livro.capa }
                    : null;
            })
            .filter((livro): livro is LivroDisponivel => livro !== null);

        // Com livro pré-fixado, esse é o livro selecionado e o picker não é usado.
        if (this.livroFixo) {
            this.livroSelecionado = this.livroFixo;
        }

        // Com amigo pré-fixado, esse é o amigo selecionado e o picker não é usado.
        if (this.amigoFixo) {
            this.idAmigoSelecionado = this.amigoFixo.id;
        }

        this.aCarregar = false;
    }

    public get temLivroFixo(): boolean {
        return this.livroFixo !== null;
    }

    public get temAmigoFixo(): boolean {
        return this.amigoFixo !== null;
    }

    public get semLivrosDisponiveis(): boolean {
        return !this.temLivroFixo && this.livrosDisponiveis.length === 0;
    }

    public get amigoSelecionado(): Utilizador | null {
        if (this.amigoFixo) return this.amigoFixo;
        if (this.idAmigoSelecionado == null) return null;
        return this.amigos.find(amigo => amigo.id === this.idAmigoSelecionado) ?? null;
    }

    public get podeMostrarFormulario(): boolean {
        return (this.temAmigoFixo || this.amigos.length > 0) &&
            (this.temLivroFixo || this.livrosDisponiveis.length > 0);
    }

    public get livrosDisponiveisFiltrados(): LivroDisponivel[] {
        const termo = this.termoPesquisaLivro.toLowerCase().trim();
        if (!termo) return this.livrosDisponiveis;
        return this.livrosDisponiveis.filter(livro =>
            livro.titulo.toLowerCase().includes(termo) ||
            livro.autor.toLowerCase().includes(termo));
    }

    public abrirPickerLivro() {
        if (this.temLivroFixo) return;
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

    public get amigosFiltrados(): Utilizador[] {
        const termo = this.termoPesquisaAmigo.toLowerCase().trim().replace(/^@/, '');
        if (!termo) return this.amigos;
        return this.amigos.filter(amigo =>
            amigo.nome.toLowerCase().includes(termo) ||
            amigo.username.toLowerCase().includes(termo));
    }

    public abrirPickerAmigo() {
        if (this.temAmigoFixo) return;
        this.termoPesquisaAmigo = '';
        this.modalAmigoAberto = true;
    }

    public fecharPickerAmigo() {
        this.modalAmigoAberto = false;
    }

    public pesquisarAmigo(event: any) {
        this.termoPesquisaAmigo = event?.target?.value ?? '';
    }

    public selecionarAmigo(amigo: Utilizador) {
        this.idAmigoSelecionado = amigo.id;
        this.erroAmigo = '';
        this.modalAmigoAberto = false;
    }

    /**
     * Reage à alteração da data no calendário. Limpa o erro e, quando a data
     * escolhida difere da sugestão automática, deixa de a tratar como sugerida
     * (escondendo o aviso). Comparar o dia evita que um eventual `ionChange`
     * disparado na montagem com o valor inicial apague o aviso (ver design.md §4).
     */
    public aoMudarData(event: any) {
        this.erroData = '';
        const valor: string | null = event?.detail?.value ?? null;
        if (valor && valor.slice(0, 10) !== this.dataSugeridaIso) {
            this.dataSugerida = false;
        }
    }

    public cancelar() {
        this.cancelado.emit();
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
            await this.mostrarToast('Empréstimo registado com sucesso.', 'success');
            this.registado.emit();
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

    private dataAnteriorAHoje(data: Date): boolean {
        return this.inicioDoDia(data).getTime() < this.inicioDoDia(new Date()).getTime();
    }

    private inicioDoDia(data: Date): Date {
        const copia = new Date(data);
        copia.setHours(0, 0, 0, 0);
        return copia;
    }

    private formatarIso(data: Date): string {
        const ano = data.getFullYear();
        const mes = String(data.getMonth() + 1).padStart(2, '0');
        const dia = String(data.getDate()).padStart(2, '0');
        return `${ano}-${mes}-${dia}`;
    }

    private dataIsoHoje(): string {
        return this.formatarIso(new Date());
    }

    /** Data sugerida de devolução: hoje + 1 mês (overflow nativo do JavaScript). */
    private dataIsoSugerida(): string {
        const data = new Date();
        data.setMonth(data.getMonth() + 1);
        return this.formatarIso(data);
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
