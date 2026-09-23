extends SceneTree
const ENTRIES = [["Status", "character"], ["Habilidades", "magic"], ["Inventário", "inventory"], ["Bestiário", "bestiary"], ["Aliados", "allies"], ["Inimigos", "enemies"], ["Mapa", "map"], ["Sistema", "system"], ["Configurações", "settings"], ["Ajuda", "help"]]

func _initialize() -> void:
	call_deferred("run")

func capture(path: String) -> void:
	await create_timer(0.15).timeout
	await process_frame
	await RenderingServer.frame_post_draw
	root.get_texture().get_image().save_png(path)

func run() -> void:
	var app = load("res://main.tscn").instantiate()
	root.add_child(app)
	app.prefs.illustratedIcons = true
	app.mode = "player"
	app.genre = "Isekai"
	app.setting = "Fantasia"
	app.character.characterName = "Aventureiro"
	app.character.playerName = "Jogador"
	app.state.begin(app.character, app.genre, app.setting, app.mode)
	app.show_screen("inGame")
	for i in ENTRIES.size():
		var button: Button = app.hud_row.get_child(i)
		assert(button.icon != null and button.icon.resource_path.ends_with(ENTRIES[i][1] + ".png"), "Incorrect HUD mapping")
	await capture("res://tests/hud-illustrated.png")
	app.queue_free()
	await process_frame
	var panel := ColorRect.new()
	panel.color = Color("2c241c")
	panel.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	root.add_child(panel)
	var margin := MarginContainer.new()
	margin.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	for side in ["left", "right", "top", "bottom"]: margin.add_theme_constant_override("margin_" + side, 55)
	panel.add_child(margin)
	var column := VBoxContainer.new()
	column.add_theme_constant_override("separation", 35)
	margin.add_child(column)
	var title := Label.new()
	title.text = "RPG Maker • Ícones do jogo"
	title.add_theme_font_override("font", load("res://assets/fonts/title.ttf"))
	title.add_theme_font_size_override("font_size", 42)
	title.add_theme_color_override("font_color", Color("d6bf69"))
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	column.add_child(title)
	var grid := GridContainer.new()
	grid.columns = 5
	grid.size_flags_vertical = Control.SIZE_EXPAND_FILL
	grid.add_theme_constant_override("h_separation", 20)
	grid.add_theme_constant_override("v_separation", 35)
	column.add_child(grid)
	for entry in ENTRIES:
		var box := VBoxContainer.new()
		box.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		box.size_flags_vertical = Control.SIZE_EXPAND_FILL
		grid.add_child(box)
		var texture := TextureRect.new()
		texture.texture = load("res://assets/icons/" + entry[1] + ".png")
		texture.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		texture.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		texture.custom_minimum_size = Vector2(175, 180)
		texture.size_flags_vertical = Control.SIZE_EXPAND_FILL
		box.add_child(texture)
		var label := Label.new()
		label.text = entry[0]
		label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		label.add_theme_font_override("font", load("res://assets/fonts/title.ttf"))
		label.add_theme_font_size_override("font_size", 25)
		label.add_theme_color_override("font_color", Color("fdf6e3"))
		box.add_child(label)
	await capture("res://assets/icons/hud-collection-preview.png")
	print("HUD: 10 image mappings rendered successfully")
	quit()
