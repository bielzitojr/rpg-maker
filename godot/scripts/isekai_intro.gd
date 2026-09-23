extends Control
signal completed
const RACES = {"Humano": "human", "Elfo": "elf", "Anão": "dwarf", "Orc": "orc", "Halfling": "halfling", "Tiefling": "tiefling", "Meio-Elfo": "halfelf", "Goblin": "goblin", "Slime": "slime", "Lobisomem": "werewolf", "Vampiro": "vampire", "Dragão (Jovem)": "dragon", "Aracne": "arachne"}
var race := "Humano"
var page := 0
var turning := false
var art: TextureRect
var caption: Label
var counter: Label
var next: Button
var previous: Button
var blackout: ColorRect
var motion: Tween
var reveal_motion: Tween
var revealed := 0
var elapsed := 0.0
var idle := 0.0
var visibility := Vector3.ZERO
var ink: ShaderMaterial
var sound: AudioStreamPlayer
var sound_volume := 0.35
var last_cue := ""
var panel_layouts: Dictionary
const CUES = [["fall", "horn", "breath"], ["void", "light", "portal"], ["breath", "forest", "rustle"], ["rustle", "breath", "forest"]]
const PANEL_SECONDS := 3.0
const IDLE_SECONDS := 5.0

func _ready() -> void:
	panel_layouts = JSON.parse_string(FileAccess.get_file_as_string("res://assets/isekai/panel_cuts.json"))
	sound = AudioStreamPlayer.new()
	sound.volume_db = linear_to_db(clampf(sound_volume, 0.0, 1.0))
	add_child(sound)
	var backdrop := ColorRect.new()
	backdrop.color = Color("100e16")
	backdrop.set_anchors_and_offsets_preset(PRESET_FULL_RECT)
	add_child(backdrop)
	var margin := MarginContainer.new()
	margin.set_anchors_and_offsets_preset(PRESET_FULL_RECT)
	for side in ["left", "right", "top", "bottom"]: margin.add_theme_constant_override("margin_" + side, 22)
	add_child(margin)
	var column := VBoxContainer.new()
	column.add_theme_constant_override("separation", 14)
	margin.add_child(column)
	counter = Label.new()
	counter.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	column.add_child(counter)
	var page_stage := Control.new()
	page_stage.size_flags_vertical = SIZE_EXPAND_FILL
	page_stage.clip_contents = true
	column.add_child(page_stage)
	art = TextureRect.new()
	art.set_anchors_and_offsets_preset(PRESET_FULL_RECT)
	art.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	art.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	art.size_flags_vertical = SIZE_EXPAND_FILL
	page_stage.add_child(art)
	ink = ShaderMaterial.new()
	ink.shader = preload("res://scripts/comic_reveal.gdshader")
	art.material = ink
	caption = Label.new()
	caption.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	caption.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	caption.custom_minimum_size.y = 64
	caption.add_theme_font_size_override("font_size", 21)
	column.add_child(caption)
	var row := HBoxContainer.new()
	row.alignment = BoxContainer.ALIGNMENT_CENTER
	row.add_theme_constant_override("separation", 25)
	column.add_child(row)
	previous = Button.new()
	previous.text = "Página anterior"
	previous.custom_minimum_size = Vector2(210, 48)
	previous.pressed.connect(func(): turn(-1))
	row.add_child(previous)
	next = Button.new()
	next.custom_minimum_size = Vector2(240, 48)
	next.pressed.connect(advance)
	row.add_child(next)
	blackout = ColorRect.new()
	blackout.color = Color.BLACK
	blackout.mouse_filter = MOUSE_FILTER_IGNORE
	blackout.set_anchors_and_offsets_preset(PRESET_FULL_RECT)
	blackout.modulate.a = 0
	add_child(blackout)
	refresh()


func page_asset() -> String:
	return "res://assets/isekai/" + (["arrival", "cosmos", "forest", "race_" + str(RACES[race])][page]) + ".png"

