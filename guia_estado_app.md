# Guia pratico de estado do projeto - Papelada

Objetivo: ter um ficheiro simples para o grupo perceber rapidamente o que ja esta implementado no codigo, o que esta incompleto e o que falta fechar para a entrega do trabalho.

Ultima analise ao codigo: 2026-06-01; 15:00H;; Flávio

## Resumo rapido

| Area | Estado | Nota pratica |
|---|---|---|
| Login | Feito | Cria sessao com Ionic Storage e protege as tabs com `AuthGuard`. |
| Criar conta | Feito | Guarda utilizadores no Ionic Storage com password hash. |
| Navegacao por tabs | Feito | Existem tabs para Pesquisa, Amigos, Biblioteca, Emprestimos e Perfil. |
| Pesquisa/Descobrir | Feito | Carrega livros do JSON, filtra por titulo/autor e permite adicionar aos desejos. |
| Biblioteca | Feito/Parcial | Mostra livros em "Desejos" e "Lidos"; abre detalhe por `id`. |
| Detalhe do livro | Feito/Parcial | Mostra livro, permite estrelas e comentario; falta persistencia real. |
| Amigos | Por fazer | Pagina existe mas esta vazia. |
| Emprestimos | Por fazer | Pagina existe mas esta vazia; Tarefa 3 ainda nao e demonstravel. |
| Perfil | Parcial | Tem logout, mas a pagina ainda parece inacabada e o titulo diz "Criar Conta". |
| Persistencia dos livros | Parcial | JSON carrega dados iniciais; alteracoes ficam so em memoria. |
| Capacitor/APK | Por fazer | Falta usar o capicitor por exemplo para evitar rotação do ecra e tambem preparar o apk mas isso é no final |

## Funcionalidades ja implementadas

### Autenticacao

- [x] Pagina de login criada.
- [x] Pagina de criar conta criada.
- [x] `Auth` service criado.
- [x] Ionic Storage configurado em `AppModule`.
- [x] Utilizadores guardados no Storage.
- [x] Password guardada com hash via `bcryptjs`.
- [x] Login valida username/password.
- [x] Logout existe no Perfil.
- [x] `AuthGuard` impede acesso a `/tabs` sem login.

Ficheiros principais:

- `src/app/login/login.page.ts`
- `src/app/criar-conta/criar-conta.page.ts`
- `src/app/services/auth.ts`
- `src/app/guards/auth-guard.ts`

### Navegacao e routing

- [x] App abre no login.
- [x] Rota para criar conta existe.
- [x] Tabs estao protegidas por `AuthGuard`.
- [x] Tabs configuradas: Pesquisa, Amigos, Biblioteca, Emprestimos e Perfil.
- [x] Rota de detalhe criada com parametro: `/detalhe/:id`.
- [x] `ActivatedRoute` usado na pagina de detalhe para obter o `id`.
- [x] Biblioteca envia o `id` do livro para a pagina de detalhe.

Ficheiros principais:

- `src/app/app-routing.module.ts`
- `src/app/tabs/tabs-routing.module.ts`
- `src/app/biblioteca/biblioteca.page.html`
- `src/app/detalhe/detalhe.page.ts`

### Dados dos livros

- [x] Existe ficheiro JSON com livros iniciais.
- [x] Existe `LivroService`.
- [x] `LivroService` carrega `assets/data/livros.json` com `HttpClient`.
- [x] Interface `Livro` tem campos para wishlist, avaliacao, comentario e emprestimo.
- [x] Existem metodos para:
  - atualizar status;
  - adicionar avaliacao;
  - registar emprestimo.

Ficheiros principais:

- `src/assets/data/livros.json`
- `src/app/services/livro.ts`

### Pesquisa / Descobrir

- [x] Pagina visual implementada.
- [x] Lista livros em grelha com capas.
- [x] Pesquisa por titulo.
- [x] Pesquisa por autor.
- [x] Botao para adicionar livro a lista de desejos.
- [x] Mostra estado visual quando o livro ja esta em desejos.
- [x] Mostra mensagem quando nao ha resultados.

Ficheiros principais:

- `src/app/pesquisa/pesquisa.page.ts`
- `src/app/pesquisa/pesquisa.page.html`

### Biblioteca

- [x] Pagina visual implementada.
- [x] Segmento "Desejos".
- [x] Segmento "Lidos".
- [x] Lista livros filtrados por status.
- [x] Mostra capa, titulo e autor.
- [x] Mostra badge de avaliacao para livros lidos.
- [x] Clicar num livro abre a pagina de detalhe.
- [x] Mostra estado vazio quando nao ha livros na categoria.

Ficheiros principais:

- `src/app/biblioteca/biblioteca.page.ts`
- `src/app/biblioteca/biblioteca.page.html`

### Detalhe / Avaliacao

- [x] Pagina de detalhe recebe `id` por rota.
- [x] Procura o livro correto no `LivroService`.
- [x] Mostra capa, titulo e autor.
- [x] Permite selecionar avaliacao de 1 a 5 estrelas.
- [x] Permite escrever comentario.
- [x] Guardar avaliacao muda o livro para `lido`.
- [x] Guardar avaliacao guarda nota e comentario em memoria.
- [x] Mostra mensagem de erro se o livro nao existir.

