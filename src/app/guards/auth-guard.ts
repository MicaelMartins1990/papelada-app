import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Auth } from '../services/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  
  constructor(private auth: Auth, private router: Router) {}

  async canActivate(): Promise<boolean> {
        await this.auth.esperarPronto()
        if (!this.auth.estaLogado()) {
            this.router.navigateByUrl('');
            return false;
        }
    return true;
  }
}