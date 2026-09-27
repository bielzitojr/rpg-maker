extends SceneTree
var app
var checks := 0
var failures := 0
func _initialize(): call_deferred("run")
func check(ok: bool, label: String):
	checks += 1
	if not ok: failures += 1; printerr("FAIL: " + label)
func settle():
	await create_timer(.4).timeout
	await RenderingServer.frame_post_draw
func run():
	root.mode = Window.MODE_WINDOWED
	app = load("res://main.tscn").instantiate()
	root.add_child(app)
	app.character.characterName = "Leib"
	app.character.race = "Anão"
	app.genre = "Isekai"
	app.state.begin(app.character, "Isekai", "Medieval", "player")
	app.state.world.location = "Orla da Floresta Ancestral"
	app.state.world.history = [{"role":"model","text":"Você abre os olhos e a primeira coisa que sente é o peso. Não o peso do cansaço, mas uma densidade física que nunca conheceu antes. Seus dedos, agora curtos e calejados, agarram a terra úmida e as raízes de árvores que parecem colossais sob sua nova perspectiva.\n\nUma tela translúcida flutua suavemente diante de você, pulsando com uma luz azulada. O som de passos desconhecidos ecoa pela mata. Você está em um corpo de anão, em um mundo que não é o seu."}]
	app.state.world.suggestions = ["Inspecionar a tela flutuante do Sistema", "Tentar se levantar e testar o equilíbrio do novo corpo", "Observar os arredores em busca de sinais de civilização", "Gritar para ver se há alguém por perto"]
	app.show_screen("inGame")
	app.input.text = "Minha ação em elaboração"
	for dimensions in [Vector2i(2560,1038),Vector2i(1920,1080),Vector2i(1280,720),Vector2i(768,1024),Vector2i(390,844),Vector2i(960,600)]:
		root.size = dimensions
		app._resize_layout()
		await settle()
		var available: Vector2 = app.get_viewport_rect().size
		var wide: bool = available.x >= 1100
		check(app.background.size.distance_to(available) < 2, "Background fills viewport " + str(dimensions))
		check(app.story.get_parent().size.y > available.y * .65, "Chat receives most height " + str(dimensions))
		check(app.chat_column.get_global_rect().end.x <= available.x, "Composer stays in viewport " + str(dimensions))
		check(app.input.text == "Minha ação em elaboração", "Resize preserves draft")
		check(app.navigation_panel.visible == wide and app.action_panel.visible == wide, "Responsive sidebars")
		root.get_texture().get_image().save_png("res://tests/layout-%dx%d.png" % [dimensions.x,dimensions.y])
		if not wide:
			app._toggle_drawer("actions")
			await settle()
			check(app.action_panel.visible and app.drawer_shade.visible, "Actions drawer opens")
			check(app.action_panel.get_global_rect().end.x <= available.x + 1, "Drawer fits")
			root.get_texture().get_image().save_png("res://tests/layout-actions-%dx%d.png" % [dimensions.x,dimensions.y])
			app._toggle_drawer("actions")
			app._toggle_drawer("navigation")
			await settle()
			check(app.hud_row.get_child_count() == 10 and app.navigation_panel.visible, "All navigation available")
			app._open_panel("Status")
			check(app.drawer.is_empty() and is_instance_valid(app.overlay), "Navigation opens section")
			app._close_modal()
	root.size = Vector2i(1280,720)
	app._resize_layout()
	await settle()
	check(app.navigation_panel.get_parent() == app.game_columns, "Sidebars restored after resizing")
	print("LAYOUT TESTS: %d checks, %d failures" % [checks, failures])
	quit(failures)
