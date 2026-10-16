# Lume Reserve

Frontend demonstrativo de um e-commerce premium de bebidas, desenvolvido para apresentar uma experiência de compra moderna, responsiva e acessível em um portfólio profissional.

> **Projeto de demonstração:** o nome, identidade visual, e-mail e textos da marca são genéricos para facilitar a publicação em um portfólio público. O projeto não representa uma operação comercial real.

## Visão geral

O Lume Reserve apresenta:

- Home com hero editorial, imagem de bebidas e chamadas para ação.
- Catálogo com busca, filtros por categoria e faixa de preço.
- Detalhes de produto, carrinho e checkout.
- Fluxo de autenticação, conta, endereços e histórico de pedidos.
- Área administrativa para produtos, categorias, usuários, pedidos e pagamentos.
- Tema escuro/claro com preferência persistida no navegador.
- Barreira de maioridade antes do acesso à experiência.
- Navegação de retorno global em todas as páginas internas.
- Layout responsivo para mobile, tablet e desktop.

## Stack

- Angular 21 com componentes standalone.
- TypeScript 5.9.
- Tailwind CSS 4.
- Angular Router com lazy loading.
- Reactive Forms e Signals.
- Ng Icons (Lucide e Heroicons).
- Mercado Pago Payment Brick no checkout.
- Karma/Jasmine para testes unitários.

## Requisitos

- Node.js 20.19+ (ou versão compatível com Angular 21).
- npm 10+.
- Backend da aplicação disponível em `http://localhost:8080` para catálogo, autenticação e pedidos.

## Como executar

```bash
npm install
npm start
```

Abra `http://localhost:4200`.

Para iniciar o servidor em outro host:

```bash
npx ng serve --host=127.0.0.1
```

## Configuração

A URL da API fica em `src/environments/environment.ts`.

Para habilitar o checkout com Mercado Pago, informe a chave pública:

```ts
mercadoPagoPublicKey: 'TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
```

A chave privada deve permanecer exclusivamente no backend, usando a variável `MERCADOPAGO_ACCESS_TOKEN`.

## Scripts

| Comando | Objetivo |
| --- | --- |
| `npm start` | Inicia o servidor de desenvolvimento |
| `npm run build` | Gera o build de produção |
| `npm run watch` | Compila continuamente em modo desenvolvimento |
| `npm run lint` | Executa o lint do Angular |
| `npm test -- --watch=false --browsers=ChromeHeadless` | Executa os testes unitários sem modo interativo |

## Decisões de produto e trade-offs

### Identidade genérica

“Lume Reserve” substitui o nome original por uma marca neutra, curta e adequada a portfólio. Isso evita acoplamento a um negócio específico e facilita adaptar textos, domínio e identidade posteriormente.

### Barreira de maioridade

A confirmação de 18 anos é exibida no nível raiz, antes de qualquer rota, e é persistida em `localStorage` para evitar interromper a navegação a cada página.

Esse mecanismo é uma barreira de UX, não uma validação legal ou verificação de identidade. Em uma operação real, a regra deve ser complementada por políticas, geolocalização e validações exigidas pela legislação aplicável.

### Botão de voltar global

O botão é um componente único renderizado pelo shell da aplicação. Ele usa o histórico do navegador e, quando não há histórico útil, volta para `/home`.

Essa abordagem evita duplicação em cada tela e mantém a interação consistente. A home não exibe o botão porque não existe uma página anterior relevante dentro do fluxo principal.

### Header e hero

O header usa uma borda de baixa opacidade, em vez de uma linha forte, para não parecer cortar a imagem do hero. O conteúdo começa exatamente abaixo da altura real do header e a imagem recebe gradientes para preservar contraste e leitura.

No mobile, a navegação vira um menu compacto com acesso ao carrinho, conta, administração e tema. No desktop, a navegação permanece horizontal.

### Responsividade

Foram priorizados grids fluidos, botões com largura confortável no toque, tipografia escalável e `svh` no hero. A imagem é local e copiada pelo pipeline de assets do Angular, evitando depender de um CDN externo em produção.

### Tema

O tema escuro é o padrão visual da marca. O tema claro continua disponível porque oferece acessibilidade e preferência pessoal sem duplicar componentes.

## Estrutura de pastas

```text
src/
├── app/
│   ├── core/                 # guards, serviços, modelos e layouts
│   ├── features/             # funcionalidades por domínio
│   └── shared/components/    # header, footer, notificações, age gate e retorno
├── environments/             # configuração da API e integrações
├── index.html
└── styles.css                # tokens visuais e utilitários globais
public/assets/images/         # imagens estáticas, incluindo o hero
```

## Validação local

Antes de abrir um pull request:

```bash
npm run lint
npm run build
npx ng test --watch=false --browsers=ChromeHeadless
```

O build deve concluir sem erros e o lint deve permanecer limpo. Os testes de integração com API exigem o backend em execução.

## Docker

Se o projeto possuir o `Dockerfile` configurado:

```bash
docker build -t lume-reserve-frontend .
docker run --rm -p 4200:80 lume-reserve-frontend
```

## Próximos passos

- Adicionar testes de componentes para o age gate, menu mobile e botão de retorno.
- Substituir o `localStorage` da maioridade por uma solução alinhada à política jurídica do negócio real.
- Adicionar tratamento de estados offline e skeletons de carregamento no catálogo.
- Configurar observabilidade e analytics com consentimento explícito.
- Revisar acessibilidade com axe e navegação completa via teclado.
