import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { Utilizador } from '../models/utilizador';
import { Resultado } from '../enums/resultado';
import { DadosLeitura } from '../models/dados-leitura';
import { LivroPessoal } from '../models/livro-pessoal';
import { Posse } from '../enums/posse';
import { migrarRegistoLivroPessoal } from './livro-pessoal';
import { LivroService } from './livro';
import { Livro } from '../models/livro';
import { AVATAR_PADRAO } from './auth';

@Injectable({
    providedIn: 'root',
})
export class UtilizadorService {
    private _storage: Storage | null = null;

    private estaPronto: Promise<void>;

    constructor(private storage: Storage, private livroService: LivroService) {
        this.estaPronto = this.init();
    }
    /** Inicializa a ligação ao armazenamento (storage) local da aplicação */
    async init() {
        this._storage = await this.storage.create();
    }
    /** Gera a chave única usada para guardar e procurar a lista de amigos de um utilizador */
    private getChaveUtilizador(idUtilizador: number): string {
        return `amigos_${idUtilizador}`;
    }
    /** Retorna a lista de IDs de todos os amigos que o utilizador tem adicionados */
    async getAmigos(idUtilizador: number): Promise<number[]> {
        await this.esperarPronto();
        const amigos = await this._storage?.get(this.getChaveUtilizador(idUtilizador));
        return amigos || [];
    }
    /** Procura e devolve os dados de um utilizador específico através do seu ID */
    async getUtilizador(id: number): Promise<Utilizador | null> {
        await this.esperarPronto();
        const utilizadores: Utilizador[] = (await this._storage?.get('utilizadores')) || [];
        const utilizador = utilizadores.find((u: any) => u.id === id);
        return utilizador ? this.normalizarUtilizador(utilizador) : null;
    }
    /** Procura e devolve os dados de um utilizador através do seu username (@nome) */
    async getUtilizadorUsername(username: string): Promise<Utilizador | null> {
        await this.esperarPronto();
        const utilizadores: Utilizador[] = (await this._storage?.get('utilizadores')) || [];
        const utilizador = utilizadores.find((u: any) => u.username === username);
        return utilizador ? this.normalizarUtilizador(utilizador) : null;
    }
    /** Procura utilizadores pelo nome ou username, aceitando pesquisa com ou sem @ */
    async pesquisarUtilizadores(termo: string): Promise<Utilizador[]> {
        await this.esperarPronto();
        const texto = termo.trim().toLowerCase();
        const usernamePesquisa = texto.startsWith('@') ? texto.substring(1) : texto;

        if (!usernamePesquisa) return [];

        const utilizadores: Utilizador[] = (await this._storage?.get('utilizadores')) || [];
        return utilizadores
            .filter(utilizador =>
                utilizador.nome.toLowerCase().includes(texto) ||
                utilizador.username.toLowerCase().includes(usernamePesquisa)
            )
            .map(utilizador => this.normalizarUtilizador(utilizador));
    }
    /** Recebe uma lista de IDs e devolve os dados completos de todos esses utilizadores (usado para listar amigos) */
    async getDadosUtilizadores(ids: number[]): Promise<Utilizador[]> {
        await this.esperarPronto();
        const utilizadores: Utilizador[] = (await this._storage?.get('utilizadores')) || [];
        return utilizadores
            .filter(utilizador => ids.includes(utilizador.id))
            .map(utilizador => this.normalizarUtilizador(utilizador));
    }
    /** Atualiza o nome e o avatar do utilizador, guardando essas alterações na base de dados local */
    async atualizarPerfil(idUtilizador: number, nome: string, avatar: string): Promise<Utilizador | null> {
        await this.esperarPronto();
        const utilizadores: Utilizador[] = (await this._storage?.get('utilizadores')) || [];
        const indiceUtilizador = utilizadores.findIndex(utilizador => utilizador.id === idUtilizador);

        if (indiceUtilizador === -1) return null;

        const utilizadorAtualizado = this.normalizarUtilizador({
            ...utilizadores[indiceUtilizador],
            nome: nome.trim(),
            avatar: avatar || AVATAR_PADRAO
        });

        utilizadores[indiceUtilizador] = utilizadorAtualizado;
        await this._storage?.set('utilizadores', utilizadores);
        await this._storage?.set('utilizador_logado', utilizadorAtualizado);

        return utilizadorAtualizado;
    }
    /** Vai buscar todos os livros que o utilizador tem na lista de desejos, juntando a informação da capa e título */
    async getLivrosDesejadosComCapa(idUtilizador: number): Promise<Livro[]> {
        await this.esperarPronto();
        const [livros, registosBrutos] = await Promise.all([
            this.livroService.getLivros(),
            this._storage?.get(`livroutil_${idUtilizador}`) || []
        ]);
        const idsDesejados = new Set(
            (registosBrutos as any[])
                .map(registo => migrarRegistoLivroPessoal(registo))
                .filter(registo => registo.posse === Posse.DESEJADO)
                .map(registo => registo.idLivro)
        );

        return livros.filter(livro => idsDesejados.has(livro.id));
    }
    /** Adiciona um novo amigo usando o username, verificando antes se ele existe ou se já foi adicionado */
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
    /** Remove um amigo da lista de amigos do utilizador, verificando se ele existe e se é realmente amigo antes de remover */
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
    /** Regista um novo livro criado pelo utilizador, atribuindo-lhe um ID único e guardando-o na base de dados local */
    public async getDadosLeitura(idUtilizador: number) {
        await this.esperarPronto();
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
    /** Aguarda que o armazenamento esteja totalmente pronto a usar antes de qualquer operação */
    async esperarPronto() {
        await this.estaPronto;
    }
    /** Garante que um utilizador que seja devolvido pela base de dados tenha sempre um avatar válido */
    private normalizarUtilizador(utilizador: Utilizador): Utilizador {
        return {
            ...utilizador,
            avatar: utilizador.avatar || AVATAR_PADRAO
        };
    }
}
