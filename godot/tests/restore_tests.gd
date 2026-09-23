extends SceneTree
const State = preload("res://scripts/rpg_state.gd")
const Store = preload("res://scripts/rpg_store.gd")
const API = preload("res://scripts/gemini_api.gd")
var total := 0
var failures := 0
var app: Control

func check(condition: bool, label: String) -> void:
	total += 1
	if not condition:
		failures += 1
		printerr("FAIL: " + label)

func _initialize() -> void:
	call_deferred("run")

func run() -> void:
	var game := State.new()
	check(game.catalog.achievements.size() == 80, "All original achievements imported")
	check(State.GENRES.size() == 9 and State.SETTINGS.size() == 8, "Original genres and settings")
	var profile := game.profile()
	profile.characterName = "Elara"
	profile.playerName = "Teste"
	game.begin(profile, "Isekai", "Um Mundo de Fantasia com Sistema de Jogo", "player")
	check(game.world.status.strength == 3 and game.world.status.constitution == 3, "Race and class bonuses")
	check(game.world.status.maxHealth == 40, "Original health formula")
	check(game.world.inventory.size() == 1, "Initial weapon exists once")
	check(game.world.skills.is_empty(), "Isekai starts with skill choices")
	check(game.world.status.skillPoints == 2, "Isekai starting points")
	check(not game.world.character.has("provacao"), "Biblical trial does not leak into other genres")
	check(game.learn_tree("origin_1"), "Class skill can be unlocked")
	check(game.world.status.skillPoints == 1, "Unlock spends one point")
	check(game.world.skills[0].level == 1, "Unlocked skill starts at level one")
	check(game.normalize_response(null).is_empty(), "Null response rejected")
	check(game.normalize_response({"storyText": ""}).is_empty(), "Empty narrative rejected")
	var update := game.normalize_response({"storyText": "A porta se abre.", "location": "Templo", "inventory": [{"name": "Poção", "quantity": 2, "type": "Consumível", "description": "Cura"}], "bestiary": [{"name": "Goblin", "description": "Pequeno", "knownInfo": {"health": "Baixa"}}], "allies": [{"name": "Mira", "description": "Guia"}], "playerStatus": {"health": -10, "mana": "wrong"}, "enemies": [{"id": "g1", "name": "Goblin", "health": 12, "maxHealth": 12}], "actionSuggestions": ["Observar", 10], "diceRollChallenge": true})
	game.commit("Abrir a porta", update)
	check(game.world.history.size() == 2, "Turn committed atomically")
	check(game.world.location == "Templo" and "Templo" in game.world.visited, "Location and visited locations")
	check(game.world.status.health == 0 and game.world.status.mana == 20, "Malformed numeric state does not corrupt resources")
	check(game.world.suggestions == ["Observar"], "Suggestions filtered")
	check(game.world.dice, "Dice challenge enabled")
	check(game.world.initiativePending, "Enemy encounter requires initiative")
	check(game.world.inventory[1].quantity == 2, "Items gained")
	check(game.world.bestiary.size() == 1 and game.world.allies.size() == 1, "Bestiary and allies updated")
	game.roll_initiative()
	check(game.world.turnOrder.size() == 3 and not game.world.initiativePending, "Initiative includes player ally enemy")
	var actor := str(game.actor().id)
	game.advance_turn(actor)
	check(game.actor().id != actor, "Turn advances")
	game.apply_update({"storyText": "Segue", "inventory": [{"name": "Poção", "quantity": 1}], "bestiary": [{"name": "Goblin", "knownInfo": {"weaknesses": ["Fogo"]}}]})
	check(game.world.inventory[1].quantity == 3, "Item stack increments")
	check(game.world.bestiary.size() == 1 and game.world.bestiary[0].knownInfo.has("weaknesses"), "Bestiary updated without duplicate")
	check(game.world.bestiary[0].knownInfo.get("health") == "Baixa", "Bestiary keeps previously discovered facts")
	check(game.world.enemies.size() == 1, "Omitted enemies does not end combat")
	game.apply_update({"storyText": "Venceu", "enemies": []})
	check(game.world.turnOrder.is_empty() and game.world.enemies.is_empty(), "Explicit empty enemies ends combat")
	game.apply_update({"storyText": "Novo nível", "playerStatus": {"level": 2}, "unlockedAchievementId": "isekai_1"})
	check(game.world.status.skillPoints == 3, "Level adds skill points")
	check(game.world.achievements.size() == 1, "Achievement unlocked once")
	game.apply_update({"storyText": "Segue", "unlockedAchievementId": "isekai_1"})
	check(game.world.achievements.size() == 1, "Duplicate achievement ignored")
	game.world.notebook.notes = "Uma pista importante"
	var storage := Store.new()
	storage.base = "res://tests/unit-runtime"
	check(storage.save_world(game.world), "Save structured adventure")
	var list := storage.list_saves("adventures")
	var found: Dictionary = {}
	for entry in list:
		if entry.get("data", {}).get("id") == game.world.id: found = entry.data
	check(State.valid_save(found), "Serialized state accepted")
	check(found.get("notebook", {}).get("notes") == "Uma pista importante", "Notebook persists")
	check(found.get("inventory", []).size() == 2 and found.get("skills", []).size() == 1 and found.skills[0].treeId == "origin_1", "Inventory and chosen skill persist")
	check(storage.save_world(game.world, "characters"), "Separate character save")
	check(storage.save_world(game.world), "Atomic overwrite with backup")
	check(not State.valid_save({"version": 2}), "Corrupted save rejected")
	check(API.extract_text({"candidates": []}) == "", "Blocked API response")
	check(API.extract_text({"candidates": [{"content": {"parts": [{"thought": true, "text": "private"}, {"text": "Narrativa"}]}}]}) == "Narrativa", "Thinking excluded")
	app = load("res://main.tscn").instantiate()
	root.add_child(app)
	app.prefs.autoSave = false
	app.prefs.textSpeed = "Rápido"
	for screen_ in ["mainMenu", "playModeSelection", "genreSelection", "settingSelection", "achievements", "loadGame", "updateNotes"]:
		app.show_screen(screen_)
		check(app.screen == screen_, "Open " + screen_)
	app.mode = "player"
	app._choose_genre("Isekai")
	check(app.screen == "characterCreation", "Isekai shortcut")
	check(app.fields.size() == 3 and app.fields.has("gender"), "Isekai only asks identity")
	app._choose_genre("Fantasia")
	app._choose_setting("Medieval")
	app._random_character()
	check(not app.character.characterName.is_empty() and not app.character.playerName.is_empty(), "Random character fills names")
	check(not app.character.appearance.is_empty(), "Random appearance available offline")
	app._save_portrait(Image.load_from_file("res://assets/icons/character.png"))
	check(FileAccess.file_exists(app.character.image), "Local portrait saved without Gemini")
	check(app.portrait.texture is ImageTexture, "Local portrait displayed")
	app.operation = "portrait"
	app._failure("Quota exceeded (HTTP 429)")
	check(app.message.text.contains("Use Carregar"), "Image quota error offers local image fallback")
	app._choose_genre("Fantasia")
	check(app.screen == "settingSelection", "Other genres use setting step")
	app._choose_setting("Medieval")
	check(app.fields.has("weapon") and app.fields.has("background"), "Weapon and background fields restored")
	app.state = game
	app.character = game.world.character.duplicate(true)
	app.genre = "Isekai"
	app.mode = "player"
	app.show_screen("inGame")
	check(app.hud_row.get_child_count() == 10, "All player HUD sections restored")
	for name_ in ["Status", "Habilidades", "Inventário", "Bestiário", "Aliados", "Inimigos", "Mapa", "Sistema", "Ajuda", "Configurações"]:
		app._open_panel(name_)
		check(is_instance_valid(app.overlay), "Open panel " + name_)
		app._close_modal()
	var previous: int = game.world.history.size()
	app.pending = "Uma ação"
	app.operation = "turn"
	app.input.text = "Uma ação"
	app._failure("Falha simulada")
	check(game.world.history.size() == previous and app.input.text == "Uma ação", "Network failure keeps history and draft")
	check(app.retry_button.visible, "Retry action is visible")
	app.operation = "turn"
	app.pending = "Uma ação"
	app._reply("JSON inválido")
	check(game.world.history.size() == previous, "Malformed JSON cannot commit turn")
	app.operation = "turn"
	app.pending = "Uma ação"
	app._cancel()
	app._reply('{"storyText":"Resposta tardia"}')
	check(game.world.history.size() == previous, "Cancelled late reply ignored")
	app.operation = "turn"
	app.pending = "Primeira ação"
	app.opening = true
	app._reply('{"storyText":"Cena inicial","location":"Cidade","inventory":[{"name":"Espada Longa","quantity":1}]}')
	check(game.world.inventory.size() == 2, "Opening does not duplicate starting weapon")
	app.mode = "master"
	app.state.begin(app.character, "Fantasia", "Medieval", "master")
	app.show_screen("inGame")
	check(app.hud_row.get_child_count() == 6, "Master tools restored")
	for panel in ["Caderno", "Geradores", "Inimigos"]:
		app._open_panel(panel)
		check(is_instance_valid(app.overlay), "Master panel " + panel)
		app._close_modal()
	app.queue_free()
	await process_frame
	print("RESTORED TESTS: %d checks, %d failures" % [total, failures])
	quit(1 if failures else 0)
