import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthServiceGuard implements CanActivate {
  
  constructor(private auth: AuthService, private router: Router) {}
  /** Guarda de rota que verifica se o utilizador tem permissão para aceder à página.*/
  async canActivate(): Promise<boolean> {
    // Aguarda que o serviço de autenticação termine a inicialização
        await this.auth.esperarPronto()
        // Verifica se o utilizador está autenticado
        if (!this.auth.estaLogado()) {
          // Se não estiver, envia para a página inicial (login/boas-vindas)
            this.router.navigateByUrl('');
            return false; // Bloqueia o acesso à rota
        }
    // Se estiver logado, permite o acesso
    return true;
  }
}