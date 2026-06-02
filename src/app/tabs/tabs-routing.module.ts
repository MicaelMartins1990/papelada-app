import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

const routes: Routes = [
    {
        path: '',
        component: TabsPage,
        children: [
            {
                path: 'pesquisa',
                loadChildren: () => import('../pesquisa/pesquisa.module').then(m => m.PesquisaPageModule)
            },
            {
                path: 'amigos',
                children: [
                    {
                        path: '',
                        loadChildren: () => import('../amigos/amigos.module').then(m => m.AmigosPageModule)
                    },
                    {
                        path: 'detalhe/:id',
                        loadChildren: () => import('../amigo-detalhe/amigo-detalhe.module').then(m => m.AmigoDetalhePageModule)
                    },
                ]
            },
            {
                path: 'biblioteca',
                loadChildren: () => import('../biblioteca/biblioteca.module').then(m => m.BibliotecaPageModule)
            },
            {
                path: 'emprestimos',
                loadChildren: () => import('../emprestimos/emprestimos.module').then(m => m.EmprestimosPageModule)
            },
            {
                path: 'perfil',
                loadChildren: () => import('../perfil/perfil.module').then(m => m.PerfilPageModule)
            },
            
            {
                path: '',
                redirectTo: '/tabs/pesquisa',
                pathMatch: 'full'
            }
        ]
    },
    {
        path: '',
        redirectTo: '/tabs/pesquisa',
        pathMatch: 'full'
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class TabsPageRoutingModule { }