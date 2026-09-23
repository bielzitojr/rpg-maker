extends Node
## Native REST client. The credential stays in memory, never in a save or URL.
signal completed(text: String)
signal failed(message: String)

const API_ROOT = "https://generativelanguage.googleapis.com/v1beta/models/"
var api_key := ""
var model := "gemini-3-flash-preview"
var busy := false
var http: HTTPRequest

func _ready() -> void:
	http = HTTPRequest.new()
	http.timeout = 90.0
	http.body_size_limit = 4 * 1024 * 1024
	add_child(http)
	http.request_completed.connect(_on_response)
	api_key = OS.get_environment("GEMINI_API_KEY")

func send(history: Array, instruction: String) -> void:
	if busy:
		return
	if api_key.strip_edges().is_empty():
		failed.emit("Configure sua chave Gemini antes de iniciar a aventura.")
		return
	var valid_model := RegEx.new()
	valid_model.compile("^[a-zA-Z0-9._-]+$")
	if valid_model.search(model) == null:
		failed.emit("O identificador do modelo é inválido.")
		return
	var body := JSON.stringify({
		"systemInstruction": {"parts": [{"text": instruction}]},
		"contents": history,
		"generationConfig": {"temperature": 0.85, "maxOutputTokens": 4096}
	})
	busy = true
	var result := http.request(API_ROOT + model + ":generateContent", PackedStringArray([
		"Content-Type: application/json", "x-goog-api-key: " + api_key.strip_edges()
	]), HTTPClient.METHOD_POST, body)
	if result != OK:
		busy = false
		failed.emit("Não foi possível iniciar a conexão. Código %d." % result)

func cancel() -> void:
	http.cancel_request()
	busy = false

func _on_response(result: int, code: int, _headers: PackedStringArray, body: PackedByteArray) -> void:
	busy = false
	if result != HTTPRequest.RESULT_SUCCESS:
		failed.emit("A conexão falhou ou expirou. Sua ação foi preservada; tente novamente.")
		return
	if code != 200:
		var messages := {
			400: "A solicitação não foi aceita. Confira a chave e o modelo nas configurações.",
			401: "A chave Gemini não foi aceita.",
			403: "A chave não tem acesso à API ou ao modelo escolhido.",
			404: "Modelo indisponível. Altere o nome do modelo nas configurações.",
			429: "Limite de uso do Gemini atingido. Aguarde antes de tentar novamente."
		}
		failed.emit(messages.get(code, "O Gemini está indisponível (HTTP %d). Tente novamente." % code))
		return
	var parser := JSON.new()
	var parse_result := parser.parse(body.get_string_from_utf8())
	var text := extract_text(parser.data if parse_result == OK else null)
	if text.is_empty():
		failed.emit("O Gemini não retornou texto utilizável. A resposta pode ter sido bloqueada; reformule sua ação.")
	else:
		completed.emit(text)

static func extract_text(data: Variant) -> String:
	if not data is Dictionary:
		return ""
	var candidates: Variant = data.get("candidates", [])
	if not candidates is Array or candidates.is_empty() or not candidates[0] is Dictionary:
		return ""
	var content: Variant = candidates[0].get("content", {})
	if not content is Dictionary:
		return ""
	var parts: Variant = content.get("parts", [])
	if not parts is Array:
		return ""
	var chunks := PackedStringArray()
	for part in parts:
		if part is Dictionary and not part.get("thought", false) and part.get("text") is String:
			chunks.append(part.text)
	return "\n".join(chunks).strip_edges()
