extends RefCounted
## Canonical gameplay state; UI and network never mutate a partially decoded response.
const GENRES = ["Arena", "Bíblico", "Dungeon", "Exploração Espacial", "Fantasia", "Guerra", "Investigação", "Isekai", "Terror"]
const SETTINGS = ["Medieval", "Steampunk", "Cyberpunk", "Cósmico", "Pós-apocalíptico", "Western", "Mitológico", "Subaquático"]
const ATTRIBUTES = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"]
var catalog: Dictionary
var world: Dictionary = {}

func _init() -> void:
	catalog = JSON.parse_string(FileAccess.get_file_as_string("res://data/original.json"))

func profile() -> Dictionary:
	return {"playerName": "", "characterName": "", "gender": "Masculino", "race": "Humano", "class": "Guerreiro", "weapon": "Espada Longa", "appearance": "", "background": "", "image": "", "imageZoom": 1.0, "provacao": "Gula"}

func begin(character: Dictionary, genre: String, setting: String, mode: String) -> void:
	var stats := {"health": 10, "maxHealth": 10, "mana": 10, "maxMana": 10, "energy": 10, "maxEnergy": 10, "sanity": 100, "maxSanity": 100 if genre == "Terror" else 0, "level": 1, "experience": 0, "maxExperience": 100, "skillPoints": 2 if genre == "Isekai" else 0, "gold": 0, "description": "Pronto para a aventura!", "title": "nenhum", "fame": "Desconhecido"}
	var race_bonus: Dictionary = catalog.RACE_STATS_BONUSES.get(character.race, catalog.MONSTER_RACE_STATS_BONUSES.get(character.race, {}))
	var class_bonus: Dictionary = catalog.CLASS_STATS_BONUSES.get(character["class"], {})
	for attr in ATTRIBUTES:
		stats[attr] = int(race_bonus.get(attr, 0)) + int(class_bonus.get(attr, 0))
	for resource in [["health", "maxHealth", "constitution"], ["mana", "maxMana", "intelligence"], ["energy", "maxEnergy", "dexterity"]]:
		stats[resource[1]] = maxi(10, 10 + int(stats[resource[2]]) * 10)
		stats[resource[0]] = stats[resource[1]]
	world = {"version": 2, "id": str(Time.get_unix_time_from_system()).replace(".", "-") + "-" + str(randi()), "character": character.duplicate(true), "genre": genre, "setting": setting, "mode": mode, "status": stats, "inventory": [], "skills": [], "bestiary": [], "allies": [], "enemies": [], "history": [], "log": [], "notifications": {}, "location": "Local Desconhecido", "gameTime": {"hour": 8, "minute": 0, "day": 1, "month": 1, "year": 1428}, "achievements": [], "suggestions": [], "dice": false, "initiativePending": false, "turnOrder": [], "turnIndex": 0, "notebook": {"notes": "", "npcs": "", "places": "", "quests": ""}, "shipStatus": {}, "factionReputation": [], "squadStatus": {}, "evidenceBoard": [], "visited": []}
	if genre == "Isekai":
		world.skills = [] # Isekai skills are chosen through the tree.
	if genre != "Bíblico": world.character.erase("provacao")
	for weapon in weapons(character):
		if weapon.name == character.weapon:
			world.inventory.append({"name": weapon.name, "description": "Sua arma inicial.", "type": "Arma", "quantity": 1, "damage": weapon.damage})
	log_event("Aventura criada: %s — %s." % [genre, setting])

func weapons(character: Dictionary) -> Array:
	if character.race in catalog.RACES_WITH_NATURAL_WEAPONS:
		return [catalog.NATURAL_WEAPON]
	return catalog.WEAPONS_BY_CLASS.get(character["class"], [])