Ficheiros principais:

- `src/app/detalhe/detalhe.page.ts`
- `src/app/detalhe/detalhe.page.html`

## Paginas existentes e estado de cada uma

| Pagina | Rota | Estado | O que ja faz | O que falta |
|---|---|---|---|---|
| Login | `/` | Feita | Valida utilizador e entra na app | Melhorar visual se houver tempo |
| Criar conta | `/criar-conta` | Feita | Cria utilizador no Storage | Melhorar validacoes se houver tempo |
| Pesquisa | `/tabs/pesquisa` | Feita | Pesquisa livros e adiciona a desejos | Trocar `alert()` por toast |
| Biblioteca | `/tabs/biblioteca` | Feita/Parcial | Mostra desejos/lidos e abre detalhe | Confirmar atualizacao ao voltar da avaliacao |
| Detalhe | `/detalhe/:id` | Feita/Parcial | Avalia e comenta livro | Proteger rota com login e persistir dados |
| Amigos | `/tabs/amigos` | Por fazer | Apenas titulo/template | Criar conteudo minimo ou esconder se nao for usado |
| Emprestimos | `/tabs/emprestimos` | Por fazer | Apenas titulo/template | Implementar Tarefa 3 |
| Perfil | `/tabs/perfil` | Parcial | Logout | Corrigir titulo e mostrar dados do utilizador |

## Estado das 3 tarefas obrigatorias

### Tarefa 1 - Adicionar livro aos desejos

Estado: implementada, mas com persistencia limitada.

Fluxo atual:

- [x] Login.
- [x] Abrir Pesquisa.
- [x] Pesquisar livro.
- [x] Clicar no icon de bookmark.
- [x] Livro muda para `quero_ler`.
- [x] Livro aparece em Biblioteca > Desejos.

Falta melhorar:

- [ ] Guardar alteracao no Ionic Storage para sobreviver a refresh/reabertura.
- [ ] Substituir `alert()` por `ToastController`.

### Tarefa 2 - Avaliar e comentar livro

Estado: implementada, mas com persistencia limitada.

Fluxo atual:

- [x] Abrir Biblioteca.
- [x] Clicar num livro.
- [x] Navegar para `/detalhe/:id`.
- [x] Ver dados do livro correto.
- [x] Selecionar estrelas.
- [x] Escrever comentario.
- [x] Guardar avaliacao.
- [x] Livro passa para `lido`.

Falta melhorar:

- [ ] Guardar avaliacao/comentario no Ionic Storage.
- [ ] Validar se foi escolhida pelo menos 1 estrela.
- [ ] Trocar `alert()` por `ToastController`.
- [ ] Corrigir `defaultHref="/"` do botao voltar para algo como `/tabs/biblioteca`.
- [ ] Proteger rota `/detalhe/:id` com `AuthGuard`.

### Tarefa 3 - Registar emprestimo

Estado: por fazer na interface.

O que ja existe:

- [x] O modelo `Livro` ja tem `prestadoA` e `dataDevolucao`.
- [x] O `LivroService` ja tem metodo `registarEmprestimo(id, amigo, data)`.
- [x] Existe tab e rota para Emprestimos.

O que falta para ficar demonstravel:

- [ ] A pagina `EmprestimosPage` deve carregar livros do `LivroService`.
- [ ] Deve existir formulario para escolher livro.
- [ ] Deve existir campo para nome do amigo/contacto.
- [ ] Deve existir campo para data de devolucao.
- [ ] Botao "Guardar emprestimo".
- [ ] Chamar `livroService.registarEmprestimo(...)`.
- [ ] Mostrar lista de emprestimos ativos.
- [ ] Mostrar livro, pessoa e data na lista.
- [ ] Opcional: botao "Marcar como devolvido".

Esta e a maior prioridade antes da entrega, porque o enunciado diz que as 3 tarefas sao obrigatorias.

## O que falta para entrega

## P0 - Obrigatorio / risco alto

- [ ] Implementar a interface da Tarefa 3 em `Emprestimos`.
- [ ] Testar as 3 tarefas de ponta a ponta.
- [ ] Preparar app em dispositivo fisico.
- [ ] Gerar e testar APK.
- [ ] Confirmar que o projeto compila depois das alteracoes dos colegas.
- [ ] Atualizar o diario de desenvolvimento com contribuicoes de todos.
- [ ] Criar/rever ficheiro com ajuda humana/IA.

## P1 - Muito importante

- [ ] Persistir estado dos livros em Ionic Storage:
  - wishlist;
  - avaliacoes;
  - comentarios;
  - emprestimos.
- [ ] Corrigir Perfil:
  - titulo atual diz "Criar Conta";
  - mostrar nome/username do utilizador;
  - manter botao de logout.
- [ ] Dar conteudo minimo a Amigos ou decidir se fica fora da demonstracao.
- [ ] Proteger `/detalhe/:id` com `AuthGuard`.
- [ ] Trocar `alert()` por toasts Ionic.

