extends SceneTree
var app: Control

func _initialize() -> void:
	call_deferred("run")

func capture(name_: String) -> void:
	await create_timer(0.18).timeout
	await process_frame
	await process_frame
	await RenderingServer.frame_post_draw
	root.get_texture().get_image().save_png("res://tests/" + name_ + ".png")

func run() -> void:
	app = load("res://main.tscn").instantiate()
	root.add_child(app)
	app.prefs.autoSave = false
	app.prefs.textSpeed = "Rápido"
	await capture("restored-menu")
	app.show_screen("playModeSelection")
	await capture("restored-role")
	app.show_screen("genreSelection")
	await capture("restored-genres")
	app._choose_genre("Isekai")
	await capture("restored-character")
	app._choose_genre("Fantasia")
	await capture("restored-setting")
	app._choose_setting("Medieval")
	await capture("restored-character-fantasy")
	app.show_screen("mainMenu")
	app._settings_modal()
	# Do not capture a key field even though it is masked.
	for edit in app.overlay.find_children("*", "LineEdit", true, false):
		if edit.secret: edit.text = ""
	await capture("restored-settings")
	app._close_modal()
	var saves: Array = app.storage.list_saves("adventures")
	for entry in saves:
		if entry.has("data") and entry.data.history.size() == 4 and entry.data.mode == "player":
			app._load_world(entry.data)
			await capture("restored-game")
			app._open_panel("Status")
			await capture("restored-status")
			app._open_panel("Habilidades")
			await capture("restored-skills")
			app._close_modal()
			break
	print("VISUAL RESTORE: gallery rendered successfully")
	quit()
