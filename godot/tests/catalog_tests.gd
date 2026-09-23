extends SceneTree
var app
var failures := 0
func _initialize(): call_deferred("run")
func check(ok: bool, label: String):
	if not ok: failures += 1; printerr("FAIL: " + label)
func capture(label: String):
	await create_timer(.3).timeout
	await RenderingServer.frame_post_draw
	root.get_texture().get_image().save_png("res://tests/codex-" + label + ".png")
func run():
	app = load("res://main.tscn").instantiate()
	root.add_child(app)
	app.character.race = "Aracne"
	app.character["class"] = "Aprendiz"
	app.character.image = ""
	app.genre = "Isekai"
	app.state.begin(app.character, "Isekai", "Medieval", "player")
	var creatures: Array = JSON.parse_string(FileAccess.get_file_as_string("res://data/creatures.json"))
	check(creatures.size() == 20, "20 creatures")
	for creature in creatures:
		check(ResourceLoader.exists(creature.image), "Creature art " + creature.name)
		check(creature.damageMax >= creature.damageMin and creature.damageMin > 0, "Numeric damage " + creature.name)
	var gallery: Dictionary = JSON.parse_string(FileAccess.get_file_as_string("res://data/race_portraits.json"))
	check(gallery.size() == 13, "13 races")
	for race in gallery:
		check(ResourceLoader.exists(app._race_image(race)), "Portrait " + race)
	var items: Array = JSON.parse_string(FileAccess.get_file_as_string("res://data/items.json"))
	check(items.size() >= 50, "Item catalog")
	for category in ["Arma", "Material", "Consumível"]:
		check(items.any(func(item): return item.type == category), "Category " + category)
	var ids := {}
	for node in app.state.skill_tree():
		check(not ids.has(node.treeId), "Unique node")
		ids[node.treeId] = true
	for node in app.state.skill_tree():
		check(str(node.requires).is_empty() or ids.has(node.requires), "Valid parent")
	check(not app.state.learn_tree("combat_0_focus"), "Satellite requires parent")
	check(app.state.learn_tree("combat_0"), "Learn base")
	check(app.state.learn_tree("combat_0_focus"), "Learn satellite")
	check(app.state.world.status.skillPoints == 0, "Point accounting")
	check("5 pontos percentuais" in app._instruction(), "Numeric skills in narration")
	app.show_screen("inGame")
	app._open_panel("Status")
	var photo = app.overlay.find_child("StatusPortrait", true, false)
	check(photo != null and photo.texture != null and "arachne" in photo.texture.resource_path, "Old save race portrait")
	await capture("status")
	app._portrait_gallery()
	await capture("gallery")
	app._bestiary_dev()
	var buttons = app.overlay.find_children("*", "Button", true, false)
	for button in buttons:
		if button.text == "Ver detalhes ▾":
			var parent = button.get_parent()
			var detail = parent.get_child(button.get_index()+1)
			check(not detail.visible, "Initially concise")
			button.pressed.emit()
			check(detail.visible, "Expand details")
			break
	await capture("bestiary")
	var before := JSON.stringify(app.state.world.inventory)
	app._inventory_dev()
	check(JSON.stringify(app.state.world.inventory) == before, "Dev does not grant items")
	await capture("items")
	app._open_panel("Habilidades")
	var graphs = app.overlay.find_children("*", "Control", true, false)
	for graph in graphs:
		if graph.get_script() == load("res://scripts/skill_constellation.gd"):
			await process_frame
			graph.selected.emit("combat_0")
			var event := InputEventMouseButton.new()
			event.button_index = MOUSE_BUTTON_WHEEL_UP
			event.pressed = true
			event.position = Vector2(200, 200)
			var previous: float = graph.zoom
			graph._gui_input(event)
			check(graph.zoom > previous, "Graph zoom")
			graph.zoom = .48
			graph.pan = Vector2.ZERO
			graph.queue_redraw()
	await capture("tree")
	print("CODEX CATALOG TESTS: %d failures" % failures)
	quit(failures)