func normalize_response(raw: Variant) -> Dictionary:
	if not raw is Dictionary or not raw.get("storyText") is String or raw.storyText.strip_edges().is_empty():
		return {}
	var clean := {"storyText": raw.storyText}
	if raw.get("location") is String: clean.location = raw.location
	for field in ["playerStatus", "gameTime", "shipStatus", "squadStatus", "npcDialogue"]:
		if raw.get(field) is Dictionary: clean[field] = raw[field].duplicate(true)
	for field in ["inventory", "skills", "bestiary", "allies", "enemies", "factionReputation", "evidenceBoard"]:
		if raw.get(field) is Array:
			clean[field] = []
			for item in raw[field]:
				if not item is Dictionary: continue
				if field == "evidenceBoard":
					if item.get("id") is String and item.get("description") is String: clean[field].append(item)
				elif item.get("name") is String and not item.name.is_empty():
					clean[field].append(item)
	if raw.get("actionSuggestions") is Array:
		clean.actionSuggestions = []
		for value in raw.actionSuggestions:
			if value is String and clean.actionSuggestions.size() < 5: clean.actionSuggestions.append(value)
	if raw.get("diceRollChallenge") is bool: clean.diceRollChallenge = raw.diceRollChallenge
	if raw.get("diceTest") is Dictionary:
		var test: Dictionary = raw.diceTest
		if test.get("attribute") in ATTRIBUTES and (test.get("difficulty") is int or test.get("difficulty") is float):
			clean.diceTest = {"attribute": test.attribute, "difficulty": clampi(int(test.difficulty), 1, 40), "reason": str(test.get("reason", "Teste de atributo"))}
	if raw.get("unlockedAchievementId") is String: clean.unlockedAchievementId = raw.unlockedAchievementId
	if raw.get("bestiaryDiscoveries") is Array: clean.bestiaryDiscoveries = raw.bestiaryDiscoveries.filter(func(entry): return entry is Dictionary).duplicate(true)
	if raw.get("enemyAction") is Dictionary: clean.enemyAction = raw.enemyAction.duplicate(true)
	return clean

func commit(action: String, update: Dictionary, opening: bool = false) -> void:
	if not world.history.is_empty() and world.history.back().get("localRoll", false) and world.history.back().text == action:
		world.history.back().erase("localRoll")
	else:
		world.history.append({"role": "user", "text": action, "hidden": opening})
	var story: String = update.storyText
	if update.get("npcDialogue") is Dictionary:
		story += "\n\n%s: %s" % [update.npcDialogue.get("character", ""), update.npcDialogue.get("line", "")]
	world.history.append({"role": "model", "text": story})
	apply_update(update)

