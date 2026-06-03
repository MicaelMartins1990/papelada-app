import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Livro } from '../models/livro';
import { Capacitor } from '@capacitor/core';

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

    async init() {
        if (!this._storage) {
            this._storage = await this.storage.create();
        }
    }

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

    public async carregarCapa(livro: Livro) {
        if (livro.inicial) return livro.capa;
        return Capacitor.convertFileSrc(livro.capa)
    }

    private getNovoId(livros: Livro[]): number {
        if (livros.length === 0) return 1;
        return Math.max(...livros.map(livro => livro.id || 0)) + 1;
    }

    private async carregarLivrosIniciais(): Promise<Livro[]> {
        const livros = await firstValueFrom(this.http.get<any[]>(this.livrosUrl));
        const livrosNormalizados = (livros || []).map(livro => this.normalizarLivro(livro, true));
        return livrosNormalizados;
    }

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

    public async getGeneros(): Promise<string[]> {
        return await firstValueFrom(this.http.get<string[]>(this.generosUrl));
    }
}
