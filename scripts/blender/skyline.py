"""Procedural cinematic city at golden hour for 3D reels (Blender 5.2, headless).

    blender -b -P scripts/blender/skyline.py -- --out <dir> [--frames 1-120] [--scale 0.5] [--samples 32]

Physically based look (docs/core/ASSET-STANDARD.md, 3D tier):
- physical sky (multiple scattering) + sun with soft shadows
- volumetric clouds (noise-driven density) and atmospheric haze
- PBR materials: reflective glass towers, concrete, lit windows, rippled water
- camera crane-down through the clouds, with motion blur
Deterministic: fixed random seed, so every run renders the same frames.
"""

import math
import random
import sys

import bpy

argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []


def arg(name, default):
    return argv[argv.index(name) + 1] if name in argv else default


OUT = arg("--out", "//render/")
F0, F1 = (int(v) for v in arg("--frames", "1-120").split("-"))
SCALE = float(arg("--scale", "0.5"))
SAMPLES = int(arg("--samples", "32"))
random.seed(7)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.frame_start, scene.frame_end = 1, 120
scene.render.fps = 30
scene.render.resolution_x, scene.render.resolution_y = 1080, 1920
scene.render.resolution_percentage = int(SCALE * 100)
scene.render.engine = "BLENDER_EEVEE"
scene.eevee.taa_render_samples = SAMPLES
scene.eevee.use_raytracing = True
scene.eevee.use_shadows = True
scene.eevee.use_volumetric_shadows = True
scene.eevee.volumetric_tile_size = "4"
scene.render.use_motion_blur = True
scene.render.motion_blur_shutter = 0.5
scene.view_settings.view_transform = "AgX"
scene.view_settings.look = "AgX - Medium High Contrast"
scene.view_settings.exposure = -1.3
scene.render.image_settings.file_format = "PNG"
scene.render.filepath = OUT.rstrip("/\\") + "/frame_"


def node_mat(name):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    return m, m.node_tree.nodes, m.node_tree.links


# ---------- world: physical sky + haze ----------
world = bpy.data.worlds.new("World")
scene.world = world
world.use_nodes = True
wn, wl = world.node_tree.nodes, world.node_tree.links
wn.clear()
sky = wn.new("ShaderNodeTexSky")
sky.sky_type = "MULTIPLE_SCATTERING"
SUN_ELEV = math.radians(6)  # golden hour
SUN_ROT = math.radians(250)
sky.sun_elevation = SUN_ELEV
sky.sun_rotation = SUN_ROT
bg = wn.new("ShaderNodeBackground")
bg.inputs["Strength"].default_value = 1.0
out = wn.new("ShaderNodeOutputWorld")
wl.new(sky.outputs[0], bg.inputs["Color"])
wl.new(bg.outputs[0], out.inputs["Surface"])
# No world volume: EEVEE treats it as infinite and it swallows the sky and
# the sun. Haze is a finite volume box around the city instead (below).

# ---------- sun ----------
sun_data = bpy.data.lights.new("Sun", "SUN")
sun_data.energy = 3.2
sun_data.angle = math.radians(1.2)
sun_data.color = (1.0, 0.62, 0.36)
sun = bpy.data.objects.new("Sun", sun_data)
sun.rotation_euler = (math.pi / 2 - SUN_ELEV, 0, SUN_ROT + math.pi / 2)
scene.collection.objects.link(sun)

# ---------- materials ----------
glass, n, l = node_mat("Glass")
p = n["Principled BSDF"]
p.inputs["Base Color"].default_value = (0.06, 0.09, 0.12, 1)
p.inputs["Metallic"].default_value = 0.85
p.inputs["Roughness"].default_value = 0.06

concrete, n, l = node_mat("Concrete")
p = n["Principled BSDF"]
noise = n.new("ShaderNodeTexNoise")
noise.inputs["Scale"].default_value = 40
ramp = n.new("ShaderNodeValToRGB")
ramp.color_ramp.elements[0].color = (0.32, 0.30, 0.28, 1)
ramp.color_ramp.elements[1].color = (0.52, 0.49, 0.45, 1)
l.new(noise.outputs["Fac"], ramp.inputs["Fac"])
l.new(ramp.outputs["Color"], p.inputs["Base Color"])
p.inputs["Roughness"].default_value = 0.85

# Windows: brick texture as a grid of panes, some lit (emission).
windows, n, l = node_mat("Windows")
p = n["Principled BSDF"]
brick = n.new("ShaderNodeTexBrick")
brick.inputs["Scale"].default_value = 0.22
tc = n.new("ShaderNodeTexCoord")
l.new(tc.outputs["Object"], brick.inputs["Vector"])
brick.inputs["Mortar Size"].default_value = 0.04
brick.inputs["Color1"].default_value = (1.0, 0.72, 0.38, 1)
brick.inputs["Color2"].default_value = (0.05, 0.06, 0.08, 1)
brick.inputs["Mortar"].default_value = (0.1, 0.1, 0.11, 1)
lit = n.new("ShaderNodeTexNoise")
lit.inputs["Scale"].default_value = 18
gate = n.new("ShaderNodeMath")
gate.operation = "GREATER_THAN"
gate.inputs[1].default_value = 0.55
mix = n.new("ShaderNodeMix")
mix.data_type = "RGBA"
l.new(lit.outputs["Fac"], gate.inputs[0])
l.new(gate.outputs[0], mix.inputs["Factor"])
mix.inputs["A"].default_value = (0, 0, 0, 1)
l.new(brick.outputs["Color"], mix.inputs["B"])
l.new(brick.outputs["Color"], p.inputs["Base Color"])
l.new(mix.outputs["Result"], p.inputs["Emission Color"])
p.inputs["Emission Strength"].default_value = 2.5
p.inputs["Metallic"].default_value = 0.6
p.inputs["Roughness"].default_value = 0.12

