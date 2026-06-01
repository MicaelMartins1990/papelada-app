import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import * as bcrypt from 'bcryptjs';
import { Resultado } from 'src/app/enums/resultado'

export interface Utilizador {
    id: number,
    nome: string,
    username: string,
    passwordHash: string,
}

@Injectable({
    providedIn: 'root',
})

export class Auth {
    private _storage: Storage | null = null;
    private utilizadorLogado: Utilizador | null = null;
    private estaPronto: Promise<void>;

    constructor(private storage: Storage) {
        this.estaPronto = this.init();
    }

    async init() {
        this._storage = await this.storage.create();
        await this.checkLogin();
    }

    async checkLogin() {
        const utilizador = await this._storage?.get('utilizador_logado');
        if (utilizador) {
            this.utilizadorLogado = utilizador;
        }
    }

    async criarConta(nome: string, username: string, password: string): Promise <Resultado> {
        const utilizadores: Utilizador[] = (await this._storage?.get('utilizadores')) || [];

        if (utilizadores.find((u: any) => u.username === username)) return Resultado.JA_EXISTE;

        const id = (utilizadores[utilizadores.length - 1]?.id || 0) + 1;
        const salt = await bcrypt.genSalt();
        const passwordHash = await bcrypt.hash(password, salt);

        const utilizador: Utilizador = {id, nome, username, passwordHash}
        utilizadores.push(utilizador);
        await this._storage?.set('utilizadores', utilizadores);
        return Resultado.EXITO;
    }

    async login(username: string, password: string): Promise <Resultado> {
        const utilizadores: Utilizador[] = (await this._storage?.get('utilizadores')) || [];
        const utilizador = utilizadores.find((u: Utilizador) => u.username === username);
        if (!utilizador) return Resultado.NAO_ENCONTRADO;
        if (!await bcrypt.compare(password, utilizador.passwordHash)) return Resultado.NAO_ENCONTRADO;

        this.utilizadorLogado = utilizador;
        await this._storage?.set('utilizador_logado', utilizador);

        return Resultado.EXITO;
    }

    async logout() {
        this.utilizadorLogado = null;
        await this._storage?.remove('utilizador_logado');
    }

    public async esperarPronto() {
        await this.estaPronto;
    }

    public getUtilizador(): Utilizador | null {
        return this.utilizadorLogado;
    }

    public estaLogado(): boolean {
        return this.utilizadorLogado !== null;
    }
}
