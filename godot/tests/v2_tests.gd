extends SceneTree
var app
var failures := 0
var checks := 0
func _initialize(): call_deferred("run")
func check(ok: bool, label: String):
	checks += 1
	if not ok: failures += 1; printerr("FAIL: " + label)
func capture(label: String):
	await create_timer(.3).timeout
	await RenderingServer.frame_post_draw
	root.get_texture().get_image().save_png("res://tests/v2-" + label + ".png")
func find_button(node: Node, text: String):
	for child in node.get_children():
		if child is Button and child.text == text: return child
		var found = find_button(child, text)
		if found != null: return found
	return null
func has_text(node: Node, text: String) -> bool:
	if node is Label and text in node.text: return true
	for child in node.get_children():
		if has_text(child, text): return true
	return false
func run():
	app = load("res://main.tscn").instantiate()
	root.add_child(app)
	app.character.characterName = "Biel"
	app.character.playerName = "Biel"
	app.character.race = "Slime"
	app.character["class"] = "Aprendiz"
	app.character.image = ""
	app.genre = "Isekai"
	app.state.begin(app.character, "Isekai", "Medieval", "player")
	var state = app.state
	for attribute in state.ATTRIBUTES:
		state.world.status[attribute] = 3
		var equal: Dictionary = state.attribute_roll(attribute, 12, 9)
		check(equal.total == 12 and equal.success, "Attribute success at DC")
		check(not state.attribute_roll(attribute, 12, 8).success, "Below DC fails")
	check(state.attribute_roll("invalid", 10).is_empty(), "Reject invalid attribute")
	var clean: Dictionary = state.normalize_response({"storyText":"Teste","diceRollChallenge":true,"diceTest":{"attribute":"strength","difficulty":12,"reason":"Abrir porta"}})
	check(clean.diceTest.attribute == "strength", "Structured attribute challenge")
	state.apply_update(clean)
	app.show_screen("inGame")
	app._open_panel("Status")
	check(has_text(app.overlay,"Atributos") and has_text(app.overlay,"Status"), "Status section titles")
	await capture("status")
	app._attribute_test()
	await process_frame
	var roll = find_button(app, "Rolar d20 + atributo")
	check(roll != null, "Roll button")
	roll.pressed.emit()
	check(roll.disabled and state.world.has("pendingRoll"), "Single saved roll")
	var pending: Dictionary = state.world.pendingRoll.duplicate(true)
	for child in app.get_children():
		if child is AcceptDialog: child.queue_free()
	await process_frame
	app._attribute_test()
	await process_frame
	check(find_button(app,"Rolar d20 + atributo").disabled, "Reopen cannot reroll challenge")
	check(state.world.pendingRoll == pending, "Roll persists")
	await capture("dice")
	for child in app.get_children():
		if child is AcceptDialog: child.queue_free()
	state.world.dice = false
	state.world.status.level = 5
	state.world.status.skillPoints = 10
	check(state.learn_tree("combat_0"), "Learn passive")
	check(state.learn_tree("combat_1"), "Learn active")
	check(state.learn_tree("arcane_0"), "Learn mana skill")
	app._open_panel("Habilidades")
	var tabs = app.overlay.find_children("*","TabContainer",true,false)[0]
	tabs.current_tab = 1
	await process_frame
	check(has_text(app.overlay,"Habilidades ativas") and has_text(app.overlay,"Passivas"), "Learned skill sections")
	check(find_button(app.overlay,"Preparar habilidade") != null, "Learned active action")
	await capture("skills")
	find_button(app.overlay,"Preparar habilidade").pressed.emit()
	check("Precisão Marcial" in app.input.text, "Prepare selected skill")
	app._open_panel("Inventário")
	state.world.inventory = [{"name":"Espada Longa","quantity":1,"rarity":"Épico","stars":3,"starSlots":5}]
	app._open_panel("Inventário")
	check(has_text(app.overlay,"★★★☆☆"), "Filled and empty stars")
	var pictures = app.overlay.find_children("*","TextureRect",true,false).filter(func(p): return p.tooltip_text == "Clique para ampliar")
	check(not pictures.is_empty() and pictures[0].texture != null, "Item image")
	await process_frame
	var event := InputEventMouseButton.new()
	event.button_index = MOUSE_BUTTON_LEFT; event.pressed = true
	pictures[0].gui_input.emit(event)
	await process_frame
	check(find_button(app,"Fechar imagem") != null, "Image click opens viewer")
	await capture("image")
	if find_button(app,"Fechar imagem") != null: find_button(app,"Fechar imagem").pressed.emit()
	await process_frame
	check(is_instance_valid(app.overlay), "Viewer preserves panel")
	pictures[0].gui_input.emit(event)
	await process_frame
	var escape := InputEventKey.new()
	escape.keycode = KEY_ESCAPE; escape.pressed = true
	app._unhandled_key_input(escape)
	await process_frame
	check(not is_instance_valid(app.image_layer) and is_instance_valid(app.overlay), "Escape closes only enlarged image")
	state.apply_update({"storyText":"Item", "inventory":[{"name":"Espada Longa","rarity":"Comum","quantity":1}]})
	check(state.world.inventory.size() == 2, "Different rarity remains separate")
	state.apply_update({"storyText":"Item", "inventory":[{"name":"Espada Longa","rarity":"Comum","quantity":2}]})
	check(state.world.inventory.size() == 2 and state.world.inventory[1].quantity == 3, "Identical items stack")
	var catalog: Array = JSON.parse_string(FileAccess.get_file_as_string("res://data/items.json"))
	check(catalog.all(func(item): return ResourceLoader.exists(item.image)), "All catalog item illustrations exist")
	app._inventory_dev()
	await capture("items")
	var opts = app.overlay.find_children("*","OptionButton",true,false)
	for i in 7:
		opts[-1].selected = i+1
		opts[-1].item_selected.emit(i+1)
		check(has_text(app.overlay,app.ITEM_RARITIES[i]), "Rarity preview")
	print("V2 TESTS: %d checks, %d failures" % [checks, failures])
	quit(failures)
