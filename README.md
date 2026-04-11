# PDF Generator API

![Node.js 22](https://img.shields.io/badge/node.js-22-339933?style=flat-square&logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-5+-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Serverless Framework](https://img.shields.io/badge/serverless-v4-FD5750?style=flat-square&logo=serverless&logoColor=white)
![AWS Lambda](https://img.shields.io/badge/aws-lambda-FF9900?style=flat-square&logo=awslambda&logoColor=white)
![API Gateway HTTP API](https://img.shields.io/badge/api%20gateway-http%20api-8C4FFF?style=flat-square&logo=amazonapigateway&logoColor=white)
![Amazon S3](https://img.shields.io/badge/amazon-s3-569A31?style=flat-square&logo=amazons3&logoColor=white)
![Puppeteer](https://img.shields.io/badge/puppeteer-pdf%20generation-40B5A4?style=flat-square&logo=puppeteer&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/github%20actions-ci%2Fcd-2088FF?style=flat-square&logo=githubactions&logoColor=white)

API serverless para gerar PDFs sob demanda com **AWS Lambda + Puppeteer + S3**, estruturada com **Clean Architecture** e empacotada com **Serverless Framework v4**.
.

A proposta foi construir um serviço pequeno, objetivo e fácil de revisar, mas com decisões de arquitetura e operação próximas de um ambiente real. A intenção é que o repositório funcione como uma amostra prática de como eu estruturo integrações serverless na AWS, com foco em clareza, deploy e tratamento de casos operacionais.

## Motivação

A ideia deste projeto é resolver um problema comum em produtos B2B e operações internas:

- receber dados transacionais via API
- montar um documento visualmente consistente
- gerar um PDF no backend
- armazenar o artefato com segurança
- retornar uma URL temporária para download

Em vez de acoplar isso a um monólito ou a uma aplicação web tradicional, a solução usa um fluxo serverless, mais adequado para workloads event-driven e burst de geração.

Além do problema funcional em si, houve uma motivação adicional de portfólio: reunir em um projeto autoral uma combinação de serviços que uso rotineiramente.

## Por Que HTTP API e Não REST API

A escolha por **API Gateway HTTP API** foi intencional.

Para este caso de uso, eu não preciso de:
- API Keys
- Usage Plans
- throttling por consumidor
- features legadas do API Gateway REST

Eu preciso de:
- menor custo operacional
- menor latência
- configuração mais simples
- integração direta com Lambda

Por isso, **HTTP API** faz mais sentido do que **REST API** neste projeto. Em um produto real com múltiplos clientes externos, monetização por chave, quotas ou políticas avançadas, eu reavaliaria essa escolha.

## Stack

- Node.js 22
- TypeScript
- Serverless Framework v4
- AWS Lambda
- API Gateway HTTP API
- Puppeteer Core
- `@sparticuz/chromium-min`
- AWS SDK v3
- Amazon S3
- Zod
- Pino
- GitHub Actions

## Arquitetura

O projeto segue uma separação simples inspirada em Clean Architecture:

```text
src/
|-- app/       # casos de uso, DTOs e erros de aplicação
|-- domain/    # entidades de domínio
|-- infra/     # adapters AWS, config e controller HTTP
|-- factories/ # composição das dependências
`-- utils/     # logger e template HTML
```

Regra de dependência:

```text
Domain <- App <- Infra <- Handler
```

Isso mantém o núcleo da aplicação relativamente isolado de framework, Lambda e SDK da AWS.

## Fluxo da Requisição

```text
POST /generate-pdf
  -> Lambda handler
  -> Controller HTTP
  -> validação com Zod
  -> use case de geração
  -> HTML builder
  -> Puppeteer + Chromium
  -> upload para S3
  -> URL pré-assinada
```

## Endpoint

### `POST /generate-pdf`

Exemplo de payload:

```json
{
  "title": "Comprovante de Entrega #001",
  "recipientName": "Kaio Henrique",
  "recipientDocument": "123.456.789-00",
  "deliveryDate": "2026-04-11",
  "items": [
    {
      "description": "Notebook Dell Latitude 5440",
      "quantity": 1,
      "unit": "UN"
    },
    {
      "description": "Mouse sem fio Logitech",
      "quantity": 2,
      "unit": "UN"
    }
  ],
  "notes": "Entregue em mãos ao destinatário, sem avarias."
}
```

Resposta esperada:

```json
{
  "url": "https://...",
  "expiresAt": "2026-04-11T19:00:00.000Z"
}
```

Erros conhecidos:
- `400` quando o body está ausente ou inválido
- `422` quando o schema falha
- `500` quando falha a geração do PDF ou o upload para o S3

## Public Test Endpoint

```md
### Live Demo

`POST https://vt5duuq2o5.execute-api.us-east-1.amazonaws.com/generate-pdf`

```

## Decisões Técnicas

### 1. Chromium separado do código

O projeto usa `@sparticuz/chromium-min` para evitar empacotar um binário gigante dentro da Lambda. O runtime baixa ou resolve o pack compatível em tempo de execução.

Isso reduz o artefato da função, mas exige disciplina de versionamento:
- `puppeteer-core`
- `@sparticuz/chromium-min`
- `CHROMIUM_PACK_URL`

Esses três precisam estar coerentes.

### 2. URL pré-assinada em vez de bucket público

O PDF nunca fica público. O S3 armazena o arquivo e a API retorna uma **pre-signed URL** com tempo de expiração.

Isso melhora:
- segurança
- controle de acesso
- aderência a cenários corporativos

### 3. Validação explícita na borda

A entrada HTTP é validada com **Zod** no controller. Assim:
- a Lambda responde erro sem entrar no caso de uso
- o domínio recebe dados já conformes
- a resposta de erro fica mais previsível

### 4. Logger estruturado

Em produção, os logs são estruturados para CloudWatch. Em desenvolvimento, o projeto usa saída legível com `pino-pretty`.

## Execução Local

### Pré-requisitos

- Node.js 22
- npm
- uma conta AWS
- um bucket S3 existente para testes locais com S3 real, ou um nome de bucket único para o primeiro deploy via CloudFormation
- Chrome/Chromium local

### Variáveis de ambiente

Crie um `.env` a partir de `.env.example`.

Exemplo:

```env
BUCKET_NAME=pdf-generator-yourname-dev
AWS_S3_REGION=us-east-1
CHROMIUM_BIN_PATH=C:\Chromium\chrome-win\chrome.exe
CHROMIUM_PACK_URL=https://github.com/Sparticuz/chromium/releases/download/v147.0.0/chromium-v147.0.0-pack.x64.tar
LOG_LEVEL=debug
NODE_ENV=development
```

Observações:
- `AWS_S3_REGION` deve ser a **região real do bucket**
- `CHROMIUM_PACK_URL` deve ser compatível com a versão instalada de `@sparticuz/chromium-min` no repositório
- em `serverless offline`, o bucket precisa existir se você estiver usando S3 real
- no CI, a região está fixa em `us-east-1`; localmente você pode usar outra região, desde que `AWS_S3_REGION` bata com a região real do bucket

### Rodando

```bash
npm ci
npm run type-check
npm run lint
npm run dev
```

## Deploy

O deploy é feito com:

```bash
npm run deploy:dev
npm run deploy:prod
```

O repositório também possui workflow de GitHub Actions para deploy por branch:
- `dev` -> ambiente de desenvolvimento
- `main` -> ambiente de produção

O `serverless.yml` também cria o bucket via CloudFormation durante o deploy. Por isso, cada ambiente deve usar um `BUCKET_NAME` único. Se o nome já existir fora da stack, o deploy falha.

## GitHub Environments e Secrets

O workflow usa **GitHub Environments**:

- `development` para a branch `dev`
- `production` para a branch `main`

Em cada environment, configure estes mesmos secrets:

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `SERVERLESS_ACCESS_KEY`
- `CHROMIUM_PACK_URL`
- `BUCKET_NAME`

A ideia é manter os mesmos nomes de secrets em ambos os environments e trocar apenas os valores.

A região está padronizada como `us-east-1` no workflow.


## O Que Este Projeto Demonstra

- capacidade de desenhar uma API com responsabilidade única
- uso pragmático de arquitetura em projeto pequeno
- integração com AWS sem acoplamento excessivo ao framework
- tratamento de erros operacionais reais, como mismatch de região do S3
- preocupação com segurança, custo e deploy

Não é um “toy project” no sentido de só devolver um hello world. Ele passa por problemas reais de engenharia:
- empacotamento de Chromium
- diferença entre ambiente local e Lambda
- composição de infraestrutura
- artefatos no S3
- validação e observabilidade

## Próximos Passos

Melhorias naturais para evoluir este projeto:

1. testes unitários para use case, controller e adapters
2. testes de integração locais com LocalStack
3. CI com validação de deploy por pull request
4. autenticação e autorização para consumo externo
5. geração de múltiplos documentos por lote
6. observabilidade com métricas e tracing (x-ray)

## Estrutura Atual

Arquivos principais:

- [handler.ts](/c:/projetos/pdf-generator/handler.ts)
- [serverless.yml](/c:/projetos/pdf-generator/serverless.yml)
- [src/infra/http/generate-pdf.controller.ts](/c:/projetos/pdf-generator/src/infra/http/generate-pdf.controller.ts)
- [src/app/use-cases/generate-pdf.use-case.ts](/c:/projetos/pdf-generator/src/app/use-cases/generate-pdf.use-case.ts)
- [src/app/services/pdf-builder.service.ts](/c:/projetos/pdf-generator/src/app/services/pdf-builder.service.ts)
- [src/infra/cloud/s3.adapter.ts](/c:/projetos/pdf-generator/src/infra/cloud/s3.adapter.ts)
- [docs/PDF_GENERATOR_PROJECT_GUIDE.md](/c:/projetos/pdf-generator/docs/PDF_GENERATOR_PROJECT_GUIDE.md)

## Status

Projeto funcional em evolução, com fluxo principal implementado e pipeline pronto para versionamento e deploy.

Como peça de portfólio, ele foi desenhado para ser lido rapidamente por recrutadores e entrevistadores, mas com profundidade técnica suficiente para sustentar perguntas sobre arquitetura, operação, trade-offs e uso real de AWS em contexto serverless.
