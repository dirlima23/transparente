# Transparente

Editor de transparência em português, sem dependências de execução externas.

## Baixar e testar sem instalar

Baixe o repositório em **Code → Download ZIP**, extraia os arquivos e abra **index.html** no Chrome, Edge ou Firefox atualizado. Essa versão funciona offline, sem Node.js ou servidor. Clique em **Abrir exemplo** ou importe sua imagem para testar.

Tanto `index.html` quanto `transparente.html` contêm o aplicativo completo, incluindo estilos e scripts. São versões idênticas e também funcionam quando hospedadas em uma subpasta. As imagens não são enviadas para a internet.

## Executar

Para desenvolver com os arquivos separados, use Node.js 20.11 ou superior:

```sh
cd transparente
npm start
```

O servidor usa a porta 3000 por padrão; configure `PORT` para alterar. Execute `npm test` para validar o algoritmo de seleção.

Edite o modelo `src/index.html`, os estilos `src/style.css` e os scripts em `src/`. Depois de alterar o código, execute `npm run build` para atualizar `index.html` e `transparente.html` antes de publicar. `npm start` e `npm run dev` também geram esses arquivos antes de iniciar o servidor.

## Usar

Importe JPG, PNG ou WebP (até 20 MB e 16 megapixels), ou carregue o exemplo. Clique no fundo para selecionar sua cor. “Remover fundo” usa o pixel superior esquerdo como referência. Ajuste tolerância e suavização; alterar esses controles recalcula a seleção e substitui os retoques atuais (Desfazer recupera a máscara anterior).

Use Apagar e Restaurar para retoques com pincel. O tamanho é medido em pixels da imagem original. Alterne entre Resultado, Original e Área removida; a sobreposição vermelha identifica pixels removidos. Baixar PNG exporta a imagem na resolução original, com canal alfa, independentemente do modo de visualização.

A seleção usa semelhança de cor, com opção de limitar a áreas conectadas. É indicada para fundos uniformes; não faz segmentação semântica por inteligência artificial. Fundos complexos exigem retoque manual. Arquivos são processados localmente no navegador e não são enviados ao servidor. O histórico armazena até cinco operações e não persiste após fechar a página.

## Interface

O visual acompanha o projeto `dirlima23/contorno`: tema escuro, detalhes verde-menta, controles numerados na lateral, ferramentas abaixo da prévia e painel de exportação. A janela Como funciona explica o fluxo. O indicador abaixo da imagem mostra a porcentagem equivalente de pixels removidos, incluindo transparência parcial.
