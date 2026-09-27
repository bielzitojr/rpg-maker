extends SceneTree
var checks := 0
var failures := 0
var errors: Array = []
var replies: Array = []
func _initialize(): call_deferred("run")
func check(ok: bool, label: String):
	checks += 1
	if not ok: failures += 1; printerr("FAIL: " + label)
func run():
	var api = load("res://tests/transport_probe.gd").new()
	root.add_child(api)
	api.failed.connect(func(message): errors.append(message))
	api.completed.connect(func(message): replies.append(message))
	var history := [{"role":"user","parts":[{"text":"Olá"}]},{"role":"model","parts":[{"text":"Resposta"}]}]
	var schema := {"type":"OBJECT","properties":{"storyText":{"type":"STRING"}}}
	var contract: Dictionary = api.compact_schema({"type":"OBJECT","properties":{"type":{"type":"STRING"},"description":{"type":"STRING","description":"help"}}})
	check(contract.properties.type is Dictionary and contract.properties.description.type == "string", "Compact schema preserves fields named type and description")
	api.send(history, "Mestre", schema)
	check(api.request_data.url.begins_with(api.API_ROOT), "Gemini endpoint")
	check(api.request_data.body.generationConfig.responseMimeType == "application/json", "Gemini structured mode")
	check(api.request_data.body.generationConfig.maxOutputTokens == 8192, "Enough output for structured reply and reasoning")
	check(api.request_data.body.generationConfig.thinkingConfig.thinkingLevel == "low", "Low thinking latency")
	api.cancel()
	for provider in ["Groq","OpenRouter"]:
		api.provider = provider
		api.send(history, "Mestre", schema)
		check(api.request_data.body.messages[2].role == "assistant", "Provider role mapping " + provider)
		check(api.request_data.body.response_format.type == "json_object", "Provider JSON mode " + provider)
		if provider == "Groq": check(api.request_data.body.max_tokens == 2048, "Groq limits output reservation for free tier")
		check(not "gemini-test-placeholder" in str(api.request_data.headers), "No Gemini key sent to " + provider)
		check(api.request_data.url == ("https://api.groq.com/openai/v1/chat/completions" if provider == "Groq" else "https://openrouter.ai/api/v1/chat/completions"), "Exact provider endpoint")
		api._on_response(0,200,[],JSON.stringify({"choices":[{"finish_reason":"stop","message":{"content":"ok"}}]}).to_utf8_buffer())
		check(replies.back() == "ok" and not api.busy and api.request_data.is_empty(), "Provider completion clears sensitive request")
	api.provider = "Gemini"
	api.send(history,"Mestre")
	api._on_response(0,503,[],"{}".to_utf8_buffer())
	check(api.retry_count == 1 and api.busy, "503 bounded retry scheduled")
	var previous: int = api.dispatches
	api.cancel()
	await create_timer(3.1).timeout
	check(api.dispatches == previous, "Cancel invalidates scheduled retry")
	api.send(history,"Mestre")
	api.retry_count = 1
	api._on_response(0,503,[],"{}".to_utf8_buffer())
	check(not api.busy and "HTTP 503" in errors.back(), "503 stops after retry")
	api.send(history,"Mestre")
	api._on_response(0,429,[],"{}".to_utf8_buffer())
	check(not api.busy and api.retry_count == 0 and "cota" in errors.back(), "Quota doesn't loop requests")
	api.send(history,"Mestre")
	api._on_response(0,200,[],JSON.stringify({"candidates":[{"finishReason":"MAX_TOKENS"}]}).to_utf8_buffer())
	check("limite de saída" in errors.back() and not "bloque" in errors.back(), "Empty truncated response not misclassified safety")
	api.send(history,"Mestre")
	api._on_response(0,200,[],JSON.stringify({"promptFeedback":{"blockReason":"SAFETY"}}).to_utf8_buffer())
	check("SAFETY" in errors.back(), "Explicit block reported accurately")
	api.send(history,"Mestre")
	api.retry_count = 1
	api._on_response(0,200,[],"{}".to_utf8_buffer())
	check("não informado" in errors.back() and not "bloque" in errors.back(), "Unknown empty response not guessed as safety")
	check(not "placeholder" in JSON.stringify(api.last_diagnostic), "Diagnostics never expose test keys")
	api.queue_free()
	print("AI TRANSPORT: %d checks, %d failures" % [checks,failures])
	quit(1 if failures else 0)
