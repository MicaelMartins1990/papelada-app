import { Posse } from "../enums/posse";

export interface LivroPessoal {
    idLivro: number,
    idUtilizador: number,
    posse: Posse,
    lido: boolean,
    avaliacao: number | null,
    comentario: string | null,
    dataAvaliacao: string | null,
    emprestimo: Emprestimo | null,
}

export interface Emprestimo {
    idRecipiente: number,
    dataEmprestimo: Date,
    dataDevolucao: Date
}
