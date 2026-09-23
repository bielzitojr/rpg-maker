# RPG Maker

RPG narrativo em português com mestre baseado no Gemini e interface em Godot. Inclui criação de personagem, aventura Isekai com prólogo em quadrinhos, árvore de habilidades, inventário ilustrado, bestiário, testes de atributos e partidas salvas localmente.

## Executar a versão Godot

1. Instale Godot 4 (projeto validado em 4.7.2) e Git LFS.
2. Clone o projeto e obtenha os arquivos de áudio:

```sh
git lfs install
git clone https://github.com/bielzitojr/rpg-maker.git
cd rpg-maker
git lfs pull
```

3. Importe `godot/project.godot` no Godot e pressione F5.
4. Em Configurações, informe sua própria chave do Gemini e teste a conexão. Também é possível usar a variável de ambiente `GEMINI_API_KEY`.

A conversa e a geração de retratos precisam de internet e acesso aos modelos configurados. Nenhuma chave ou partida salva acompanha este repositório. Mantenha a pasta `public` junto de `godot`, pois ela contém a música utilizada pelo jogo.

## Conteúdo

- `godot/`: jogo atual, scripts, dados, ilustrações e testes.
- `public/assets/audio/`: trilhas e efeitos, armazenados com Git LFS.
- `components/`, `hooks/`, `services/`, `utils/` e arquivos TypeScript na raiz: versão web original.

A versão web pode ser instalada com `npm install` e iniciada com `npm run dev`. Configure suas próprias credenciais localmente usando `.env.example` como referência.

## Testes locais

```sh
godot --headless --path godot --script res://tests/restore_tests.gd -- --test
godot --path godot --script res://tests/v2_tests.gd -- --test
```

A segunda suíte abre uma janela para verificar a interface. Ambas usam dados isolados. Scripts com `live` no nome podem fazer chamadas reais à API.

## Novidades

Veja [itens, atributos e habilidades](godot/ATUALIZACAO-ITENS.md), [catálogos](godot/CATALOGOS.md) e [modo Isekai](godot/ISEKAI.md).

Fontes incluem seus arquivos de licença em `godot/assets/fonts`. Os prompts das ilustrações estão nas pastas de assets correspondentes.
