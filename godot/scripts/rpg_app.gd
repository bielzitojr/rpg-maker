extends Control
const State = preload("res://scripts/rpg_state.gd")
const Store = preload("res://scripts/rpg_store.gd")
const Gemini = preload("res://scripts/gemini_api.gd")
const GOLD = Color("d6bf69")
const CREAM = Color("fdf6e3")
const BROWN = Color("3a2d21")
const ORANGE = Color("f59e0b")
var state := State.new()
var storage := Store.new()
var client: Node
var prefs := {"textSpeed": "Normal", "textDescription": "Curto e Detalhado", "autoNarrate": false, "theme": "Padrão", "volume": 0.35, "showActionSuggestions": true, "autoSave": true, "illustratedIcons": true, "hudIconSetVersion": 2, "model": "gemini-3-flash-preview", "imageModel": "gemini-2.5-flash-image"}
var screen := "loading"
var mode := "player"
var genre := ""
var setting := ""
var character: Dictionary
var loaded_character: Dictionary = {}
var ui: VBoxContainer
var view: MarginContainer
var background: ColorRect
var overlay: Control
var image_layer: CanvasLayer
var message: Label
var retry_button: Button
var input: TextEdit
var story: RichTextLabel
var location_label: Label
var clock_label: Label
var send_button: Button
var cancel_button: Button
var suggestion_row: HFlowContainer
var combat_row: HBoxContainer
var hud_row: HBoxContainer
var portrait: TextureRect
var portrait_hint: Label
var fields: Dictionary = {}
var schema: Dictionary
var pending := ""
var opening := false
var operation := ""
var failed_action := ""
var failed_opening := false
var actor_before := ""
var generator_result := ""
var probe_label: Label
var music: AudioStreamPlayer
var music_path := ""
var paused_music := false
var sfx: AudioStreamPlayer
var text_tween: Tween
var test_mode := false
var request_age := 0.0
var total_unlocked: Array = []
var portrait_target := "character"
var isekai_start_inventory := false
var isekai_revealed := false
var isekai_rolled := false

func _ready() -> void:
	test_mode = "--test" in OS.get_cmdline_user_args()
	if test_mode: storage.base = "res://tests/runtime"
	character = state.profile()
	schema = JSON.parse_string(FileAccess.get_file_as_string("res://data/response_schema.json"))
	var saved_prefs: Variant = storage.read_json(storage.base.path_join("settings.json"))
	if saved_prefs is Dictionary:
		for key in prefs:
			if saved_prefs.has(key) and typeof(saved_prefs[key]) == typeof(prefs[key]): prefs[key] = saved_prefs[key]
		# Enable the requested complete image set once, then respect later user choices.
		if int(saved_prefs.get("hudIconSetVersion", 0)) < 2:
			prefs.illustratedIcons = true
			prefs.hudIconSetVersion = 2
			storage.write_json(storage.base.path_join("settings.json"), prefs)
	var unlocked: Variant = storage.read_json(storage.base.path_join("achievements.json"))
	if unlocked is Array: total_unlocked = unlocked
	client = Gemini.new()
	add_child(client)
	client.model = prefs.model
	client.image_model = prefs.imageModel
	client.completed.connect(_reply)
	client.failed.connect(_failure)
	client.image_completed.connect(_image_reply)
	music = AudioStreamPlayer.new()
	add_child(music)
	music.finished.connect(func(): if not paused_music: music.play())
	sfx = AudioStreamPlayer.new()
	add_child(sfx)
	_make_theme()
	background = ColorRect.new()
	background.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	background.color = _background_color()
	add_child(background)
	view = MarginContainer.new()
	view.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	for edge in ["left", "right", "top", "bottom"]: view.add_theme_constant_override("margin_" + edge, 20)
	add_child(view)
	DisplayServer.window_set_min_size(Vector2i(960, 720))
	if test_mode: show_screen("mainMenu")
	else:
		show_screen("loading")
		await get_tree().create_timer(1.1).timeout
		if screen == "loading": show_screen("mainMenu")

func _background_color() -> Color:
	return Color("eee8db") if prefs.theme == "Claro" else (Color("181512") if prefs.theme == "Escuro" else BROWN)

func _box(color: Color, border: Color = Color("71664d"), radius: int = 6, padding: int = 12) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = color
	style.border_color = border
	style.set_border_width_all(1)
	style.set_corner_radius_all(radius)
	style.content_margin_left = padding
	style.content_margin_right = padding
	style.content_margin_top = padding
	style.content_margin_bottom = padding
	return style

func _make_theme() -> void:
	theme = Theme.new()
	theme.default_font = load("res://assets/fonts/text.ttf")
	theme.default_font_size = 17
	var title_font := FontVariation.new()
	title_font.base_font = load("res://assets/fonts/title.ttf")
	title_font.variation_embolden = 0.6
	theme.set_font("font", "Button", title_font)
	theme.set_font_size("font_size", "Button", 22)
	theme.set_color("font_color", "Label", CREAM)
	for type in ["Button", "OptionButton"]:
		theme.set_stylebox("normal", type, _box(CREAM))
		theme.set_stylebox("hover", type, _box(Color("f9e6ae"), ORANGE))
		theme.set_stylebox("pressed", type, _box(Color("e1c98e"), ORANGE))
		theme.set_stylebox("focus", type, _box(Color(0, 0, 0, 0), ORANGE, 6, 0))
		theme.set_color("font_color", type, BROWN)
		theme.set_color("font_hover_color", type, BROWN)
		theme.set_color("font_pressed_color", type, BROWN)
		theme.set_color("font_focus_color", type, BROWN)
	for status_ in ["normal", "hover", "pressed"]:
		theme.set_stylebox(status_, "OptionButton", _box(Color("2c241c"), GOLD, 4, 10))
	for key in ["font_color", "font_hover_color", "font_pressed_color", "font_focus_color"]: theme.set_color(key, "OptionButton", CREAM)
	for type in ["LineEdit", "TextEdit"]:
		theme.set_stylebox("normal", type, _box(Color("2c241c"), Color("7b682c"), 4, 10))
		theme.set_stylebox("focus", type, _box(Color("2c241c"), ORANGE, 4, 10))
		theme.set_color("font_color", type, CREAM)
		theme.set_color("font_placeholder_color", type, Color("aeb9c4"))
	theme.set_color("font_color", "CheckButton", BROWN)

func _label(text: String, size_: int = 18, color: Color = CREAM, title: bool = false) -> Label:
	var label := Label.new()
	label.text = text
	label.add_theme_font_size_override("font_size", size_)
	label.add_theme_color_override("font_color", color)
	if title: label.add_theme_font_override("font", theme.get_font("font", "Button"))
	return label

func _paragraph(parent: Node, text: String, color: Color = BROWN, size_: int = 17) -> Label:
	var label := _label(text, size_, color)
	label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	parent.add_child(label)
	return label

func _button(text: String, action: Callable, tone: String = "cream") -> Button:
	var button := Button.new()
	button.text = text
	button.custom_minimum_size.y = 48
	button.mouse_default_cursor_shape = CURSOR_POINTING_HAND
	button.pressed.connect(action)
	if tone != "cream":
		var color: Color = {"dark": Color("423a31"), "green": Color("205733"), "red": Color("751f20"), "purple": Color("65278c"), "orange": Color("7a3e10"), "blue": Color("263c89")}.get(tone, BROWN)
		button.add_theme_stylebox_override("normal", _box(color, Color("827763")))
		button.add_theme_stylebox_override("hover", _box(color.lightened(0.16), GOLD))
		for key in ["font_color", "font_hover_color", "font_pressed_color", "font_focus_color"]: button.add_theme_color_override(key, CREAM)
	return button

func _vbox(parent: Node, separation: int = 14) -> VBoxContainer:
	var box := VBoxContainer.new()
	box.add_theme_constant_override("separation", separation)
	parent.add_child(box)
	return box

func _hbox(parent: Node, separation: int = 16) -> HBoxContainer:
	var box := HBoxContainer.new()
	box.add_theme_constant_override("separation", separation)
	parent.add_child(box)
	return box

func _spacer(parent: Node, height: float) -> void:
	var space := Control.new()
	space.custom_minimum_size.y = height
	parent.add_child(space)

func _clear(parent: Node) -> void:
	for child in parent.get_children():
		parent.remove_child(child)
		child.queue_free()

func show_screen(next: String) -> void:
	_close_modal()
	screen = next
	_clear(view)
	ui = _vbox(view, 14)
	fields.clear()
	var title := _label("RPG Maker", 64, ORANGE, true)
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_color_override("font_shadow_color", Color("1a130c"))
	title.add_theme_constant_override("shadow_offset_x", 3)
	title.add_theme_constant_override("shadow_offset_y", 4)
	ui.add_child(title)
	match next:
		"loading": _loading()
		"mainMenu": _main_menu()
		"playModeSelection": _mode_menu()
		"genreSelection": _choice_menu("Escolha o Gênero da Aventura", State.GENRES, _choose_genre, "playModeSelection")
		"settingSelection": _choice_menu("Escolha a Ambientação", State.SETTINGS, _choose_setting, "genreSelection")
		"characterCreation": _character_screen()
		"inGame": _game_screen()
		"loadGame": _load_screen()
		"achievements": _achievements_screen()
		"updateNotes": _updates_screen()
	var status_row := _hbox(ui, 8)
	message = _label("", 13, GOLD)
	message.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	message.size_flags_horizontal = SIZE_EXPAND_FILL
	status_row.add_child(message)
	retry_button = _button("Tentar novamente", _retry, "orange")
	retry_button.custom_minimum_size.y = 30
	retry_button.add_theme_font_size_override("font_size", 16)
	retry_button.visible = not failed_action.is_empty() and next == "inGame"
	status_row.add_child(retry_button)
	if next == "mainMenu": _status(_connection_status())
	if next == "inGame": _refresh_game()
	_update_music()

func _center(width: float) -> VBoxContainer:
	var title := ui.get_child(0)
	ui.remove_child(title)
	var center := CenterContainer.new()
	center.size_flags_vertical = SIZE_EXPAND_FILL
	ui.add_child(center)
	var box := _vbox(center, 16)
	box.custom_minimum_size.x = width
	box.add_child(title)
	_spacer(box, 20)
	return box

func _heading(parent: Node, text: String) -> void:
	var label := _label(text, 31, CREAM, true)
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	parent.add_child(label)

func _loading() -> void:
	var box := _center(450)
	var bar := ProgressBar.new()
	bar.show_percentage = false
	bar.custom_minimum_size.y = 24
	bar.add_theme_stylebox_override("background", _box(Color("2c241c"), GOLD, 14, 3))
	bar.add_theme_stylebox_override("fill", _box(ORANGE, ORANGE, 12, 3))
	box.add_child(bar)
	create_tween().tween_property(bar, "value", 100.0, 1.0)
	_heading(box, "Forjando os Reinos...")

func _main_menu() -> void:
	var box := _center(430)
	for entry in [["Jogar", "playModeSelection"], ["Carregar Jogo", "loadGame"], ["Conquistas", "achievements"], ["Configurações", "settings"], ["Notas de Atualização", "updateNotes"]]:
		var target: String = entry[1]
		var button := _button(entry[0], func():
			if target == "settings": _settings_modal()
			else: show_screen(target))
		button.custom_minimum_size.y = 56
		box.add_child(button)

func _mode_menu() -> void:
	var box := _center(550)
	_heading(box, "Escolha seu Papel")
	_spacer(box, 20)
	for entry in [["Jogador", "Crie um herói e embarque em uma aventura épica\nnarrada pela IA.", "player"], ["Mestre", "Narre a história e os desafios, enquanto a IA joga como\no aventureiro.", "master"]]:
		var value: String = entry[2]
		var button := _button(entry[0] + "\n" + entry[1], func(): mode = value; loaded_character = {}; show_screen("genreSelection"))
		button.custom_minimum_size.y = 108
		box.add_child(button)
	_spacer(box, 24)
	box.add_child(_button("Voltar", func(): show_screen("mainMenu"), "dark"))

