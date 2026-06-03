import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { Emprestimo, LivroPessoal } from '../models/livro-pessoal';
import { Posse } from '../enums/posse';

/**
 * Valores numéricos do enum legado `LivroStatus`, mantidos aqui apenas para a
 * migração on-read dos registos antigos. Não usar em código novo.
 */
const LEGACY_STATUS = {
    NAO_POSSUIDO: 0,
    DESEJADO: 1,
    POR_LER: 2,
    LIDO: 3
} as const;

/**
 * Migra um registo legado (eixo único `status`) para o modelo de três eixos
 * (`posse` + `lido` + `emprestimo`). Determinística e idempotente: registos já
 * no novo formato passam sem alteração. Função partilhada para que qualquer
 * leitor de `livroutil_*` aplique a mesma normalização.
 */
export function migrarRegistoLivroPessoal(registo: any): LivroPessoal {
    if (registo == null) return registo;

    const temNovoFormato = registo.posse !== undefined && registo.lido !== undefined;
    if (!temNovoFormato) {
        let posse = Posse.NENHUMA;
        let lido = false;
        switch (registo.status) {
            case LEGACY_STATUS.DESEJADO:
                posse = Posse.DESEJADO;
                break;
            case LEGACY_STATUS.POR_LER:
                posse = Posse.NA_BIBLIOTECA;
                break;
            case LEGACY_STATUS.LIDO:
                posse = Posse.NA_BIBLIOTECA;
                lido = true;
                break;
            default:
                // NAO_POSSUIDO, ausente ou desconhecido → defaults seguros
                posse = Posse.NENHUMA;
        }
        registo.posse = registo.posse ?? posse;
        registo.lido = registo.lido ?? lido;
    }
    delete registo.status;
    return registo;
}

@Injectable({
    providedIn: 'root'
})
export class LivroPessoalService {
    private _storage: Storage | null = null;

    constructor(private storage: Storage) {
        this.init();
    }

    async init() {
        if (!this._storage) {
            this._storage = await this.storage.create();
        }
    }

    private getChaveUtilizador(idUtilizador: number): string {
        return `livroutil_${idUtilizador}`;
    }

    public async getLivroPessoal(idUtilizador: number): Promise<LivroPessoal[]> {
        await this.init();
        const livroPesosal: LivroPessoal[] = await this._storage?.get(this.getChaveUtilizador(idUtilizador)) || [];
        return livroPesosal.map(registo => this.normalizarEmprestimo(migrarRegistoLivroPessoal(registo)));
    }

    /**
     * O Ionic Storage serializa as datas para string. Ao ler, voltamos a
     * convertê-las para `Date` para os cálculos de urgência funcionarem.
     * Empréstimos antigos sem `dataEmprestimo` usam a data de devolução como recurso.
     */
    private normalizarEmprestimo(registo: LivroPessoal): LivroPessoal {
        if (registo.emprestimo) {
            const emprestimo = registo.emprestimo;
            emprestimo.dataDevolucao = new Date(emprestimo.dataDevolucao);
            emprestimo.dataEmprestimo = emprestimo.dataEmprestimo
                ? new Date(emprestimo.dataEmprestimo)
                : new Date(emprestimo.dataDevolucao);
        }
        return registo;
    }

    private async saveLivrosPessoais(idUtilizador: number, livroPesosal: LivroPessoal[]): Promise<void> {
        await this.init();
        await this._storage?.set(this.getChaveUtilizador(idUtilizador), livroPesosal);
    }

    private async getOuCriarRegisto(idUtilizador: number, idLivro: number, livrosPessoais: LivroPessoal[]): Promise<LivroPessoal> {
        let livroPesosal = livrosPessoais.find(l => l.idLivro === idLivro);
        
        if (!livroPesosal) {
            livroPesosal = {
                idLivro: idLivro,
                idUtilizador: idUtilizador,
                posse: Posse.NENHUMA,
                lido: false,
                avaliacao: null,
                comentario: null,
                dataAvaliacao: null,
                emprestimo: null
            };
            livrosPessoais.push(livroPesosal);
        }
        return livroPesosal;
    }

