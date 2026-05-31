import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavController } from '@ionic/angular';
import { LivroService, Livro } from '../services/livro';

@Component({
  selector: 'app-detalhe',
  templateUrl: './detalhe.page.html',
  styleUrls: ['./detalhe.page.scss'],
  standalone: false 
})
export class DetalhePage implements OnInit {
  public livro: any;
  public avaliacaoAtual: number = 0;
  public comentarioAtual: string = '';

  constructor(
    private route: ActivatedRoute,
    private navCtrl: NavController,
    private livroService: LivroService
  ) {}

  async ngOnInit() {
    // 1. Garantir que a base de dados central já carregou
    await this.livroService.init(); 
    
    // 2. Obter o ID passado pelo URL através do ActivatedRoute
    const id = this.route.snapshot.paramMap.get('id');
    
    if (id) {
      // 3. Procurar o livro exato na nossa lista
      this.livro = this.livroService.getLivros().find(l => l.id === id);
      
      // 4. Preencher os campos com os dados existentes (se já tiver sido avaliado antes)
      if (this.livro) {
        this.avaliacaoAtual = this.livro.avaliacao;
        this.comentarioAtual = this.livro.comentario;
      }
    }
  }

  // Função chamada sempre que se clica numa estrela
  setAvaliacao(nota: number) {
    this.avaliacaoAtual = nota;
  }

  
  // Função para gravar os dados e voltar para trás
  guardarAvaliacao() {
    if (this.livro) {
      // Em vez de alterar o objeto diretamente, chamamos o Service
      this.livroService.adicionarAvaliacao(this.livro.id, this.avaliacaoAtual, this.comentarioAtual);
      
      alert('Avaliação guardada com sucesso!');
      
      // O NavController regressa automaticamente à página de onde viemos
      this.navCtrl.back(); 
    }
  }
}