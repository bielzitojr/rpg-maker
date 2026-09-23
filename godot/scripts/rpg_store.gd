extends RefCounted
const State = preload("res://scripts/rpg_state.gd")
var base := "user://rpg_maker_v2"
var last_error := ""

func read_json(path: String) -> Variant:
	if not FileAccess.file_exists(path): return null
	var parser := JSON.new()
	if parser.parse(FileAccess.get_file_as_string(path)) != OK: return null
	return parser.data

func write_json(path: String, data: Variant) -> bool:
	last_error = ""
	DirAccess.make_dir_recursive_absolute(path.get_base_dir())
	var file := FileAccess.open(path + ".tmp", FileAccess.WRITE)
	if file == null:
		last_error = "Não foi possível abrir o arquivo para salvar."
		return false
	file.store_string(JSON.stringify(data, "\t"))
	file.flush()
	var error := file.get_error()
	file.close()
	if error == OK and FileAccess.file_exists(path):
		error = DirAccess.copy_absolute(path, path + ".bak")
	if error == OK: error = DirAccess.rename_absolute(path + ".tmp", path)
	if error != OK: last_error = "Falha ao salvar (código %d). O arquivo anterior foi preservado." % error
	return error == OK

func save_world(world: Dictionary, kind: String = "adventures") -> bool:
	if not State.valid_save(world):
		last_error = "O estado da aventura não é válido para salvar."
		return false
	var copy: Dictionary = world.duplicate(true)
	copy.savedAt = Time.get_datetime_string_from_system().replace("T", " ")
	return write_json(base.path_join(kind).path_join(str(copy.id).validate_filename() + ".json"), copy)

func list_saves(kind: String) -> Array:
	var list: Array = []
	var directory := base.path_join(kind)
	if not DirAccess.dir_exists_absolute(directory): return list
	for filename in DirAccess.get_files_at(directory):
		if not filename.ends_with(".json"): continue
		var path := directory.path_join(filename)
		var data: Variant = read_json(path)
		if State.valid_save(data): list.append({"path": path, "data": data})
		else: list.append({"path": path, "error": "Save inválido: " + filename})
	list.sort_custom(func(a, b): return str(a.get("data", {}).get("savedAt", "")) > str(b.get("data", {}).get("savedAt", "")))
	return list
