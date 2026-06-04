import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Livro } from '../models/livro';
import { LivroPessoal } from '../models/livro-pessoal';
import { Posse } from '../enums/posse';
import { Capacitor } from '@capacitor/core';

/** Livro recomendado mais os géneros que partilha com o livro de referência. */
export interface LivroSemelhante {
    livro: Livro;
    generosPartilhados: string[];
}

@Injectable({
    providedIn: 'root'
})
export class LivroService {
    private _storage: Storage | null = null;

    private livrosUrl = 'assets/data/livros.json';
    private generosUrl = 'assets/data/generos.json';

    constructor(private http: HttpClient, private storage: Storage) {
        this.init();
    }
    /** Inicializa a ligação ao armazenamento (storage) local da aplicação */
    async init() {
        if (!this._storage) {
            this._storage = await this.storage.create();
        }
    }
    /** Vai buscar a lista completa de livros, garantindo que os livros padrão da aplicação (JSON) estão sempre incluídos e misturados com os criados pelo utilizador */
    public async getLivros(): Promise<Livro[]> {
        await this.init();
        const livros = await this._storage?.get('livros');
        const livrosGuardados = Array.isArray(livros)
            ? livros.map(livro => this.normalizarLivro(livro))
            : [];

        const totalGuardado = livrosGuardados.length;
        const livrosIniciais = await this.carregarLivrosIniciais();
        const idsGuardados = new Set(livrosGuardados.map(livro => livro.id));

        for (const livroInicial of livrosIniciais) {
            if (!idsGuardados.has(livroInicial.id)) {
                livrosGuardados.push(livroInicial);
            }
        }

        if (!Array.isArray(livros) || livrosGuardados.length !== totalGuardado) {
            await this._storage?.set('livros', livrosGuardados);
        }

        return livrosGuardados;
    }
    /** Regista um novo livro criado manualmente pelo utilizador e guarda-o na base de dados local */
    public async registarLivro(titulo: string, autor: string, capa: string, generos: string[] = []): Promise<Livro> {
        const livros = await this.getLivros();
        const novoLivro: Livro = {
            id: this.getNovoId(livros),
            titulo: titulo,
            autor: autor,
            capa: capa,
            inicial: false,
            generos: generos
        };
        livros.push(novoLivro);
        await this._storage?.set('livros', livros);
        return novoLivro;
    }
    /** Prepara o caminho da imagem da capa para ser lido corretamente pelo telemóvel (converte ficheiros locais do dispositivo se necessário) */
    public async carregarCapa(livro: Livro) {
        if (livro.inicial) return livro.capa;
        return Capacitor.convertFileSrc(livro.capa)
    }
    /** Calcula qual deve ser o próximo ID (identificador) numérico disponível para um livro novo */
    private getNovoId(livros: Livro[]): number {
        if (livros.length === 0) return 1;
        return Math.max(...livros.map(livro => livro.id || 0)) + 1;
    }
    /** Lê os livros pré-configurados que vêm dentro da própria aplicação (ficheiro livros.json) */
    private async carregarLivrosIniciais(): Promise<Livro[]> {
        const livros = await firstValueFrom(this.http.get<any[]>(this.livrosUrl));
        const livrosNormalizados = (livros || []).map(livro => this.normalizarLivro(livro, true));
        return livrosNormalizados;
    }
    /** Garante que um livro tem todos os dados no formato correto antes de ser usado na aplicação */
    private normalizarLivro(livro: any, inicial: boolean = false): Livro {
        return {
            id: Number(livro.id),
            titulo: livro.titulo,
            autor: livro.autor,
            capa: livro.capa,
            inicial: inicial,
            generos: livro.generos || []
        };
    }
    /** Lê a lista de géneros literários possíveis a partir do ficheiro generos.json */
    public async getGeneros(): Promise<string[]> {
        return await firstValueFrom(this.http.get<string[]>(this.generosUrl));
    }

    /**
     * Recomenda livros que partilham géneros com `livroBase`, excluindo o próprio
     * livro e os que o utilizador já tem (biblioteca ou desejos). Ordena por número
     * de géneros partilhados (desc), com desempate determinístico por título.
     *
     * Recebe os registos pessoais já carregados em vez de os ir buscar, para não
     * acoplar este serviço ao LivroPessoalService nem duplicar a leitura.
     */
    public async getLivrosSemelhantes(
        livroBase: Livro,
        registosPessoais: LivroPessoal[],
        limite: number = 12
    ): Promise<LivroSemelhante[]> {
        const generosBase = livroBase.generos || [];
        if (generosBase.length === 0) {
            return [];
        }

        const idsPossuidos = new Set(
            registosPessoais
                .filter(registo => registo.posse === Posse.NA_BIBLIOTECA || registo.posse === Posse.DESEJADO)
                .map(registo => registo.idLivro)
        );

        const livros = await this.getLivros();

        return livros
            .filter(livro => livro.id !== livroBase.id && !idsPossuidos.has(livro.id))
            .map(livro => ({
                livro,
                generosPartilhados: (livro.generos || []).filter(genero => generosBase.includes(genero))
            }))
            .filter(candidato => candidato.generosPartilhados.length > 0)
            .sort((a, b) =>
                b.generosPartilhados.length - a.generosPartilhados.length
                || a.livro.titulo.localeCompare(b.livro.titulo)
            )
            .slice(0, limite);
    }
}
