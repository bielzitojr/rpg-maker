extends "res://scripts/gemini_api.gd"
var dispatches := 0
func _ready() -> void:
	http = HTTPRequest.new()
	add_child(http)
	api_key = "gemini-test-placeholder"
	provider_keys = {"Groq":"groq-test-placeholder","OpenRouter":"router-test-placeholder"}
func _dispatch() -> void:
	dispatches += 1
