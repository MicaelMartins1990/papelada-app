import { LivroStatus } from "../enums/livro-status";

export interface LivroPessoal {
    idLivro: number,
    idUtilizador: number,
    status: LivroStatus,
    avaliacao: number | null,
    comentario: string | null,
    dataAvaliacao: string | null,
    emprestimo: Emprestimo | null,
}

export interface Emprestimo {
    idRecipiente: number,
    dataDevolucao: Date
}
