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
var hovered := ""
var query := ""
var focus_branch := ""
var icons := {}
var font: Font = preload("res://assets/fonts/body.ttf")
const COLORS = {"Combate": Color("eea16e"), "Arcano": Color("94bafa"), "Sobrevivência": Color("76d7af"), "Origem e classe": Color("dfc987")}
const ANGLES = {"Combate": -2.62, "Arcano": -0.52, "Sobrevivência": 1.57, "Origem e classe": -1.57}
const TITLES = {"Combate": "GUERREIRO", "Arcano": "MAGO", "Sobrevivência": "LADINO"}
func _ready():
	custom_minimum_size.y = clampf(get_viewport_rect().size.y - 430, 300, 620)
	clip_contents = true
	mouse_filter = MOUSE_FILTER_STOP
	resized.connect(func(): focus_path(focus_branch))
	rebuild()
	focus_path("")
func rebuild():
	nodes = game.skill_tree()
	positions.clear()
	for node in nodes:
		var angle: float = ANGLES[node.branch]
		var tier := int(node.get("tier", 0))
		var distance_: float = 190 + tier * 125
		if node.has("specialization"):
			angle += (int(node.specializationIndex) - 1) * .48
			distance_ = 550 + int(node.specializationTier) * 115
		var point := Vector2.from_angle(angle) * distance_
		if node.has("satellite"): point += Vector2.from_angle(angle + float(node.satellite) * PI / 2) * 65
		if str(node.treeId).begins_with("origin_"): point = Vector2(-65 + int(str(node.treeId).trim_prefix("origin_")) * 100, -90)
		positions[node.treeId] = point
	queue_redraw()
func focus_path(branch: String):
	focus_branch = branch
	var bounds := Rect2(Vector2.ZERO, Vector2.ONE) if branch.is_empty() else Rect2(Vector2.from_angle(ANGLES[branch])*550, Vector2.ONE)
	for node in nodes:
		if branch.is_empty() or node.branch == branch: bounds = bounds.expand(positions[node.treeId])
	bounds = bounds.grow(115)
	zoom = clampf(minf(size.x / bounds.size.x, (size.y-55) / bounds.size.y), .15, 1.2)
	pan = -bounds.get_center() * zoom + Vector2(0,22)
	queue_redraw()
func project(point: Vector2) -> Vector2: return size / 2 + pan + point * zoom
func radius(node: Dictionary) -> float:
	return maxf(5 if node.has("satellite") else (12 if node.get("keystone", false) else 8), (18 if node.has("satellite") else (42 if node.get("keystone", false) else 31)) * zoom)
func caption(point: Vector2, value: String, color: Color, font_size: int = 13):
	var width := font.get_string_size(value, HORIZONTAL_ALIGNMENT_LEFT, -1, font_size).x
	draw_string(font, point - Vector2(width / 2, 0), value, HORIZONTAL_ALIGNMENT_LEFT, -1, font_size, color)
func glyph(p: Vector2, r: float, node: Dictionary, color: Color):
	var kind := int(node.get("specializationIndex", 0))
	if node.has("satellite"):
		draw_circle(p, r * .25, color)
	elif node.branch == "Combate":
		if kind == 1:
			draw_polyline(PackedVector2Array([p+Vector2(-r*.5,-r*.5),p+Vector2(r*.5,-r*.5),p+Vector2(r*.4,r*.2),p+Vector2(0,r*.65),p+Vector2(-r*.4,r*.2),p+Vector2(-r*.5,-r*.5)]),color,1.7,true)
		else:
			draw_line(p+Vector2(-r*.45,r*.5),p+Vector2(r*.45,-r*.6),color,2,true)
			draw_line(p+Vector2(-r*.5,0),p+Vector2(0,r*.4),color,2,true)
			if kind == 2: draw_line(p+Vector2(r*.45,r*.5),p+Vector2(-r*.45,-r*.6),color,2,true)
	elif node.branch == "Arcano":
		for i in (6 if kind == 1 else 4):
			var a := TAU * i / (6 if kind == 1 else 4)
			draw_line(p,p+Vector2.from_angle(a)*r*.62,color,1.7,true)
		draw_circle(p,r*.22,color)
		if kind == 2: draw_arc(p,r*.58,0,TAU,24,color,1,true)
	elif node.branch == "Sobrevivência":
		if kind == 2:
			draw_arc(p-Vector2(r*.4,0),r*.7,-PI/2,PI/2,20,color,1.8,true)
			draw_line(p-Vector2(r*.4,r*.7),p+Vector2(-r*.4,r*.7),color,1,true)
		else:
			draw_polyline(PackedVector2Array([p+Vector2(-r*.6,0),p+Vector2(0,-r*.4),p+Vector2(r*.6,0),p+Vector2(0,r*.4),p+Vector2(-r*.6,0)]),color,1.7,true)
			draw_circle(p,r*.17,color)
	else: draw_arc(p,r*.5,0,TAU,24,color,2,true)
