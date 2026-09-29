# Frações em Órbita

Jogo educacional de tabuleiro (2 a 4 jogadores) sobre frações, em HTML5 + CSS3 + JavaScript puro (sem frameworks, sem backend).

## Como jogar localmente

Basta abrir o arquivo `index.html` diretamente no navegador (duplo clique ou "Abrir com..."). Não é necessário servidor, build ou instalação.

## Estrutura do projeto

```
index.html
css/
  main.css        - tokens visuais, layout, telas, botões
  board.css        - estilo do tabuleiro em SVG
  cards.css         - modais, missões, perguntas, ilustrações, eventos
  animations.css      - keyframes
js/
  fractions.js  - parsing, simplificação e equivalência de frações
  questions.js  - as 60 missões (20 fáceis, 20 médias, 20 difíceis)
  events.js     - as 12 cartas de evento
  game.js       - estado central e regras do jogo (GameEngine)
  board.js      - renderização e animação do tabuleiro (BoardRenderer)
  ui.js         - telas, modais e fluxo de jogo (UIController)
  audio.js      - gerenciador de áudio simples com fallback sintetizado
  app.js        - ponto de entrada
assets/
  audio/   - coloque aqui hover.mp3, click.mp3, correct.mp3, incorrect.mp3,
             event.mp3, move.mp3 e victory.mp3 para sons reais (opcional —
             sem os arquivos, o jogo usa bipes sintetizados)
  icons/   - reservado para ícones adicionais, se desejar
```

## Persistência

O progresso da partida é salvo automaticamente em `localStorage`. Se a aba for
fechada ou recarregada, o jogo oferece continuar a missão em andamento ou
começar uma nova.

## Notas de implementação

- O tabuleiro é desenhado dinamicamente em SVG (12 setores geometricamente
  distribuídos como um relógio, setor 12 no topo, setor 6 embaixo).
- O sistema de frações reconhece equivalências (ex.: 3/6 é aceito para 1/2),
  exceto quando a pergunta pede explicitamente para simplificar.
- As 12 cartas de evento são sorteadas apenas quando um jogador termina
  exatamente em um setor 3, 6 ou 9 (passar pelo setor não ativa o evento).

## Evolução — versão finalizada

Esta revisão adiciona acabamento de produto ao protótipo original: identidade visual mais coesa, tela inicial com ambientação orbital, tabuleiro com planeta central detalhado, painel de tripulação com progresso e estatísticas, indicador de rodada e região, resumo final de desempenho, responsividade refinada, respeito a `prefers-reduced-motion` e suporte PWA/offline quando publicado em HTTPS/localhost.

### Deploy

O projeto continua 100% estático. Pode ser publicado diretamente em Vercel, Netlify, GitHub Pages ou Cloudflare Pages sem backend e sem etapa de build.

## Multiplayer online (Guest)
Esta versão inclui modo online em tempo real para 2–4 jogadores, sem cadastro. Rode `npm install` e depois `npm start`; abra `http://localhost:3000`. O host cria uma sala e compartilha o código.

O `server.js` serve o frontend e o Socket.IO, então o deploy mais simples pode ser feito inteiro como um Web Service Node no Render. O `render.yaml` está incluído. Se preferir Vercel + Render, hospede o frontend na Vercel e defina `window.MULTIPLAYER_SERVER_URL` com a URL pública do backend antes de carregar `multiplayer.js`.

O modo online já inclui salas Guest, códigos, host, 2–4 jogadores, turnos autoritativos, validação das respostas no servidor, missões Normal/Avançada/Crítica, equivalência de frações, movimento, vitória exata em 12/12, estatísticas, rodada, revelação sincronizada de eventos, reinício pelo host e tratamento básico de desconexão. Nesta primeira integração, os efeitos estratégicos das cartas de Evento continuam completos no modo local; no online os eventos são sorteados/revelados, mas seus modificadores ainda não alteram o turno.

## Multiplayer completo (v2)
O modo online agora reutiliza o mesmo tabuleiro `BoardRenderer`, painel de tripulação, modais e linguagem visual do modo local. O servidor é autoritativo e implementa as 12 cartas de evento, obstáculos, escolha entre perguntas, retry, wormhole, dica, cronômetro, tecnologia alienígena, supernova, assistência gravitacional, alternativas eliminadas, baralhos, vitória exata em 12/12, reinício e reconexão temporária de convidados.