func apply_update(update: Dictionary) -> void:
	if update.has("location"):
		world.location = update.location
		if not update.location in world.visited: world.visited.append(update.location)
	if update.has("gameTime"):
		for key in world.gameTime:
			var value: Variant = update.gameTime.get(key)
			if value is float or value is int: world.gameTime[key] = maxi(0, int(value))
	if update.has("playerStatus"):
		var old_status: Dictionary = world.status.duplicate(true)
		var previous_level := int(world.status.level)
		var previous_points := int(world.status.skillPoints)
		for key in world.status:
			var value: Variant = update.playerStatus.get(key)
			if world.status[key] is String:
				if value is String: world.status[key] = value
			elif value is float or value is int:
				world.status[key] = int(value) if key in ATTRIBUTES else maxi(0, int(value))
		for pair in [["health", "maxHealth"], ["mana", "maxMana"], ["energy", "maxEnergy"], ["sanity", "maxSanity"]]:
			world.status[pair[0]] = clampi(world.status[pair[0]], 0, world.status[pair[1]])
		world.status.level = maxi(1, world.status.level)
		world.status.maxExperience = maxi(1, world.status.maxExperience)
		if world.genre == "Isekai": world.status.skillPoints = previous_points + 2 * maxi(0, int(world.status.level) - previous_level)
		if world.status.level > previous_level:
			log_event("Subiu ao nível %d!" % world.status.level)
		var changed := false
		for key in world.status:
			if key in ["sanity", "maxSanity"] and world.genre != "Terror": continue
			if key != "description" and old_status.get(key) != world.status[key]: changed = true
		if changed: notify("Status")
	for item in update.get("inventory", []):
		var amount := maxi(1, int(item.get("quantity", 1))) if item.get("quantity", 1) is float or item.get("quantity", 1) is int else 1
		var index := -1
		for i in world.inventory.size():
			var owned: Dictionary = world.inventory[i]
			if owned.name == item.name and str(owned.get("rarity", "Comum")) == str(item.get("rarity", "Comum")) and int(owned.get("stars", 0)) == int(item.get("stars", 0)) and int(owned.get("starSlots", 5)) == int(item.get("starSlots", 5)):
				index = i
				break
		if index >= 0: world.inventory[index].quantity += amount
		else:
			var normalized: Dictionary = item.duplicate(true)
			normalized.quantity = amount
			world.inventory.append(normalized)
		log_event("Item adquirido: %s ×%d." % [item.name, amount])
		notify("Inventário")
	for field in ["skills", "bestiary", "allies", "factionReputation", "evidenceBoard"]:
		for item in update.get(field, []):
			if field == "skills" and world.genre == "Isekai": continue
			var key := "id" if field == "evidenceBoard" else "name"
			var index := _index_by(world[field], key, item[key])
			var normalized: Dictionary = item.duplicate(true)
			if field == "skills":
				normalized.level = maxi(1, int(item.get("level", 1))) if item.get("level", 1) is float or item.get("level", 1) is int else 1
				normalized.maxLevel = maxi(normalized.level, int(item.get("maxLevel", 1))) if item.get("maxLevel", 1) is float or item.get("maxLevel", 1) is int else normalized.level
			if index >= 0:
				if normalized.get("knownInfo") is Dictionary and world[field][index].get("knownInfo") is Dictionary:
					var knowledge: Dictionary = world[field][index].knownInfo.duplicate(true)
					knowledge.merge(normalized.knownInfo, true)
					normalized.knownInfo = knowledge
				world[field][index].merge(normalized, true)
			else: world[field].append(normalized)
			var panel: String = {"skills": "Habilidades", "bestiary": "Bestiário", "allies": "Aliados"}.get(field, "Status")
			notify(panel)
			log_event("%s: %s." % [panel, item.get("name", item.get("description", "Atualização"))])
	for field in ["shipStatus", "squadStatus"]:
		if update.has(field): world[field].merge(update[field], true)
	if update.has("enemies"):
		var had_enemies: bool = not world.enemies.is_empty()
		var enemies: Array = []
		for enemy in update.enemies:
			if not (enemy.get("health") is float or enemy.get("health") is int): continue
			var item: Dictionary = enemy.duplicate(true)
			item.id = str(item.get("id", item.name))
			item.health = maxi(0, int(item.health))
			item.maxHealth = maxi(1, int(item.get("maxHealth", item.health))) if item.get("maxHealth", item.health) is float or item.get("maxHealth", item.health) is int else maxi(1, item.health)
			item.health = mini(item.health, item.maxHealth)
			if item.health > 0: enemies.append(item)
		world.enemies = enemies
		if not had_enemies and not enemies.is_empty() and world.mode == "player":
			world.initiativePending = true
			log_event("Combate iniciado. Role a iniciativa.")
		if enemies.is_empty():
			world.initiativePending = false
			world.turnOrder = []
			world.turnIndex = 0
			if had_enemies: log_event("Combate encerrado.")
		else:
			var alive_ids: Array = ["player"]
			for enemy in enemies: alive_ids.append(enemy.id)
			for ally in world.allies: alive_ids.append("ally_" + ally.name)
			world.turnOrder = world.turnOrder.filter(func(actor): return actor.id in alive_ids)
			if not world.turnOrder.is_empty(): world.turnIndex = int(world.turnIndex) % world.turnOrder.size()
	world.erase("pendingRoll")
	world.diceTest = update.get("diceTest", {})
	world.dice = update.get("diceRollChallenge", false)
	world.suggestions = update.get("actionSuggestions", [])
	if update.has("unlockedAchievementId"):
		for achievement in catalog.achievements:
			if achievement.id == update.unlockedAchievementId and not achievement.id in world.achievements:
				world.achievements.append(achievement.id)
				log_event("Conquista desbloqueada: " + achievement.name)

