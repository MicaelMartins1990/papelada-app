import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth';
import { Router } from '@angular/router';
import { UtilizadorService } from '../services/utilizador';

@Component({
    selector: 'app-perfil',
    templateUrl: './perfil.page.html',
    styleUrls: ['./perfil.page.scss'],
    standalone: false
})
export class PerfilPage implements OnInit {
    public nomeUtilizador: string = '';
    public totalPossuidos: number = 0;
    public totalEmprestados: number = 0;
    public totalDesejos: number = 0;

    constructor(
        private auth: AuthService, 
        private router: Router,
        private utilizadorService: UtilizadorService
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

            const dadosLeitura = await this.utilizadorService.getDadosLeitura(idAtual);
            this.totalPossuidos = dadosLeitura.livrosPossuidos;
            this.totalEmprestados = dadosLeitura.livrosEmprestados;
            this.totalDesejos = dadosLeitura.livrosDesejados;
        }
    }

    async logout() {
        await this.auth.logout();
        // Mantém a navegação exata que o teu colega definiu
        this.router.navigateByUrl(''); 
    }
}
