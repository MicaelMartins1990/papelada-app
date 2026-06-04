import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, NavController, ToastController } from '@ionic/angular';
import { AuthService } from '../services/auth';
import { LivroPessoalService } from '../services/livro-pessoal';
import { LivroService } from '../services/livro';
import { UtilizadorService } from '../services/utilizador';
import { Utilizador } from '../models/utilizador';

interface LivroResumo {
    titulo: string;
    autor: string;
    capa: string;
}

@Component({
    selector: 'app-emprestimo-detalhe',
    templateUrl: './emprestimo-detalhe.page.html',
    styleUrls: ['./emprestimo-detalhe.page.scss'],
    standalone: false
})
export class EmprestimoDetalhePage implements OnInit {

    public idUtilizador!: number;
    public idLivro!: number;

    public aCarregar: boolean = true;
    public emprestimoEncontrado: boolean = false;

    public livro: LivroResumo | null = null;
    public recipiente: Utilizador | null = null;
    public dataEmprestimo: Date | null = null;
    public dataDevolucao: Date | null = null;

    // Modal de alteração de data
    public modalDataAberto: boolean = false;
    public novaData: string | null = null;
    public erroData: string = '';
    public readonly hojeIso: string = this.dataIsoHoje();

    private readonly meses = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private navController: NavController,
        private alertController: AlertController,
        private toastController: ToastController,
        private authService: AuthService,
        private livroPessoalService: LivroPessoalService,
        private livroService: LivroService,
        private utilizadorService: UtilizadorService
    ) { }
    /** Inicializa a página carregando os dados do empréstimo */
    async ngOnInit() {
        await this.carregar();
    }
    /** Atualiza os dados sempre que o utilizador entra na página */
    async ionViewWillEnter() {
        await this.carregar();
    }
    /** Pesquisa as informações do utilizador, do livro e do empréstimo associado */
    private async carregar() {
        this.aCarregar = true;
        await this.authService.esperarPronto();
        const id = this.authService.getIdUtilizador();
        if (id == null) {
            this.router.navigateByUrl('/');
            return;
        }
        this.idUtilizador = id;

        const idLivroParam = this.route.snapshot.paramMap.get('idLivro');
        this.idLivro = idLivroParam ? Number(idLivroParam) : NaN;

        const registos = await this.livroPessoalService.getLivrosPessoais(this.idUtilizador);
        const registo = registos.find(r => r.idLivro === this.idLivro);

        if (!registo || !registo.emprestimo) {
            this.emprestimoEncontrado = false;
            this.aCarregar = false;
            return;
        }

        const livros = await this.livroService.getLivros();
        const livro = livros.find(l => l.id === this.idLivro);
        this.livro = livro
            ? { titulo: livro.titulo, autor: livro.autor, capa: livro.capa }
            : { titulo: 'Livro desconhecido', autor: '', capa: '' };

        this.recipiente = await this.utilizadorService.getUtilizador(registo.emprestimo.idRecipiente);
        this.dataEmprestimo = new Date(registo.emprestimo.dataEmprestimo);
        this.dataDevolucao = new Date(registo.emprestimo.dataDevolucao);

        this.emprestimoEncontrado = true;
        this.aCarregar = false;
    }
    /** Volta para a página anterior */
    public voltar() {
        this.navController.back();
    }

    // --- Alterar data de devolução ---
    /** Abre o modal para editar a data de devolução do livro */
    public abrirAlterarData() {
        this.erroData = '';
        this.novaData = this.dataDevolucao ? this.dataParaIso(this.dataDevolucao) : null;
        this.modalDataAberto = true;
    }
    /** Fecha o modal de alteração de data */
    public fecharAlterarData() {
        this.modalDataAberto = false;
    }
    /** Valida e guarda a nova data de devolução escolhida */
    public async confirmarAlterarData() {
        if (!this.novaData) {
            this.erroData = 'Escolhe uma data de devolução.';
            return;
        }
        const data = new Date(this.novaData);
        if (this.dataAnteriorAHoje(data)) {
            this.erroData = 'A data de devolução não pode ser no passado.';
            return;
        }

        try {
            await this.livroPessoalService.atualizarDataDevolucao(this.idUtilizador, this.idLivro, data);
            this.modalDataAberto = false;
            await this.carregar();
            await this.mostrarToast('Data de devolução atualizada.', 'success');
        } catch {
            await this.mostrarToast('Não foi possível atualizar a data. Tenta novamente.', 'danger');
        }
    }

    // --- Concluir empréstimo ---
    /** Mostra um alerta para confirmar a conclusão do empréstimo */
    public async concluir() {
        const alerta = await this.alertController.create({
            header: 'Concluir empréstimo',
            message: 'O livro fica disponível novamente. Queres concluir este empréstimo?',
            buttons: [
                { text: 'Cancelar', role: 'cancel' },
                {
                    text: 'Concluir',
                    role: 'destructive',
                    handler: () => { this.executarConclusao(); }
                }
            ]
        });
        await alerta.present();
    }
    /** Processa a finalização do empréstimo no serviço */
    private async executarConclusao() {
        try {
            await this.livroPessoalService.concluirEmprestimo(this.idUtilizador, this.idLivro);
            await this.mostrarToast('Empréstimo concluído.', 'success');
            this.navController.back();
        } catch {
            await this.mostrarToast('Não foi possível concluir o empréstimo. Tenta novamente.', 'danger');
        }
    }

    /** Processa a finalização do empréstimo no serviço */
    public formatarDataLonga(data: Date | null): string {
        if (!data) return '';
        const d = new Date(data);
        return `${d.getDate()} de ${this.meses[d.getMonth()]} de ${d.getFullYear()}`;
    }
    /** Verifica se uma data é anterior ao dia de hoje */
    private dataAnteriorAHoje(data: Date): boolean {
        return this.inicioDoDia(data).getTime() < this.inicioDoDia(new Date()).getTime();
    }
    /** Retorna a data fornecida com o horário a zero */
    private inicioDoDia(data: Date): Date {
        const copia = new Date(data);
        copia.setHours(0, 0, 0, 0);
        return copia;
    }
    /** Converte um objeto Date para formato string ISO (YYYY-MM-DD) */
    private dataParaIso(data: Date): string {
        const d = new Date(data);
        const ano = d.getFullYear();
        const mes = String(d.getMonth() + 1).padStart(2, '0');
        const dia = String(d.getDate()).padStart(2, '0');
        return `${ano}-${mes}-${dia}`;
    }
    /** Retorna a data de hoje em formato ISO */
    private dataIsoHoje(): string {
        return this.dataParaIso(new Date());
    }
    /** Exibe uma mensagem temporária com uma cor de estado específica */
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