func roll_initiative() -> void:
	world.initiativePending = false
	world.turnOrder = [{"id": "player", "name": world.character.characterName, "type": "player", "initiative": randi_range(1, 20) + world.status.dexterity}]
	for enemy in world.enemies:
		world.turnOrder.append({"id": enemy.id, "name": enemy.name, "type": "enemy", "initiative": randi_range(1, 20)})
	for ally in world.allies:
		world.turnOrder.append({"id": "ally_" + ally.name, "name": ally.name, "type": "ally", "initiative": randi_range(1, 20)})
	world.turnOrder.sort_custom(func(a, b): return a.initiative > b.initiative)
	world.turnIndex = 0
	log_event("Ordem de iniciativa definida.")

func actor() -> Dictionary:
	if world.get("turnOrder", []).is_empty(): return {}
	return world.turnOrder[int(world.turnIndex) % world.turnOrder.size()]

func advance_turn(previous_id: String) -> void:
	if world.turnOrder.is_empty(): return
	var index := _index_by(world.turnOrder, "id", previous_id)
	world.turnIndex = (index + 1) % world.turnOrder.size() if index >= 0 else int(world.turnIndex) % world.turnOrder.size()

func upgrade(index: int) -> bool:
	if index < 0 or index >= world.skills.size(): return false
	var skill: Dictionary = world.skills[index]
	if world.status.skillPoints <= 0 or skill.level >= skill.maxLevel: return false
	skill.level += 1
	world.status.skillPoints -= 1
	log_event("%s melhorada para nível %d." % [skill.name, skill.level])
	return true

func log_event(message: String) -> void:
	world.log.append(message)
	notify("Sistema")

func notify(panel: String) -> void:
	world.notifications[panel] = int(world.notifications.get(panel, 0)) + 1

func _index_by(items: Array, key: String, value: Variant) -> int:
	for i in items.size():
		if items[i].get(key) == value: return i
	return -1

static func valid_save(data: Variant) -> bool:
	if not data is Dictionary or data.get("version") != 2: return false
	for key in ["character", "status", "gameTime", "notebook", "notifications", "shipStatus", "squadStatus"]:
		if not data.get(key) is Dictionary: return false
	for key in ["inventory", "skills", "bestiary", "allies", "enemies", "history", "log", "achievements", "suggestions", "turnOrder", "visited", "factionReputation", "evidenceBoard"]:
		if not data.get(key) is Array: return false
	for key in ["id", "genre", "setting", "mode", "location"]:
		if not data.get(key) is String: return false
	if data.mode not in ["player", "master"] or not data.character.get("characterName") is String: return false
	for key in ATTRIBUTES + ["health", "maxHealth", "mana", "maxMana", "energy", "maxEnergy", "sanity", "maxSanity", "level", "experience", "maxExperience", "skillPoints", "gold"]:
		if not (data.status.get(key) is int or data.status.get(key) is float): return false
	for entry in data.history:
		if not entry is Dictionary or entry.get("role") not in ["user", "model"] or not entry.get("text") is String: return false
	for field in ["inventory", "skills", "bestiary", "allies", "enemies"]:
		for entry in data[field]:
			if not entry is Dictionary or not entry.get("name") is String: return false
	return data.get("dice") is bool and data.get("initiativePending") is bool and (data.get("turnIndex") is float or data.get("turnIndex") is int)

