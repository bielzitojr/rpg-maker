extends Node
signal completed(text: String)
signal image_completed(bytes: PackedByteArray)
signal failed(message: String)
signal progress(message: String)
const API_ROOT = "https://generativelanguage.googleapis.com/v1beta/models/"
var api_key := ""
var credential_source := "Nenhuma chave configurada"
var model := "gemini-3-flash-preview"
var image_model := "gemini-2.5-flash-image"
var busy := false
var verified := false
var http: HTTPRequest
var image_request := false
var provider := "Gemini"
var provider_keys := {"Groq": "", "OpenRouter": ""}
var provider_models := {"Groq": "openai/gpt-oss-20b", "OpenRouter": "openrouter/free"}
var retry_count := 0
var generation := 0
var status_message := ""
var text_timeout := 75.0
var request_started := 0
var request_data: Dictionary = {}
var last_diagnostic: Dictionary = {}

func _ready() -> void:
	http = HTTPRequest.new()
	http.timeout = 45.0
	http.body_size_limit = 24 * 1024 * 1024
	add_child(http)
	http.request_completed.connect(_on_response)
	load_local_credential()
	provider_keys.Groq = OS.get_environment("GROQ_API_KEY")
	provider_keys.OpenRouter = OS.get_environment("OPENROUTER_API_KEY")

func load_local_credential() -> void:
	var protected_path := ProjectSettings.globalize_path("res://").path_join("../.local/gemini-key.dpapi").simplify_path()
	if OS.get_name() == "Windows" and FileAccess.file_exists(protected_path):
		var output: Array = []
		var helper := ProjectSettings.globalize_path("res://tools/read_credential.ps1")
		var powershell := OS.get_environment("SystemRoot").path_join("System32/WindowsPowerShell/v1.0/powershell.exe")
		var result := OS.execute(powershell, PackedStringArray(["-NoProfile", "-NonInteractive", "-WindowStyle", "Hidden", "-ExecutionPolicy", "Bypass", "-File", helper, "-CredentialPath", protected_path]), output, false, false)
		if result == 0 and not output.is_empty() and usable_key(str(output[0]).strip_edges()):
			api_key = str(output[0]).strip_edges()
			credential_source = "Chave local protegida pelo Windows"
			output.clear()
			return
	# Read the original credential outside res://. Never copy it into exported assets.
	var source := ProjectSettings.globalize_path("res://").path_join("../config/apiKey.ts").simplify_path()
	var regex := RegEx.new()
	regex.compile("MANUAL_API_KEY[^=]*=\\s*['\"]([^'\"]+)['\"]")
	if FileAccess.file_exists(source):
		var found := regex.search(FileAccess.get_file_as_string(source))
		if found and usable_key(found.get_string(1)):
			api_key = found.get_string(1)
			credential_source = "Chave do projeto original"
			return
	var environment := OS.get_environment("GEMINI_API_KEY")
	if usable_key(environment):
		api_key = environment
		credential_source = "Variável GEMINI_API_KEY"
		return
	var env_path := ProjectSettings.globalize_path("res://").path_join("../.env.local").simplify_path()
	if FileAccess.file_exists(env_path):
		regex.compile("(?m)^GEMINI_API_KEY\\s*=\\s*([^\\r\\n]+)")
		var found := regex.search(FileAccess.get_file_as_string(env_path))
		if found:
			var candidate := found.get_string(1).strip_edges().trim_prefix("\"").trim_suffix("\"").trim_prefix("'").trim_suffix("'")
			if usable_key(candidate):
				api_key = candidate
				credential_source = "Arquivo .env.local original"

static func usable_key(value: String) -> bool:
	var lower := value.to_lower()
	return value.strip_edges().length() >= 20 and not "placeholder" in lower and not "your_" in lower and not "sua_chave" in lower

func text_key() -> String:
	return api_key if provider == "Gemini" else str(provider_keys.get(provider, ""))

func text_model() -> String:
	return model if provider == "Gemini" else str(provider_models.get(provider, ""))

