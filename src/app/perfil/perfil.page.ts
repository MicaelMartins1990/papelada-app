import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth';
import { Router } from '@angular/router';
import { LivroPessoalService } from '../services/livro-pessoal';
import { LivroStatus } from '../enums/livro-status'; // Verifica se o caminho da pasta enums está correto

@Component({
    selector: 'app-perfil',
    templateUrl: './perfil.page.html',
    styleUrls: ['./perfil.page.scss'],
    standalone: false
})
export class PerfilPage implements OnInit {
    public nomeUtilizador: string = '';
    public totalLidos: number = 0;
    public totalDesejos: number = 0;

    constructor(
        private auth: AuthService, 
        private router: Router,
        private livroPessoalService: LivroPessoalService
    ) { }

    async ngOnInit() {
        // 1. Espera que o Storage da autenticação esteja pronto
        await this.auth.esperarPronto();
        
        // 2. Descobre quem é o utilizador logado
        const idAtual = this.auth.getIdUtilizador();

        if (idAtual !== null) {
            // 3. Vai buscar o Nome do utilizador
            const listaUsers = await this.auth.getUtilizadoresPublicos();
            const user = listaUsers.find(u => u.id === idAtual);
            if (user) {
                this.nomeUtilizador = user.nome;
            }

           // 4. Vai buscar os livros para as estatísticas
            const meusLivros = await this.livroPessoalService.getLivroPessoal(idAtual);
            
            if (meusLivros) {
                // Agora usamos os nomes exatos do Enum do teu colega!
                this.totalLidos = meusLivros.filter(l => l.status === LivroStatus.LIDO).length;
                this.totalDesejos = meusLivros.filter(l => l.status === LivroStatus.DESEJADO).length;
            }
        }
    }

    async logout() {
        await this.auth.logout();
        // Mantém a navegação exata que o teu colega definiu
        this.router.navigateByUrl(''); 
    }
}
