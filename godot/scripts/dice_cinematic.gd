extends Control
signal finished
var result: Dictionary = {}
var elapsed := 0.0
var closed := false
var fast := false
var vertices: Array[Vector3] = []
var faces: Array = []
var random := RandomNumberGenerator.new()
var display_font: Font = preload("res://assets/fonts/title.ttf")

func _ready() -> void:
	random.randomize()
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = MOUSE_FILTER_STOP
	var phi := (1.0 + sqrt(5.0)) / 2.0
	for a in [-1.0,1.0]:
		for b in [-phi,phi]:
			vertices.append(Vector3(0,a,b).normalized())
			vertices.append(Vector3(a,b,0).normalized())
			vertices.append(Vector3(b,0,a).normalized())
	var edge := 2.0 / sqrt(1 + phi*phi)
	for a in vertices.size():
		for b in range(a+1,vertices.size()):
			for c in range(b+1,vertices.size()):
				if absf(vertices[a].distance_to(vertices[b])-edge)<.01 and absf(vertices[a].distance_to(vertices[c])-edge)<.01 and absf(vertices[b].distance_to(vertices[c])-edge)<.01: faces.append([a,b,c])

func _process(delta: float) -> void:
	elapsed += delta
	if elapsed >= (2.6 if fast else 3.6): complete()
	queue_redraw()

func line(text: String, y: float, font_size: int, color: Color) -> void:
	var font := display_font
	var width := font.get_string_size(text, HORIZONTAL_ALIGNMENT_LEFT, -1, font_size).x
	draw_string(font, Vector2((size.x-width)*.5,y), text, HORIZONTAL_ALIGNMENT_LEFT, -1, font_size, color)

func _draw() -> void:
	draw_rect(Rect2(Vector2.ZERO,size), Color(0.025,.018,.04,.95))
	var scale_ := minf(1.0, minf(size.x/480.0,size.y/630.0))
	var center := size*.5
	var radius := 108.0*scale_
	var card := Rect2(center-Vector2(206,275)*scale_,Vector2(412,550)*scale_)
	var style := StyleBoxFlat.new()
	style.bg_color = Color("191525")
	style.border_color = Color("a88948")
	style.set_border_width_all(2)
	style.set_corner_radius_all(int(36*scale_))
	draw_style_box(style,card)
	for side in [-1.0,1.0]:
		for top in [-1.0,1.0]:
			var corner := center+Vector2(side*183,top*247)*scale_
			var diamond := PackedVector2Array([corner+Vector2(0,-8)*scale_,corner+Vector2(5,0)*scale_,corner+Vector2(0,8)*scale_,corner+Vector2(-5,0)*scale_])
			draw_colored_polygon(diamond,Color("cdb17c"))
			draw_line(corner+Vector2(-side*12,0)*scale_,corner+Vector2(-side*75,0)*scale_,Color("7d683b"),1.0,true)
	draw_circle(center+Vector2(0,radius*.25),radius*1.02,Color(0,0,0,.35))
	for ring in [1.26,1.40]: draw_arc(center, radius*ring, 0, TAU, 96, Color(.72,.59,.34,.3),1,true)
	var names := {"strength":"Força", "dexterity":"Destreza", "constitution":"Constituição", "intelligence":"Inteligência", "wisdom":"Sabedoria", "charisma":"Carisma"}
	var initiative: bool = result.get("initiative",false)
	line("INICIATIVA" if initiative else "TESTE DE " + str(names.get(result.get("attribute",""),"ATRIBUTO")).to_upper(),center.y-218*scale_,int(24*scale_),Color("f6e0ad"))
	line("D20 + atributo" if initiative else "DIFICULDADE %d" % int(result.get("difficulty",10)),center.y-171*scale_,int(24*scale_),Color("cdb17c"))
	var t := clampf(elapsed/2.1,0,1)
	var angle := pow(1.0-t,3)*TAU*3
	var basis := Basis.from_euler(Vector3(angle*.71+.35,angle+.22,angle*.43+.13))
	var transformed: Array[Vector3] = []
	for vertex in vertices: transformed.append(basis*vertex)
	var sorted := faces.duplicate()
	sorted.sort_custom(func(a,b): return (transformed[a[0]].z+transformed[a[1]].z+transformed[a[2]].z)<(transformed[b[0]].z+transformed[b[1]].z+transformed[b[2]].z))
	for face in sorted:
		var points := PackedVector2Array()
		var depth := 0.0
		for id in face:
			var v: Vector3 = transformed[id]
			points.append(center+Vector2(v.x,v.y)*radius*(1+v.z*.15))
			depth += v.z/3
		var normal: Vector3 = (transformed[face[1]]-transformed[face[0]]).cross(transformed[face[2]]-transformed[face[0]]).normalized()
		if normal.dot(transformed[face[0]]) < 0: normal = -normal
		var light := clampf(normal.dot(Vector3(-.5,-.6,.8).normalized())*.6+.35,0,1)
		var color := Color("231b35").lerp(Color("b5a1d1"),light)
		draw_colored_polygon(points,color)
		var midpoint := (points[0]+points[1]+points[2])/3
		if depth > .25 and midpoint.distance_to(center) > radius*.53:
			var number := str(1+int(face[0]+face[1]+face[2])%20)
			draw_string(display_font,midpoint+Vector2(-7,5)*scale_,number,HORIZONTAL_ALIGNMENT_LEFT,-1,int(18*scale_),Color(.92,.86,1,.6))
		points.append(points[0]); draw_polyline(points,Color("b9a4d3"),1.4,true)
	var rolling := elapsed < 2.1
	var value := 1+int(elapsed*27)%20 if rolling else int(result.get("roll",1))
	line(str(value),center.y+19*scale_,int(55*scale_),Color("fff3ce"))
	if not rolling:
		line("%d + %d = %d" % [result.get("roll",1),result.get("bonus",0),result.get("total",1)],center.y+174*scale_,int(28*scale_),Color("f3d995"))
		var verdict := "INICIATIVA DEFINIDA" if initiative else ("SUCESSO" if result.get("success",false) else "FALHA")
		line(verdict,center.y+218*scale_,int(29*scale_),Color("e8ce8f") if initiative or result.get("success",false) else Color("eb8f8f"))
	else: line("ROLANDO…",center.y+189*scale_,int(24*scale_),Color("e8ce8f"))
	line("Espaço ou clique para acelerar",minf(size.y-18,card.end.y+32),16,Color("aaa3b8"))

func _input(event: InputEvent) -> void:
	if (event is InputEventKey and event.pressed and not event.echo and event.keycode in [KEY_SPACE,KEY_ENTER,KEY_ESCAPE]) or (event is InputEventMouseButton and event.pressed):
		elapsed = maxf(elapsed,2.1)
		fast = true
		get_viewport().set_input_as_handled()

func complete() -> void:
	if closed: return
	closed = true
	set_process(false)
	finished.emit()
	queue_free()