func send(history: Array, instruction: String, schema: Dictionary = {}) -> void:
	if busy: return
	if text_key().strip_edges().is_empty():
		failed.emit("Configure sua chave de " + provider + " em Configurações.")
		return
	var body: Dictionary
	if provider == "Gemini":
		var config := {"temperature": 1.0, "maxOutputTokens": 8192}
		if model.begins_with("gemini-3"): config.thinkingConfig = {"thinkingLevel": "low"}
		elif model.begins_with("gemini-2.5-flash") and not "lite" in model: config.thinkingConfig = {"thinkingBudget":512}
		if not schema.is_empty():
			config.responseMimeType = "application/json"
			config.responseSchema = schema
		body = {"systemInstruction": {"parts": [{"text": instruction}]}, "contents": history, "generationConfig": config}
		_begin_request(API_ROOT + model.uri_encode() + ":generateContent", ["Content-Type: application/json", "x-goog-api-key: " + api_key.strip_edges()], body, false)
	else:
		var messages: Array = [{"role": "system", "content": instruction + ("\nRetorne somente JSON válido conforme este esquema: " + JSON.stringify(compact_schema(schema)) if not schema.is_empty() else "")}]
		for turn in history:
			var text := ""
			for part in turn.get("parts", []): text += str(part.get("text", ""))
			messages.append({"role": "assistant" if turn.role == "model" else "user", "content": text})
		body = {"model": text_model(), "messages": messages, "max_tokens": 2048 if provider == "Groq" else 8192}
		if not schema.is_empty(): body.response_format = {"type": "json_object"}
		if provider == "Groq" and text_model().begins_with("openai/gpt-oss"): body.reasoning_effort = "low"
		if provider == "OpenRouter": body.provider = {"require_parameters": true}
		var endpoint := "https://api.groq.com/openai/v1/chat/completions" if provider == "Groq" else "https://openrouter.ai/api/v1/chat/completions"
		_begin_request(endpoint, ["Content-Type: application/json", "Authorization: Bearer " + text_key().strip_edges()], body, false)

func generate_image(prompt: String) -> void:
	if busy: return
	if api_key.is_empty(): failed.emit("Retratos por IA precisam de uma chave Gemini. Você também pode carregar uma imagem."); return
	_begin_request(API_ROOT + image_model.uri_encode() + ":generateContent", ["Content-Type: application/json", "x-goog-api-key: " + api_key.strip_edges()], {"contents": [{"role": "user", "parts": [{"text": prompt}]}], "generationConfig": {"responseModalities": ["TEXT", "IMAGE"]}}, true)

func _begin_request(url: String, headers: Array, body: Dictionary, is_image: bool) -> void:
	generation += 1
	retry_count = 0
	image_request = is_image
	request_data = {"url": url, "headers": headers, "body": body}
	busy = true
	request_started = Time.get_ticks_msec()
	_dispatch()

func _dispatch() -> void:
	status_message = "Conectando a " + ("Gemini" if image_request else provider) + (" · tentativa 2/2" if retry_count > 0 else "")
	progress.emit(status_message)
	http.timeout = 90.0 if image_request else clampf(text_timeout,30,120)
	var result := http.request(request_data.url, PackedStringArray(request_data.headers), HTTPClient.METHOD_POST, JSON.stringify(request_data.body))
	if result != OK: _fail("Não foi possível iniciar a conexão. Sua ação foi preservada.")

func cancel() -> void:
	generation += 1
	http.cancel_request()
	busy = false
	request_data = {}
	status_message = "Cancelado"

func _fail(message: String) -> void:
	busy = false
	request_data = {}
	status_message = message
	failed.emit(message)

func _retry_transient(headers: PackedStringArray) -> bool:
	if image_request or retry_count >= 1 or request_data.is_empty(): return false
	var delay := 2.0 + randf()
	for header in headers:
		if header.to_lower().begins_with("retry-after:"):
			var value := header.split(":", true, 1)[1].strip_edges()
			if value.is_valid_float():
				if float(value) > 20: return false
				delay = maxf(delay, float(value))
	retry_count += 1
	status_message = "Serviço ocupado. Nova tentativa em %ds; você pode cancelar." % ceili(delay)
	progress.emit(status_message)
	_retry_later(delay, generation)
	return true

func _retry_later(delay: float, ticket: int) -> void:
	await get_tree().create_timer(delay).timeout
	if ticket == generation and busy: _dispatch()

