import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { Utilizador } from '../models/utilizador';
import { Resultado } from '../enums/resultado';

@Injectable({
    providedIn: 'root',
})
export class UtilizadorService {
    private _storage: Storage | null = null;

    constructor(private storage: Storage) {
        this.init();
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

    async getUtilizador(username: string): Promise<Utilizador | null> {
        const utilizadores: Utilizador[] = (await this._storage?.get('utilizadores')) || [];
        return utilizadores.find((u: any) => u.username === username) || null;
    }

    async getDadosUtilizadores(ids: number[]): Promise<Utilizador[]> {
        const utilizadores: Utilizador[] = (await this._storage?.get('utilizadores')) || [];
        return utilizadores.filter(utilizador => ids.includes(utilizador.id));
    }

    async adicionarAmigo(idUtilizador: number, usernameAmigo: string): Promise<Resultado> {
        const amigos = await this.getAmigos(idUtilizador);
        const amigo = await this.getUtilizador(usernameAmigo);

        if (!amigo) return Resultado.NAO_ENCONTRADO;
        if (amigo.id == idUtilizador) return Resultado.MESMO_UTILIZADOR;
        if (amigos.includes(amigo.id)) return Resultado.JA_EXISTE;

        amigos.push(amigo.id);
        await this._storage?.set(this.getChaveUtilizador(idUtilizador), amigos);
        return Resultado.EXITO;
    } 
}
