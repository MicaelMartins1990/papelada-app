import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth';
import { Router } from '@angular/router';
import { DadosLeitura } from '../models/dados-leitura';
import { UtilizadorService } from '../services/utilizador';

@Component({
    selector: 'app-perfil',
    templateUrl: './perfil.page.html',
    styleUrls: ['./perfil.page.scss'],
    standalone: false
})
export class PerfilPage implements OnInit {
    public nomeUtilizador: string = '';
    public dadosLeitura: DadosLeitura | null = null;

    constructor(
        private authService: AuthService, 
        private router: Router,
        private utilizadorService: UtilizadorService
    ) { }

    async ngOnInit() {
        // 1. Espera que o Storage da autenticação esteja pronto
        await this.authService.esperarPronto();
        
        // 2. Descobre quem é o utilizador logado
        const idAtual = this.authService.getIdUtilizador();
    
        if (idAtual !== null) {
            // 3. Vai buscar o Nome do utilizador
            const listaUsers = await this.authService.getUtilizadoresPublicos();
            const user = listaUsers.find(u => u.id === idAtual);
            if (user) {
                this.nomeUtilizador = user.nome;
            }
            // 4. Obtenção dos dados de leitura
            this.dadosLeitura = await this.utilizadorService.getDadosLeitura(idAtual);
        }
    }

    async logout() {
        await this.authService.logout();
        this.router.navigateByUrl(''); 
    }
}
