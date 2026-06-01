import { LivroStatus } from "../enums/livro-status";

export interface LivroExibido {
    id: number;
    titulo: string;
    autor: string;
    capa: string;
    status: LivroStatus;
    avaliacao: number | null;
}