func skill_tree() -> Array:
	var nodes: Array = []
	var originals: Array = catalog.skills.get(world.character.race, {}).get(world.character["class"], [])
	if world.character["class"] == "Aprendiz":
		var racial: Array = catalog.skills.get(world.character.race, {}).get("Guerreiro", [])
		originals = racial.filter(func(skill): return "Raça" in str(skill.get("category", "")))
	for i in originals.size():
		var entry: Dictionary = originals[i].duplicate(true)
		entry.treeId = "origin_%d" % i
		entry.requires = ""
		entry.requiredLevel = 1
		entry.branch = "Origem e classe"
		entry.tier = i
		var stages: Array = entry.get("progression", [])
		if not stages.is_empty(): entry.merge(stages[0], true)
		entry.summary = str(entry.get("description", "Talento racial."))
		nodes.append(entry)
	var branches := [
		["combat", "Combate", ["Instinto de Batalha", "Precisão Marcial", "Mestre das Armas"], ["Identifica aberturas na defesa dos adversários.", "Concentra a próxima ação para atingir um ponto vulnerável.", "Combina técnicas de arma em uma sequência avançada."]],
		["arcane", "Arcano", ["Percepção de Mana", "Canalização", "Domínio Arcano"], ["Percebe fontes de mana próximas.", "Concentra mana para potencializar uma técnica aprendida.", "Controla fluxos de mana complexos durante a aventura."]],
		["survival", "Sobrevivência", ["Sentidos Aguçados", "Passo Silencioso", "Adaptação Superior"], ["Observa rastros e perigos no ambiente.", "Move-se com cuidado para evitar ser percebido.", "Usa conhecimento do ambiente para enfrentar condições extremas."]]]
	for branch in branches:
		for tier in 3:
			nodes.append({"treeId": "%s_%d" % [branch[0], tier], "name": branch[2][tier], "description": branch[3][tier], "branch": branch[1], "requires": "" if tier == 0 else "%s_%d" % [branch[0], tier - 1], "requiredLevel": 1 + tier * 2, "maxLevel": 1, "category": "Talento de Isekai", "level": 1})
	var rules := {
		"combat_0": ["Acerto +5%", "Aumenta a chance de acertar ataques físicos em 5 pontos percentuais. Não causa dano direto.", 0, "Energia", 0, "0", 0],
		"combat_1": ["Dano da arma ×1,25", "Ataque preciso contra 1 alvo a até 2 metros. Causa 125% do dano da arma. Reutilização: 2 turnos.", 8, "Energia", 2, "125% do dano da arma", 2],
		"combat_2": ["Dano físico +15%", "Aumenta o dano físico final em 15%. Efeito passivo enquanto o talento estiver aprendido.", 0, "Energia", 0, "0 (passiva)", 0],
		"arcane_0": ["Detecção: 12 m", "Percebe fontes de mana a até 12 metros por 3 turnos. Não revela automaticamente a identidade de criaturas.", 4, "Mana", 1, "0", 12],
		"arcane_1": ["Próxima magia +20%", "Canaliza mana para aumentar em 20% o dano da próxima magia, dentro de 2 turnos. Não acumula consigo mesma.", 8, "Mana", 3, "0 (suporte)", 0],
		"arcane_2": ["Dano mágico +15%", "Aumenta o dano mágico final em 15%. Não altera ataques físicos nem custos de mana.", 0, "Mana", 0, "0 (passiva)", 0],
		"survival_0": ["Percepção +2", "Concede +2 em testes de percepção para notar rastros, armadilhas e ameaças próximas.", 0, "Energia", 0, "0", 0],
		"survival_1": ["Furtividade +3", "Concede +3 em testes de furtividade durante 3 turnos. Termina ao atacar ou produzir ruído intenso.", 6, "Energia", 3, "0", 0],
		"survival_2": ["Dano ambiental −15%", "Reduz em 15% dano de frio, calor e terreno hostil. Não reduz golpes de armas ou magias de criaturas.", 0, "Energia", 0, "0 (passiva)", 0]}
	var base_nodes := nodes.duplicate()
	for node in base_nodes:
		if not rules.has(node.treeId): continue
		var rule: Array = rules[node.treeId]
		node.tier = int(str(node.treeId).get_slice("_", 1))
		node.summary = rule[0]
		node.description = rule[1]
		node.cost = rule[2]
		node.costType = rule[3]
		node.cooldown = rule[4]
		node.damage = rule[5]
		node.range = rule[6]
		for side in [-1, 1]:
			var suffix := "Foco" if side < 0 else "Disciplina"
			var bonus := 2 + int(node.tier)
			var effect := "%s +%d" % ["acerto físico (%)" if node.branch == "Combate" else ("concentração" if node.branch == "Arcano" else "resistência ambiental (%)"), bonus]
			nodes.append({"treeId": str(node.treeId) + ("_focus" if side < 0 else "_discipline"), "name": suffix + " · " + str(node.name), "description": "Especialização passiva: " + effect + ". Aplica-se apenas aos testes ou efeitos correspondentes. Não causa dano direto.", "summary": effect, "requires": node.treeId, "requiredLevel": node.requiredLevel, "branch": node.branch, "tier": node.tier, "satellite": side, "cost": 0, "costType": "Passiva", "damage": "0", "cooldown": 0, "range": 0, "maxLevel": 1, "level": 1})
	nodes.append_array(JSON.parse_string(FileAccess.get_file_as_string("res://data/specializations.json")))
	return nodes

