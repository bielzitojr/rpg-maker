extends SceneTree

const Gemini = preload("res://scripts/gemini_client.gd")
const Saves = preload("res://scripts/save_store.gd")
var failures := 0
var checks := 0

func check(condition: bool, description: String) -> void:
	checks += 1
	if not condition:
		failures += 1
		printerr("FAIL: " + description)

func _initialize() -> void:
	call_deferred("run")

func run() -> void:
	check(Gemini.extract_text(null) == "", "Reject null response")
	check(Gemini.extract_text({"candidates": []}) == "", "Reject blocked response")
	check(Gemini.extract_text({"candidates": [{"content": {"parts": "bad"}}]}) == "", "Reject malformed parts")
	var response := {"candidates": [{"content": {"parts": [{"thought": true, "text": "private reasoning"}, {"text": "Olá"}, {"text": "viajante"}]}}]}
	check(Gemini.extract_text(response) == "Olá\nviajante", "Combine public parts; omit reasoning")
	var data := {"version": 1, "hero": "Lúcia", "genre": "Isekai", "notes": "Pista", "inventory": "Espada", "model": "gemini-2.5-flash", "history": [{"role": "user", "parts": [{"text": "Olá"}]}, {"role": "model", "parts": [{"text": "Bem-vinda"}]}]}
	check(Saves.valid(data), "Valid save accepted")
	check(not Saves.valid({"version": 1}), "Reject incomplete save")
	var invalid := data.duplicate(true)
	invalid.history[0].parts = [17]
	check(not Saves.valid(invalid), "Reject corrupted turn")
	var test_path := "res://tests/roundtrip.tmp.json"
	check(Saves.write(data, test_path) == OK, "Write initial save")
	data.notes = "Anotação revisada"
	check(Saves.write(data, test_path) == OK, "Atomic replacement of existing save")
	var restored := Saves.read_save(test_path)
	check(restored.get("notes") == data.notes and restored.get("hero") == data.hero and JSON.stringify(restored.get("history")) == JSON.stringify(data.history), "Roundtrip preserves history and Unicode")
	DirAccess.remove_absolute(test_path)
	var client := Gemini.new()
	root.add_child(client)
	var replies: Array = []
	var errors: Array = []
	client.completed.connect(func(text): replies.append(text))
	client.failed.connect(func(text): errors.append(text))
	client.api_key = ""
	client.send([], "Test")
	check(errors.size() == 1 and not client.busy, "Missing key fails without a request")
	client._on_response(HTTPRequest.RESULT_SUCCESS, 429, PackedStringArray(), PackedByteArray())
	check(errors.back().contains("Limite"), "Quota failure is explained")
	client._on_response(HTTPRequest.RESULT_TIMEOUT, 0, PackedStringArray(), PackedByteArray())
	check(errors.back().contains("expirou"), "Timeout is explained")
	client._on_response(HTTPRequest.RESULT_SUCCESS, 200, PackedStringArray(), JSON.stringify(response).to_utf8_buffer())
	check(replies == ["Olá\nviajante"], "Successful response reaches consumer")
	client._on_response(HTTPRequest.RESULT_SUCCESS, 200, PackedStringArray(), "not-json".to_utf8_buffer())
	check(errors.back().contains("utilizável"), "Malformed JSON is handled")
	client.cancel()
	check(not client.busy, "Cancellation resets client")
	var scene: PackedScene = load("res://main.tscn")
	var app = scene.instantiate()
	root.add_child(app)
	app.autosave_blocked = true # UI tests never overwrite the player's save.
	app.history = []
	app.pending = "Exploro a floresta."
	app.input.text = app.pending
	app._on_reply("Uma trilha surge entre as árvores.")
	check(app.history.size() == 2 and app.input.text == "", "Completed pair committed to history")
	app.pending = "Próxima ação"
	app.input.text = "Próxima ação"
	app._on_failure("Erro de teste")
	check(app.history.size() == 2 and app.input.text == "Próxima ação", "Failed action retained without corrupting history")
	app.pending = "Próxima ação"
	app._cancel()
	check(app.pending == "" and app.input.text == "Próxima ação", "Cancelled draft retained")
	app._on_reply("Late response")
	check(app.history.size() == 2, "Late reply after cancellation ignored")
	app._roll_dice()
	check(app.input.text.contains("Rolei um d20"), "Dice result available to send")
	app._open_settings()
	check(app.settings_dialog.visible, "Settings opens")
	app.settings_dialog.hide()
	for i in [0, 1, 2]:
		app.tabs.current_tab = i
		check(app.tabs.current_tab == i, "Navigate tab %d" % i)
	app.queue_free()
	client.queue_free()
	await process_frame
	print("TESTS: %d checks, %d failures" % [checks, failures])
	quit(1 if failures else 0)
