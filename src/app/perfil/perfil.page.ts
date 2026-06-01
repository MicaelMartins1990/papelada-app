import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth';
import { Router } from '@angular/router';

@Component({
    selector: 'app-perfil',
    templateUrl: './perfil.page.html',
    styleUrls: ['./perfil.page.scss'],
    standalone: false
})
export class PerfilPage implements OnInit {

    constructor(private auth: AuthService, private router: Router) { }

    ngOnInit() {
    }

    async logout() {
        await this.auth.logout();
        this.router.navigateByUrl('');
    }
}
