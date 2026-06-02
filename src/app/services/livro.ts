import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Livro } from '../models/livro';

@Injectable({
    providedIn: 'root'
})
export class LivroService {
    private _storage: Storage | null = null;

    // Temporário
    private capaUrl = 'assets/data/capa-teste.txt';
    private livrosUrl = 'assets/data/livros.json';
    private capaTeste = '';

    constructor(private http: HttpClient, private storage: Storage) {
        this.init();
    }

    async init() {
        if (!this._storage) {
            this._storage = await this.storage.create();
        }
        // Temporário
        this.capaTeste = await firstValueFrom(this.http.get(this.capaUrl, { responseType: 'text' })) || '';
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

    public async registarLivro(titulo: string, autor: string, capa: string = this.capaTeste): Promise<Livro> {
        const livros = await this.getLivros();
        const novoLivro: Livro = {
            id: this.getNovoId(livros),
            titulo: titulo,
            autor: autor,
            capa: capa,
        };
        livros.push(novoLivro);
        await this._storage?.set('livros', livros);
        return novoLivro;
    }

    private getNovoId(livros: Livro[]): number {
        if (livros.length === 0) return 1;
        return Math.max(...livros.map(livro => livro.id || 0)) + 1;
    }

    private async carregarLivrosIniciais(): Promise<Livro[]> {
        const livros = await firstValueFrom(this.http.get<any[]>(this.livrosUrl));
        return (livros || []).map(livro => this.normalizarLivro(livro));
    }

    private normalizarLivro(livro: any): Livro {
        return {
            id: Number(livro.id),
            titulo: livro.titulo,
            autor: livro.autor,
            capa: livro.capa
        };
    }
}
