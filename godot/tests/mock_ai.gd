extends "res://scripts/gemini_api.gd"
var calls: Array = []
func _ready() -> void:
	http = HTTPRequest.new()
	add_child(http)
	api_key = "test-only-no-real-credential"
func send(history: Array, instruction: String, schema_: Dictionary = {}) -> void:
	busy = true
	calls.append({"history": history.duplicate(true), "instruction": instruction, "schema": schema_})
func reply(value: Dictionary) -> void:
	busy = false
	completed.emit(JSON.stringify(value))
func reject() -> void:
	busy = false
	failed.emit("Erro de rede simulado")