func tree_rank(node: Dictionary) -> int:
	for skill in world.skills:
		if skill.get("treeId", "") == node.treeId or skill.name == node.name: return int(skill.get("level", 1))
	return 0

func tree_block(node: Dictionary) -> String:
	if tree_rank(node) >= int(node.get("maxLevel", 1)): return "Concluída"
	if int(world.status.level) < int(node.requiredLevel): return "Requer nível %d" % node.requiredLevel
	if not str(node.requires).is_empty():
		for parent in skill_tree():
			if parent.treeId == node.requires and tree_rank(parent) == 0: return "Requer " + str(parent.name)
	if world.status.skillPoints < 1: return "Sem pontos disponíveis"
	return ""

func learn_tree(id: String) -> bool:
	if world.genre != "Isekai": return false
	for node in skill_tree():
		if node.treeId != id: continue
		if not tree_block(node).is_empty(): return false
		var rank := tree_rank(node)
		if rank == 0:
			var learned: Dictionary = node.duplicate(true)
			learned.level = 1
			world.skills.append(learned)
		else:
			for skill in world.skills:
				if skill.name == node.name: skill.level = rank + 1; break
		world.status.skillPoints -= 1
		log_event("Habilidade aprendida: " + str(node.name))
		return true
	return false


func attribute_roll(attribute: String, difficulty: int, fixed_roll: int = 0) -> Dictionary:
	if attribute not in ATTRIBUTES: return {}
	var die := clampi(fixed_roll, 1, 20) if fixed_roll > 0 else randi_range(1, 20)
	var bonus := int(world.status.get(attribute, 0))
	var dc := clampi(difficulty, 1, 40)
	return {"attribute": attribute, "roll": die, "bonus": bonus, "total": die + bonus, "difficulty": dc, "success": die + bonus >= dc}

func skill_is_passive(skill: Dictionary) -> bool:
	var id := str(skill.get("treeId", ""))
	if id in ["combat_0", "combat_2", "arcane_2", "survival_0", "survival_2"] or id.ends_with("_focus") or id.ends_with("_discipline"): return true
	return "passiv" in str(skill.get("category", "")).to_lower() or str(skill.get("costType", "")).to_lower() == "passiva"

func master_catalog() -> Dictionary:
	var result := {"creatures": [], "items": [], "skills": [], "races": catalog.RACES + catalog.MONSTER_RACES, "classes": catalog.CLASSES}
	var skill_names: Array = []
	for race in catalog.skills.values():
		for skills in race.values():
			for skill in skills:
				if skill.name not in skill_names:
					skill_names.append(skill.name)
					result.skills.append(skill.duplicate(true))
	if not world.is_empty() and world.genre == "Isekai": result.skills.append_array(skill_tree())
	for pair in [["creatures", "res://data/creatures.json"], ["items", "res://data/items.json"]]:
		var data: Array = JSON.parse_string(FileAccess.get_file_as_string(pair[1]))
		for entry in data:
			var clean: Dictionary = entry.duplicate(true)
			clean.erase("image")
			result[pair[0]].append(clean)
	for weapons_ in catalog.WEAPONS_BY_CLASS.values():
		for weapon in weapons_:
			if not result.items.any(func(item): return item.name == weapon.name): result.items.append(weapon.duplicate(true))
	if not result.items.any(func(item): return item.name == catalog.NATURAL_WEAPON.name): result.items.append(catalog.NATURAL_WEAPON.duplicate(true))
	return result

