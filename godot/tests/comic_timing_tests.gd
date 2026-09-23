extends SceneTree
var failures := 0
func _initialize(): call_deferred("run")
func check(ok: bool, message: String):
	if not ok: failures += 1; printerr("FAIL: " + message)
func space(intro, echo_: bool = false):
	var event := InputEventKey.new()
	event.keycode = KEY_SPACE
	event.pressed = true
	event.echo = echo_
	intro._input(event)
func shot(label_: String):
	await process_frame
	await RenderingServer.frame_post_draw
	root.get_texture().get_image().save_png("res://tests/comic-" + label_ + ".png")
func run():
	var intro = load("res://scripts/isekai_intro.gd").new()
	intro.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	root.add_child(intro)
	intro.set_process(false)
	check(intro.revealed == 0 and intro.visibility == Vector3.ZERO, "All panels start black")
	intro._process(2.9)
	check(intro.revealed == 0, "No early reveal")
	intro._process(0.11)
	await create_timer(1.0).timeout
	check(intro.revealed == 1 and intro.visibility == Vector3(1, 0, 0), "First band after three seconds")
	check(intro.last_cue == "fall" and intro.sound.playing, "Fall synchronized to first band")
	await shot("first-band")
	space(intro, true)
	check(intro.revealed == 1, "Held key ignored")
	space(intro)
	await create_timer(1.0).timeout
	check(intro.revealed == 2 and intro.visibility == Vector3(1, 1, 0), "Space advances one band")
	check(intro.last_cue == "horn", "Horn synchronized to car")
	await shot("second-band")
	space(intro)
	await create_timer(1.0).timeout
	check(intro.revealed == 3 and intro.page == 0, "Third space completes current page")
	check(intro.last_cue == "breath", "Breath synchronized to blackout")
	intro._process(4.9)
	check(not intro.turning, "Wait five seconds after reveal")
	var click := InputEventMouseButton.new()
	click.pressed = true
	intro._input(click)
	check(intro.idle == 0, "Interaction resets idle")
	intro._process(4.9)
	check(not intro.turning, "Reset postpones automatic advance")
	intro._process(0.11)
	check(intro.turning, "Automatic advance after inactivity")
	space(intro)
	await create_timer(1.5).timeout
	check(intro.page == 1 and intro.revealed == 0 and not intro.turning, "Next page black; input during transition ignored")
	check(not intro.sound.playing, "Sounds stop between pages")
	check(intro.ink.get_shader_parameter("cuts") == Vector2(310.0/1024.0,608.0/1024.0), "Cosmos uses actual gutters")
	intro.set_band(1.0, 0)
	await shot("cosmos-first-fixed")
	intro.set_band(1.0, 1)
	await shot("cosmos-second-fixed")
	check(intro.art.scale == Vector2.ONE and intro.art.rotation == 0, "No page distortion")
	for i in 3: space(intro)
	space(intro)
	await create_timer(1.5).timeout
	check(intro.page == 2, "Space advances completed page")
	check(intro.ink.get_shader_parameter("cuts").x < 0.22, "Unequal forest bands")
	intro.page = 3
	intro.race = "Goblin"
	intro.refresh()
	check(intro.ink.get_shader_parameter("vertical_panels"), "Goblin uses vertical panels")
	space(intro)
	await create_timer(1.0).timeout
	await shot("goblin-first")
	var result := {"count": 0}
	intro.completed.connect(func(): result.count += 1)
	space(intro)
	space(intro)
	await create_timer(1.0).timeout
	intro._process(5.1)
	space(intro)
	check(result.count == 1, "Final page completes once")
	print("COMIC TIMING: %d failures" % failures)
	quit(failures)