func _choice_menu(title: String, choices: Array, action: Callable, back: String) -> void:
	var box := _center(570)
	_heading(box, title)
	_spacer(box, 12)
	var grid := GridContainer.new()
	grid.columns = 2
	grid.add_theme_constant_override("h_separation", 18)
	grid.add_theme_constant_override("v_separation", 16)
	box.add_child(grid)
	for choice in choices:
		var value: String = choice
		var button := _button(value, func(): action.call(value))
		button.custom_minimum_size = Vector2(276, 60)
		grid.add_child(button)
	_spacer(box, 14)
	box.add_child(_button("Voltar", func(): show_screen(back), "dark"))

func _choose_genre(value: String) -> void:
	genre = value
	isekai_revealed = false
	isekai_rolled = false
	if value == "Isekai":
		setting = "Um Mundo de Fantasia com Sistema de Jogo"
		show_screen("characterCreation")
	else: show_screen("settingSelection")

func _choose_setting(value: String) -> void:
	setting = value
	show_screen("characterCreation")

func _character_screen() -> void:
	if genre == "Isekai":
		_isekai_character_screen()
		return
	var scroll := ScrollContainer.new()
	scroll.size_flags_vertical = SIZE_EXPAND_FILL
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	ui.add_child(scroll)
	var panel := PanelContainer.new()
	panel.size_flags_horizontal = SIZE_EXPAND_FILL
	panel.add_theme_stylebox_override("panel", _box(BROWN, Color("716b5e"), 6, 24))
	scroll.add_child(panel)
	var box := _vbox(panel, 24)
	_heading(box, "Crie seu Personagem")
	var columns := _hbox(box, 28)
	var image_column := _vbox(columns, 10)
	image_column.custom_minimum_size.x = 245
	var frame := PanelContainer.new()
	frame.custom_minimum_size = Vector2(220, 230)
	frame.add_theme_stylebox_override("panel", _box(Color("2c241c"), GOLD))
	image_column.add_child(frame)
	var portrait_clip := Control.new()
	portrait_clip.clip_contents = true
	portrait_clip.custom_minimum_size = Vector2(190, 205)
	frame.add_child(portrait_clip)
	portrait = TextureRect.new()
	portrait.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	portrait.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	portrait.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	portrait_clip.add_child(portrait)
	_clickable_image(portrait)
	portrait.resized.connect(func(): portrait.pivot_offset = portrait.size / 2)
	portrait_hint = _label("Carregue ou gere um\nretrato", 15, GOLD)
	portrait_hint.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	portrait_hint.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	portrait_hint.position = Vector2(-100, 25)
	portrait_hint.size = Vector2(200, 50)
	portrait_hint.mouse_filter = Control.MOUSE_FILTER_IGNORE
	portrait_clip.add_child(portrait_hint)
	_refresh_portrait()
	var zoom := HSlider.new()
	zoom.min_value = 1.0
	zoom.max_value = 2.5
	zoom.step = 0.05
	zoom.value = character.get("imageZoom", 1.0)
	zoom.tooltip_text = "Zoom do retrato"
	zoom.value_changed.connect(func(value): character.imageZoom = value; portrait.scale = Vector2.ONE * value)
	image_column.add_child(zoom)
	image_column.add_child(_button("Gerar Imagem com IA", _generate_portrait, "purple"))
	var image_actions := _hbox(image_column, 8)
	image_actions.add_child(_button("Carregar", _select_portrait, "blue"))
	image_actions.add_child(_button("Remover", func(): character.image = ""; character.imageZoom = 1.0; _refresh_portrait(), "red"))
	var middle := _vbox(columns, 14)
	middle.size_flags_horizontal = SIZE_EXPAND_FILL
	_line_field(middle, "Seu Nome", "playerName", "Nome do Jogador")
	_line_field(middle, "Nome do Personagem", "characterName", "Nome do Personagem")
	_select_field(middle, "Gênero", "gender", ["Masculino", "Feminino", "Não-binário"])
	_text_field(middle, "Aparência", "appearance", "Descreva a aparência do seu personagem...")
	var right := _vbox(columns, 14)
	right.size_flags_horizontal = SIZE_EXPAND_FILL
	var races: Array = state.catalog.RACES.duplicate()
	if genre == "Isekai": races.append_array(state.catalog.MONSTER_RACES)
	_select_field(right, "Raça", "race", races)
	var race_hint := _paragraph(right, "", GOLD, 13)
	fields.raceHint = race_hint
	_select_field(right, "Classe", "class", state.catalog.CLASSES)
	fields.classHint = _paragraph(right, "", GOLD, 13)
	if genre != "Isekai":
		var weapon_names: Array = []
		for item in state.weapons(character): weapon_names.append(item.name)
		_select_field(right, "Arma Inicial", "weapon", weapon_names)
		_text_field(right, "Antecedentes", "background", "Qual a história do seu personagem?")
	if genre == "Bíblico": _select_field(right, "Provação", "provacao", state.catalog.SEVEN_DEADLY_SINS)
	_update_bonuses()
	var actions := _hbox(box, 18)
	actions.add_child(_button("Voltar", func(): show_screen("genreSelection" if genre == "Isekai" else "settingSelection"), "dark"))
	var space := Control.new()
	space.size_flags_horizontal = SIZE_EXPAND_FILL
	actions.add_child(space)
	actions.add_child(_button("Gerar Aleatoriamente", _random_character, "orange"))
	actions.add_child(_button("Iniciar Aventura", _start_adventure, "green"))

func _isekai_character_screen() -> void:
	var box := _center(520)
	_heading(box, "Antes de outro mundo")
	_line_field(box, "Seu Nome", "playerName", "Seu nome")
	_line_field(box, "Nome do Personagem", "characterName", "Nome do personagem")
	_select_field(box, "Gênero", "gender", ["Masculino", "Feminino", "Não-binário"])
	_paragraph(box, "Uma nova vida começa onde a anterior termina. Sua raça será revelada ao despertar.", GOLD, 16)
	box.add_child(_button("Começar introdução", _start_adventure, "green"))
	box.add_child(_button("Voltar", func(): show_screen("genreSelection"), "dark"))

func _begin_isekai_intro() -> void:
	if not isekai_rolled:
		var races: Array = state.catalog.RACES.duplicate()
		races.append_array(state.catalog.MONSTER_RACES)
		character.race = races.pick_random()
		character["class"] = "Aprendiz"
		character.weapon = ""
		character.image = _race_image(character.race)
		character.imageZoom = 1.0
		character.appearance = "Um novo corpo de " + str(character.race) + ", recém-desperto na floresta."
		character.background = "Após um atropelamento e uma passagem pelo vazio estrelado, renasceu em uma floresta de outro mundo."
		loaded_character = {}
		isekai_rolled = true
	_close_modal()
	_clear(view)
	screen = "isekaiIntro"
	music.stop()
	music_path = ""
	sfx.stop()
	DisplayServer.tts_stop()
	var intro := preload("res://scripts/isekai_intro.gd").new()
	intro.race = character.race
	intro.sound_volume = float(prefs.volume)
	intro.size_flags_vertical = SIZE_EXPAND_FILL
	intro.size_flags_horizontal = SIZE_EXPAND_FILL
	view.add_child(intro)
	intro.completed.connect(func():
		isekai_revealed = true
		show_screen("characterCreation")
		_start_adventure())

func _line_field(parent: Node, title: String, key: String, hint: String) -> void:
	var box := _vbox(parent, 5)
	box.add_child(_label(title, 17, CREAM, true))
	var row := _hbox(box, 5)
	var edit := LineEdit.new()
	edit.size_flags_horizontal = SIZE_EXPAND_FILL
	edit.custom_minimum_size.x = 170
	edit.max_length = 100
	edit.placeholder_text = hint
	edit.text = character.get(key, "")
	edit.text_changed.connect(func(value): character[key] = value)
	row.add_child(edit)
	fields[key] = edit
	row.add_child(_random_button(key))

func _select_field(parent: Node, title: String, key: String, choices: Array) -> void:
	var box := _vbox(parent, 5)
	box.add_child(_label(title, 17, CREAM, true))
	var row := _hbox(box, 5)
	var select := OptionButton.new()
	select.size_flags_horizontal = SIZE_EXPAND_FILL
	select.custom_minimum_size.x = 175
	for item in choices: select.add_item(str(item))
	var index := choices.find(character.get(key, ""))
	select.select(maxi(0, index))
	if not choices.is_empty(): character[key] = choices[maxi(0, index)]
	select.item_selected.connect(func(i): character[key] = select.get_item_text(i); _update_bonuses())
	row.add_child(select)
	fields[key] = select
	row.add_child(_random_button(key))

func _text_field(parent: Node, title: String, key: String, hint: String) -> void:
	var box := _vbox(parent, 5)
	box.add_child(_label(title, 17, CREAM, true))
	var row := _hbox(box, 5)
	var edit := TextEdit.new()
	edit.custom_minimum_size = Vector2(180, 115)
	edit.size_flags_horizontal = SIZE_EXPAND_FILL
	edit.wrap_mode = TextEdit.LINE_WRAPPING_BOUNDARY
	edit.text = character.get(key, "")
	edit.placeholder_text = hint
	edit.text_changed.connect(func(): character[key] = edit.text)
	row.add_child(edit)
	fields[key] = edit
	row.add_child(_random_button(key))

func _random_button(key: String) -> Button:
	var button := _button("⟳", func(): _random_field(key), "dark")
	button.tooltip_text = "Gerar " + key + (" com IA" if key == "appearance" else " aleatoriamente")
	button.custom_minimum_size = Vector2(34, 40)
	button.add_theme_font_override("font", ThemeDB.fallback_font)
	return button

func _random_field(key: String) -> void:
	if client.busy: return
	match key:
		"playerName": character[key] = state.catalog.FIRST_NAMES.pick_random()
		"characterName": character[key] = state.catalog.FIRST_NAMES.pick_random() + " " + state.catalog.LAST_NAMES.pick_random()
		"background": character[key] = state.catalog.BACKGROUNDS.pick_random()
		"appearance":
			operation = "appearance"
			_status("Gerando aparência…")
			client.send([{"role": "user", "parts": [{"text": "Crie uma descrição curta de aparência de RPG para: " + JSON.stringify(character)}]}], "Responda em português com apenas a descrição visual, sem Markdown.")
			return
		_:
			if fields.get(key) is OptionButton:
				var choice: OptionButton = fields[key]
				var index := randi_range(0, choice.item_count - 1)
				choice.select(index)
				character[key] = choice.get_item_text(index)
	if fields.get(key) is LineEdit or fields.get(key) is TextEdit: fields[key].text = character[key]
	_update_bonuses()

func _random_character() -> void:
	if client.busy: return
	for key in ["playerName", "characterName", "gender", "race", "class", "weapon", "background", "provacao"]: _random_field(key)
	character.appearance = state.catalog.APPEARANCES.pick_random()
	fields.appearance.text = character.appearance

func _update_bonuses() -> void:
	if is_instance_valid(fields.get("raceHint")): fields.raceHint.text = state.catalog.RACE_BONUSES.get(character.race, state.catalog.MONSTER_RACE_BONUSES.get(character.race, ""))
	if is_instance_valid(fields.get("classHint")): fields.classHint.text = state.catalog.CLASS_BONUSES.get(character["class"], "")
	var weapons: Array = state.weapons(character)
	var names: Array = []
	for item in weapons: names.append(item.name)
	if not character.weapon in names: character.weapon = names[0] if not names.is_empty() else ""
	if fields.get("weapon") is OptionButton:
		var select: OptionButton = fields.weapon
		select.clear()
		for name_ in names: select.add_item(name_)
		select.select(maxi(0, names.find(character.weapon)))

