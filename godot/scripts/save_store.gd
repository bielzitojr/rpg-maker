extends RefCounted

const SAVE_PATH = "user://adventure.json"

static func valid(data: Variant) -> bool:
	if not data is Dictionary or data.get("version") != 1:
		return false
	for field in ["hero", "genre", "notes", "inventory", "model"]:
		if not data.get(field) is String:
			return false
	if not data.get("history") is Array or data.history.size() % 2 != 0:
		return false
	for i in data.history.size():
		var turn: Variant = data.history[i]
		if not turn is Dictionary or turn.get("role") != ("user" if i % 2 == 0 else "model"):
			return false
		var parts: Variant = turn.get("parts")
		if not parts is Array or parts.size() != 1 or not parts[0] is Dictionary:
			return false
		if not parts[0].get("text") is String:
			return false
	return true

static func write(data: Dictionary, path: String = SAVE_PATH) -> Error:
	if not valid(data):
		return ERR_INVALID_DATA
	var file := FileAccess.open(path + ".tmp", FileAccess.WRITE)
	if file == null:
		return FileAccess.get_open_error()
	file.store_string(JSON.stringify(data, "\t"))
	file.flush()
	var error := file.get_error()
	file.close()
	if error != OK:
		return error
	return DirAccess.rename_absolute(path + ".tmp", path)

static func read_save(path: String = SAVE_PATH) -> Dictionary:
	if not FileAccess.file_exists(path):
		return {}
	var file := FileAccess.open(path, FileAccess.READ)
	if file == null:
		return {}
	var parser := JSON.new()
	if parser.parse(file.get_as_text()) != OK:
		return {}
	var data: Variant = parser.data
	return data if valid(data) else {}
