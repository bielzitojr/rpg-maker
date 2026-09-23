extends Control
signal selected(id: String)
var game
var nodes: Array = []
var positions := {}
var zoom := 0.48
var pan := Vector2.ZERO
var dragging := false
var moved := false
var active := ""
var query := ""
var icons := {}
const COLORS = {"Combate": Color("d98557"), "Arcano": Color("71bded"), "Sobrevivência": Color("7ccaa1"), "Origem e classe": Color("dfc987")}
func _ready():
	custom_minimum_size.y = 460
	clip_contents = true
	mouse_filter = MOUSE_FILTER_STOP
	for item in [["Combate", "enemies"], ["Arcano", "magic"], ["Sobrevivência", "map"], ["Origem e classe", "character"]]: icons[item[0]] = load("res://assets/icons/" + item[1] + ".png")
	resized.connect(queue_redraw)
	rebuild()
func rebuild():
	nodes = game.skill_tree()
	positions.clear()
	var branches := ["Combate", "Arcano", "Sobrevivência", "Origem e classe"]
	for node in nodes:
		var branch: int = branches.find(node.branch)
		var angle: float = [-2.5, -0.64, 1.57, -1.57][branch]
		var tier := int(node.get("tier", 0))
		if str(node.treeId).begins_with("origin_"): tier = int(str(node.treeId).trim_prefix("origin_"))
		angle += sin(tier * 1.7) * 0.28
		var center := Vector2.from_angle(angle) * (150 + tier * 135)
		if node.has("satellite"):
			var side := float(node.satellite)
			center += Vector2.from_angle(angle + side * 1.05) * 78
		center.x *= 1.25
		positions[node.treeId] = center
	queue_redraw()
func project(point: Vector2) -> Vector2: return size / 2 + pan + point * zoom
func _draw():
	draw_rect(Rect2(Vector2.ZERO, size), Color("0b1118"))
	for i in 100:
		var star := Vector2(fmod(i * 137.13, size.x), fmod(i * 73.37, size.y))
		draw_circle(star, 1.0, Color(0.6, 0.7, 0.8, 0.18))
	for radius in [150, 295, 440]: draw_arc(project(Vector2.ZERO), radius * zoom, 0, TAU, 96, Color("26313b"), 1, true)
	for node in nodes:
		var start: Vector2 = positions.get(node.requires, Vector2.ZERO)
		var learned: bool = game.tree_rank(node) > 0
		draw_line(project(start), project(positions[node.treeId]), Color("cba96a") if learned else Color("394858"), 2.2 if learned else 1.1, true)
	var hub := project(Vector2.ZERO)
	draw_circle(hub, 48 * zoom, Color("283340"))
	draw_arc(hub, 48 * zoom, 0, TAU, 64, Color("d6bf69"), 2, true)
	if icons.has("Origem e classe"): draw_texture_rect(icons["Origem e classe"], Rect2(hub - Vector2.ONE * 37 * zoom, Vector2.ONE * 74 * zoom), false)
	for node in nodes:
		var p: Vector2 = project(positions[node.treeId])
		var rank: int = game.tree_rank(node)
		var radius := (19.0 if node.has("satellite") else 32.0) * zoom
		var color: Color = COLORS[node.branch]
		var available: bool = game.tree_block(node).is_empty()
		if node.treeId == active: draw_circle(p, radius + 8, Color(1, 0.8, 0.35, .2))
		draw_circle(p, radius, Color("202c38") if available or rank > 0 else Color("141c24"))
		draw_arc(p, radius, 0, TAU, 40, Color("f1d88b") if rank > 0 else (color if available else Color("65707a")), 2.5, true)
		if not query.is_empty() and query.to_lower() in str(node.name).to_lower(): draw_arc(p, radius + 5, 0, TAU, 40, Color.WHITE, 2, true)
		if node.has("satellite"): draw_circle(p, radius * .35, color if rank > 0 or available else Color("54616c"))
		else: draw_texture_rect(icons[node.branch], Rect2(p - Vector2.ONE * radius * .8, Vector2.ONE * radius * 1.6), false, color if rank > 0 or available else Color(.45, .45, .45))
func hit(point: Vector2) -> String:
	for node in nodes:
		if point.distance_to(project(positions[node.treeId])) < (20 if node.has("satellite") else 30) * zoom: return node.treeId
	return ""
func _gui_input(event):
	if event is InputEventMouseButton:
		if event.button_index in [MOUSE_BUTTON_WHEEL_UP, MOUSE_BUTTON_WHEEL_DOWN] and event.pressed:
			var before: Vector2 = (event.position - size / 2 - pan) / zoom
			zoom = clampf(zoom * (1.12 if event.button_index == MOUSE_BUTTON_WHEEL_UP else 1.0/1.12), .35, 1.8)
			pan = event.position - size / 2 - before * zoom
			queue_redraw(); accept_event()
		elif event.button_index == MOUSE_BUTTON_LEFT:
			if event.pressed: dragging = true; moved = false
			else:
				dragging = false
				if not moved:
					active = hit(event.position)
					if not active.is_empty(): selected.emit(active)
					queue_redraw()
	elif event is InputEventMouseMotion:
		if dragging:
			pan += event.relative
			if event.relative.length() > 2: moved = true
			queue_redraw()
		var id := hit(event.position)
		tooltip_text = ""
		for node in nodes:
			if node.treeId == id: tooltip_text = str(node.name) + "\n" + str(node.get("summary", node.description)); break