func catalog_error(update: Dictionary) -> String:
	if world.has("pendingRoll") and update.get("diceRollChallenge", false): return "O dado já foi rolado. Resolva somente a ação pendente com esse resultado, sem pedir uma segunda rolagem."
	if update.get("diceRollChallenge", false) and (not update.has("diceTest") or not update.diceTest.get("attribute", "") in ATTRIBUTES):
		return "O teste solicitado precisa de atributo, dificuldade e motivo válidos."
	var data := master_catalog()
	for pair in [["enemies", "creatures"], ["bestiary", "creatures"], ["inventory", "items"], ["skills", "skills"]]:
		for entry in update.get(pair[0], []):
			var name_: String = entry.name
			var found := false
			for base in data[pair[1]]:
				if base.name == name_: found = true; break
			# Existing saves may contain legacy entities; never create new unknown entities.
			for existing in world.get(pair[0], []):
				if existing.name == name_: found = true; break
			if not found: return "Elemento fora do catálogo: " + name_ + "."
	return ""

func canonicalize_update(update: Dictionary) -> void:
	var data := master_catalog()
	for pair in [["enemies", "creatures"], ["inventory", "items"]]:
		for item in update.get(pair[0], []):
			for base in data[pair[1]]:
				if base.name != item.name: continue
				if pair[0] == "enemies":
					item.maxHealth = int(base.health)
					for key in ["type", "level", "damage", "damageType", "armor", "magicAptitude", "ability", "weakness", "image"]:
						if base.has(key): item[key] = base[key]
				else:
					for key in ["type", "description", "damage", "image", "value"]:
						if base.has(key): item[key] = base[key]
				break

func compact_master_catalog() -> Dictionary:
	var data := master_catalog()
	var result := {}
	for spec in [["creatures", ["name", "type", "health", "armor", "damage", "damageType", "magicAptitude", "ability", "weakness", "habitat"]], ["items", ["name", "type", "damage", "description"]]]:
		var rows: Array = []
		for entry in data[spec[0]]:
			var row: Array = []
			for key in spec[1]: row.append(entry.get(key, ""))
			rows.append(row)
		result[spec[0]] = {"columns": spec[1], "rows": rows}
	result.skills = data.skills.map(func(skill): return skill.name)
	result.races = data.races
	result.classes = data.classes
	return result

func creature_base(name_: String) -> Dictionary:
	var creatures: Array = JSON.parse_string(FileAccess.get_file_as_string("res://data/creatures.json"))
	for creature in creatures:
		if creature.name == name_: return creature
	return {}

func knowledge(name_: String) -> Dictionary:
	return world.get("codexKnowledge", {}).get(name_, {"fields": {}, "evidence": [], "hits": 0, "attacks": 0, "damageObserved": [], "defeats": 0})

func discover(name_: String, fields: Array = [], note: String = "Avistamento") -> void:
	var base := creature_base(name_)
	if base.is_empty(): return
	if not world.has("codexKnowledge"): world.codexKnowledge = {}
	var record: Dictionary = knowledge(name_).duplicate(true)
	var changed: bool = not world.codexKnowledge.has(name_)
	for field in fields:
		if base.has(field) and not record.fields.has(field): record.fields[field] = true; changed = true
	if changed:
		record.evidence.append(note)
		notify("Bestiário")
	world.codexKnowledge[name_] = record
	if not world.bestiary.any(func(entry): return entry.name == name_): world.bestiary.append({"name":name_})

func known_creature(name_: String) -> Dictionary:
	var base := creature_base(name_)
	var data := {"name": name_, "image": base.get("image", ""), "description": "Observe, enfrente ou pesquise esta espécie para descobrir suas características."}
	var record := knowledge(name_)
	for field in record.fields:
		if base.has(field): data[field] = base[field]
	data.evidence = record.evidence
	data.damageObserved = record.damageObserved
	return data

