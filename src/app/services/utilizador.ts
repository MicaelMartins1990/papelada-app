import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { Utilizador } from '../models/utilizador';
import { Resultado } from '../enums/resultado';
import { DadosLeitura } from '../models/dados-leitura';
import { LivroPessoal } from '../models/livro-pessoal';
import { Posse } from '../enums/posse';
import { migrarRegistoLivroPessoal } from './livro-pessoal';

@Injectable({
    providedIn: 'root',
})
export class UtilizadorService {
    private _storage: Storage | null = null;

    private estaPronto: Promise<void>;

    constructor(private storage: Storage) {
        this.estaPronto = this.init();
    }

    async init() {
        this._storage = await this.storage.create();
    }

    private getChaveUtilizador(idUtilizador: number): string {
        return `amigos_${idUtilizador}`;
    }

    async getAmigos(idUtilizador: number): Promise<number[]> {
        const amigos = await this._storage?.get(this.getChaveUtilizador(idUtilizador));
        return amigos || [];
    }

    async getUtilizador(id: number): Promise<Utilizador | null> {
        const utilizadores: Utilizador[] = (await this._storage?.get('utilizadores')) || [];
        return utilizadores.find((u: any) => u.id === id) || null;
    }

    async getUtilizadorUsername(username: string): Promise<Utilizador | null> {
        const utilizadores: Utilizador[] = (await this._storage?.get('utilizadores')) || [];
        return utilizadores.find((u: any) => u.username === username) || null;
    }

    async getDadosUtilizadores(ids: number[]): Promise<Utilizador[]> {
        const utilizadores: Utilizador[] = (await this._storage?.get('utilizadores')) || [];
        return utilizadores.filter(utilizador => ids.includes(utilizador.id));
    }

    async adicionarAmigo(idUtilizador: number, usernameAmigo: string): Promise<Resultado> {
        const amigos = await this.getAmigos(idUtilizador);
        const amigo = await this.getUtilizadorUsername(usernameAmigo);

        if (!amigo) return Resultado.NAO_ENCONTRADO;
        if (amigo.id == idUtilizador) return Resultado.MESMO_UTILIZADOR;
        if (amigos.includes(amigo.id)) return Resultado.JA_EXISTE;

        amigos.push(amigo.id);
        await this._storage?.set(this.getChaveUtilizador(idUtilizador), amigos);
        return Resultado.EXITO;
    }

    async removerAmigo(idUtilizador: number, idAmigo: number): Promise<Resultado> {
        const amigos = await this.getAmigos(idUtilizador);
        const amigo = await this.getUtilizador(idAmigo);

        if (!amigo) return Resultado.NAO_ENCONTRADO;
        // Não deveria ser possível
        if (!amigos.includes(amigo.id)) return Resultado.ERRO;

        amigos.splice(amigos.indexOf(amigo.id), 1);
        await this._storage?.set(this.getChaveUtilizador(idUtilizador), amigos);
        return Resultado.EXITO;
    }

    public async getDadosLeitura(idUtilizador: number) {
        const dadosLeitura: DadosLeitura = {
            livrosPossuidos: 0,
            livrosDesejados: 0,
            livrosEmprestados: 0
        }
        const registosBrutos: any[] = await this._storage?.get(`livroutil_${idUtilizador}`) || [];
        const livrosPessoais: LivroPessoal[] = registosBrutos.map(registo => migrarRegistoLivroPessoal(registo));
        if (livrosPessoais.length > 0) {
            dadosLeitura.livrosPossuidos = livrosPessoais.filter(registo =>
                registo.posse === Posse.NA_BIBLIOTECA
            ).length;
            dadosLeitura.livrosDesejados = livrosPessoais.filter(registo =>
                registo.posse === Posse.DESEJADO
            ).length;
            dadosLeitura.livrosEmprestados = livrosPessoais.filter(registo =>
                registo.emprestimo !== null
            ).length;
        }
        return dadosLeitura;
    }

    async esperarPronto() {
        await this.estaPronto;
    }
}
