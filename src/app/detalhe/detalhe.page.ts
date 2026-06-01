import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NavController } from '@ionic/angular';
import { LivroService } from '../services/livro';
import { LivroPessoalService } from '../services/livro-pessoal';
import { Livro } from '../models/livro';
import { AuthService } from '../services/auth';
import { LivroStatus } from '../enums/livro-status';

@Component({
    selector: 'app-detalhe',
    templateUrl: './detalhe.page.html',
    styleUrls: ['./detalhe.page.scss'],
    standalone: false
})
export class DetalhePage implements OnInit {
    public livro: Livro | null = null;
    public avaliacaoAtual: number = 0;
    public comentarioAtual: string = '';

    public idUtilizador!: number;

    constructor(
        private route: ActivatedRoute,
        private navCtrl: NavController,
        private livroService: LivroService,
        private livroPessoalService: LivroPessoalService,
        private authService: AuthService,
        private router: Router
    ) {
    }

    async ngOnInit() {
        const idParam = this.route.snapshot.paramMap.get('id');

        if (idParam) {
            const idLivro = Number(idParam);
            
            await this.carregarUtilizador();

            const [livros, registosPessoais] = await Promise.all([
                this.livroService.getLivros(),
                this.livroPessoalService.getLivroPessoal(this.idUtilizador)
            ]);
            const livro = livros.find(l => l.id === idLivro);

            if (livro) {
                this.livro = livro;
                const livroPessoal = registosPessoais.find(lp => lp.idLivro === idLivro);
                if (livroPessoal) {
                    this.avaliacaoAtual = livroPessoal.avaliacao ?? 0;
                    this.comentarioAtual = livroPessoal.comentario ?? '';
                }
            }
        }
    }

    private async carregarUtilizador() {
        await this.authService.esperarPronto();
        const id = this.authService.getIdUtilizador();
        if (id == null) {
            this.router.navigateByUrl('/');
            return;
        }
        this.idUtilizador = id;
    }

    setAvaliacao(nota: number) {
        this.avaliacaoAtual = nota;
    }

    async guardarAvaliacao() {
        if (this.livro) {
            await this.livroPessoalService.adicionarAvaliacao(
                this.idUtilizador,
                this.livro.id,
                this.avaliacaoAtual,
                this.comentarioAtual
            );
            await this.livroPessoalService.atualizarStatus(
                this.idUtilizador,
                this.livro.id,
                LivroStatus.LIDO
            );
            alert('Avaliação guardada com sucesso!');
            this.navCtrl.back();
        }
    }
}