func _on_response(result: int, code: int, headers: PackedStringArray, body: PackedByteArray) -> void:
	if not busy: return
	last_diagnostic = {"provider": "Gemini" if image_request else provider, "model": image_model if image_request else text_model(), "http": code, "transport": result, "retries": retry_count, "elapsedSeconds": snappedf((Time.get_ticks_msec()-request_started)/1000.0,.1), "timeoutSeconds": text_timeout}
	if result != HTTPRequest.RESULT_SUCCESS:
		if _retry_transient(headers): return
		var reason: String = {2:"Não foi possível conectar ao servidor.",3:"Falha ao localizar o servidor (DNS).",4:"A conexão foi interrompida.",5:"Falha na conexão segura TLS.",6:"O servidor não enviou uma resposta HTTP válida.",13:"O servidor não concluiu a resposta no tempo configurado."}.get(result,"Falha de transporte de rede (código %d)." % result)
		last_diagnostic.cause = reason
		_fail("%s: %s Sua ação e seu dado foram preservados. Isso não confirma um problema na chave. Consulte Dev → Prompt → Diagnóstico ou tente outro provedor." % [last_diagnostic.provider,reason])
		return
	if code != 200:
		if code in [408, 500, 502, 503, 504] and _retry_transient(headers): return
		var messages := {400: "Solicitação recusada. Confira o modelo e seu suporte a JSON.", 401: "Chave não aceita.", 402: "O provedor exige saldo para este modelo.", 403: "Esta chave não tem acesso ao modelo.", 404: "Modelo indisponível. Altere o modelo nas configurações.", 429: "Limite/cota do provedor atingido. Aguarde a renovação ou selecione outro provedor configurado.", 503: "Serviço temporariamente indisponível, mesmo após nova tentativa."}
		_fail("%s (HTTP %d) %s Sua ação foi preservada." % [last_diagnostic.provider, code, messages.get(code, "Falha temporária no serviço.")])
		return
	var parser := JSON.new()
	if parser.parse(body.get_string_from_utf8()) != OK or not parser.data is Dictionary:
		_fail("Resposta de rede inválida. Nenhum progresso foi alterado."); return
	var data: Dictionary = parser.data
	if image_request:
		for part in extract_parts(data):
			if part.get("inlineData") is Dictionary and part.inlineData.get("data") is String:
				busy = false; request_data = {}; image_completed.emit(Marshalls.base64_to_raw(part.inlineData.data)); return
		_fail("O modelo não retornou imagem. Confira o modelo de retratos ou carregue uma imagem local."); return
	var text := extract_text(data) if provider == "Gemini" else extract_chat_text(data)
	var reason := finish_reason(data)
	last_diagnostic.finishReason = reason
	if reason in ["MAX_TOKENS", "length"]:
		_fail("A resposta foi interrompida pelo limite de saída do modelo. O estado foi preservado; tente uma descrição mais curta ou outro modelo."); return
	if text.is_empty():
		if reason in ["SAFETY", "BLOCKLIST", "PROHIBITED_CONTENT", "content_filter"]:
			_fail("O provedor bloqueou esta resposta (" + reason + "). Reformule a ação.")
		elif reason == "RECITATION": _fail("O provedor interrompeu a resposta por semelhança com conteúdo existente. Reformule a ação.")
		else:
			if _retry_transient(headers): return
			_fail("O provedor não enviou uma resposta de texto. Motivo: " + (reason if not reason.is_empty() else "não informado") + ". Sua ação foi preservada.")
		return
	busy = false
	request_data = {}
	verified = true
	completed.emit(text)

static func extract_chat_text(data: Dictionary) -> String:
	var choices: Variant = data.get("choices", [])
	if not choices is Array or choices.is_empty() or not choices[0] is Dictionary: return ""
	var message: Variant = choices[0].get("message", {})
	return str(message.content).strip_edges() if message is Dictionary and message.get("content") is String else ""

static func compact_schema(value: Variant) -> Variant:
	if value is Dictionary:
		var result := {}
		for key in value:
			if key == "description" and value[key] is String: continue
			result[key] = str(value[key]).to_lower() if key == "type" and value[key] is String else compact_schema(value[key])
		return result
	if value is Array:
		var result: Array = []
		for item in value: result.append(compact_schema(item))
		return result
	return value

static func finish_reason(data: Dictionary) -> String:
	if data.get("promptFeedback") is Dictionary and data.promptFeedback.has("blockReason"): return str(data.promptFeedback.blockReason)
	for key in ["candidates", "choices"]:
		var entries: Variant = data.get(key, [])
		if entries is Array and not entries.is_empty() and entries[0] is Dictionary:
			return str(entries[0].get("finishReason", entries[0].get("finish_reason", "")))
	return ""

static func parse_game_json(text: String) -> Dictionary:
	var payload := text.strip_edges().trim_prefix("```json").trim_prefix("```").trim_suffix("```").strip_edges()
	var parser := JSON.new()
	if parser.parse(payload) == OK and parser.data is Dictionary: return parser.data
	var first := payload.find("{")
	var last := payload.rfind("}")
	if first >= 0 and last > first and parser.parse(payload.substr(first, last-first+1)) == OK and parser.data is Dictionary: return parser.data
	return {}

static func extract_parts(data: Variant) -> Array:
	if not data is Dictionary: return []
	var candidates: Variant = data.get("candidates")
	if not candidates is Array or candidates.is_empty() or not candidates[0] is Dictionary: return []
	var content: Variant = candidates[0].get("content")
	if not content is Dictionary or not content.get("parts") is Array: return []
	return content.parts.filter(func(part): return part is Dictionary)

static func extract_text(data: Variant) -> String:
	var chunks := PackedStringArray()
	for part in extract_parts(data):
		if not part.get("thought", false) and part.get("text") is String: chunks.append(part.text)
	return "\n".join(chunks).strip_edges()
