extends SceneTree
func _initialize() -> void:
	var output: Array = []
	var helper := ProjectSettings.globalize_path("res://tools/read_credential.ps1")
	var file := ProjectSettings.globalize_path("res://").path_join("../.local/gemini-key.dpapi").simplify_path()
	var powershell := OS.get_environment("SystemRoot").path_join("System32/WindowsPowerShell/v1.0/powershell.exe")
	var result := OS.execute(powershell, PackedStringArray(["-NoProfile", "-NonInteractive", "-WindowStyle", "Hidden", "-ExecutionPolicy", "Bypass", "-File", helper, "-CredentialPath", file]), output, true, false)
	print("PROBE exists=%s exit=%d count=%d length=%d" % [FileAccess.file_exists(file), result, output.size(), str(output[0]).length() if output.size() > 0 else 0])
	if result != 0: print(output)
	quit()
