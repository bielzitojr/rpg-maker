shader_type canvas_item;
uniform vec3 visibility = vec3(0.0);
uniform vec2 cuts = vec2(0.33333, 0.66667);
uniform bool vertical_panels = false;
void fragment() {
	float axis = vertical_panels ? UV.x : UV.y;
	float light = axis < cuts.x ? visibility.x : (axis < cuts.y ? visibility.y : visibility.z);
	COLOR.rgb *= light;
}
