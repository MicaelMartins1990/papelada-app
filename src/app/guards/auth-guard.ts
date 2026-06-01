import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthServiceGuard implements CanActivate {
  
  constructor(private auth: AuthService, private router: Router) {}

  async canActivate(): Promise<boolean> {
        await this.auth.esperarPronto()
        if (!this.auth.estaLogado()) {
            this.router.navigateByUrl('');
            return false;
        }
    return true;
  }
}