## P2 - Melhorias se sobrar tempo

- [ ] Mover estilos inline para ficheiros `.scss`.
- [ ] Adicionar texto/labels nas tabs, se fizer sentido para a avaliacao heuristica.
- [ ] Melhorar estados vazios.
- [ ] Corrigir specs/testes unitarios.
- [ ] Validar melhor formularios.

## Requisitos do enunciado: estado atual

| Requisito | Estado atual | Evidencia / acao |
|---|---|---|
| 3 tarefas implementadas | Parcial | Tarefa 1 e 2 existem; Tarefa 3 falta UI. |
| App em dispositivo fisico | Por fazer | Isto é normla ainda nao estar feito uma vez que é para o fim. |
| Routing aplicado | Feito | `app-routing.module.ts` e `tabs-routing.module.ts`. |
| Angular Router | Feito | Navegacao login/criar conta/tabs/detalhe. |
| ActivatedRoute | Feito | `DetalhePage` le `id` da rota. |
| Passagem de parametros | Feito | Biblioteca abre `/detalhe/:id`. |
| Icones da framework | Feito | Varios `ion-icon`. |
| Modulos/services/assets organizados | Feito/Parcial | Estrutura existe; paginas Amigos/Emprestimos ainda vazias. |
| Ionic Storage | Parcial | Usado no login; falta livros/tarefas. |
| JSON | Feito | `assets/data/livros.json`. |
| Ionic Components | Feito | Tabs, cards, list, segment, inputs, buttons. |
| Capacitor | Por fazer | Falta adiconar funcionalidade para nao haver rotação de ecra. |
| CSS Custom Properties | Feito | `variables.scss` e propriedades Ionic inline. |
| Formatacoes globais | Feito | `global.scss`. |
| Services | Feito | `Auth` e `LivroService`. |
| Cores globais | Feito | `--ion-color-primary`, `--ion-color-secondary`, `--bg-color`. |
| Codigo comentado | Parcial | Ha comentarios, mas ainda pode melhorar. |
| Git com commits progressivos | Em progresso | Ver historico e URL final. |
| Ficheiro ajuda humana/IA | Por fazer | Tambem fica para o final  |
| Diario de desenvolvimento | Em desenvolvimento | `Diario.txt` existe e foi alterado; confirmar entradas de todos. |

## Plano pratico de fecho

### Antes de mexer mais no visual

- [ ] Fechar Tarefa 3.
- [ ] Confirmar que Tarefa 1 e Tarefa 2 ainda funcionam.
- [ ] Confirmar build local.
- [ ] Testar num fluxo real de demo.

### Depois de fechar as funcionalidades

- [ ] Guardar alteracoes dos livros em Ionic Storage.
- [ ] Corrigir Perfil.
- [ ] Rever Amigos.
- [ ] Preparar APK/dispositivo.
- [ ] Atualizar diario e ajuda IA.

### Antes da entrega

- [ ] Fazer clone/check limpo ou testar numa maquina sem estado anterior.
- [ ] Instalar dependencias.
- [ ] Compilar.
- [ ] Gerar APK.
- [ ] Instalar APK no telemovel.
- [ ] Fazer ensaio da apresentacao.
- [ ] Compactar projeto sem `node_modules` e sem `.angular`.

## Guiao de teste para o grupo

Usar esta sequencia para testar a app quando alguem der commit e disser que temrinou: 

### Teste 1 - Login

- [ ] Abrir app.
- [ ] Criar conta nova.
- [ ] Voltar ao login.
- [ ] Entrar com a conta criada.
- [ ] Confirmar que abre `/tabs/pesquisa`.
- [ ] Fazer logout no Perfil.
- [ ] Confirmar que volta ao login.

### Teste 2 - Wishlist

- [ ] Entrar na app.
- [ ] Abrir Pesquisa.
- [ ] Pesquisar `1984`.
- [ ] Adicionar aos desejos.
- [ ] Abrir Biblioteca.
- [ ] Confirmar que aparece em "Desejos".

### Teste 3 - Avaliacao

- [ ] Abrir Biblioteca.
- [ ] Abrir um livro.
- [ ] Selecionar 4 ou 5 estrelas.
- [ ] Escrever comentario.
- [ ] Guardar.
- [ ] Confirmar que aparece em "Lidos".

### Teste 4 - Emprestimo

- [ ] Abrir Emprestimos.
- [ ] Escolher um livro.
- [ ] Escrever nome da pessoa.
- [ ] Definir data de devolucao.
- [ ] Guardar.
- [ ] Confirmar que aparece na lista de emprestimos ativos.

### Teste 5 - Reabrir app

- [ ] Fechar a app ou fazer refresh.
- [ ] Entrar novamente.
- [ ] Confirmar se wishlist continua guardada.
- [ ] Confirmar se avaliacao/comentario continuam guardados.
- [ ] Confirmar se emprestimo continua guardado.

Se este teste falhar, significa que falta persistencia dos livros em Storage.

