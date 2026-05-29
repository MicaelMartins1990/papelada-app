import { Component, OnInit } from '@angular/core';
import { LivroService, Livro } from '../services/livro';

@Component({
  selector: 'app-pesquisa',
  templateUrl: './pesquisa.page.html',
  styleUrls: ['./pesquisa.page.scss'],
  standalone: false
})
export class PesquisaPage implements OnInit {
  public todosOsLivros: Livro[] = [];
  public livrosFiltrados: Livro[] = [];
  public estaAcarregar: boolean = true; 

  constructor(private livroService: LivroService) { }

  
  async ngOnInit() {
    // O await OBRIGA a página a parar aqui e a esperar que o JSON seja lido por completo
    await this.livroService.init();

    this.todosOsLivros = this.livroService.getLivros();
    this.livrosFiltrados = this.todosOsLivros;
    this.estaAcarregar = false; 
  }

  public filtrarLivros(event: any) {
    const texto = event.target.value ? event.target.value.toLowerCase().trim() : '';

    if (texto === '') {
      this.livrosFiltrados = this.todosOsLivros;
    } else {
      this.livrosFiltrados = this.todosOsLivros.filter(livro => 
        livro.titulo.toLowerCase().includes(texto) || 
        livro.autor.toLowerCase().includes(texto)
      );
    }
  }

  public adicionarAListaDeDesejos(livroId: string) {
    this.livroService.atualizarStatus(livroId, 'quero_ler');
    alert('Livro adicionado à tua Lista de Desejos!');
  }
}