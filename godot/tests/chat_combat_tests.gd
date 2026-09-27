extends SceneTree
var app
var checks := 0
var failures := 0
func _initialize(): call_deferred("run")
func check(ok: bool, label: String):
	checks += 1
	if not ok: failures += 1; printerr("FAIL: " + label)
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
	app.state.begin(app.character, "Isekai", "Medieval", "player")
	app.show_screen("inGame")
	app.state.world.dice = true
	app.state.world.diceTest = {"attribute":"wisdom","difficulty":12,"reason":"Rastrear uma criatura"}
	app._refresh_game()
	check(app.send_button.text == "D20", "Send becomes D20")
	app._send()
	check(app.client.calls.size() == 1 and app.client.busy, "D20 submits automatically")
	var result: Dictionary = app.state.world.pendingRoll.duplicate(true)
	var text: String = app.pending
	check(app.state.world.history.size() == 1 and text in app.story.get_parsed_text(), "Roll immediately visible once")
	app.client.reject()
	check(app.state.world.pendingRoll == result and app.state.world.dice, "Failure preserves rolled die")
	app._send()
	check(app.pending == text and app.state.world.history.size() == 1, "Retry never rerolls or duplicates")
	app.client.reply({"storyText":"Você encontra as pegadas de um Slime.","location":"Floresta","diceRollChallenge":false})
	check(app.state.world.history.size() == 2 and not app.state.world.has("pendingRoll"), "Successful roll commits only once")
	check(app.send_button.text == "Enviar", "Send restored after roll")
	app._request_turn("Procuro um adversário")
	var before: Dictionary = app.state.world.duplicate(true)
	app.client.reply({"storyText":"Uma criatura aparece.","enemies":[{"name":"Monstro inventado","health":12}]})
	check(app.repair_count == 1 and app.client.busy and app.state.world == before, "Unknown creature requests repair without mutating")
	app.client.reply({"storyText":"Um Slime emerge da vegetação.","location":"Floresta","enemies":[{"id":"slime-1","name":"Slime","health":12,"maxHealth":12}]})
	check(app.battle_selected and app.battle_panel.visible, "Combat opens automatically")
	check(app.send_button.text == "D20", "Initiative uses D20")
	app._send()
	check(not app.state.world.initiativePending, "Initiative resolved")
	app.state.world.turnOrder = [{"id":"player","name":"Leib","type":"player","initiative":15},{"id":"slime-1","name":"Slime","type":"enemy","initiative":9}]
	app.state.world.turnIndex = 0
	app._refresh_game()
	app._request_turn("Tento uma manobra")
	app.client.reply({"storyText":"Teste sua força.","diceRollChallenge":true,"diceTest":{"attribute":"strength","difficulty":10}})
	check(app.state.world.turnIndex == 0, "Challenge does not advance turn")
	app._send()
	app.client.reply({"storyText":"A manobra termina.","diceRollChallenge":false})
	check(app.state.world.turnIndex == 1, "Resolved roll advances turn")
	app._resolve_actor()
	check(not app.pending in app.story.get_parsed_text(), "Internal command hidden while pending")
	app.client.reply({"storyText":"O Slime investe contra você."})
	check(app.state.world.history[-2].hidden, "Internal command hidden after commit")
	app.state.world.inventory = [{"name":"Poção de Vida","type":"Consumível","quantity":2}]
	app.state.world.turnIndex = 0
	app._battle_use("Usar Poção de Vida em mim", {"item":"Poção de Vida"})
	app.client.reject()
	check(app.state.world.inventory[0].quantity == 2, "Failed use consumes nothing")
	app._retry()
	app.client.reply({"storyText":"A poção restaura suas forças."})
	check(app.state.world.inventory[0].quantity == 1, "Retry consumes item exactly once")
	app.state.world.notifications = {"Sistema":12}
	app._refresh_game()
	check(app.hud_row.get_child(7).has_node("NotificationBadge"), "Red notification badge exists")
	var badge: PanelContainer = app.hud_row.get_child(7).get_node("NotificationBadge")
	check(badge.get_theme_stylebox("panel").bg_color == Color("d92b38"), "Badge red")
	var catalog: Dictionary = app.state.master_catalog()
	check(catalog.creatures.size() == 20 and catalog.items.size() >= 50, "Prompt includes full item and creature catalogs")
	check(JSON.stringify(catalog).length() < 75000, "Catalog deduplicates skills to reduce tokens")
	app.client.provider = "Groq"
	check(app._instruction().length() < 18000, "Groq prompt compact enough for small free context budget")
	app.client.provider = "Gemini"
	check(not app.state.catalog_error({"inventory":[{"name":"Item inventado"}]}).is_empty(), "Unknown item rejected")
	app._prompt_inspector()
	check(is_instance_valid(app.overlay), "Prompt inspector opens")
	app._close_modal()
	app._settings_modal()
	check(is_instance_valid(app.overlay), "Provider settings opens")
	app._close_modal()
	var api = load("res://scripts/gemini_api.gd")
	check(api.parse_game_json("```json\n{\"storyText\":\"Ok\"}\n```").storyText == "Ok", "Fenced JSON handled")
	check(api.parse_game_json("Texto: {\"storyText\":\"Ok\"}").storyText == "Ok", "Wrapped JSON handled")
	check(api.parse_game_json("{broken").is_empty(), "Broken JSON rejected")
	check(api.finish_reason({"candidates":[{"finishReason":"MAX_TOKENS"}]}) == "MAX_TOKENS", "Truncation diagnosed")
	check(api.finish_reason({"promptFeedback":{"blockReason":"SAFETY"}}) == "SAFETY", "Explicit safety diagnosed")
	check(api.extract_chat_text({"choices":[{"message":{"content":"ok"}}]}) == "ok", "Compatible provider text parsed")
	app.state.world.skills = [{"name":"Golpe de teste","cost":3,"costType":"Mana","level":1}]
	app.state.world.status.mana = 10
	app.state.world.turnIndex = 0
	app._battle_use("Usar habilidade", {"pool":"mana","remaining":7})
	app._send()
	app.client.reply({"storyText":"A técnica atinge o alvo.","playerStatus":{"mana":7}})
	check(app.state.world.status.mana == 7, "Skill cost not charged twice")
	app.state.world.turnIndex = 0
	app.state.world.status.mana = 10
	app._battle_use("Usar técnica com teste", {"pool":"mana","remaining":7,"skill":"Golpe de teste","cooldown":2})
	check(app.state.world.status.mana == 10 and app.state.world.has("pendingCombatAction"), "Skill waits for requested roll before charging")
	app._send()
	app.client.reply({"storyText":"A técnica é concluída.","diceRollChallenge":false})
	check(app.state.world.status.mana == 7 and app.state.world.skillCooldowns["Golpe de teste"] == 2, "Roll resolves reserved cost and cooldown")
	check(not app.state.world.has("pendingCombatAction"), "Resolved combat reservation cleared")
	check(not app.state.catalog_error({"diceRollChallenge":true}).is_empty(), "Missing attribute rejected instead of guessing")
	var enemy_update := {"enemies":[{"name":"Slime","health":12,"maxHealth":999,"damage":"999d20"}]}
	app.state.canonicalize_update(enemy_update)
	check(enemy_update.enemies[0].maxHealth == 12 and enemy_update.enemies[0].damage != "999d20", "Canonical creature combat stats restored")
	app.battle_selected = true
	app._refresh_game()
	if DisplayServer.get_name() != "headless":
		await create_timer(.5).timeout
		await RenderingServer.frame_post_draw
		var system_button: Button = app.hud_row.get_child(7)
		var visible_badge: PanelContainer = system_button.get_node("NotificationBadge")
		check(visible_badge.get_global_rect().end.x <= system_button.get_global_rect().end.x + 1, "Notification stays on its own icon")
		root.get_texture().get_image().save_png("res://tests/chat-combat-desktop.png")
		root.size = Vector2i(390,844)
		app._resize_layout()
		await create_timer(.5).timeout
		await RenderingServer.frame_post_draw
		check(app.chat_column.get_global_rect().end.x <= app.get_viewport_rect().size.x + 1, "Combat fits mobile width")
		root.get_texture().get_image().save_png("res://tests/chat-combat-mobile.png")
	print("CHAT COMBAT: %d checks, %d failures" % [checks,failures])
	quit(1 if failures else 0)

