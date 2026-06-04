import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import * as bcrypt from 'bcryptjs';
import { Resultado } from 'src/app/enums/resultado'
import { Utilizador } from '../models/utilizador';

export interface UtilizadorPublico {
    id: number,
    nome: string,
    username: string,
    avatar: string,
}

export const AVATAR_PADRAO = '#8c5a47';

@Injectable({
    providedIn: 'root',
})

export class AuthService {
    private _storage: Storage | null = null;
    private utilizadorLogado: number | null = null;
    private estaPronto: Promise<void>;

    constructor(private storage: Storage) {
        this.estaPronto = this.init();
    }
    /** Inicializa o armazenamento (storage) e verifica se já existe uma sessão aberta */
    async init() {
        this._storage = await this.storage.create();
        await this.checkLogin();
    }
    /** Verifica no armazenamento local se existe um utilizador já logado */
    public async checkLogin() {
        const utilizador = await this._storage?.get('utilizador_logado');
        if (utilizador) {
            this.utilizadorLogado = utilizador.id;
        }
    }
    /** Cria uma nova conta, encriptando a palavra-passe com bcrypt antes de guardar */
    public async criarConta(nome: string, username: string, password: string): Promise <Resultado> {
        const utilizadores: Utilizador[] = (await this._storage?.get('utilizadores')) || [];
        // Verifica se o username já existe
        if (utilizadores.find((u: any) => u.username === username)) return Resultado.JA_EXISTE;

        const id = this.getNovoId(utilizadores);
        const salt = await bcrypt.genSalt();
        const passwordHash = await bcrypt.hash(password, salt);

        const utilizador: Utilizador = {id, nome, username, passwordHash, avatar: AVATAR_PADRAO}
        utilizadores.push(utilizador);
        await this._storage?.set('utilizadores', utilizadores);
        return Resultado.EXITO;
    }
    /** Valida as credenciais e inicia sessão caso estejam corretas */
    public async login(username: string, password: string): Promise <Resultado> {
        const utilizadores: Utilizador[] = (await this._storage?.get('utilizadores')) || [];
        const utilizador = utilizadores.find((u: Utilizador) => u.username === username);
        // Verifica se utilizador existe e se a password coincide
        if (!utilizador) return Resultado.NAO_ENCONTRADO;
        if (!await bcrypt.compare(password, utilizador.passwordHash)) return Resultado.NAO_ENCONTRADO;

        const utilizadorNormalizado = this.normalizarUtilizador(utilizador);
        this.utilizadorLogado = utilizadorNormalizado.id;~
        // Guarda o estado de login no storage
        await this._storage?.set('utilizadores', utilizadores.map(u => u.id === utilizadorNormalizado.id ? utilizadorNormalizado : u));
        await this._storage?.set('utilizador_logado', utilizadorNormalizado);

        return Resultado.EXITO;
    }
    /** Remove a sessão do utilizador do storage */
    public async logout() {
        this.utilizadorLogado = null;
        await this._storage?.remove('utilizador_logado');
    }
    /** Aguarda que o armazenamento esteja pronto para ser lido ou escrito */
    public async esperarPronto() {
        await this.estaPronto;
    }
    /** Retorna o ID do utilizador atualmente logado */
    public getIdUtilizador(): number | null {
        return this.utilizadorLogado;
    }
    /** Retorna uma lista de utilizadores sem dados sensíveis (password), ideal para listagens */
    public async getUtilizadoresPublicos(): Promise<UtilizadorPublico[]> {
        await this.esperarPronto();
        const utilizadores: Utilizador[] = (await this._storage?.get('utilizadores')) || [];

        return utilizadores.map(utilizador => ({
            id: utilizador.id,
            nome: utilizador.nome,
            username: utilizador.username,
            avatar: utilizador.avatar || AVATAR_PADRAO
        }));
    }
    /** Verifica se o utilizador tem uma sessão ativa */
    public estaLogado(): boolean {
        return this.utilizadorLogado !== null;
    }
    /** Gera um novo ID sequencial para um novo utilizador */
    private getNovoId(utilizadores: Utilizador[]): number {
        return (utilizadores[utilizadores.length - 1]?.id || 0) + 1
    }
    /** Garante que um utilizador tem sempre um avatar definido */
    private normalizarUtilizador(utilizador: Utilizador): Utilizador {
        return {
            ...utilizador,
            avatar: utilizador.avatar || AVATAR_PADRAO
        };
    }
}
