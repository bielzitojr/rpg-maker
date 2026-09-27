# Jogar online

https://bielzitojr.github.io/rpg-maker/

O GitHub Actions testa, exporta para Windows e Web e publica no GitHub Pages a cada atualização da versão Godot na main. O navegador precisa de WebGL 2 e WebAssembly. O primeiro carregamento baixa os recursos do jogo e pode demorar.

Cada jogador configura sua própria chave em Configurações. Chaves privadas não são incluídas na publicação. Os saves da versão Web ficam no armazenamento local do navegador; limpar os dados do site remove esse progresso. Os limites de cada provedor de IA continuam aplicáveis.

A versão Web usa exportação sem threads para funcionar no GitHub Pages sem cabeçalhos especiais de isolamento. O build e o deploy devem concluir antes de considerar o link atualizado.
