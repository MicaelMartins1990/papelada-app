import { Component, OnInit } from '@angular/core';
import { Livro, LivroService } from '../services/livro';

@Component({
  selector: 'app-emprestimos',
  templateUrl: './emprestimos.page.html',
  styleUrls: ['./emprestimos.page.scss'],
  standalone: false
})
export class EmprestimosPage implements OnInit {
  public livros: Livro[] = [];
  public emprestimosAtivos: Livro[] = [];
  public livroSelecionadoId: string = '';
  public nomeAmigo: string = '';
  public dataDevolucao: string = '';
  public mensagemErro: string = '';
  public mensagemSucesso: string = '';
  public estaAcarregar: boolean = true;

  constructor(private livroService: LivroService) { }

  async ngOnInit() {
    await this.livroService.init();
    this.livros = this.livroService.getLivros();
    this.atualizarEmprestimosAtivos();
    this.estaAcarregar = false;
  }

  get livrosDisponiveis(): Livro[] {
    return this.livros.filter(livro => livro.status !== 'emprestado');
  }

  public registarEmprestimo() {
    this.mensagemErro = '';
    this.mensagemSucesso = '';

    if (!this.livroSelecionadoId || !this.nomeAmigo.trim() || !this.dataDevolucao) {
      this.mensagemErro = 'Preenche o livro, a pessoa e a data de devolução.';
      return;
    }

    this.livroService.registarEmprestimo(
      this.livroSelecionadoId,
      this.nomeAmigo.trim(),
      this.dataDevolucao
    );

    this.atualizarEmprestimosAtivos();
    this.limparFormulario();
    this.mensagemSucesso = 'Empréstimo guardado com sucesso.';
  }

  private atualizarEmprestimosAtivos() {
    this.emprestimosAtivos = this.livros.filter(livro => livro.status === 'emprestado');
  }

  private limparFormulario() {
    this.livroSelecionadoId = '';
    this.nomeAmigo = '';
    this.dataDevolucao = '';
  }
}