func _refresh_portrait() -> void:
	if not is_instance_valid(portrait): return
	portrait.scale = Vector2.ONE * float(character.get("imageZoom", 1.0))
	var image := Image.new()
	if not character.get("image", "").is_empty() and image.load(character.image) == OK:
		portrait.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
		portrait.texture = ImageTexture.create_from_image(image)
		portrait_hint.visible = false
	else:
		portrait.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
		portrait.offset_left = -24
		portrait.offset_right = 24
		portrait.offset_top = -40
		portrait.offset_bottom = 8
		portrait.texture = load("res://assets/ui/Status.svg")
		portrait_hint.visible = true

func _select_portrait() -> void:
	var dialog := FileDialog.new()
	dialog.access = FileDialog.ACCESS_FILESYSTEM
	dialog.file_mode = FileDialog.FILE_MODE_OPEN_FILE
	dialog.filters = PackedStringArray(["*.png,*.jpg,*.jpeg,*.webp ; Images"])
	dialog.use_native_dialog = true
	add_child(dialog)
	dialog.file_selected.connect(func(path):
		var image := Image.new()
		if image.load(path) != OK: _status("Não foi possível abrir a imagem.")
		else: _save_portrait(image)
		dialog.queue_free())
	dialog.canceled.connect(dialog.queue_free)
	dialog.popup_centered_ratio(0.7)

func _save_portrait(image: Image) -> void:
	if image.get_width() > 2048 or image.get_height() > 2048:
		var ratio := 2048.0 / maxf(image.get_width(), image.get_height())
		image.resize(int(image.get_width() * ratio), int(image.get_height() * ratio), Image.INTERPOLATE_LANCZOS)
	var folder := storage.base.path_join("portraits")
	DirAccess.make_dir_recursive_absolute(folder)
	var path := folder.path_join(str(Time.get_unix_time_from_system()).replace(".", "-") + ".png")
	if image.save_png(path) != OK: _status("Não foi possível salvar o retrato."); return
	character.image = path
	character.imageZoom = 1.0
	_refresh_portrait()
	_status("Retrato carregado.")

func _generate_portrait() -> void:
	if client.busy: return
	if character.appearance.strip_edges().is_empty(): _status("Descreva a aparência antes de gerar o retrato."); return
	operation = "portrait"
	_status("Gerando retrato com Gemini…")
	client.generate_image("Retrato de personagem de RPG, arte digital, rosto e ombros. %s %s da classe %s. Aparência: %s. Sem texto." % [character.race, character.gender, character["class"], character.appearance])

func _image_reply(bytes: PackedByteArray) -> void:
	if operation != "portrait": return
	operation = ""
	var image := Image.new()
	var result := image.load_png_from_buffer(bytes)
	if result != OK: result = image.load_jpg_from_buffer(bytes)
	if result != OK: result = image.load_webp_from_buffer(bytes)
	if result != OK: _status("A imagem recebida não pôde ser aberta.")
	else: _save_portrait(image)

func _start_adventure() -> void:
	if client.busy: _status("Aguarde a solicitação atual terminar."); return
	if character.playerName.strip_edges().is_empty() or character.characterName.strip_edges().is_empty():
		_status("Preencha seu nome e o nome do personagem.")
		return
	if genre == "Isekai" and not isekai_revealed:
		_begin_isekai_intro()
		return
	if client.api_key.is_empty():
		_settings_modal()
		_status("Informe sua chave Gemini para iniciar a aventura.")
		return
	state.begin(character, genre, setting, mode)
	if not loaded_character.is_empty():
		for key in ["status", "inventory", "skills"]: state.world[key] = loaded_character[key].duplicate(true)
		loaded_character = {}
	failed_action = ""
	show_screen("inGame")
	if mode == "master":
		_status("Você é o mestre. Narre a primeira cena; a IA responderá como aventureiro.")
	else:
		var opening_text := "Crie a cena de abertura da aventura. Apresente o mundo e a situação inicial deste personagem, respeitando sua raça, classe, aparência, antecedentes e provação. Não tome decisões por ele."
		if genre == "Isekai": opening_text = "O prólogo já aconteceu: atropelamento, escuridão, espaço, luz e reencarnação. O personagem acaba de abrir os olhos numa floresta e reconhecer seu corpo de " + str(character.race) + ". Continue exatamente deste ponto, sem repetir o prólogo, sem mudar a raça, sem conceder classe, equipamento ou habilidades prontas. A árvore local controla os talentos. Narre em segunda pessoa, respeitando o gênero escolhido, sem decidir ações pelo personagem."
		_request_turn(opening_text, true)

func _game_screen() -> void:
	var paper := PanelContainer.new()
	paper.size_flags_vertical = SIZE_EXPAND_FILL
	paper.add_theme_stylebox_override("panel", _box(CREAM, Color("716b5e"), 6, 20))
	ui.add_child(paper)
	story = RichTextLabel.new()
	story.bbcode_enabled = false
	story.selection_enabled = true
	story.scroll_following = true
	story.add_theme_color_override("default_color", BROWN)
	story.add_theme_font_size_override("normal_font_size", 20)
	story.add_theme_constant_override("line_separation", 9)
	story.gui_input.connect(func(event): if event is InputEventMouseButton and event.pressed and is_instance_valid(text_tween): text_tween.kill(); story.visible_characters = -1)
	paper.add_child(story)
	var info := _hbox(ui, 15)
	location_label = _label("", 16, GOLD, true)
	location_label.size_flags_horizontal = SIZE_EXPAND_FILL
	info.add_child(location_label)
	clock_label = _label("", 14, GOLD)
	info.add_child(clock_label)
	combat_row = _hbox(ui, 8)
	suggestion_row = HFlowContainer.new()
	ui.add_child(suggestion_row)
	var row := _hbox(ui, 8)
	input = TextEdit.new()
	input.custom_minimum_size.y = 64
	input.size_flags_horizontal = SIZE_EXPAND_FILL
	input.placeholder_text = "Narre a cena para o aventureiro…" if state.world.mode == "master" else "O que você faz a seguir?"
	input.wrap_mode = TextEdit.LINE_WRAPPING_BOUNDARY
	input.gui_input.connect(_input_key)
	row.add_child(input)
	send_button = _button("Enviar", _send, "orange")
	row.add_child(send_button)
	cancel_button = _button("Cancelar", _cancel, "dark")
	row.add_child(cancel_button)
	var hud_panel := PanelContainer.new()
	hud_panel.add_theme_stylebox_override("panel", _box(Color("2c241c"), Color("756129"), 6, 8))
	ui.add_child(hud_panel)
	hud_row = _hbox(hud_panel, 12)
	hud_row.alignment = BoxContainer.ALIGNMENT_CENTER
	_refresh_hud()

func _refresh_hud() -> void:
	if not is_instance_valid(hud_row): return
	_clear(hud_row)
	var entries := [["Status", "Status"], ["Habilidades", "Magic"], ["Inventário", "Inventory"], ["Bestiário", "Bestiary"], ["Aliados", "Allies"], ["Inimigos", "Enemies"], ["Mapa", "Map"], ["Sistema", "System"], ["Configurações", "Settings"], ["Ajuda", "Help"]]
	if state.world.mode == "master": entries = [["Caderno", "Notebook"], ["Geradores", "Generator"], ["Inimigos", "Enemies"], ["Sistema", "System"], ["Configurações", "Settings"], ["Ajuda", "Help"]]
	for entry in entries:
		var name_: String = entry[0]
		var button := _button("", func(): _open_panel(name_), "dark")
		button.tooltip_text = name_
		button.accessibility_name = name_
		var icon_path := "res://assets/ui/%s.svg" % entry[1]
		if prefs.illustratedIcons:
			var images := {"Status": "character", "Habilidades": "magic", "Inventário": "inventory", "Bestiário": "bestiary", "Aliados": "allies", "Inimigos": "enemies", "Mapa": "map", "Sistema": "system", "Configurações": "settings", "Ajuda": "help"}
			if images.has(name_): icon_path = "res://assets/icons/%s.png" % images[name_]
		if ResourceLoader.exists(icon_path): button.icon = load(icon_path)
		button.expand_icon = true
		button.add_theme_constant_override("icon_max_width", 42 if prefs.illustratedIcons else 30)
		button.custom_minimum_size = Vector2(64, 58) if prefs.illustratedIcons else Vector2(58, 48)
		button.add_theme_stylebox_override("normal", _box(Color(0, 0, 0, 0), Color(0, 0, 0, 0), 4, 8))
		var count: int = state.world.notifications.get(name_, 0)
		if count > 0:
			button.text = str(count) if count < 10 else "9+"
			button.add_theme_font_size_override("font_size", 12)
		hud_row.add_child(button)

func _refresh_game(animate: bool = false) -> void:
	if screen != "inGame" or not is_instance_valid(story): return
	if is_instance_valid(text_tween): text_tween.kill()
	story.visible_characters = -1
	story.clear()
	if state.world.history.is_empty():
		story.push_color(Color("a67c13"))
		story.add_text("O mundo está se materializando…" if not pending.is_empty() else ("Você é o Mestre. Narre a cena inicial para a IA jogar como aventureiro." if mode == "master" else "A aventura aguarda o primeiro capítulo. Use Tentar novamente se a conexão falhou."))
		story.pop()
	var before_last := 0
	for i in state.world.history.size():
		var turn: Dictionary = state.world.history[i]
		if turn.get("hidden", false): continue
		if i == state.world.history.size() - 1: before_last = story.get_total_character_count()
		var speaker: String = ("Aventureiro" if state.world.mode == "master" else "Mestre") if turn.role == "model" else ("Mestre" if state.world.mode == "master" else state.world.character.characterName)
		story.push_color(Color("925c15") if turn.role == "model" else Color("76513a"))
		story.add_text(speaker + ":\n")
		story.pop()
		story.add_text(turn.text + "\n\n")
	if not pending.is_empty() and not opening:
		story.add_text(("Mestre" if mode == "master" else character.characterName) + ":\n" + pending + "\n\n")
	if client.busy: story.add_text("…")
	if animate and prefs.textSpeed != "Rápido":
		story.visible_characters = before_last
		var duration := float(story.get_total_character_count() - before_last) / (110.0 if prefs.textSpeed == "Normal" else 45.0)
		text_tween = create_tween()
		text_tween.tween_property(story, "visible_characters", story.get_total_character_count(), duration)
	location_label.text = "Localização: " + state.world.location
	var time: Dictionary = state.world.gameTime
	clock_label.text = "%02d:%02d — %02d/%02d/%04d" % [time.hour, time.minute, time.day, time.month, time.year]
	input.editable = not client.busy
	send_button.disabled = client.busy or state.world.initiativePending
	cancel_button.visible = client.busy
	_clear(suggestion_row)
	if prefs.showActionSuggestions and not client.busy and not state.world.dice and state.world.enemies.is_empty():
		for suggestion in state.world.suggestions:
			var action: String = suggestion
			var button := _button(action, func(): input.text = action; _send(), "dark")
			button.add_theme_font_size_override("font_size", 15)
			button.custom_minimum_size.y = 34
			suggestion_row.add_child(button)
	_refresh_combat()
	_refresh_hud()

