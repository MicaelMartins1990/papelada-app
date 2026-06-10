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

    /** Id do utilizador autenticado, usado ao registar o livro no serviço. */
    @Input() idUtilizador!: number;
    /** Lista de géneros disponíveis para associar ao livro. */
    @Input() generos: string[] = [];

    /** Emitido após o livro ser registado com sucesso. */
    @Output() registado = new EventEmitter<void>();
    /** Emitido quando o utilizador cancela o registo. */
    @Output() cancelado = new EventEmitter<void>();

    public tituloInput: string = '';
    public autorInput: string = '';
    public imagemCapa: string = '';
    public generosInput: string[] = [];

    /** Verdadeiro quando título, autor e capa estão preenchidos, habilitando o botão de registo. */
    public get formularioCompleto(): boolean {
        return !!this.tituloInput.trim() && !!this.autorInput.trim() && !!this.imagemCapa;
    }

    /**
     * Invoca a câmara para capturar a capa do livro.
     * Mostra toast de erro se a captura ou o processamento falharem.
     */
    public async tirarFoto() {
        const res = await this.carregarCapa();
        if (res !== Resultado.EXITO) {
            await this.mostrarToast('Não foi possível capturar a foto.', 'danger');
        }
    }

    /**
     * Valida o formulário e regista o livro via serviço.
     * Em caso de sucesso limpa o formulário e emite `registado`;
     * em caso de erro mostra toast de falha sem propagar a exceção.
     */
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

    /** Limpa o formulário e emite `cancelado` para o componente pai descartar a vista. */
    public cancelar() {
        this.limparFormulario();
        this.cancelado.emit();
    }

    /**
     * Abre a câmara do dispositivo, obtém a imagem capturada e redimensiona-a
     * para no máximo 300 px no lado mais curto, mantendo a proporção original.
     * A imagem final é guardada em `imagemCapa` como data URL JPEG (qualidade 85 %).
     * Devolve `Resultado.EXITO` em caso de sucesso, `Resultado.NAO_ENCONTRADO` se
     * não houver webPath, ou `Resultado.ERRO` em qualquer outra falha.
     */
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

    /** Repõe todos os campos do formulário para os valores iniciais. */
    private limparFormulario() {
        this.tituloInput = '';
        this.autorInput = '';
        this.imagemCapa = '';
        this.generosInput = [];
    }

    /**
     * Cria e apresenta um toast Ionic com a mensagem e cor indicadas.
     * Toasts de sucesso têm duração de 1800 ms e ícone de confirmação;
     * toasts de erro têm duração de 2000 ms sem ícone.
     */
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