extends SceneTree

func _initialize() -> void:
	call_deferred("run")

func run() -> void:
	var client = load("res://scripts/gemini_client.gd").new()
	root.add_child(client)
	if client.api_key.is_empty():
		print("LIVE SKIPPED: GEMINI_API_KEY is not configured.")
		quit(2)
		return
	client.completed.connect(func(text):
		print("LIVE OK: received %d characters from Gemini." % text.length())
		quit(0))
	client.failed.connect(func(message):
		printerr("LIVE FAILED: " + message)
		quit(1))
	client.send([{"role": "user", "parts": [{"text": "Responda apenas: A aventura começa."}]}], "Responda em português de forma breve.")