func _draw():
	draw_rect(Rect2(Vector2.ZERO, size), Color("090f19"))
	for i in 180:
		var star := Vector2(fmod(i * 137.13, maxf(1,size.x)), fmod(i * 73.37, maxf(1,size.y)))
		draw_circle(star, 1 if i%5 else 1.5, Color(.5,.65,.9,.18))
	for ring in [190, 440, 550, 895]: draw_arc(project(Vector2.ZERO), ring * zoom, 0, TAU, 160, Color(.4,.55,.7,.10), 1, true)
	for branch in TITLES:
		if not focus_branch.is_empty() and branch != focus_branch: continue
		var color: Color = COLORS[branch]
		var angle: float = ANGLES[branch]
		draw_arc(project(Vector2.ZERO), 490*zoom, angle-.7, angle+.7, 48, Color(color,.28),2,true)
		caption(project(Vector2.from_angle(angle+.21)*480),TITLES[branch],color,14)
	for node in nodes:
		if not focus_branch.is_empty() and node.branch != focus_branch: continue
		var start: Vector2 = positions.get(node.requires, Vector2.ZERO)
		var learned: bool = game.tree_rank(node) > 0
		var end: Vector2 = project(positions[node.treeId])
		var c: Color = COLORS[node.branch] if learned else Color("354454")
		if learned: draw_line(project(start),end,Color(c,.15),7,true)
		draw_line(project(start),end,c,2 if learned else 1,true)
	var hub := project(Vector2.ZERO)
	draw_circle(hub,23,Color("192334"))
	draw_arc(hub,23,0,TAU,48,Color("d6bf69"),2,true)
	caption(hub+Vector2(0,5),"✦",Color("ead39a"),23)
	for node in nodes:
		if not focus_branch.is_empty() and node.branch != focus_branch: continue
		var p: Vector2 = project(positions[node.treeId])
		var rank: int = game.tree_rank(node)
		var r := radius(node)
		var color: Color = COLORS[node.branch]
		var available: bool = game.tree_block(node).is_empty()
		var match_: bool = not query.is_empty() and query.to_lower() in (str(node.name)+" "+str(node.get("specialization",""))).to_lower()
		var highlighted: bool = node.treeId == active or node.treeId == hovered or match_
		if highlighted or rank > 0: draw_circle(p,r+6,Color(color,.17))
		draw_circle(p,r,Color("1b293b") if available or rank > 0 else Color("111a27"))
		draw_arc(p,r,0,TAU,40,Color("ffda87") if rank > 0 else (color if available or highlighted else color.darkened(.42)),2 if highlighted or rank > 0 else 1.5,true)
		if node.get("keystone",false): draw_arc(p,r+4,0,TAU,40,Color(color,.55),1,true)
		glyph(p,r,node,color if available or rank > 0 or highlighted else color.darkened(.3))
		if node.has("specialization") and int(node.specializationTier) == 3:
			caption(p+Vector2(0,-r-12) if p.y < hub.y-40 else p+Vector2(0,r+20),str(node.specialization),color,13)
		elif zoom > .55 and not node.has("satellite"):
			caption(p+Vector2(0,r+17),str(node.name),Color("c9d5e3"),12)
		if rank > 0: draw_circle(p+Vector2(r*.75,-r*.75),3,Color("ffdc8c"))
	caption(Vector2(size.x/2,24),"CONSTELAÇÃO DE TALENTOS",Color("d5bd86"),15)
func hit(point: Vector2) -> String:
	for node in nodes:
		if not focus_branch.is_empty() and node.branch != focus_branch: continue
		if point.distance_to(project(positions[node.treeId])) < radius(node)+4: return node.treeId
	return ""
func _gui_input(event):
	if event is InputEventMouseButton:
		if event.button_index in [MOUSE_BUTTON_WHEEL_UP, MOUSE_BUTTON_WHEEL_DOWN] and event.pressed:
			var before: Vector2 = (event.position - size / 2 - pan) / zoom
			zoom = clampf(zoom * (1.12 if event.button_index == MOUSE_BUTTON_WHEEL_UP else 1.0/1.12), .2, 1.8)
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
		if hovered != id: hovered = id; queue_redraw()
		tooltip_text = ""
		for node in nodes:
			if node.treeId == id:
				tooltip_text = str(node.name)+"\n"+str(node.get("summary",node.description))+"\n"+("Aprendida" if game.tree_rank(node)>0 else game.tree_block(node))
				break
