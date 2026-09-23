extends SceneTree
var app: Control
var failed := 0
func _initialize() -> void:
	OS.set_environment("GEMINI_API_KEY", "")
	call_deferred("run")
func wait_request() -> void:
	var start := Time.get_ticks_msec()
	while app.client.busy and Time.get_ticks_msec() - start < 100000:
		await create_timer(0.1).timeout
func check(result: bool, name_: String) -> void:
	print(("PASS: " if result else "FAIL: ") + name_)
	if not result:
		failed += 1
		print("UI ERROR: " + app.message.text)
func run() -> void:
	app = load("res://main.tscn").instantiate()
	root.add_child(app)
	app.prefs.autoSave = false
	app._choose_genre("Isekai")
	app.character.playerName = "Teste"
	app.character.characterName = "Elara"
	app._random_field("appearance")
	await wait_request()
	check(not app.character.appearance.is_empty(), "Gemini generates character appearance")
	app._generate_portrait()
	await wait_request()
	check(not app.character.image.is_empty() and FileAccess.file_exists(app.character.image), "Gemini portrait saved and displayed")
	app.mode = "master"
	app.state.begin(app.character, "Fantasia", "Medieval", "master")
	app.genre = "Fantasia"
	app.setting = "Medieval"
	app.show_screen("inGame")
	app._open_panel("Geradores")
	for button in app.overlay.find_children("*", "Button", true, false):
		if button.text == "Gerar com Gemini": button.pressed.emit(); break
	await wait_request()
	check(not app.generator_result.is_empty(), "Master generator receives content")
	print("FEATURE LIVE: %d failures" % failed)
	quit(1 if failed else 0)