func observe_turn(before: Dictionary, update: Dictionary, actor_id: String, action: String) -> void:
	for enemy in world.enemies: discover(enemy.name)
	for entry in update.get("bestiary", []): discover(entry.name)
	var actor_: Dictionary = {}
	for candidate in before.get("turnOrder", []):
		if candidate.id == actor_id: actor_ = candidate
	for old in before.get("enemies", []):
		var remaining := 0
		for enemy in world.enemies:
			if enemy.id == old.id: remaining = int(enemy.health)
		if remaining < int(old.health):
			discover(old.name)
			var record: Dictionary = knowledge(old.name).duplicate(true)
			record.hits += 1
			world.codexKnowledge[old.name] = record
			if int(record.hits) >= 3: discover(old.name, ["armor"], "Defesa estimada após três impactos observados.")
		if remaining == 0 and int(old.health) > 0:
			discover(old.name, ["health", "level", "type"], "Vitalidade confirmada após observar a derrota da criatura.")
			world.codexKnowledge[old.name].defeats += 1
	if actor_.get("type", "") == "enemy":
		var action_info: Dictionary = update.get("enemyAction", {})
		var base := creature_base(actor_.name)
		if action_info.get("actorId", "") == actor_id and action_info.get("kind", "") == "ability" and str(action_info.get("ability", "")) == str(base.get("ability", "")) and str(base.get("magicAptitude", "Nenhuma")).to_lower() != "nenhuma":
			discover(actor_.name, ["ability", "magicAptitude", "attackRange"], "Técnica mágica observada em combate.")
			var record: Dictionary = knowledge(actor_.name).duplicate(true)
			record.casts = int(record.get("casts", 0)) + 1
			world.codexKnowledge[actor_.name] = record
			if int(record.casts) >= 2: discover(actor_.name, ["attackCost", "cooldown"], "Custo e intervalo identificados após duas conjurações.")
			if int(record.casts) >= 3: discover(actor_.name, ["mana"], "Reserva de mana identificada após acompanhar três conjurações.")
		var damage := maxi(0, int(before.status.health) - int(world.status.health))
		if damage > 0:
			discover(actor_.name, ["damageType"], "Tipo de ferimento observado durante o ataque.")
			var record: Dictionary = knowledge(actor_.name).duplicate(true)
			record.damageObserved.append(damage)
			world.codexKnowledge[actor_.name] = record
			if record.damageObserved.size() >= 3: discover(actor_.name, ["damage", "damageMin", "damageMax"], "Padrão de dano identificado após três ataques sofridos.")
	for entry in update.get("bestiaryDiscoveries", []):
		if not entry.get("name") is String or not entry.get("fields") is Array: continue
		var source := str(entry.get("source", ""))
		var evidence := str(entry.get("evidence", "")).strip_edges()
		if evidence.is_empty(): continue
		var requested := action.to_lower()
		var place := (str(before.get("location", "")) + " " + str(world.location)).to_lower()
		var study := source == "study" and ["biblioteca", "academia", "arquivo", "guilda", "universidade", "escola", "templo"].any(func(word): return word in place) and ["estud", "pesquis", "ler ", "leio", "consult"].any(func(word): return word in requested)
		var narration := str(update.get("storyText", "")).to_lower()
		var informant := source == "informant" and (["pergunt", "convers", "inform", "ouvir", "ouço", "ensine", "consult"].any(func(word): return word in requested) or ["explica", "informa", "ensina", "revela", "diz:"].any(func(word): return word in narration))
		if study or informant: discover(entry.name, entry.fields, ("Pesquisa: " if study else "Informação recebida: ") + evidence)
		elif source == "observation":
			var allowed: Array = []
			var narrative := str(update.get("storyText", "")).to_lower()
			var base := creature_base(entry.name)
			if "observar" in requested or "analisar" in requested or "examinar" in requested:
				for field in entry.fields:
					if field in ["ability", "weakness", "magicAptitude", "mana", "attackCost", "cooldown", "attackRange"] and base.has(field) and str(base[field]).to_lower() in narrative: allowed.append(field)
			if not allowed.is_empty(): discover(entry.name, allowed, "Observação: " + evidence)
