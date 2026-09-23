extends SceneTree
const Intro = preload("res://scripts/isekai_intro.gd")
var failures := 0
func _initialize(): call_deferred("run")
func check(value: bool, label: String):
	if not value: failures += 1; printerr("FAIL: " + label)
func capture(name_: String):
	await create_timer(0.15).timeout
	await RenderingServer.frame_post_draw
	root.get_texture().get_image().save_png("res://tests/isekai-" + name_ + ".png")
func run():
	var app = load("res://main.tscn").instantiate()
	root.add_child(app)
	app.client.api_key = ""
	app._choose_genre("Isekai")
	check(app.fields.size() == 3, "Only three creation fields")
	app.character.playerName = "Biel"
	app.character.characterName = "Leib"
	app.character.gender = "Não-binário"
	app.show_screen("characterCreation")
	await capture("creation")
	if "--intro-smoke" in OS.get_cmdline_user_args():
		app.character.race = "Humano"
		app.isekai_rolled = true
	app._start_adventure()
	check(app.screen == "isekaiIntro", "Intro starts without API")
	check(not app.music.playing and app.music_path.is_empty(), "Prologue stops background music")
	var rolled: String = app.character.race
	check(Intro.RACES.has(rolled), "Random race has art")
	check(app.character.playerName == "Biel" and app.character.gender == "Não-binário", "Identity preserved")
	var intro = app.view.get_child(0)
	await create_timer(0.8).timeout
	await capture("arrival")
	intro.turn(1)
	await create_timer(0.20).timeout
	await process_frame
	check(intro.turning and intro.blackout.modulate.a > 0 and intro.art.scale == Vector2.ONE, "Smooth undistorted page transition")
	await capture("turn")
	intro.turn(1)
	await create_timer(1.5).timeout
	check(intro.page == 1 and not intro.turning, "Double clicks do not skip pages")
	await capture("cosmos")
	if "--intro-smoke" in OS.get_cmdline_user_args():
		print("INTRO SMOKE: %d failures" % failures)
		quit(failures)
		return
	intro.turn(1)
	await create_timer(1.7).timeout
	check(intro.page == 2, "Forest follows blackout")
	intro.turn(1)
	await create_timer(1.5).timeout
	check(intro.page == 3, "Race reveal reached")
	for race in Intro.RACES:
		intro.race = race
		intro.refresh()
		check(intro.art.texture != null and intro.page_asset().ends_with("race_" + Intro.RACES[race] + ".png"), "Correct art for " + race)
		if race in ["Slime", "Dragão (Jovem)", "Aracne"]: await capture(Intro.RACES[race])
	intro.race = rolled
	intro.refresh()
	intro.turn(-1)
	await create_timer(1.5).timeout
	check(app.character.race == rolled and intro.page == 2, "Back does not reroll")
	intro.turn(1)
	await create_timer(1.5).timeout
	intro.turn(1)
	check(app.isekai_revealed and app.screen == "characterCreation", "Missing key prompts settings after intro")
	app.client.api_key = "test-only-no-network"
	app.mode = "master"
	app._start_adventure()
	check(app.screen == "inGame" and app.state.world.character.race == rolled, "Game uses revealed race")
	check(app.state.world.character["class"] == "Aprendiz" and app.state.world.skills.is_empty(), "No prechosen class skills")
	check(app.state.world.inventory.is_empty(), "No hidden starting weapon")
	var saved: Dictionary = JSON.parse_string(JSON.stringify(app.state.world))
	check(app.state.valid_save(saved), "Reincarnation saves normally")
	app._load_world(saved)
	check(app.screen == "inGame" and app.character.race == rolled, "Loading does not replay or reroll")
	print("ISEKAI: all checks complete, %d failures" % failures)
	quit(failures)

