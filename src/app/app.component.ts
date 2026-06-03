import { Component, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { App, URLOpenListenerEvent } from '@capacitor/app';

@Component({
    selector: 'app-root',
    templateUrl: 'app.component.html',
    styleUrls: ['app.component.scss'],
    standalone: false,
})
export class AppComponent {
    constructor(
        private router: Router,
        private zone: NgZone
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
    }
}