func _refresh_combat() -> void:
	_clear(combat_row)
	if state.world.initiativePending:
		combat_row.add_child(_button("Rolar Iniciativa (d20)", func(): state.roll_initiative(); _refresh_game(); _autosave(), "orange"))
	elif not state.world.turnOrder.is_empty():
		var actor: Dictionary = state.actor()
		var label := _label("Turno: %s  •  Iniciativa %d" % [actor.name, actor.initiative], 15, GOLD)
		label.size_flags_horizontal = SIZE_EXPAND_FILL
		combat_row.add_child(label)
		combat_row.add_child(_button("Ver combate", func(): _open_panel("Inimigos"), "dark"))
		if actor.type != "player":
			send_button.disabled = true
			var next := _button("Resolver turno da IA", func(): _request_turn("É o turno de %s. Resolva apenas a ação de combate deste participante." % actor.name), "orange")
			next.disabled = client.busy
			combat_row.add_child(next)
	if state.world.dice and not state.world.initiativePending:
		var dice := _button("Rolar d20", _roll_dice, "orange")
		dice.disabled = client.busy
		combat_row.add_child(dice)

func _input_key(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and event.keycode == KEY_ENTER and not event.shift_pressed:
		_send()
		input.accept_event()

func _send() -> void:
	if client.busy or state.world.initiativePending: return
	if not state.actor().is_empty() and state.actor().type != "player": return
	var action := input.text.strip_edges()
	if action.is_empty(): return
	_request_turn(action)

func _request_turn(action: String, first: bool = false) -> void:
	if client.busy: return
	if action.length() > 16000: _status("Descreva sua ação em até 16.000 caracteres."); return
	pending = action
	opening = first
	operation = "turn"
	failed_action = ""
	actor_before = str(state.actor().get("id", ""))
	var contents: Array = []
	for turn in state.world.history:
		contents.append({"role": turn.role, "parts": [{"text": turn.text}]})
	contents.append({"role": "user", "parts": [{"text": action}]})
	client.send(contents, _instruction(), schema if mode == "player" else {})
	request_age = 0.0
	_refresh_game()
	if client.busy: _status("O mundo está se materializando…" if first else "O mestre está preparando a resposta…")
	if is_instance_valid(retry_button): retry_button.visible = not failed_action.is_empty()

func _instruction() -> String:
	var context: Dictionary = state.world.duplicate(true)
	context.erase("history")
	context.erase("log")
	context.character.erase("image")
	if state.world.genre == "Isekai":
		for skill in context.skills:
			for node in state.skill_tree():
				if skill.get("treeId", "") == node.treeId or skill.name == node.name:
					var rank := int(skill.get("level", 1))
					skill.merge(node, true)
					skill.level = rank
					for stage in skill.get("progression", []):
						if int(stage.get("level", 0)) == rank: skill.merge(stage, true)
	if genre != "Bíblico": context.character.erase("provacao")
	if mode == "master":
		return "Você é o AVENTUREIRO de um RPG em português brasileiro. O usuário é o MESTRE e narra o mundo. Responda em primeira pessoa apenas com ações, falas e intenções do seu personagem; não controle NPCs nem resultados. Respeite raça, classe, equipamentos e fatos estabelecidos. Use texto simples. Contexto: " + JSON.stringify(context)
	return """Você é o Mestre de RPG do jogo RPG Maker. Narre em português brasileiro, com escrita envolvente e coerente. Preserve a agência do jogador: não decida ações nem falas dele. Respeite rigorosamente o inventário, habilidades e estado informados. Não conceda itens imaginados pelo jogador. Nunca declare um erro de API como parte da ficção.
Retorne JSON com storyText e location; use os demais campos do esquema para atualizar as mecânicas. storyText é só a narrativa, com parágrafos, sem prefixo Mestre, sem Markdown. Respeite o estilo de descrição solicitado.
inventory: SOMENTE novos itens realmente adquiridos, com quantidade, tipo e dano de armas; não repita itens existentes. skills: habilidades novas/atualizadas com nível, nível máximo, descrição, custo e dano. bestiary: fichas cumulativas das criaturas com knownInfo. allies: novos aliados. enemies: lista COMPLETA de inimigos vivos, preservando IDs e vida atual; array vazio encerra combate. Não crie inimigos no meio do combate. playerStatus: valores atuais, incluindo XP total atualizado e recursos após custos/danos. No Isekai, as habilidades e os pontos são controlados pela árvore local: não conceda nem altere habilidades ou pontos pela resposta. Considere apenas as habilidades já aprendidas em skills ao narrar seus efeitos.
Em combate, resolva APENAS o turno do ator atual. Declare explicitamente dano, aplique passivas e custos, atualize health dos alvos. Não restaure a vida automaticamente. Fora de combate, peça teste d20 para incertezas usando diceRollChallenge e diceTest com attribute (strength/dexterity/constitution/intelligence/wisdom/charisma), difficulty (CD inteira 1–40) e reason. A regra é d20 + valor do atributo, sucesso quando total >= CD. Não altere a CD após a rolagem. Respeite o resultado calculado localmente; espere o resultado real do jogador. Termine em uma decisão, com 3 a 5 actionSuggestions quando não houver teste ou combate. Se o jogador quer falar com um NPC, peça a fala dele em vez de inventá-la.
Mecânicas dos gêneros: Arena usa ouro, loja e treino; Bíblico usa a provação escolhida e npcDialogue de O Inimigo; Dungeon usa tesouros com raridade e estrelas; Exploração Espacial atualiza shipStatus (casco, escudos, combustível, sucata); Fantasia atualiza factionReputation; Guerra atualiza squadStatus e moral; Investigação atualiza evidenceBoard com IDs estáveis; Isekai usa progressão, habilidades e pontos; Terror usa sanidade e consequências de medo. Adapte ao cenário escolhido.
Desbloqueie conquistas apenas quando a condição for cumprida, usando um ID do catálogo. Atualize gameTime e location coerentemente. Não exponha JSON na narrativa.
""" + "\nEstilo: " + prefs.textDescription + "\nEstado atual: " + JSON.stringify(context) + "\nConquistas deste gênero: " + JSON.stringify(state.catalog.achievements.filter(func(a): return a.genre == genre))

func _reply(text: String) -> void:
	var kind := operation
	operation = ""
	if kind == "probe":
		_status("Conexão confirmada: o Gemini respondeu com sucesso.")
		if is_instance_valid(probe_label): probe_label.text = "Conexão confirmada. Pronto para jogar."
		return
	if kind == "appearance":
		character.appearance = text
		if is_instance_valid(fields.get("appearance")): fields.appearance.text = text
		_status("Aparência gerada.")
		return
	if kind == "generator":
		generator_result = text
		_open_panel("Geradores")
		return
	if kind != "turn" or pending.is_empty(): return
	var update: Dictionary
	if mode == "master": update = {"storyText": text}
	else:
		var parser := JSON.new()
		var payload := text.strip_edges().trim_prefix("```json").trim_prefix("```").trim_suffix("```").strip_edges()
		if parser.parse(payload) != OK:
			operation = "turn"
			_failure("O Gemini respondeu fora do formato do jogo. O estado foi preservado. Tente novamente.")
			return
		update = state.normalize_response(parser.data)
		if update.is_empty():
			operation = "turn"
			_failure("A resposta não contém uma narrativa válida. Tente novamente.")
			return
	if opening: update.erase("inventory") # Initial weapon already belongs to the character.
	var old_actor := actor_before
	state.commit(pending, update, opening)
	if not old_actor.is_empty(): state.advance_turn(old_actor)
	pending = ""
	opening = false
	failed_action = ""
	if is_instance_valid(input): input.text = ""
	_refresh_game(true)
	_status("Resposta recebida do Gemini.")
	for id in state.world.achievements:
		if not id in total_unlocked: total_unlocked.append(id)
	storage.write_json(storage.base.path_join("achievements.json"), total_unlocked)
	_autosave()
	if prefs.autoNarrate: _speak(text if mode == "master" else update.storyText)
	_update_music()

func _failure(text: String) -> void:
	if operation == "portrait" and "HTTP 429" in text:
		text = "O Gemini não liberou a geração do retrato por limite de cota. Use Carregar para escolher uma imagem do computador ou tente mais tarde. A conversa de texto permanece disponível."
	if operation == "turn":
		failed_action = pending
		failed_opening = opening
		if is_instance_valid(input) and not opening: input.text = pending
		pending = ""
		_refresh_game()
	operation = ""
	_status(text, true)
	if is_instance_valid(probe_label): probe_label.text = text
	if is_instance_valid(retry_button): retry_button.visible = not failed_action.is_empty() and screen == "inGame"

func _retry() -> void:
	if client.busy or failed_action.is_empty(): return
	_request_turn(failed_action, failed_opening)

func _cancel() -> void:
	client.cancel()
	if operation == "turn":
		failed_action = pending
		failed_opening = opening
		if is_instance_valid(input) and not opening: input.text = pending
	pending = ""
	operation = ""
	_refresh_game()
	_status("Solicitação cancelada. Você pode tentar novamente.")
	if is_instance_valid(retry_button): retry_button.visible = not failed_action.is_empty()

func _roll_dice() -> void:
	if client.busy: return
	_attribute_test()

func _status(text: String, error: bool = false) -> void:
	if is_instance_valid(message):
		message.text = text
		message.add_theme_color_override("font_color", Color("ffb19a") if error else GOLD)

func _connection_status() -> String:
	return "Gemini: conexão confirmada." if client.verified else client.credential_source + " • Conexão ainda não testada."

func _process(delta: float) -> void:
	if client != null and client.busy:
		request_age += delta
		if operation == "turn": _status("O mundo está se materializando… %ds • Você pode cancelar." % int(request_age) if opening else "Aguardando o Gemini… %ds • Você pode cancelar." % int(request_age))

func _save(kind: String = "adventures") -> void:
	if state.world.is_empty(): return
	if storage.save_world(state.world, kind): _status("Personagem salvo." if kind == "characters" else "Aventura salva.")
	else: _status(storage.last_error, true)

func _autosave() -> void:
	if prefs.autoSave: _save()

func _speak(text: String) -> void:
	var voices := DisplayServer.tts_get_voices_for_language("pt")
	if voices.is_empty(): _status("Não há voz em português instalada no Windows."); return
	DisplayServer.tts_stop()
	DisplayServer.tts_speak(text, voices[0], int(prefs.volume * 100), 1.0, 1.0)

func _update_music() -> void:
	if screen == "isekaiIntro":
		music.stop()
		music_path = ""
		return
	if test_mode: return
	var filename := "menu/menu.mp3"
	if screen == "inGame":
		var music_genre: String = {"Isekai": "Fantasia", "Dungeon": "Fantasia", "Guerra": "Arena"}.get(genre, genre)
		filename = "adventure/" + music_genre.replace(" ", "_") + ".mp3"
	var path := ProjectSettings.globalize_path("res://").path_join("../public/assets/audio/music/" + filename).simplify_path()
	if path == music_path:
		music.volume_db = linear_to_db(maxf(0.0001, prefs.volume))
		return
	music.stop()
	music_path = path
	if FileAccess.file_exists(path):
		music.stream = AudioStreamMP3.load_from_file(path)
		music.volume_db = linear_to_db(maxf(0.0001, prefs.volume))
		if not paused_music: music.play()

func _play_sfx(relative: String) -> void:
	if test_mode: return
	var path := ProjectSettings.globalize_path("res://").path_join("../public/assets/audio/sfx/" + relative).simplify_path()
	if FileAccess.file_exists(path):
		sfx.stream = AudioStreamMP3.load_from_file(path)
		sfx.volume_db = linear_to_db(maxf(0.0001, prefs.volume))
		sfx.play()

func _modal(title: String) -> VBoxContainer:
	_close_modal()
	overlay = Control.new()
	overlay.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(overlay)
	var shade := ColorRect.new()
	shade.color = Color(0, 0, 0, 0.72)
	shade.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	overlay.add_child(shade)
	var margin := MarginContainer.new()
	margin.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	for edge in ["left", "right"]: margin.add_theme_constant_override("margin_" + edge, 145)
	for edge in ["top", "bottom"]: margin.add_theme_constant_override("margin_" + edge, 45)
	overlay.add_child(margin)
	var panel := PanelContainer.new()
	panel.add_theme_stylebox_override("panel", _box(CREAM, GOLD, 8, 24))
	margin.add_child(panel)
	var main := _vbox(panel, 15)
	var header := _hbox(main)
	var heading := _label(title, 31, BROWN, true)
	heading.size_flags_horizontal = SIZE_EXPAND_FILL
	header.add_child(heading)
	if title in ["Bestiário", "Inventário"]:
		heading.size_flags_horizontal = SIZE_SHRINK_BEGIN
		header.add_child(_button("Dev", _bestiary_dev if title == "Bestiário" else _inventory_dev, "dark"))
		var gap := Control.new()
		gap.size_flags_horizontal = SIZE_EXPAND_FILL
		header.add_child(gap)
	var close := _button("Fechar", _close_modal, "dark")
	close.custom_minimum_size.y = 35
	header.add_child(close)
	var scroll := ScrollContainer.new()
	scroll.size_flags_vertical = SIZE_EXPAND_FILL
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	main.add_child(scroll)
	var body := _vbox(scroll, 14)
	body.size_flags_horizontal = SIZE_EXPAND_FILL
	return body

func _close_modal() -> void:
	if is_instance_valid(overlay):
		remove_child(overlay)
		overlay.queue_free()
	overlay = null
	probe_label = null

func _unhandled_key_input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_cancel") and is_instance_valid(image_layer):
		image_layer.queue_free()
		get_viewport().set_input_as_handled()
		return
	if event.is_action_pressed("ui_cancel") and is_instance_valid(overlay):
		_close_modal()
		get_viewport().set_input_as_handled()

func _open_panel(name_: String) -> void:
	if name_ == "Configurações": _settings_modal(); return
	if state.world.is_empty(): return
	state.world.notifications[name_] = 0
	_refresh_hud()
	var box := _modal("Habilidades" if name_ == "Habilidades" and genre == "Isekai" else ("Magias" if name_ == "Habilidades" else name_))
	match name_:
		"Status": _status_panel(box)
		"Inventário": _inventory_panel(box)
		"Habilidades": _skills_panel(box)
		"Bestiário": _creatures_panel(box, "bestiary")
		"Aliados": _creatures_panel(box, "allies")
		"Inimigos": _enemies_panel(box)
		"Mapa":
			_paragraph(box, "Locais visitados nesta aventura. O original ainda não possuía um mapa gráfico.")
			for place in state.world.visited: _paragraph(box, "• " + place)
			if state.world.visited.is_empty(): _paragraph(box, "Nenhum local descoberto ainda.")
		"Sistema":
			for event in state.world.log: _paragraph(box, "• " + event, BROWN, 15)
		"Ajuda": _help_panel(box)
		"Caderno": _notebook_panel(box)
		"Geradores": _generator_panel(box)

func _card(parent: Node, heading: String, description: String = "") -> VBoxContainer:
	var panel := PanelContainer.new()
	panel.add_theme_stylebox_override("panel", _box(Color("f0e6ca"), Color("c7b889"), 5, 12))
	parent.add_child(panel)
	var box := _vbox(panel, 8)
	if not heading.is_empty():
		var title := _label(heading, 22, BROWN, true)
		title.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		box.add_child(title)
	if not description.is_empty(): _paragraph(box, description)
	return box


func _status_panel(box: Node) -> void:
	var w: Dictionary = state.world
	var c: Dictionary = w.character
	var hero := _hbox(box, 22)
	var frame := PanelContainer.new()
	frame.add_theme_stylebox_override("panel", _box(BROWN, GOLD, 8, 10))
	hero.add_child(frame)
	var clip := Control.new()
	clip.custom_minimum_size = Vector2(170, 215)
	clip.clip_contents = true
	frame.add_child(clip)
	var photo := TextureRect.new()
	photo.name = "StatusPortrait"
	photo.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	photo.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	photo.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	clip.add_child(photo)
	_clickable_image(photo)
	var image := Image.new()
	var path := str(c.get("image", ""))
	if path.is_empty() and w.genre == "Isekai": path = _race_image(c.race)
	if path.begins_with("res://") and ResourceLoader.exists(path):
		photo.texture = load(path)
	elif not path.is_empty() and FileAccess.file_exists(path) and image.load(path) == OK:
		photo.texture = ImageTexture.create_from_image(image)
		photo.scale = Vector2.ONE * clampf(float(c.get("imageZoom", 1.0)), 0.5, 3.0)
	else: photo.texture = load("res://assets/icons/character.png")
	photo.resized.connect(func(): photo.pivot_offset = photo.size / 2)
	var info := _vbox(hero, 9)
	info.size_flags_horizontal = SIZE_EXPAND_FILL
	info.add_child(_label(c.characterName, 30, BROWN, true))
	if w.genre == "Isekai": info.add_child(_button("Galeria de raças", _portrait_gallery, "dark"))
	_paragraph(info, "%s • %s • %s" % [c.race, c["class"], c.gender], Color("85652e"), 16)
	_paragraph(info, "Nível %d  |  %s\nJogador: %s" % [w.status.level, w.status.fame, c.playerName], BROWN, 16)
	_paragraph(info, str(c.get("appearance", "")), BROWN, 15)
	_paragraph(info, str(w.status.description), BROWN, 15)
	if str(w.status.title) != "nenhum": _paragraph(info, "Título: " + str(w.status.title))
	_section(box, "Status")
	var resources := GridContainer.new()
	resources.columns = 2
	resources.add_theme_constant_override("h_separation", 18)
	resources.add_theme_constant_override("v_separation", 12)
	box.add_child(resources)
	for resource in [["Vida", "health", "maxHealth", Color("a83b30")], ["Mana", "mana", "maxMana", Color("365aab")], ["Energia", "energy", "maxEnergy", Color("b69121")], ["Experiência", "experience", "maxExperience", Color("567d32")]]:
		var cell := _card(resources, "")
		cell.get_parent().size_flags_horizontal = SIZE_EXPAND_FILL
		_resource_bar(cell, resource[0], w.status[resource[1]], w.status[resource[2]], resource[3])
	if w.genre == "Terror": _resource_bar(box, "Sanidade", w.status.sanity, w.status.maxSanity, Color("7a4b97"))
	_section(box, "Atributos")
	var grid := GridContainer.new()
	grid.columns = 3
	grid.add_theme_constant_override("h_separation", 12)
	grid.add_theme_constant_override("v_separation", 12)
	box.add_child(grid)
	var names := ["Força", "Destreza", "Constituição", "Inteligência", "Sabedoria", "Carisma"]
	for i in State.ATTRIBUTES.size():
		var cell := _card(grid, str(int(w.status[State.ATTRIBUTES[i]])), names[i])
		cell.get_parent().size_flags_horizontal = SIZE_EXPAND_FILL
		var attr: String = State.ATTRIBUTES[i]
		cell.add_child(_button("Testar d20", func(): _attribute_test(attr), "dark"))
	_paragraph(box, "Ouro: %d   •   Pontos de habilidade: %d" % [w.status.gold, w.status.skillPoints], Color("85652e"), 16)
	for entry in [["Nave", "shipStatus"], ["Esquadrão", "squadStatus"], ["Facções", "factionReputation"], ["Quadro de Evidências", "evidenceBoard"]]:
		if not w[entry[1]].is_empty(): _card(box, entry[0], _pretty(w[entry[1]]))

func _resource_bar(parent: Node, title: String, value: float, maximum: float, color: Color) -> void:
	parent.add_child(_label("%s: %d / %d" % [title, value, maximum], 17, BROWN))
	var bar := ProgressBar.new()
	bar.max_value = maxf(1, maximum)
	bar.value = value
	bar.show_percentage = false
	bar.custom_minimum_size.y = 15
	bar.add_theme_stylebox_override("background", _box(Color("ded2b5"), Color("bbaa7c"), 5, 0))
	bar.add_theme_stylebox_override("fill", _box(color, color, 5, 0))
	parent.add_child(bar)


func _inventory_panel(box: Node) -> void:
	var total := 0
	for item in state.world.inventory: total += int(item.get("quantity", 1))
	_paragraph(box, "%d itens  •  %d tipos  •  %d ouro" % [total, state.world.inventory.size(), state.world.status.gold], Color("85652e"), 17)
	var search := LineEdit.new()
	search.placeholder_text = "Buscar item por nome ou descrição…"
	box.add_child(search)
	var filter := OptionButton.new()
	filter.add_item("Todas as categorias")
	var categories: Array = []
	for item in state.world.inventory:
		var category := str(item.get("type", "Outro"))
		if not category in categories: categories.append(category); filter.add_item(category)
	box.add_child(filter)
	var grid := GridContainer.new()
	grid.columns = 2
	grid.add_theme_constant_override("h_separation", 15)
	grid.add_theme_constant_override("v_separation", 15)
	box.add_child(grid)
	var empty := _label("Nenhum item encontrado.", 18, BROWN)
	box.add_child(empty)
	var refresh := func():
		for child in grid.get_children(): grid.remove_child(child); child.queue_free()
		var count := 0
		for item in state.world.inventory:
			if filter.selected > 0 and str(item.get("type", "Outro")) != filter.get_item_text(filter.selected): continue
			if not search.text.is_empty() and not search.text.to_lower() in (str(item.name) + " " + str(item.get("description", ""))).to_lower(): continue
			count += 1
			_item_card(grid, item)
		empty.visible = count == 0
	search.text_changed.connect(func(_text): refresh.call())
	filter.item_selected.connect(func(_index): refresh.call())
	refresh.call()

func _tree_panel(box: Node) -> void:
	var summary := _label("Pontos disponíveis: %d" % state.world.status.skillPoints, 20, BROWN)
	box.add_child(summary)
	_paragraph(box, "Arraste para explorar • Roda do mouse para zoom • Clique em um nó para ver seus detalhes", Color("85652e"), 14)
	var search := LineEdit.new()
	search.placeholder_text = "Destacar habilidade pelo nome…"
	box.add_child(search)
	var graph := preload("res://scripts/skill_constellation.gd").new()
	graph.game = state
	var layout := _hbox(box, 14)
	graph.custom_minimum_size.x = 580
	graph.size_flags_horizontal = SIZE_EXPAND_FILL
	layout.add_child(graph)
	var detail := _vbox(layout, 10)
	detail.custom_minimum_size.x = 290
	detail.size_flags_horizontal = SIZE_EXPAND_FILL
	var actions := _hbox(box)
	actions.add_child(_button("Centralizar", func(): graph.pan = Vector2.ZERO; graph.zoom = .48; graph.queue_redraw(), "dark"))
	var legend := _paragraph(actions, "Dourado: aprendido • Colorido: disponível • Cinza: bloqueado", Color("85652e"), 14)
	legend.size_flags_horizontal = SIZE_EXPAND_FILL
	_paragraph(detail, "Selecione um talento para consultar seus valores e pré-requisitos.")
	search.text_changed.connect(func(text): graph.query = text; graph.queue_redraw())
	graph.selected.connect(func(id):
		_clear(detail)
		for node in state.skill_tree():
			if node.treeId != id: continue
			var rank: int = state.tree_rank(node)
			var card := _card(detail, "%s · %d/%d" % [node.name, rank, node.get("maxLevel", 1)], str(node.get("summary", node.get("description", ""))))
			_skill_details(card, node, maxi(1, rank))
			var reason: String = state.tree_block(node)
			var button := _button(("Aprender · 1 ponto" if rank == 0 else "Melhorar · 1 ponto") if reason.is_empty() else reason, func():
				if state.learn_tree(id):
					_autosave()
					summary.text = "Pontos disponíveis: %d" % state.world.status.skillPoints
					graph.rebuild()
					graph.selected.emit(id), "green")
			button.disabled = client.busy or not reason.is_empty()
			card.add_child(button))
	var tree_names: Array = state.skill_tree().map(func(n): return n.name)
	for skill in state.world.skills:
		if skill.name not in tree_names:
			var card := _card(box, skill.name, "Habilidade preservada da aventura")
			_skill_details(card, skill, int(skill.get("level", 1)))

func _skills_panel(box: Node) -> void:
	if state.world.genre == "Isekai":
		var tabs := TabContainer.new()
		tabs.add_theme_stylebox_override("panel", _box(CREAM, GOLD, 6, 10))
		tabs.get_tab_bar().add_theme_stylebox_override("tab_selected", _box(BROWN, GOLD, 4, 10))
		tabs.get_tab_bar().add_theme_stylebox_override("tab_unselected", _box(Color("7d6945"), GOLD, 4, 10))
		box.add_child(tabs)
		var tree := VBoxContainer.new()
		tree.name = "Árvore de habilidades"
		tabs.add_child(tree)
		var known := VBoxContainer.new()
		known.name = "Habilidades aprendidas"
		tabs.add_child(known)
		_tree_panel(tree)
		tabs.tab_changed.connect(func(index):
			if index == 1: _clear(known); _learned_skills(known))
		return
	_paragraph(box, "Pontos de habilidade disponíveis: %d" % state.world.status.skillPoints)
	if state.world.skills.is_empty(): _paragraph(box, "Você ainda não aprendeu habilidades. Elas serão adicionadas conforme a aventura.")
	for i in state.world.skills.size():
		var skill: Dictionary = state.world.skills[i]
		var level := int(skill.get("level", 1))
		var detail: Dictionary = skill
		if skill.get("progression") is Array:
			for progression in skill.progression:
				if progression is Dictionary and int(progression.get("level", 0)) == level: detail = progression
		var card := _card(box, "%s — nível %d/%d" % [skill.name, level, skill.get("maxLevel", 1)], str(skill.get("category", "Magia")))
		_skill_details(card, skill, level)
		var index: int = i
		var button := _button("Melhorar (+1 nível)", func():
			if state.upgrade(index): _autosave(); _open_panel("Habilidades"), "green")
		button.disabled = client.busy or state.world.status.skillPoints <= 0 or level >= int(skill.get("maxLevel", 1))
		card.add_child(button)

func _creatures_panel(box: Node, field: String) -> void:
	if state.world[field].is_empty(): _paragraph(box, "Nenhum registro descoberto ainda.")
	var catalog: Array = JSON.parse_string(FileAccess.get_file_as_string("res://data/creatures.json"))
	for creature in state.world[field]:
		var record: Dictionary = creature.duplicate(true)
		if field == "bestiary":
			for base in catalog:
				if str(base.name).to_lower() == str(creature.name).to_lower(): record = base.duplicate(true); record.merge(creature, true); break
			_monster_card(box, record)
		else:
			var card := _card(box, creature.name)
			_paragraph(_fold(card), str(creature.get("description", "")))

func _enemies_panel(box: Node) -> void:
	if state.world.enemies.is_empty(): _paragraph(box, "Não há inimigos em combate.")
	for i in state.world.enemies.size():
		var enemy: Dictionary = state.world.enemies[i]
		var card := _card(box, enemy.name, str(enemy.get("description", "")))
		_resource_bar(card, "Vida", enemy.health, enemy.maxHealth, Color("a83b30"))
		if mode == "master":
			var index: int = i
			var row := _hbox(card)
			var health := SpinBox.new()
			health.min_value = 0
			health.max_value = enemy.maxHealth
			health.value = enemy.health
			health.value_changed.connect(func(value): state.world.enemies[index].health = int(value); _autosave())
			row.add_child(health)
			row.add_child(_button("Remover", func(): state.world.enemies.remove_at(index); _autosave(); _open_panel("Inimigos"), "red"))
	if not state.world.turnOrder.is_empty():
		var order := _card(box, "Ordem de iniciativa")
		for actor in state.world.turnOrder: _paragraph(order, "%s — %d%s" % [actor.name, actor.initiative, " ← turno atual" if actor.id == state.actor().id else ""])
	if mode == "master":
		var add := _card(box, "Adicionar inimigo")
		var name_edit := LineEdit.new()
		name_edit.placeholder_text = "Nome do inimigo"
		add.add_child(name_edit)
		var hp := SpinBox.new()
		hp.min_value = 1
		hp.max_value = 100000
		hp.value = 20
		add.add_child(hp)
		add.add_child(_button("Adicionar", func():
			if name_edit.text.strip_edges().is_empty(): return
			state.world.enemies.append({"id": str(randi()), "name": name_edit.text.strip_edges(), "description": "Adicionado pelo mestre.", "health": int(hp.value), "maxHealth": int(hp.value)})
			_autosave()
			_open_panel("Inimigos"), "green"))

func _notebook_panel(box: Node) -> void:
	for entry in [["Anotações", "notes"], ["NPCs", "npcs"], ["Lugares", "places"], ["Missões", "quests"]]:
		box.add_child(_label(entry[0], 22, BROWN, true))
		var key: String = entry[1]
		var edit := TextEdit.new()
		edit.text = state.world.notebook.get(key, "")
		edit.custom_minimum_size.y = 110
		edit.wrap_mode = TextEdit.LINE_WRAPPING_BOUNDARY
		edit.text_changed.connect(func(): state.world.notebook[key] = edit.text)
		box.add_child(edit)
	box.add_child(_button("Salvar Caderno", func(): _save(); _close_modal(), "green"))

func _generator_panel(box: Node) -> void:
	_paragraph(box, "Ferramentas para o mestre: gere ideias para usar na sua narrativa.")
	var kind := OptionButton.new()
	for item in ["NPC", "Local", "Missão", "Item", "Encontro"]: kind.add_item(item)
	box.add_child(kind)
	var context := TextEdit.new()
	context.placeholder_text = "Contexto ou detalhes desejados…"
	context.custom_minimum_size.y = 100
	context.wrap_mode = TextEdit.LINE_WRAPPING_BOUNDARY
	box.add_child(context)
	var button := _button("Gerar com Gemini", func():
		if client.busy: return
		operation = "generator"
		client.send([{"role": "user", "parts": [{"text": "Gere um(a) %s para um RPG %s em %s. Contexto: %s" % [kind.get_item_text(kind.selected), genre, setting, context.text]}]}], "Ajude um mestre de RPG. Responda em português com conteúdo concreto pronto para usar, sem Markdown.")
		_status("Gerando conteúdo…"), "purple")
	button.disabled = client.busy
	box.add_child(button)
	if not generator_result.is_empty():
		_card(box, "Resultado", generator_result)
		box.add_child(_button("Copiar resultado", func(): DisplayServer.clipboard_set(generator_result)))

func _help_panel(box: Node) -> void:
	var help := {
		"Arena": "Sobreviva como gladiador. Ganhe Ouro por vitórias e peça para visitar a loja ou treinar entre lutas.",
		"Bíblico": "Sua aventura é uma prova de fé. O Inimigo tenta desviá-lo usando a provação escolhida; suas decisões morais conduzem a narrativa.",
		"Dungeon": "Explore masmorras, descubra tesouros e itens com raridade e estrelas. Procure pistas e fragmentos de mapa.",
		"Exploração Espacial": "Comande sua nave. Consulte casco, escudos e recursos em Status. Peça reparos com sucata e gerencie combustível.",
		"Fantasia": "Suas escolhas alteram a reputação com reinos, guildas e clãs. Consulte as facções em Status.",
		"Guerra": "Lidere seu esquadrão. Ordens e resultados afetam o moral e os membros, consultáveis em Status.",
		"Investigação": "Reúna pistas no Quadro de Evidências, em Status. Use os IDs para analisar ou conectar evidências.",
		"Isekai": "Evolua, aprenda habilidades e distribua Pontos de Habilidade. As passivas e progressões originais foram preservadas.",
		"Terror": "Sobreviva e proteja sua Sanidade. Eventos assustadores podem causar paranoia e alucinações."
	}
	_card(box, "Mecânicas de " + genre, help.get(genre, "Escolha seu caminho e converse com o mestre."))
	_paragraph(box, "Enter envia a ação; Shift + Enter cria uma nova linha. Clique no texto para concluir a animação. Os ícones abrem fichas e registros. Quando solicitado, role d20; em combate, role iniciativa e resolva cada turno. O Gemini recebe seu personagem, histórico e estado para continuar a aventura.")
	_paragraph(box, "No modo Mestre, você narra e a IA responde como o aventureiro. Use Caderno, Geradores e Inimigos para preparar sua sessão.")

func _pretty(value: Variant) -> String:
	var labels := {"health": "Vitalidade", "mana": "Mana", "weaknesses": "Fraquezas", "abilities": "Habilidades", "loot": "Tesouros", "habitat": "Habitat", "lore": "História", "name": "Nome", "hullIntegrity": "Integridade do casco", "shieldLevel": "Escudos", "engineStatus": "Motores", "scannerStatus": "Scanner", "lifeSupportStatus": "Suporte de vida", "fuel": "Combustível", "scrap": "Sucata", "morale": "Moral", "members": "Membros", "status": "Estado", "reputation": "Reputação", "description": "Descrição", "id": "ID"}
	if value is Array:
		var entries := PackedStringArray()
		for entry in value: entries.append(_pretty(entry))
		return "\n".join(entries)
	if value is Dictionary:
		var lines := PackedStringArray()
		for key in value: lines.append("%s: %s" % [labels.get(key, key), _pretty(value[key])])
		return "\n".join(lines)
	return str(value)

func _settings_modal() -> void:
	var box := _modal("Configurações")
	probe_label = _paragraph(box, _connection_status(), Color("806325"), 14)
	box.add_child(_label("Chave Gemini", 21, BROWN, true))
	var key_edit := LineEdit.new()
	key_edit.secret = true
	key_edit.placeholder_text = "Usar a chave original ou informar outra nesta sessão"
	key_edit.text = client.api_key
	box.add_child(key_edit)
	_paragraph(box, "O jogo procura uma chave local protegida pelo Windows, a configuração original e a variável de ambiente. A chave não entra nos saves ou na exportação. Uma chave digitada aqui vale apenas nesta sessão.", BROWN, 13)
	var model_edit := LineEdit.new()
	model_edit.text = client.model
	box.add_child(_label("Modelo da conversa", 19, BROWN, true))
	box.add_child(model_edit)
	var image_edit := LineEdit.new()
	image_edit.text = client.image_model
	box.add_child(_label("Modelo de retratos", 19, BROWN, true))
	box.add_child(image_edit)
	var apply_api := func():
		if client.api_key != key_edit.text.strip_edges() or client.model != model_edit.text.strip_edges(): client.verified = false
		client.api_key = key_edit.text.strip_edges()
		client.model = model_edit.text.strip_edges()
		client.image_model = image_edit.text.strip_edges()
		prefs.model = client.model
		prefs.imageModel = client.image_model
		_save_prefs()
	var test := _button("Testar conexão com Gemini", func():
		if client.busy: return
		apply_api.call()
		operation = "probe"
		probe_label.text = "Testando conexão…"
		client.send([{"role": "user", "parts": [{"text": "Responda apenas: Conexão confirmada."}]}], "Responda brevemente em português."), "green")
	test.disabled = client.busy
	box.add_child(test)
	for item in [["Velocidade do Texto", "textSpeed", ["Lento", "Normal", "Rápido"]], ["Descrição do Texto", "textDescription", ["Curto/Objetivo", "Curto e Detalhado", "Longo Complexo"]], ["Tema", "theme", ["Padrão", "Claro", "Escuro"]]]:
		var row := _hbox(box)
		var label := _label(item[0], 16, BROWN)
		label.size_flags_horizontal = SIZE_EXPAND_FILL
		row.add_child(label)
		var select := OptionButton.new()
		for option in item[2]: select.add_item(option)
		select.select(maxi(0, item[2].find(prefs[item[1]])))
		var key: String = item[1]
		select.item_selected.connect(func(index): prefs[key] = select.get_item_text(index); background.color = _background_color(); _save_prefs())
		row.add_child(select)
	for item in [["Narrativa automática (voz do Windows)", "autoNarrate"], ["Mostrar sugestões de ações", "showActionSuggestions"], ["Salvar automaticamente", "autoSave"], ["Usar novos ícones ilustrados", "illustratedIcons"]]:
		var check := CheckButton.new()
		check.text = item[0]
		check.button_pressed = prefs[item[1]]
		var key: String = item[1]
		check.toggled.connect(func(value): prefs[key] = value; _save_prefs(); _refresh_game())
		box.add_child(check)
	var volume := HSlider.new()
	volume.max_value = 1.0
	volume.step = 0.01
	volume.value = prefs.volume
	volume.custom_minimum_size.y = 26
	volume.value_changed.connect(func(value): prefs.volume = value; music.volume_db = linear_to_db(maxf(0.0001, value)); _save_prefs())
	box.add_child(_label("Volume", 18, BROWN))
	box.add_child(volume)
	box.add_child(_button("Retomar Música" if paused_music else "Pausar Música", func(): paused_music = not paused_music; music.stream_paused = paused_music))
	box.add_child(_button("Aplicar configuração Gemini", func(): apply_api.call(); _close_modal(); _status(_connection_status()), "green"))
	if screen == "inGame":
		box.add_child(_button("Salvar Aventura", func(): _save(); _close_modal(), "blue"))
		box.add_child(_button("Salvar Personagem", func(): _save("characters"); _close_modal(), "green"))
		box.add_child(_button("Voltar ao Menu Principal", _confirm_menu, "red"))

func _save_prefs() -> void:
	if not storage.write_json(storage.base.path_join("settings.json"), prefs): _status(storage.last_error, true)

func _confirm_menu() -> void:
	var dialog := ConfirmationDialog.new()
	dialog.title = "Voltar ao menu?"
	dialog.dialog_text = "A aventura atual será salva antes de voltar. A resposta em andamento será cancelada."
	dialog.ok_button_text = "Salvar e voltar"
	dialog.cancel_button_text = "Continuar jogando"
	add_child(dialog)
	dialog.confirmed.connect(func():
		if not storage.save_world(state.world): _status(storage.last_error, true); dialog.queue_free(); return
		_cancel()
		DisplayServer.tts_stop()
		show_screen("mainMenu")
		dialog.queue_free())
	dialog.canceled.connect(dialog.queue_free)
	dialog.popup_centered()

func _scroll_screen(title: String) -> VBoxContainer:
	_heading(ui, title)
	var scroll := ScrollContainer.new()
	scroll.size_flags_vertical = SIZE_EXPAND_FILL
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	ui.add_child(scroll)
	var box := _vbox(scroll, 14)
	box.size_flags_horizontal = SIZE_EXPAND_FILL
	ui.add_child(_button("Voltar", func(): show_screen("mainMenu"), "dark"))
	return box

func _load_screen() -> void:
	var box := _scroll_screen("Carregar Jogo")
	for kind in ["adventures", "characters"]:
		_heading(box, "Aventuras Salvas" if kind == "adventures" else "Personagens Salvos")
		var saves: Array = storage.list_saves(kind)
		if saves.is_empty(): _paragraph(box, "Nenhum registro salvo.", CREAM)
		for entry in saves:
			if entry.has("error"):
				_paragraph(box, entry.error + " (arquivo preservado)", Color("ffb19a"))
				continue
			var data: Dictionary = entry.data
			var card := _card(box, data.character.characterName, "%s • %s • Nível %d\n%s" % [data.genre, data.setting, data.status.level, data.get("savedAt", "")])
			var row := _hbox(card)
			var type_: String = kind
			row.add_child(_button("Carregar", func(): _load_world(data, type_), "green"))
			var path: String = entry.path
			row.add_child(_button("Excluir", func(): _confirm_delete(path), "red"))

func _load_world(data: Dictionary, kind: String = "adventures") -> void:
	if not State.valid_save(data): _status("Não foi possível carregar este save.", true); return
	client.cancel()
	pending = ""
	operation = ""
	failed_action = ""
	state.world = data.duplicate(true)
	character = state.world.character.duplicate(true)
	mode = state.world.mode
	genre = state.world.genre
	setting = state.world.setting
	if kind == "characters":
		loaded_character = state.world.duplicate(true)
		show_screen("genreSelection")
	else:
		show_screen("inGame")
		_status("Aventura carregada. " + _connection_status())

func _confirm_delete(path: String) -> void:
	var dialog := ConfirmationDialog.new()
	dialog.title = "Excluir save?"
	dialog.dialog_text = "O save selecionado será removido da lista."
	dialog.ok_button_text = "Excluir"
	dialog.cancel_button_text = "Cancelar"
	add_child(dialog)
	dialog.confirmed.connect(func():
		if path.begins_with(storage.base.path_join("adventures") + "/") or path.begins_with(storage.base.path_join("characters") + "/"):
			var error := DirAccess.rename_absolute(path, path + ".deleted-" + str(Time.get_unix_time_from_system()))
			show_screen("loadGame")
			if error != OK: _status("Não foi possível excluir o save.", true)
		dialog.queue_free())
	dialog.canceled.connect(dialog.queue_free)
	dialog.popup_centered()

func _achievements_screen() -> void:
	var box := _scroll_screen("Conquistas")
	for genre_ in State.GENRES:
		_heading(box, genre_)
		for achievement in state.catalog.achievements:
			if achievement.genre != genre_: continue
			var unlocked: bool = achievement.id in total_unlocked
			_card(box, ("Desbloqueada • " if unlocked else "Bloqueada • ") + achievement.name, achievement.description)

func _updates_screen() -> void:
	var box := _scroll_screen("Notas de Atualização")
	_card(box, "Godot — Restauração do RPG Maker", "Fluxo e identidade originais restaurados. Integração Gemini com leitura da chave original, fichas e respostas estruturadas, modos Jogador e Mestre, saves separados e diagnóstico de conexão. Os dados abaixo são as notas originais do projeto.")
	for update in state.catalog.updates:
		_card(box, update.version, "\n\n".join(update.notes))

func _bestiary_dev() -> void:
	var box := _modal("Bestiário · Dev")
	_paragraph(box, "Catálogo de criaturas • Valores de referência por espécie.", Color("85652e"), 15)
	box.add_child(_button("Voltar ao Bestiário", func(): _open_panel("Bestiário"), "dark"))
	var search := LineEdit.new()
	search.placeholder_text = "Buscar criatura, habitat ou tipo…"
	box.add_child(search)
	var list := _vbox(box, 12)
	var creatures: Array = JSON.parse_string(FileAccess.get_file_as_string("res://data/creatures.json"))
	var refresh := func():
		_clear(list)
		var count := 0
		for creature in creatures:
			if not search.text.is_empty() and not search.text.to_lower() in (str(creature.name) + str(creature.type) + str(creature.habitat)).to_lower(): continue
			count += 1
			_monster_card(list, creature)
		if count == 0: _paragraph(list, "Nenhuma criatura encontrada.")
	search.text_changed.connect(func(_text): refresh.call())
	refresh.call()

func _fold(parent: Node) -> VBoxContainer:
	var toggle := _button("Ver detalhes ▾", func(): pass, "dark")
	toggle.add_theme_font_size_override("font_size", 15)
	parent.add_child(toggle)
	var details := _vbox(parent, 8)
	details.visible = false
	toggle.pressed.connect(func(): details.visible = not details.visible; toggle.text = "Recolher ▴" if details.visible else "Ver detalhes ▾")
	return details

func _illustration(parent: Node, path: String, dimensions: Vector2) -> TextureRect:
	var picture := TextureRect.new()
	picture.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	picture.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	picture.custom_minimum_size = dimensions
	if ResourceLoader.exists(path): picture.texture = load(path)
	parent.add_child(picture)
	_clickable_image(picture)
	return picture

func _monster_card(parent: Node, creature: Dictionary) -> void:
	var card := _card(parent, "")
	var row := _hbox(card, 18)
	_illustration(row, str(creature.get("image", "res://assets/icons/bestiary.png")), Vector2(135, 135))
	var info := _vbox(row, 7)
	info.size_flags_horizontal = SIZE_EXPAND_FILL
	info.add_child(_label(creature.name, 24, BROWN, true))
	_paragraph(info, "%s • Nível %s • Vida %s" % [creature.get("type", "Desconhecido"), creature.get("level", "?"), creature.get("health", "?")], Color("85652e"), 15)
	_paragraph(info, "Dano: %s (%s) • Magia: %s" % [creature.get("damage", "Não revelado"), creature.get("damageType", "?"), creature.get("magicAptitude", "Não revelada")], BROWN, 15)
	var details := _fold(card)
	_paragraph(details, str(creature.get("details", creature.get("description", ""))), BROWN, 16)
	for pair in [["Dano mínimo", "damageMin"], ["Dano máximo", "damageMax"], ["Defesa", "armor"], ["Mana", "mana"], ["Custo de mana", "attackCost"], ["Alcance (m)", "attackRange"], ["Recarga (turnos)", "cooldown"], ["Habitat", "habitat"], ["Técnica", "ability"], ["Fraqueza", "weakness"]]:
		if creature.has(pair[1]): _paragraph(details, pair[0] + ": " + str(creature[pair[1]]), BROWN, 15)
	if creature.get("knownInfo") is Dictionary: _paragraph(details, _pretty(creature.knownInfo), BROWN, 15)

func _skill_details(parent: Node, skill: Dictionary, rank: int) -> void:
	var current: Dictionary = skill.duplicate(true)
	for stage in skill.get("progression", []):
		if int(stage.get("level", 0)) == rank: current.merge(stage, true)
	_paragraph(parent, "Dano: %s • Custo: %s %s" % [current.get("damage", "Não informado"), current.get("cost", 0), skill.get("costType", "")], Color("85652e"), 15)
	var details := _fold(parent)
	_paragraph(details, str(current.get("description", "Sem descrição disponível.")))
	for pair in [["Alcance (m)", "range"], ["Recarga (turnos)", "cooldown"], ["Nível exigido", "requiredLevel"]]:
		if current.has(pair[1]): _paragraph(details, pair[0] + ": " + str(current[pair[1]]), BROWN, 15)
	if not str(skill.get("requires", "")).is_empty():
		for node in state.skill_tree():
			if node.treeId == skill.requires: _paragraph(details, "Pré-requisito: " + str(node.name), BROWN, 15)
	for stage in skill.get("progression", []):
		_paragraph(details, "Nível %s: %s%s" % [stage.get("level", 1), stage.get("description", ""), " • Dano " + str(stage.damage) if stage.has("damage") else ""], BROWN, 14)

func _inventory_dev() -> void:
	var box := _modal("Inventário · Dev")
	box.add_child(_button("Voltar ao Inventário", func(): _open_panel("Inventário"), "dark"))
	var items: Array = JSON.parse_string(FileAccess.get_file_as_string("res://data/items.json"))
	for owned in state.world.inventory:
		if not items.any(func(item): return item.name == owned.name): items.append(owned.duplicate(true))
	_paragraph(box, "%d registros • Catálogo base e itens exclusivos desta aventura" % items.size(), Color("85652e"), 15)
	var search := LineEdit.new()
	search.placeholder_text = "Buscar item…"
	box.add_child(search)
	var filter := OptionButton.new()
	filter.add_item("Todas as categorias")
	var categories: Array = []
	for item in items:
		var type_ := str(item.get("type", "Outro"))
		if type_ not in categories: categories.append(type_); filter.add_item(type_)
	box.add_child(filter)
	var rarity_preview := OptionButton.new()
	rarity_preview.add_item("Raridade original")
	for rarity in ITEM_RARITIES: rarity_preview.add_item("Prévia: " + rarity)
	box.add_child(rarity_preview)
	var list := _vbox(box, 10)
	var refresh := func():
		_clear(list)
		for item in items:
			if filter.selected > 0 and str(item.get("type", "Outro")) != filter.get_item_text(filter.selected): continue
			if not search.text.is_empty() and not search.text.to_lower() in str(item.name).to_lower(): continue
			_item_card(list, item, ITEM_RARITIES[rarity_preview.selected-1] if rarity_preview.selected > 0 else "")
		if list.get_child_count() == 0: _paragraph(list, "Nenhum item encontrado.")
	search.text_changed.connect(func(_text): refresh.call())
	filter.item_selected.connect(func(_index): refresh.call())
	rarity_preview.item_selected.connect(func(_index): refresh.call())
	refresh.call()

func _race_image(race_name: String) -> String:
	var gallery: Dictionary = JSON.parse_string(FileAccess.get_file_as_string("res://data/race_portraits.json"))
	var portraits: Array = gallery.get(race_name, [])
	return str(portraits[0]) if not portraits.is_empty() else "res://assets/icons/character.png"

func _portrait_gallery() -> void:
	var box := _modal("Galeria de raças")
	_paragraph(box, "Seu retrato acompanha a raça da reencarnação: " + str(state.world.character.race), Color("85652e"), 16)
	var gallery: Dictionary = JSON.parse_string(FileAccess.get_file_as_string("res://data/race_portraits.json"))
	var grid := GridContainer.new()
	grid.columns = 3
	grid.add_theme_constant_override("h_separation", 12)
	grid.add_theme_constant_override("v_separation", 12)
	box.add_child(grid)
	for race_name in gallery:
		var card := _card(grid, race_name)
		card.get_parent().size_flags_horizontal = SIZE_EXPAND_FILL
		var path: String = gallery[race_name][0]
		_illustration(card, path, Vector2(210, 210))
		if race_name == state.world.character.race:
			card.add_child(_button("Usar este retrato", func():
				state.world.character.image = path
				state.world.character.imageZoom = 1.0
				character = state.world.character.duplicate(true)
				_autosave()
				_open_panel("Status"), "green"))


func _clickable_image(picture: TextureRect) -> void:
	picture.mouse_filter = Control.MOUSE_FILTER_STOP
	picture.mouse_default_cursor_shape = CURSOR_POINTING_HAND
	picture.tooltip_text = "Clique para ampliar"
	picture.gui_input.connect(func(event):
		if event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT and event.pressed and picture.texture != null:
			_image_viewer(picture.texture)
			picture.accept_event())

func _image_viewer(texture: Texture2D) -> void:
	if is_instance_valid(image_layer): image_layer.queue_free()
	var layer := CanvasLayer.new()
	image_layer = layer
	layer.layer = 50
	add_child(layer)
	var shade := ColorRect.new()
	shade.color = Color(0, 0, 0, .94)
	shade.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	layer.add_child(shade)
	var box := VBoxContainer.new()
	shade.add_child(box)
	box.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	box.offset_left = 35; box.offset_right = -35; box.offset_top = 25; box.offset_bottom = -25
	var close := _button("Fechar imagem", layer.queue_free, "dark")
	box.add_child(close)
	var large := TextureRect.new()
	large.texture = texture
	large.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	large.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	large.size_flags_vertical = SIZE_EXPAND_FILL
	box.add_child(large)
	close.grab_focus()
	shade.gui_input.connect(func(event):
		if event is InputEventKey and event.pressed and event.keycode == KEY_ESCAPE: layer.queue_free())

func _section(parent: Node, title: String) -> void:
	parent.add_child(HSeparator.new())
	parent.add_child(_label(title, 25, BROWN, true))

func _attribute_test(attribute: String = "") -> void:
	var dialog := AcceptDialog.new()
	dialog.title = "Teste de atributo"
	dialog.ok_button_text = "Fechar"
	dialog.min_size = Vector2i(440, 330)
	dialog.add_theme_stylebox_override("panel", _box(CREAM, GOLD, 8, 16))
	add_child(dialog)
	var box := VBoxContainer.new()
	box.add_theme_constant_override("separation", 12)
	box.custom_minimum_size.x = 450
	dialog.add_child(box)
	var names := ["Força", "Destreza", "Constituição", "Inteligência", "Sabedoria", "Carisma"]
	var requested: Dictionary = state.world.get("diceTest", {})
	var selected_attr := str(requested.get("attribute", attribute))
	var choice := OptionButton.new()
	for i in State.ATTRIBUTES.size(): choice.add_item("%s (%+d)" % [names[i], state.world.status[State.ATTRIBUTES[i]]])
	choice.selected = maxi(0, State.ATTRIBUTES.find(selected_attr))
	choice.disabled = state.world.dice and requested.has("attribute")
	box.add_child(choice)
	var dc := SpinBox.new()
	dc.min_value = 1; dc.max_value = 40
	dc.value = int(requested.get("difficulty", 12))
	dc.editable = not (state.world.dice and requested.has("difficulty"))
	_paragraph(box, str(requested.get("reason", "Role 1d20 e some o valor do atributo.")))
	_paragraph(box, "Dificuldade")
	box.add_child(dc)
	var result_label := _paragraph(box, "Aguardando rolagem…")
	var roll := _button("Rolar d20 + atributo", func(): pass, "orange")
	box.add_child(roll)
	var submit := _button("Enviar resultado ao mestre", func(): pass, "green")
	submit.visible = bool(state.world.dice)
	submit.disabled = true
	box.add_child(submit)
	var result: Dictionary = state.world.get("pendingRoll", {}).duplicate(true) if state.world.dice else {}
	var display := func():
		result_label.text = "d20: %d  +  atributo: %d  =  %d\nDificuldade: %d • %s" % [result.roll, result.bonus, result.total, result.difficulty, "Sucesso" if result.success else "Falha"]
		roll.disabled = true
		choice.disabled = true
		dc.editable = false
		submit.disabled = client.busy
	roll.pressed.connect(func():
		result.merge(state.attribute_roll(State.ATTRIBUTES[choice.selected], int(dc.value)), true)
		_play_sfx("dice/dice-95077.mp3")
		if state.world.dice: state.world.pendingRoll = result.duplicate(true); _autosave()
		display.call())
	submit.pressed.connect(func():
		dialog.hide()
		dialog.queue_free()
		_request_turn("[Teste de %s: d20=%d + atributo=%d = %d; dificuldade=%d; %s]" % [names[State.ATTRIBUTES.find(result.attribute)], result.roll, result.bonus, result.total, result.difficulty, "SUCESSO" if result.success else "FALHA"]))
	if not result.is_empty(): display.call()
	dialog.confirmed.connect(dialog.queue_free)
	dialog.canceled.connect(dialog.queue_free)
	dialog.popup_centered(Vector2i(500, 460))
	await get_tree().process_frame
	await get_tree().process_frame
	if is_instance_valid(dialog): dialog.popup_centered(Vector2i(500, 460))

const ITEM_RARITIES = ["Comum", "Incomum", "Raro", "Épico", "Lendário", "Mítico", "Divino"]
const ITEM_COLORS = ["93989f", "4ec76a", "4495ee", "b46bee", "ffb02e", "ef4242", "fff0b0"]

func _item_card(parent: Node, item: Dictionary, preview_rarity: String = "") -> void:
	var data := item.duplicate(true)
	var catalog_items: Array = JSON.parse_string(FileAccess.get_file_as_string("res://data/items.json"))
	for base in catalog_items:
		if base.name == item.name:
			data = base.duplicate(true)
			data.merge(item, true)
			break
	var rarity := str(data.get("rarity", "Comum")) if preview_rarity.is_empty() else preview_rarity
	var index := maxi(0, ITEM_RARITIES.find(rarity))
	var color := Color(ITEM_COLORS[index])
	var card := _card(parent, str(data.name))
	card.get_parent().size_flags_horizontal = SIZE_EXPAND_FILL
	var row := _hbox(card, 16)
	var frame := PanelContainer.new()
	var style := _box(Color("171b21"), color, 8, 9)
	style.shadow_color = Color(color, .5)
	style.shadow_size = 8
	if index == 6: style.border_color = Color.WHITE
	frame.add_theme_stylebox_override("panel", style)
	row.add_child(frame)
	_illustration(frame, str(data.get("image", "res://assets/icons/inventory.png")), Vector2(104, 104))
	var info := _vbox(row, 7)
	info.size_flags_horizontal = SIZE_EXPAND_FILL
	_paragraph(info, "%s • %s • ×%d" % [data.get("type", "Item"), rarity, int(data.get("quantity", 1))], BROWN, 16)
	var capacity := clampi(int(data.get("starSlots", 5)), 1, 10)
	var stars := clampi(int(data.get("stars", 0)), 0, capacity)
	var star_label := _paragraph(info, "★".repeat(stars) + "☆".repeat(capacity-stars), Color("987018"), 22)
	star_label.tooltip_text = "%d de %d estrelas" % [stars, capacity]
	_paragraph(info, "%d/%d estrelas" % [stars, capacity], BROWN, 14)
	if data.has("damage"): _paragraph(info, "Dano: " + str(data.damage), BROWN, 15)
	var detail := _fold(card)
	_paragraph(detail, str(data.get("description", "")))
	if data.has("value"): _paragraph(detail, "Valor: %d ouro" % int(data.value))

func _learned_skills(box: Node) -> void:
	_paragraph(box, "Habilidades aprendidas para consultar durante a batalha. Preparar coloca a ação no campo de mensagem; escolha o alvo antes de enviar.", BROWN, 16)
	var active := _vbox(box)
	var passive := _vbox(box)
	_section(active, "Habilidades ativas")
	_section(passive, "Passivas")
	var active_count := 0
	var passive_count := 0
	for learned in state.world.skills:
		var skill: Dictionary = learned.duplicate(true)
		if state.world.genre == "Isekai":
			for node in state.skill_tree():
				if node.name == skill.name:
					var rank := int(skill.get("level", 1))
					skill.merge(node, true)
					skill.level = rank
		for stage in skill.get("progression", []):
			if int(stage.get("level", 0)) == int(skill.get("level", 1)): skill.merge(stage, true)
		var is_passive: bool = state.skill_is_passive(skill)
		if is_passive: passive_count += 1
		else: active_count += 1
		var card := _card(passive if is_passive else active, skill.name, str(skill.get("summary", skill.get("description", ""))))
		_skill_details(card, skill, int(skill.get("level", 1)))
		if not is_passive:
			var cost := float(skill.get("cost", 0))
			var pool := "mana" if str(skill.get("costType", "")).to_lower() == "mana" else "energy"
			var enough := float(state.world.status.get(pool, 0)) >= cost
			var prepare := _button("Preparar habilidade" if enough else "Recurso insuficiente", func():
				_close_modal()
				input.text = "Usar " + str(skill.name) + " em "
				input.grab_focus(), "green")
			prepare.disabled = not enough or client.busy
			card.add_child(prepare)
	if active_count == 0: _paragraph(active, "Nenhuma habilidade ativa aprendida. Consulte a árvore para desbloquear técnicas.")
	if passive_count == 0: _paragraph(passive, "Nenhuma passiva aprendida.")

