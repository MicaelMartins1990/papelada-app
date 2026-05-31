import { Component, OnInit } from '@angular/core';
import { LivroService } from '../services/livro';

@Component({
  selector: 'app-biblioteca',
  templateUrl: './biblioteca.page.html',
  styleUrls: ['./biblioteca.page.scss'],
  standalone: false
})
export class BibliotecaPage implements OnInit {
  public livros: any[] = []; 
  public filtroAtual: string = 'quero_ler'; // A página arranca na aba "Desejos"

  constructor(private livroService: LivroService) {}

  
  async ngOnInit() {
    await this.livroService.init();
    this.livros = this.livroService.getLivros();
  }

  // Filtra a lista dependendo da aba selecionada (Desejos vs Lidos)
  get livrosFiltrados() {
    return this.livros.filter(livro => livro.status === this.filtroAtual);
  }

  // Aciona quando o utilizador clica nas abas
  alterarFiltro(event: any) {
    this.filtroAtual = event.detail.value;
  }
}