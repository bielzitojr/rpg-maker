extends Control
signal finished
var steps: Array = []
var index := 0
var target_rect := Rect2()
var panel: PanelContainer
var text: Label
var counter: Label
var next: Button
var previous: Button

func _ready() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = MOUSE_FILTER_STOP
	panel = PanelContainer.new()
	var style := StyleBoxFlat.new()
	style.bg_color = Color("201d25")
	style.border_color = Color("d6bf69")
	style.set_border_width_all(2)
	style.set_corner_radius_all(12)
	style.content_margin_left = 18; style.content_margin_right = 18
	style.content_margin_top = 16; style.content_margin_bottom = 16
	panel.add_theme_stylebox_override("panel", style)
	add_child(panel)
	var box := VBoxContainer.new()
	box.add_theme_constant_override("separation", 12)
	panel.add_child(box)
	counter = Label.new()
	counter.add_theme_color_override("font_color", Color("d6bf69"))
	box.add_child(counter)
	text = Label.new()
	text.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	text.add_theme_color_override("font_color", Color("fff6df"))
	text.add_theme_font_size_override("font_size", 18)
	box.add_child(text)
	var buttons := HBoxContainer.new()
	box.add_child(buttons)
	previous = Button.new(); previous.text = "Voltar"
	previous.pressed.connect(func(): index = maxi(0, index - 1); refresh())
	buttons.add_child(previous)
	next = Button.new()
	next.pressed.connect(advance)
	buttons.add_child(next)
	var skip := Button.new(); skip.text = "Pular"
	skip.pressed.connect(close)
	buttons.add_child(skip)
	refresh()

func refresh() -> void:
	if steps.is_empty(): close(); return
	counter.text = "GUIA • %d / %d" % [index + 1, steps.size()]
	text.text = steps[index].text
	next.text = "Concluir" if index == steps.size() - 1 else "Próximo"
	previous.disabled = index == 0
	_process(0)

func _process(_delta: float) -> void:
	if steps.is_empty() or panel == null: return
	var target: Variant = steps[index].target.call()
	target_rect = target.get_global_rect().grow(5) if is_instance_valid(target) and target is Control and target.is_visible_in_tree() else Rect2(size * .5, Vector2.ZERO)
	target_rect = target_rect.intersection(Rect2(Vector2.ZERO, size))
	panel.size.x = minf(430, size.x - 24)
	panel.size.y = panel.get_combined_minimum_size().y
	var below := target_rect.end.y + 16
	var above := target_rect.position.y - panel.size.y - 16
	var y := below if below + panel.size.y <= size.y - 12 else maxf(12, above)
	panel.position = Vector2(clampf(target_rect.get_center().x - panel.size.x * .5, 12, size.x - panel.size.x - 12), y)
	queue_redraw()

func _draw() -> void:
	var r := target_rect
	var shade := Color(0, 0, 0, .97)
	draw_rect(Rect2(0, 0, size.x, maxf(0,r.position.y)), shade)
	draw_rect(Rect2(0, r.end.y, size.x, maxf(0,size.y-r.end.y)), shade)
	draw_rect(Rect2(0, r.position.y, maxf(0,r.position.x), r.size.y), shade)
	draw_rect(Rect2(r.end.x, r.position.y, maxf(0,size.x-r.end.x), r.size.y), shade)
	draw_rect(r, Color("e9c571"), false, 3)

func _input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and not event.echo:
		if event.keycode in [KEY_SPACE,KEY_ENTER]: advance(); get_viewport().set_input_as_handled()
		elif event.keycode == KEY_ESCAPE: close(); get_viewport().set_input_as_handled()

func advance() -> void:
	index += 1
	if index >= steps.size(): close()
	else: refresh()

func close() -> void:
	set_process(false)
	finished.emit()
	queue_free()
