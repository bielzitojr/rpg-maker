extends SceneTree
var app
var checks := 0
var failures := 0
func _initialize(): call_deferred("run")
func check(ok: bool, label: String):
	checks += 1
	if not ok: failures += 1; printerr("FAIL: " + label)
func setup_battle():
	app.state.world.dice = false
	app.state.world.erase("pendingRoll")
	app.state.world.erase("pendingTurn")
	app.state.world.enemies = [{"id":"goblin-1","name":"Goblin","health":20,"maxHealth":20}]
	app.state.world.turnOrder = [{"id":"player","name":"Leib","type":"player","initiative":19},{"id":"goblin-1","name":"Goblin","type":"enemy","initiative":10}]
	app.state.world.turnIndex = 0
	app.state.world.initiativePending = false
	app.failed_action = ""
	app.pending = ""
	app.operation = ""
	app.client.busy = false
	app.combat_action = {}
	app._refresh_game()
func run():
	root.mode = Window.MODE_WINDOWED
	root.size = Vector2i(1280,720)
	app = load("res://main.tscn").instantiate()
	root.add_child(app)
	app.client.queue_free()
	app.client = load("res://tests/mock_ai.gd").new()
	app.add_child(app.client)
	app.client.completed.connect(app._reply)
	app.client.failed.connect(app._failure)
	app.prefs.autoSave = false
	app.prefs.textSpeed = "Rápido"
	app.character.characterName = "Leib"
	app.genre = "Isekai"
	app.state.begin(app.character,"Isekai","Medieval","player")
	app.show_screen("inGame")
	app.state.world.notifications.clear()
	app.state.apply_update({"storyText":"Começa a luta.","playerStatus":app.state.world.status.duplicate(true)})
	check(app.state.world.notifications.get("Status",0) == 0,"Repeated status no longer notifies")
	app.state.apply_update({"storyText":"Outro texto","playerStatus":{"description":"Em combate"}})
	check(app.state.world.notifications.get("Status",0) == 0,"Flavor description alone does not notify")
	app.state.apply_update({"storyText":"Dano","playerStatus":{"health":5}})
	check(app.state.world.notifications.get("Status",0) == 1,"Real resource change notifies")
	app.state.world.status.health = app.state.world.status.maxHealth
	app.state.discover("Goblin")
	check(not app.state.known_creature("Goblin").has("health") and not app.state.known_creature("Goblin").has("armor"),"Sighting hides exact stats")
	app.state.world.bestiary[0].knownInfo = {"health":"20","mana":"0"}
	check(not app.state.known_creature("Goblin").has("health"),"Legacy leaked knownInfo cannot reveal full catalog")
	setup_battle()
	var old_health: int = app.state.world.enemies[0].health
	var count: int = app.client.calls.size()
	app._battle_use("Atacar Goblin")
	check(app.state.world.dice and app.client.calls.size() == count,"Attack prepares local roll without API")
	check(app.state.world.enemies[0].health == old_health and app.state.world.turnIndex == 0,"Preparing attack causes no damage or turn advance")
	app._send()
	check(app.client.busy and app.state.world.has("pendingRoll"),"Roll submits prepared action")
	app.client.reply({"storyText":"Seu golpe causa 6 de dano.","enemies":[{"id":"goblin-1","name":"Goblin","health":14,"maxHealth":20}]})
	check(app.state.world.enemies[0].health == 14 and app.state.world.turnIndex == 1,"Single resolution applies one hit and advances turn")
	check(not app.state.known_creature("Goblin").has("health"),"A first hit does not reveal full health")
	app.allow_test_automation = true
	count = app.client.calls.size()
	app._schedule_enemy()
	await create_timer(1.0).timeout
	check(app.client.calls.size() == count+1 and app.control_turn,"Enemy automatically requests its turn")
	app.client.reject()
	await create_timer(1.0).timeout
	check(app.client.calls.size() == count+1,"Automatic enemy stops after failure, no endless loop")
	app.allow_test_automation = false
	app._retry()
	app.client.reply({"storyText":"O goblin causa 2 de dano.","playerStatus":{"health":int(app.state.world.status.health)-2}})
	check(app.state.world.turnIndex == 0,"Enemy response returns control to player")
	check(app.state.known_creature("Goblin").has("damageType") and not app.state.known_creature("Goblin").has("damage"),"Observed damage type unlocked, theoretical damage still hidden")
	var before: Dictionary = app.state.world.duplicate(true)
	app.state.world.enemies = []
	app.state.observe_turn(before,{"storyText":"O goblin foi derrotado."},"player","Atacar Goblin")
	check(app.state.known_creature("Goblin").health == 20,"Defeat reveals canonical total health")
	app.state.world.location = "Floresta"
	before = app.state.world.duplicate(true)
	var discovery := {"storyText":"Uma leitura revela informações.","bestiaryDiscoveries":[{"name":"Slime","source":"study","fields":["health","armor","mana"],"evidence":"Manual de criaturas"}]}
	app.state.observe_turn(before,discovery,"","Estudar o slime")
	check(not app.state.known_creature("Slime").has("health"),"Study in unsuitable location cannot unlock catalog")
	app.state.world.location = "Biblioteca da guilda"
	app.state.observe_turn(app.state.world.duplicate(true),discovery,"","Pesquisar o slime em um livro")
	check(app.state.known_creature("Slime").health == 12 and app.state.known_creature("Slime").has("armor"),"Appropriate research reveals correct canonical values")
	var caster: Dictionary = {}
	for creature in app.state.master_catalog().creatures:
		if creature.name != "Slime" and str(creature.get("magicAptitude","Nenhuma")).to_lower() != "nenhuma": caster = creature; break
	before = app.state.world.duplicate(true)
	before.enemies = []
	before.turnOrder = [{"id":"caster","name":caster.name,"type":"enemy"}]
	var spell_update := {"storyText":"A criatura utiliza uma técnica mágica.","enemyAction":{"actorId":"caster","kind":"ability","ability":caster.ability}}
	app.state.observe_turn(before,spell_update,"caster","")
	check(app.state.known_creature(caster.name).has("magicAptitude") and not app.state.known_creature(caster.name).has("mana"),"First observed spell reveals aptitude but not exact mana")
	app.state.observe_turn(before,spell_update,"caster","")
	app.state.observe_turn(before,spell_update,"caster","")
	check(app.state.known_creature(caster.name).mana == caster.mana,"Repeated spell observations reveal canonical mana")
	app.state.observe_turn(before,{"storyText":"O caçador explica a defesa do goblin.","bestiaryDiscoveries":[{"name":"Goblin","fields":["armor"],"source":"informant","evidence":"Explicação de um caçador experiente."}]},"","Ouvir o caçador")
	check(app.state.known_creature("Goblin").armor == 9,"Information from a character reveals canonical field")
	setup_battle()
	app._request_turn("Tento uma ação incerta")
	app.client.reply({"storyText":"Você acerta e causa dano antes do dado.","enemies":[{"id":"goblin-1","name":"Goblin","health":1}],"playerStatus":{"health":1},"diceRollChallenge":true,"diceTest":{"attribute":"strength","difficulty":10,"reason":"Golpear o goblin"}})
	check(app.state.world.enemies[0].health == 20 and app.state.world.status.health != 1,"Premature AI damage discarded before roll")
	check(not "Você acerta" in app.state.world.history.back().text,"Premature impact narrative replaced by preparation")
	setup_battle()
	app._queue_player_action("Eu salto enquanto tento girar e atacar o goblin")
	check(app.state.world.pendingTurn.complex and app.state.world.diceTest.difficulty == 15,"Complex maneuver increases difficulty and remains one action")
	setup_battle()
	var original: Dictionary = app.state.world.duplicate(true)
	app._begin_combat_lab(app.state.creature_base("Slime"),2,true)
	check(app.dev_combat and app.dev_offline and app.state.world.enemies.size()==2,"Offline combat lab starts isolated encounter")
	app._initiative_animation()
	for i in app.state.world.turnOrder.size():
		if app.state.world.turnOrder[i].type == "player": app.state.world.turnIndex = i
	app._refresh_game()
	app._battle_use("Atacar Slime")
	app._send()
	await create_timer(.5).timeout
	check(not app.client.busy and app.state.world.history.size() >= 5,"Offline lab resolves roll without API")
	app._end_combat_lab()
	check(app.state.world == original and not app.dev_combat,"Exiting lab restores original adventure exactly")
	app._start_tutorial()
	check(is_instance_valid(app.tutorial_layer),"Tutorial opens")
	var guide = app.tutorial_layer.get_child(0)
	check(guide.steps.size() == 5,"Tutorial covers main interactions")
	if DisplayServer.get_name() != "headless":
		await create_timer(.3).timeout
		await RenderingServer.frame_post_draw
		check(guide.target_rect.intersects(app.story.get_global_rect()),"Spotlight matches highlighted chat")
		root.get_texture().get_image().save_png("res://tests/tutorial-shadow.png")
	guide.close()
	await process_frame
	var layer := CanvasLayer.new(); layer.layer = 60; app.add_child(layer)
	var die = load("res://scripts/dice_cinematic.gd").new()
	die.result = {"attribute":"strength","difficulty":15,"roll":17,"bonus":3,"total":20,"success":true}
	layer.add_child(die)
	check(die.faces.size()==20,"Animated die is a twenty-face icosahedron")
	die.elapsed = 2.2; die.set_process(false); die.queue_redraw()
	if DisplayServer.get_name() != "headless":
		await RenderingServer.frame_post_draw
		root.get_texture().get_image().save_png("res://tests/d20-cinematic.png")
		root.size = Vector2i(390,844)
		app._resize_layout()
		await create_timer(.3).timeout
		await RenderingServer.frame_post_draw
		root.get_texture().get_image().save_png("res://tests/d20-mobile.png")
	die.complete(); layer.queue_free()
	app._open_panel("Bestiário")
	check(is_instance_valid(app.overlay),"Progressive bestiary renders")
	if DisplayServer.get_name() != "headless":
		root.size = Vector2i(1280,720)
		app._resize_layout()
		await create_timer(.3).timeout
		await RenderingServer.frame_post_draw
		root.get_texture().get_image().save_png("res://tests/discovery-bestiary.png")
	app._close_modal()
	print("DISCOVERY AND COMBAT: %d checks, %d failures" % [checks,failures])
	quit(1 if failures else 0)
