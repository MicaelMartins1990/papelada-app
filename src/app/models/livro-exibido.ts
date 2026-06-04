import { Posse } from "../enums/posse";

export interface LivroExibido {
    id: number;
    titulo: string;
    autor: string;
    capa: string;
    posse: Posse;
    lido: boolean;
    emprestado: boolean;
    avaliacao: number | null;
    totalAvaliacoes: number;
    generos: string[];
}