func refresh() -> void:
	if sound: sound.stop()
	art.texture = load(page_asset())
	counter.text = "PRÓLOGO  •  %d / 4" % (page + 1)
	caption.text = ["Um instante comum. Faróis. O som dos pneus… e então, nada.", "O silêncio não tem fim. Entre as estrelas, uma luz me puxa. Não consigo resistir.", "Escuridão outra vez. Abro os olhos. Folhas, terra úmida… este lugar não é o mesmo.", "Olho para mim. Este corpo… renasci como %s." % race][page]
	if reveal_motion and reveal_motion.is_running(): reveal_motion.kill()
	revealed = 0
	elapsed = 0.0
	idle = 0.0
	visibility = Vector3.ZERO
	ink.set_shader_parameter("visibility", visibility)
	var layout: Dictionary = panel_layouts[page_asset().get_file().get_basename()]
	ink.set_shader_parameter("vertical_panels", layout.vertical)
	ink.set_shader_parameter("cuts", Vector2(layout.cuts[0], layout.cuts[1]))
	update_buttons()

func update_buttons() -> void:
	previous.disabled = turning or page == 0
	next.disabled = turning
	next.text = "Revelar faixa · Espaço" if revealed < 3 else ("Entrar neste mundo · Espaço" if page == 3 else "Próxima página · Espaço")

func reveal_band() -> void:
	if revealed >= 3 or turning: return
	if reveal_motion and reveal_motion.is_running():
		reveal_motion.kill()
		set_band(1.0, revealed - 1)
	var index := revealed
	play_cue(index)
	revealed += 1
	elapsed = 0.0
	idle = 0.0
	reveal_motion = create_tween()
	reveal_motion.tween_method(set_band.bind(index), 0.0, 1.0, 0.85).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)
	update_buttons()

func set_band(value: float, index: int) -> void:
	visibility[index] = value
	ink.set_shader_parameter("visibility", visibility)

func play_cue(index: int) -> void:
	sound.stop()
	last_cue = CUES[page][index]
	sound.stream = load("res://assets/audio/prologue/" + last_cue + ".wav")
	if sound_volume > 0.0: sound.play()

func advance() -> void:
	if turning: return
	idle = 0.0
	if revealed < 3: reveal_band()
	else:
		if reveal_motion and reveal_motion.is_running():
			reveal_motion.kill()
			set_band(1.0, 2)
		turn(1)

func _input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and event.keycode == KEY_SPACE:
		get_viewport().set_input_as_handled()
		if not event.echo: advance()
	elif (event is InputEventMouseButton and event.pressed) or (event is InputEventKey and event.pressed):
		idle = 0.0

func _process(delta: float) -> void:
	if turning: return
	if revealed < 3:
		elapsed += delta
		if elapsed >= PANEL_SECONDS: reveal_band()
	elif not reveal_motion or not reveal_motion.is_running():
		idle += delta
		if idle >= IDLE_SECONDS: turn(1)

func turn(direction: int) -> void:
	if turning: return
	sound.stop()
	if page == 3 and direction > 0:
		turning = true
		update_buttons()
		completed.emit()
		return
	var target := clampi(page + direction, 0, 3)
	if target == page: return
	turning = true
	update_buttons()
	if reveal_motion and reveal_motion.is_running(): reveal_motion.kill()
	# A cinematic dissolve replaces the old flattened, rotating page.
	motion = create_tween().set_parallel(true)
	motion.tween_property(blackout, "modulate:a", 1.0, 0.45).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)
	motion.tween_property(art, "position:x", -24.0 * direction, 0.45).set_trans(Tween.TRANS_SINE)
	motion.chain().tween_interval(0.18)
	motion.chain().tween_callback(func():
		page = target
		art.position.x = 24.0 * direction
		refresh())
	motion.chain().tween_property(blackout, "modulate:a", 0.0, 0.55).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)
	motion.parallel().tween_property(art, "position:x", 0.0, 0.55).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_OUT)
	motion.chain().tween_callback(func(): turning = false; update_buttons())

func _exit_tree() -> void:
	if sound: sound.stop()
	if motion and motion.is_running(): motion.kill()
	if reveal_motion and reveal_motion.is_running(): reveal_motion.kill()
