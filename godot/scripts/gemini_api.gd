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

func _ready() -> void:
	http = HTTPRequest.new()
	http.timeout = 90.0
	http.body_size_limit = 24 * 1024 * 1024
	add_child(http)
	http.request_completed.connect(_on_response)
	load_local_credential()

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

func send(history: Array, instruction: String, schema: Dictionary = {}) -> void:
	var config := {"temperature": 0.8, "maxOutputTokens": 8192}
	if not schema.is_empty():
		config.responseMimeType = "application/json"
		config.responseSchema = schema
	_request({"systemInstruction": {"parts": [{"text": instruction}]}, "contents": history, "generationConfig": config}, model, false)

func generate_image(prompt: String) -> void:
	_request({"contents": [{"role": "user", "parts": [{"text": prompt}]}], "generationConfig": {"responseModalities": ["TEXT", "IMAGE"]}}, image_model, true)

func _request(body: Dictionary, selected_model: String, is_image: bool) -> void:
	if busy: return
	if api_key.strip_edges().is_empty():
		failed.emit("Nenhuma chave Gemini encontrada. Abra Configurações e informe a chave da API.")
		return
	var valid_model := RegEx.new()
	valid_model.compile("^[a-zA-Z0-9._-]+$")
	if valid_model.search(selected_model) == null:
		failed.emit("Nome de modelo inválido. Confira as configurações.")
		return
	busy = true
	image_request = is_image
	progress.emit("Conectando ao Gemini…")
	var result := http.request(API_ROOT + selected_model + ":generateContent", PackedStringArray(["Content-Type: application/json", "x-goog-api-key: " + api_key.strip_edges()]), HTTPClient.METHOD_POST, JSON.stringify(body))
	if result != OK:
		busy = false
		failed.emit("Não foi possível iniciar a conexão (código %d)." % result)

func cancel() -> void:
	http.cancel_request()
	busy = false

func _on_response(result: int, code: int, _headers: PackedStringArray, body: PackedByteArray) -> void:
	busy = false
	if result != HTTPRequest.RESULT_SUCCESS:
		failed.emit("A conexão falhou ou expirou. Sua ação foi preservada. Verifique a internet e tente novamente.")
		return
	if code != 200:
		var messages := {400: "Solicitação recusada. Confira a chave e o modelo.", 401: "A chave Gemini não foi aceita.", 403: "Esta chave não tem acesso à API ou ao modelo.", 404: "Modelo indisponível. Altere o modelo em Configurações.", 429: "Limite de uso da API Gemini atingido. Aguarde e tente novamente.", 503: "O Gemini está temporariamente indisponível. Tente novamente."}
		var detail := ""
		var error_parser := JSON.new()
		if error_parser.parse(body.get_string_from_utf8()) == OK and error_parser.data is Dictionary:
			var error_data: Variant = error_parser.data.get("error")
			if error_data is Dictionary and error_data.get("message") is String:
				detail = " " + error_data.message.replace(api_key, "[chave oculta]").left(400)
		failed.emit("%s (HTTP %d)%s" % [messages.get(code, "Falha no serviço Gemini."), code, detail])
		return
	var parser := JSON.new()
	if parser.parse(body.get_string_from_utf8()) != OK or not parser.data is Dictionary:
		failed.emit("O Gemini retornou uma resposta inválida. Nenhum progresso foi alterado.")
		return
	verified = true
	if image_request:
		for part in extract_parts(parser.data):
			if part.get("inlineData") is Dictionary and part.inlineData.get("data") is String:
				image_completed.emit(Marshalls.base64_to_raw(part.inlineData.data))
				return
		failed.emit("O modelo não retornou imagem. Confira o modelo de retratos ou carregue uma imagem local.")
		return
	var text := extract_text(parser.data)
	if text.is_empty(): failed.emit("O Gemini não retornou texto. A resposta pode ter sido bloqueada; reformule sua ação.")
	else: completed.emit(text)

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
