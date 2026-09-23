extends SceneTree
var app
var failures := 0
func _initialize(): call_deferred("run")
func check(ok: bool, label: String):
	if not ok: failures += 1; printerr("FAIL: " + label)
func has_text(node: Node, text: String) -> bool:
	if node is Label and text in node.text: return true
	for child in node.get_children():
		if has_text(child, text): return true
	return false
func capture(name_: String):
	await create_timer(0.25).timeout
	await RenderingServer.frame_post_draw
	root.get_texture().get_image().save_png("res://tests/panel-" + name_ + ".png")
func run():
	app = load("res://main.tscn").instantiate()
	root.add_child(app)
	app.genre = "Isekai"
	app.character.characterName = "Darian Brightwater"
	app.character.playerName = "Zara"
	var image: Image = load("res://assets/icons/character.png").get_image()
	app._save_portrait(image)
	app.state.begin(app.character, "Isekai", "Medieval", "player")
	var game = app.state
	check(game.world.skills.is_empty(), "Isekai starts with choices")
	check(not game.learn_tree("combat_1"), "Prerequisite locked")
	check(game.learn_tree("combat_0"), "Unlock root")
	check(game.world.status.skillPoints == 1, "Spend point")
	check(not game.learn_tree("combat_0"), "No double spend")
	game.apply_update({"playerStatus": {"level": 3, "skillPoints": 999}, "skills": [{"name": "Injected"}]})
	check(game.world.status.skillPoints == 5, "Level points authoritative")
	check(game.world.skills.size() == 1, "AI cannot bypass tree")
	check(game.learn_tree("combat_1"), "Unlock next tier")
	check(not game.learn_tree("invalid"), "Invalid node rejected")
	var saved: Dictionary = JSON.parse_string(JSON.stringify(game.world))
	check(game.valid_save(saved), "Save compatible")
	game.world = saved
	check(game.tree_rank(game.skill_tree().filter(func(n): return n.treeId == "combat_1")[0]) == 1, "Tree survives reload")
	var legacy: Dictionary = game.catalog.skills.Humano.Guerreiro[0].duplicate(true)
	game.world.skills.append(legacy)
	check(game.tree_rank(game.skill_tree()[0]) > 0, "Legacy skills recognized without duplicate purchase")
	app.show_screen("inGame")
	app._open_panel("Status")
	var photo = app.overlay.find_child("StatusPortrait", true, false)
	check(photo != null and photo.texture is ImageTexture, "Saved portrait displayed")
	await capture("status")
	app._open_panel("Habilidades")
	await capture("tree")
	game.world.inventory.append({"name": "Poção de Vida", "type": "Consumível", "description": "Uma pequena reserva de cura para a jornada.", "quantity": 3})
	app._open_panel("Inventário")
	check(has_text(app.overlay, "Poção de Vida"), "Inventory displays items for empty search")
	var search = app.overlay.find_children("*", "LineEdit", true, false)[0]
	search.text = "poção"
	search.text_changed.emit(search.text)
	check(has_text(app.overlay, "Poção de Vida") and not has_text(app.overlay, "Espada Longa"), "Inventory search filters results")
	search.text = ""
	search.text_changed.emit("")
	await capture("inventory")
	app._open_panel("Bestiário")
	app._bestiary_dev()
	check(has_text(app.overlay, "Slime"), "Catalog displays creatures for empty search")
	var lookup = app.overlay.find_children("*", "LineEdit", true, false)[0]
	lookup.text = "vulc"
	lookup.text_changed.emit(lookup.text)
	check(has_text(app.overlay, "Dragão Ancião") and not has_text(app.overlay, "Slime"), "Catalog searches habitats")
	lookup.text = ""
	lookup.text_changed.emit("")
	check(JSON.parse_string(FileAccess.get_file_as_string("res://data/creatures.json")).size() == 20, "Twenty stored creatures")
	check(game.world.bestiary.is_empty(), "Dev catalog separate from discoveries")
	await capture("bestiary")
	print("Panels tests complete: %d failures" % failures)
	quit(failures)