water, n, l = node_mat("Water")
p = n["Principled BSDF"]
p.inputs["Base Color"].default_value = (0.02, 0.05, 0.07, 1)
p.inputs["Roughness"].default_value = 0.04
p.inputs["Metallic"].default_value = 0.2
wave = n.new("ShaderNodeTexWave")
wave.inputs["Scale"].default_value = 1.5
wave.inputs["Distortion"].default_value = 6
bump = n.new("ShaderNodeBump")
bump.inputs["Strength"].default_value = 0.15
l.new(wave.outputs["Fac"], bump.inputs["Height"])
l.new(bump.outputs["Normal"], p.inputs["Normal"])
# Ripples drift over time (driver on the wave phase).
drv = wave.inputs["Phase Offset"].driver_add("default_value").driver
drv.expression = "frame * 0.05"

clouds, n, l = node_mat("Clouds")
n.remove(n["Principled BSDF"])
vol = n.new("ShaderNodeVolumePrincipled")
cn = n.new("ShaderNodeTexNoise")
cn.inputs["Scale"].default_value = 1.6
cn.inputs["Detail"].default_value = 8
cmap = n.new("ShaderNodeMapRange")
cmap.inputs["From Min"].default_value = 0.52
cmap.inputs["From Max"].default_value = 0.75
cmap.inputs["To Max"].default_value = 0.35
l.new(cn.outputs["Fac"], cmap.inputs["Value"])
l.new(cmap.outputs["Result"], vol.inputs["Density"])
vol.inputs["Color"].default_value = (1.0, 0.8, 0.66, 1)
vol.inputs["Anisotropy"].default_value = 0.45
l.new(vol.outputs[0], n["Material Output"].inputs["Volume"])
# Clouds drift with the wind (driver on noise W).
cn.noise_dimensions = "4D"
d2 = cn.inputs["W"].driver_add("default_value").driver
d2.expression = "frame * 0.004"


def box(name, loc, size, mat):
    bpy.ops.mesh.primitive_cube_add(location=loc)
    o = bpy.context.object
    o.name = name
    o.scale = (size[0] / 2, size[1] / 2, size[2] / 2)
    o.data.materials.append(mat)
    return o


# ---------- city ----------
for i in range(70):
    x = random.uniform(-160, 160)
    y = random.uniform(-40, 220)
    if abs(x) < 18 and y < 60:
        continue  # keep the harbour front open
    h = random.uniform(25, 140) * (1.4 if abs(x) < 70 else 1)
    w = random.uniform(12, 26)
    mat = random.choice([glass, windows, windows, concrete])
    box(f"tower{i}", (x, y, h / 2), (w, w * random.uniform(0.8, 1.3), h), mat)
# Two hero towers facing each other (the story's subjects).
box("heroA", (-30, 70, 95), (24, 24, 190), windows)
box("heroB", (32, 90, 110), (22, 22, 220), glass)
bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=16, depth=40, location=(32, 90, 240))
bpy.context.object.data.materials.append(glass)

# ---------- ground & water ----------
bpy.ops.mesh.primitive_plane_add(size=900, location=(0, 120, 0))
bpy.context.object.data.materials.append(concrete)
bpy.ops.mesh.primitive_plane_add(size=900, location=(0, -420, 0.3))
bpy.context.object.data.materials.append(water)

# ---------- atmospheric haze (finite volume around the city) ----------
haze_mat, n, l = node_mat("Haze")
n.remove(n["Principled BSDF"])
hv = n.new("ShaderNodeVolumePrincipled")
hv.inputs["Density"].default_value = 0.00045
hv.inputs["Color"].default_value = (1.0, 0.72, 0.5, 1)
hv.inputs["Anisotropy"].default_value = 0.6
l.new(hv.outputs[0], n["Material Output"].inputs["Volume"])
bpy.ops.mesh.primitive_cube_add(location=(0, 60, 90))
hz = bpy.context.object
hz.scale = (600, 600, 95)
hz.data.materials.append(haze_mat)

# ---------- cloud layer ----------
bpy.ops.mesh.primitive_cube_add(location=(0, 60, 230))
cl = bpy.context.object
cl.scale = (420, 420, 40)
cl.data.materials.append(clouds)

# ---------- camera: crane down through the clouds ----------
cam_data = bpy.data.cameras.new("Cam")
cam_data.lens = 24
cam_data.clip_end = 3000
cam = bpy.data.objects.new("Cam", cam_data)
scene.collection.objects.link(cam)
scene.camera = cam
target = bpy.data.objects.new("Target", None)
target.location = (0, 80, 70)
scene.collection.objects.link(target)
con = cam.constraints.new("TRACK_TO")
con.target = target
con.track_axis = "TRACK_NEGATIVE_Z"
con.up_axis = "UP_Y"
for f, loc in ((1, (10, -260, 330)), (60, (0, -230, 150)), (120, (-8, -210, 45))):
    cam.location = loc
    cam.keyframe_insert("location", frame=f)
# Keyframes default to Bezier with auto-clamped handles: eased crane move.

for f in range(F0, F1 + 1):
    scene.frame_set(f)
    scene.render.filepath = OUT.rstrip("/\\") + f"/frame_{f:04d}"
    bpy.ops.render.render(write_still=True)
print("SKYLINE_DONE", F0, F1)
