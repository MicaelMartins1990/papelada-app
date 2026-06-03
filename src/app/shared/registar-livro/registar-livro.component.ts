import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { Camera, CameraResultType } from '@capacitor/camera';
import { LivroService } from '../../services/livro';
import { Resultado } from '../../enums/resultado';

@Component({
    selector: 'app-registar-livro',
    templateUrl: './registar-livro.component.html',
    styleUrls: ['./registar-livro.component.scss'],
    standalone: false
})
export class RegistarLivroComponent {
    private livroService = inject(LivroService);
    private toastController = inject(ToastController);

    @Input() idUtilizador!: number;
    @Input() generos: string[] = [];

    @Output() registado = new EventEmitter<void>();
    @Output() cancelado = new EventEmitter<void>();

    public tituloInput: string = '';
    public autorInput: string = '';
    public imagemCapa: string = '';
    public generosInput: string[] = [];

    public get formularioCompleto(): boolean {
        return !!this.tituloInput.trim() && !!this.autorInput.trim() && !!this.imagemCapa;
    }

    public async tirarFoto() {
        const res = await this.carregarCapa();
        if (res !== Resultado.EXITO) {
            await this.mostrarToast('Não foi possível capturar a foto.', 'danger');
        }
    }

    public async registarLivro() {
        if (!this.formularioCompleto) return;

        try {
            await this.livroService.registarLivro(
                this.tituloInput.trim(),
                this.autorInput.trim(),
                this.imagemCapa,
                this.generosInput
            );
            await this.mostrarToast('Livro registado com sucesso!', 'success');
            this.limparFormulario();
            this.registado.emit();
        } catch {
            await this.mostrarToast('Erro ao registar o livro.', 'danger');
        }
    }

    public cancelar() {
        this.limparFormulario();
        this.cancelado.emit();
    }

    public async carregarCapa(): Promise<Resultado> {
        try {
            const image = await Camera.getPhoto({
                quality: 60,
                allowEditing: false,
                resultType: CameraResultType.Uri
            });

            if (!image.webPath) return Resultado.NAO_ENCONTRADO;

            const img = new Image();
            img.src = image.webPath;
            await img.decode();

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const tamanhoDesejado = 300;
            let larguraDesejada = img.width;
            let alturaDesejada = img.height;

            if (img.width < img.height) {
                if (img.width > tamanhoDesejado) {
                    larguraDesejada = tamanhoDesejado;
                    alturaDesejada = (img.height / img.width) * tamanhoDesejado;
                }
            } else if (img.height > tamanhoDesejado) {
                alturaDesejada = tamanhoDesejado;
                larguraDesejada = (img.width / img.height) * tamanhoDesejado;
            }
            canvas.width = larguraDesejada;
            canvas.height = alturaDesejada;

            if (!ctx) return Resultado.ERRO;

            ctx.drawImage(img, 0, 0, larguraDesejada, alturaDesejada);
            this.imagemCapa = canvas.toDataURL('image/jpeg', 0.85);
            return Resultado.EXITO;
        } catch {
            return Resultado.ERRO;
        }
    }

    private limparFormulario() {
        this.tituloInput = '';
        this.autorInput = '';
        this.imagemCapa = '';
        this.generosInput = [];
    }

    private async mostrarToast(mensagem: string, cor: 'success' | 'danger') {
        const toast = await this.toastController.create({
            message: mensagem,
            duration: cor === 'success' ? 1800 : 2000,
            color: cor,
            icon: cor === 'success' ? 'checkmark-circle-outline' : undefined
        });
        await toast.present();
    }
}
