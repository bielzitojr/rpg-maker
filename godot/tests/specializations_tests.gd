extends SceneTree
var failures := 0
var checks := 0
func _initialize(): call_deferred("run")
func check(ok: bool, label: String):
	checks += 1
	if not ok: failures += 1; printerr("FAIL: "+label)
func run():
	var app = load("res://main.tscn").instantiate()
	root.add_child(app)
	app.character.race = "Humano"
	app.character["class"] = "Aprendiz"
	app.genre = "Isekai"
	app.state.begin(app.character,"Isekai","Medieval","player")
	var state = app.state
	var nodes: Array = state.skill_tree()
	var ids := {}
	var specializations := {}
	for node in nodes:
		check(not ids.has(node.treeId),"unique id "+node.treeId)
		ids[node.treeId] = node
		if node.has("specialization"): specializations[node.specialization] = true
	check(specializations.size()==9,"nine specializations")
	for node in nodes:
		check(str(node.requires).is_empty() or ids.has(node.requires),"valid prerequisite")
		if node.has("specialization"):
			check(state.skill_is_passive(node)==(node.specializationTier==1),"active/passive classification")
			check(node.cost>=0 and node.cooldown>=0 and node.description.length()>30,"numeric and detailed rules")
	state.world.status.skillPoints = 100
	state.world.status.level = 1
	check(not state.learn_tree("pyro_0"),"level gate")
	state.world.status.level = 10
	check(not state.learn_tree("pyro_0"),"parent gate")
	check(state.learn_tree("arcane_0") and state.learn_tree("arcane_1"),"legacy unlocks")
	for id in ["pyro_0","pyro_1","pyro_2","pyro_3"]: check(state.learn_tree(id),"specialization unlock "+id)
	var points: int = state.world.status.skillPoints
	check(not state.learn_tree("pyro_3") and state.world.status.skillPoints==points,"no double spending")
	check(state.master_catalog().skills.any(func(n): return n.name=="Coração de Supernova"),"master knows new skills")
	root.size = Vector2i(1280,900)
	var graph = load("res://scripts/skill_constellation.gd").new()
	graph.game = state
	root.add_child(graph)
	graph.size = root.get_visible_rect().size
	await process_frame
	graph.focus_path("")
	await process_frame
	for node in nodes: check(graph.hit(graph.project(graph.positions[node.treeId]))==node.treeId,"node clickable "+node.treeId)
	if DisplayServer.get_name() != "headless":
		await RenderingServer.frame_post_draw
		root.get_texture().get_image().save_png("res://tests/specializations-overview.png")
		graph.focus_path("Arcano")
		await process_frame
		await RenderingServer.frame_post_draw
		root.get_texture().get_image().save_png("res://tests/specializations-mage.png")
	graph.queue_free()
	await process_frame
	app.show_screen("inGame")
	app._open_panel("Habilidades")
	if DisplayServer.get_name() != "headless":
		await process_frame
		await RenderingServer.frame_post_draw
		root.get_texture().get_image().save_png("res://tests/specializations-panel.png")
	app.queue_free()
	print("SPECIALIZATIONS: %d checks, %d failures" % [checks, failures])
	quit(failures)
