extends SceneTree
var app: Control
var failures := 0

func _initialize() -> void:
	OS.set_environment("GEMINI_API_KEY", "") # Simulate opening from Explorer, without Codex's environment.
	call_deferred("run")

func check(value: bool, label: String) -> void:
	print(("PASS: " if value else "FAIL: ") + label)
	if not value: failures += 1

func press(text: String) -> void:
	var buttons := app.find_children("*", "Button", true, false)
	for button in buttons:
		if button.text == text and button.is_visible_in_tree():
			button.pressed.emit()
			return
	check(false, "Button found: " + text)

func await_request() -> void:
	var start := Time.get_ticks_msec()
	while app.client.busy and Time.get_ticks_msec() - start < 100000:
		await create_timer(0.1).timeout
	check(not app.client.busy, "Request finished before deadline")

func capture(name_: String) -> void:
	if not "--capture" in OS.get_cmdline_user_args(): return
	await process_frame
	await process_frame
	await RenderingServer.frame_post_draw
	root.get_texture().get_image().save_png("res://tests/" + name_ + ".png")

func run() -> void:
	app = load("res://main.tscn").instantiate()
	root.add_child(app)
	app.prefs.autoSave = false
	app.prefs.textSpeed = "Rápido"
	app.prefs.autoNarrate = false
	check(app.client.credential_source == "Chave local protegida pelo Windows", "Protected local credential loaded without environment variable")
	await capture("restored-menu")
	press("Jogar")
	check(app.screen == "playModeSelection", "Jogar opens role selection")
	await capture("restored-role")
	app.mode = "player"
	app.show_screen("genreSelection")
	await capture("restored-genres")
	press("Isekai")
	check(app.screen == "characterCreation", "Isekai goes directly to character creation")
	app.fields.playerName.text = "Teste de integração"
	app.character.playerName = "Teste de integração"
	app.fields.characterName.text = "Elara"
	app.character.characterName = "Elara"
	app.fields.appearance.text = "Cabelos castanhos e capa de viagem."
	app.character.appearance = app.fields.appearance.text
	await capture("restored-character")
	press("Iniciar Aventura")
	check(app.screen == "inGame", "Start adventure enters gameplay")
	await await_request()
	check(app.state.world.history.size() == 2, "Opening narrative committed through actual gameplay")
	if app.state.world.history.size() != 2:
		print("UI ERROR: " + app.message.text)
		await capture("restored-error")
		quit(1)
		return
	check(app.state.world.location != "Local Desconhecido", "Location updated from Gemini")
	check(app.state.world.skills.size() >= 2, "Original Isekai skills present")
	check(app.state.world.inventory.size() >= 1, "Starting weapon present")
	app.input.text = "Olho ao redor e descrevo em voz baixa meu nome: Elara. O que vejo perto de mim?"
	press("Enviar")
	await await_request()
	check(app.state.world.history.size() == 4, "Second conversational turn completed")
	await capture("restored-game")
	app._open_panel("Status")
	await capture("restored-status")
	app._close_modal()
	app._open_panel("Habilidades")
	await capture("restored-skills")
	app._close_modal()
	var original: Dictionary = app.state.world.duplicate(true)
	check(app.storage.save_world(original), "Save actual adventure")
	var saved: Array = app.storage.list_saves("adventures")
	var found := false
	for entry in saved:
		if entry.get("data", {}).get("id") == original.id:
			app._load_world(entry.data)
			found = app.state.world.history.size() == 4
	check(found, "Reload preserves actual two-turn conversation")
	# Master mode exercises the opposite Gemini role through the same UI controller.
	app.client.cancel()
	app.mode = "master"
	app.state.begin(app.character, "Fantasia", "Medieval", "master")
	app.genre = "Fantasia"
	app.setting = "Medieval"
	app.show_screen("inGame")
	app.input.text = "Você, Elara, chega à entrada de uma taverna. Uma guarda pergunta seu nome. O que você faz?"
	press("Enviar")
	await await_request()
	check(app.state.world.history.size() == 2, "Master mode receives AI adventurer response")
	await capture("restored-master")
	print("RESTORED LIVE RESULT: %d failures" % failures)
	quit(0 if failures == 0 else 1)