    /**
     * Define a posse do livro (eixo independente). Não altera o estado de
     * leitura nem o empréstimo.
     */
    public async definirPosse(idUtilizador: number, idLivro: number, novaPosse: Posse): Promise<void> {
        const livrosPessoais = await this.getLivroPessoal(idUtilizador);
        const livroPessoal = await this.getOuCriarRegisto(idUtilizador, idLivro, livrosPessoais);
        livroPessoal.posse = novaPosse;
        await this.saveLivrosPessoais(idUtilizador, livrosPessoais);
    }

    /**
     * Define o estado de leitura do livro (eixo independente). Não altera a
     * posse nem o empréstimo.
     */
    public async definirLido(idUtilizador: number, idLivro: number, lido: boolean): Promise<void> {
        const livrosPessoais = await this.getLivroPessoal(idUtilizador);
        const livroPessoal = await this.getOuCriarRegisto(idUtilizador, idLivro, livrosPessoais);
        livroPessoal.lido = lido;
        await this.saveLivrosPessoais(idUtilizador, livrosPessoais);
    }

    public async adicionarAvaliacao(idUtilizador: number, idLivro: number, nota: number, texto: string): Promise<void> {
        const livrosPessoais = await this.getLivroPessoal(idUtilizador);
        const livroPessoal = await this.getOuCriarRegisto(idUtilizador, idLivro, livrosPessoais);
        
        livroPessoal.avaliacao = nota;
        livroPessoal.comentario = texto.trim() || null;
        livroPessoal.dataAvaliacao = new Date().toISOString();
        
        await this.saveLivrosPessoais(idUtilizador, livrosPessoais);
    }

    public async apagarAvaliacao(idUtilizador: number, idLivro: number): Promise<void> {
        const livrosPessoais = await this.getLivroPessoal(idUtilizador);
        const livroPessoal = await this.getOuCriarRegisto(idUtilizador, idLivro, livrosPessoais);

        livroPessoal.avaliacao = null;
        livroPessoal.comentario = null;
        livroPessoal.dataAvaliacao = null;

        await this.saveLivrosPessoais(idUtilizador, livrosPessoais);
    }

    public async getAvaliacoesLivro(idLivro: number): Promise<LivroPessoal[]> {
        await this.init();
        const chaves = await this._storage?.keys() || [];
        const chavesUtilizadores = chaves.filter(chave => chave.startsWith('livroutil_'));
        const registos = await Promise.all(
            chavesUtilizadores.map(async chave => (await this._storage?.get(chave)) || [])
        );

        return registos
            .reduce((todos, lista) => todos.concat(lista), [])
            .filter((livroPessoal: LivroPessoal) => livroPessoal.idLivro === idLivro);
    }

    public async registarEmprestimo(idUtilizador: number, idLivro: number, idRecipiente: number, dataDevolucao: Date): Promise<void> {
        const livrosPessoais = await this.getLivroPessoal(idUtilizador);
        const livroPessoal = await this.getOuCriarRegisto(idUtilizador, idLivro, livrosPessoais);
        
        const novoEmprestimo: Emprestimo = {
            idRecipiente: idRecipiente,
            dataEmprestimo: new Date(),
            dataDevolucao: dataDevolucao
        };
        livroPessoal.emprestimo = novoEmprestimo;

        await this.saveLivrosPessoais(idUtilizador, livrosPessoais);
    }

    /**
     * Conclui um empréstimo ativo: o livro volta a ficar disponível para emprestar.
     * O estado de leitura do livro mantém-se inalterado.
     */
    public async concluirEmprestimo(idUtilizador: number, idLivro: number): Promise<void> {
        const livrosPessoais = await this.getLivroPessoal(idUtilizador);
        const livroPessoal = livrosPessoais.find(l => l.idLivro === idLivro);
        if (!livroPessoal) return;

        livroPessoal.emprestimo = null;
        await this.saveLivrosPessoais(idUtilizador, livrosPessoais);
    }

    /**
     * Atualiza a data de devolução prevista de um empréstimo ativo.
     */
    public async atualizarDataDevolucao(idUtilizador: number, idLivro: number, novaData: Date): Promise<void> {
        const livrosPessoais = await this.getLivroPessoal(idUtilizador);
        const livroPessoal = livrosPessoais.find(l => l.idLivro === idLivro);
        if (!livroPessoal || !livroPessoal.emprestimo) return;

        livroPessoal.emprestimo.dataDevolucao = novaData;
        await this.saveLivrosPessoais(idUtilizador, livrosPessoais);
    }
}
