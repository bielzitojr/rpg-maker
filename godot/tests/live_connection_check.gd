extends SceneTree
var api
func _initialize(): call_deferred("run")
func run():
	api = load("res://scripts/gemini_api.gd").new()
	root.add_child(api)
	var store = load("res://scripts/rpg_store.gd").new()
	var prefs: Variant = store.read_json(store.base.path_join("settings.json"))
	if prefs is Dictionary:
		api.provider = str(prefs.get("provider","Gemini"))
		api.model = str(prefs.get("model",api.model))
		api.provider_models.Groq = str(prefs.get("groqModel",api.provider_models.Groq))
		api.provider_models.OpenRouter = str(prefs.get("routerModel",api.provider_models.OpenRouter))
	api.text_timeout = 75
	api.completed.connect(func(text):
		print("LIVE CONNECTION: " + JSON.stringify({"validJson": not api.parse_game_json(text).is_empty(), "diagnostic":api.last_diagnostic}))
		quit())
	api.failed.connect(func(_message):
		print("LIVE CONNECTION FAILED: " + JSON.stringify(api.last_diagnostic))
		quit(1))
	if api.text_key().is_empty(): print("LIVE CONNECTION: No configured credential available for selected provider; skipped."); quit(); return
	api.send([{"role":"user","parts":[{"text":"Teste técnico de conexão. Retorne storyText como Conexão confirmada e location como Teste."}]}],"Responda somente JSON breve.",{"type":"OBJECT","properties":{"storyText":{"type":"STRING"},"location":{"type":"STRING"}},"required":["storyText","location"]})
	api.retry_count = 1 # One deliberate live call; do not consume repeated requests.
