import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthServiceGuard } from './guards/auth-guard';

const routes: Routes = [
    {
        path: '',
        loadChildren: () => import('./login/login.module').then(m => m.LoginPageModule)
    },
    {
        path: 'criar-conta',
        loadChildren: () => import('./criar-conta/criar-conta.module').then(m => m.CriarContaPageModule)
    },
    {
        path: 'tabs',
        loadChildren: () => import('./tabs/tabs.module').then(m => m.TabsPageModule),
        canActivate: [AuthServiceGuard]
    },
];
@NgModule({
    imports: [
        RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
    ],
    exports: [RouterModule]
})
export class AppRoutingModule { }
