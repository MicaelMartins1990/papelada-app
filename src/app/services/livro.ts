import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

// Definição da Interface do Objeto Livro
export interface Livro {
  id: string;
  titulo: string;
  autor: string;
  capa: string;
  status: string; // 'disponivel', 'quero_ler', 'lido', 'emprestado'
  avaliacao: number;
  comentario: string;
  prestadoA: string;
  dataDevolucao: string;
}

@Injectable({
  providedIn: 'root'
})
export class LivroService {
  private jsonUrl = 'assets/data/livros.json';
  private livros: Livro[] = [];

  constructor(private http: HttpClient) {
  }

  // (async/await)
  async init() {
    // Se a lista estiver vazia, esperamos que o HTTP leia o JSON antes de avançar
    if (this.livros.length === 0) {
      return new Promise<void>((resolve) => {
        this.http.get<Livro[]>(this.jsonUrl).subscribe(dados => {
          this.livros = dados;
          resolve(); // Só dá sinal quando a lista estiver preenchida!
        });
      });
    }
  }

  getLivros(): Livro[] {
    return this.livros;
  }

  // Altera o estado de um livro (Tarefa 1: Adicionar à Lista de Desejos / Quero Ler)
  atualizarStatus(id: string, novoStatus: string) {
    const index = this.livros.findIndex(l => l.id === id);
    if (index >= 0) {
      this.livros[index].status = novoStatus;
    }
  }

  // Regista a opinião e nota do utilizador (Tarefa 2: Avaliar e Comentar)
  adicionarAvaliacao(id: string, nota: number, texto: string) {
    const index = this.livros.findIndex(l => l.id === id);
    if (index >= 0) {
      this.livros[index].status = 'lido';
      this.livros[index].avaliacao = nota;
      this.livros[index].comentario = texto;
    }
  }

  // Regista um empréstimo físico a um contacto (Tarefa 3)
  registarEmprestimo(id: string, amigo: string, data: string) {
    const index = this.livros.findIndex(l => l.id === id);
    if (index >= 0) {
      this.livros[index].status = 'emprestado';
      this.livros[index].prestadoA = amigo;
      this.livros[index].dataDevolucao = data;
    }
  }
}