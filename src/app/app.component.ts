import { Component, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { App, URLOpenListenerEvent } from '@capacitor/app';
import { NavController, Platform } from '@ionic/angular';

@Component({
    selector: 'app-root',
    templateUrl: 'app.component.html',
    styleUrls: ['app.component.scss'],
    standalone: false,
})
export class AppComponent {
    private historico: string[] = [];

    constructor(
        private router: Router,
        private platform: Platform,
        private zone: NgZone,
        private navController: NavController
    ) { }

    ngOnInit() {
        App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
            this.zone.run(() => {
                const slug = event.url.split('://').pop();
                if (slug) {
                    this.router.navigateByUrl(`/${slug}`);
                }
            });
        });
        this.platform.backButton.subscribeWithPriority(10, (processNextHandler) => {
            this.navController.back();
        });
    }    
}
