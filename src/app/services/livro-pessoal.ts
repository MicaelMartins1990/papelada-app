import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { Emprestimo, LivroPessoal } from '../models/livro-pessoal';
import { LivroStatus } from '../enums/livro-status';

@Injectable({
    providedIn: 'root'
})
export class LivroPessoalService {
    private _storage: Storage | null = null;

    constructor(private storage: Storage) {
        this.init();
    }

    async init() {
        this._storage = await this.storage.create();
    }

    private getChaveUtilizador(idUtilizador: number): string {
        return `livroutil_${idUtilizador}`;
    }

    public async getLivroPessoal(idUtilizador: number): Promise<LivroPessoal[]> {
        const livroPesosal = await this._storage?.get(this.getChaveUtilizador(idUtilizador));
        return livroPesosal || [];
    }

    private async saveLivrosPessoais(idUtilizador: number, livroPesosal: LivroPessoal[]): Promise<void> {
        await this._storage?.set(this.getChaveUtilizador(idUtilizador), livroPesosal);
    }

    private async getOuCriarRegisto(idUtilizador: number, idLivro: number, livrosPessoais: LivroPessoal[]): Promise<LivroPessoal> {
        let livroPesosal = livrosPessoais.find(l => l.idLivro === idLivro);
        
        if (!livroPesosal) {
            livroPesosal = {
                idLivro: idLivro,
                idUtilizador: idUtilizador,
                status: LivroStatus.NAO_POSSUIDO,
                avaliacao: null,
                comentario: null,
                emprestimo: null
            };
            livrosPessoais.push(livroPesosal);
        }
        return livroPesosal;
    }

    public async atualizarStatus(idUtilizador: number, idLivro: number, novoStatus: LivroStatus): Promise<void> {
        const livrosPessoais = await this.getLivroPessoal(idUtilizador);
        const livroPessoal = await this.getOuCriarRegisto(idUtilizador, idLivro, livrosPessoais);
        livroPessoal.status = novoStatus;
        await this.saveLivrosPessoais(idUtilizador, livrosPessoais);
    }

    public async adicionarAvaliacao(idUtilizador: number, idLivro: number, nota: number, texto: string): Promise<void> {
        const livrosPessoais = await this.getLivroPessoal(idUtilizador);
        const livroPessoal = await this.getOuCriarRegisto(idUtilizador, idLivro, livrosPessoais);
        
        livroPessoal.avaliacao = nota;
        livroPessoal.comentario = texto;
        
        await this.saveLivrosPessoais(idUtilizador, livrosPessoais);
    }

    public async registarEmprestimo(idUtilizador: number, idLivro: number, idRecipiente: number, dataDevolucao: Date): Promise<void> {
        const livrosPessoais = await this.getLivroPessoal(idUtilizador);
        const livroPessoal = await this.getOuCriarRegisto(idUtilizador, idLivro, livrosPessoais);
        
        const novoEmprestimo: Emprestimo = {
            idRecipiente: idRecipiente,
            dataDevolucao: dataDevolucao
        };
        livroPessoal.emprestimo = novoEmprestimo;
        
        await this.saveLivrosPessoais(idUtilizador, livrosPessoais);
    }
}