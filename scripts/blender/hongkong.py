"""Hong Kong "two banks" set for sp04 (Blender 5.2, headless, EEVEE).

    blender -b -P scripts/blender/hongkong.py -- --out <dir> --shot <name> [--frames 1-N|--still K]
                                                [--scale 0.5] [--samples 24] [--plan docs/sp04/shots.json]

One procedural set, seven camera/light presets (one per beat in
docs/sp04/production.json). Frame counts come from the VO-driven plan
(docs/sp04/shots.json) so every shot is exactly as long as its beat.
Look standard: docs/core/ASSET-STANDARD.md (3D tier).
"""

import json
import math
import os
import random
import sys

import bpy
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []


def arg(name, default=None):
    return argv[argv.index(name) + 1] if name in argv else default


# Blender resolves bare relative paths against the drive root, not the cwd.
OUT = arg("--out", "//render")
if not OUT.startswith("//"):
    OUT = os.path.abspath(OUT).replace("\\", "/")
SHOT = arg("--shot", "sp04-hook")
SCALE = float(arg("--scale", "0.5"))
SAMPLES = int(arg("--samples", "24"))
PLAN = arg("--plan", "docs/sp04/shots.json")
plan = json.load(open(PLAN, encoding="utf-8"))
shot_info = next(s for s in plan["shots"] if s["name"] == SHOT)
N = shot_info["frames"]
if arg("--still"):
    F0 = F1 = int(arg("--still"))
else:
    F0, F1 = (int(v) for v in arg("--frames", f"1-{N}").split("-"))
random.seed(11)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.frame_start, scene.frame_end = 1, N
scene.render.fps = 30
scene.render.resolution_x, scene.render.resolution_y = 1080, 1920
scene.render.resolution_percentage = int(round(SCALE * 100))
scene.render.engine = "BLENDER_EEVEE"
ee = scene.eevee
ee.taa_render_samples = SAMPLES
ee.use_raytracing = True
ee.use_shadows = True
ee.use_volumetric_shadows = True
ee.volumetric_tile_size = "4"
scene.render.use_motion_blur = True
scene.render.motion_blur_shutter = 0.5
scene.view_settings.view_transform = "AgX"
scene.view_settings.look = "AgX - Medium High Contrast"
scene.render.image_settings.file_format = "PNG"
scene.render.film_transparent = False


def mat(name):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    return m, m.node_tree.nodes, m.node_tree.links


def objcoord(n):
    return n.new("ShaderNodeTexCoord").outputs["Object"]


# ---------------------------------------------------------------- lighting
PRESET = {
    # sun elevation (deg), azimuth (deg, 0 = from +Y in front of camera), exposure, sky strength, window glow
    "sp04-hook": (4, 335, -0.9, 1.0, 2.6),
    "sp04-context": (6, 300, -1.0, 1.0, 2.0),
    "sp04-cause": (4, 15, -1.0, 1.0, 2.4),
    "sp04-effect": (3, 290, -0.9, 0.7, 3.0),
    "sp04-fix": (5, 40, -1.0, 1.0, 2.2),
    "sp04-payoff": (1.5, 0, -1.0, 1.0, 3.5),
    "sp04-cta": (-5, 300, 0.6, 0.35, 7.0),
}[SHOT]
ELEV, AZ, EXPO, SKY_STR, GLOW = PRESET
scene.view_settings.exposure = EXPO

world = bpy.data.worlds.new("World")
scene.world = world
world.use_nodes = True
wn, wl = world.node_tree.nodes, world.node_tree.links
wn.clear()
sky = wn.new("ShaderNodeTexSky")
sky.sky_type = "MULTIPLE_SCATTERING"
sky.sun_elevation = math.radians(max(ELEV, -10))
sky.sun_rotation = math.radians(AZ)
bg = wn.new("ShaderNodeBackground")
bg.inputs["Strength"].default_value = SKY_STR
wout = wn.new("ShaderNodeOutputWorld")
wl.new(sky.outputs[0], bg.inputs["Color"])
wl.new(bg.outputs[0], wout.inputs["Surface"])

if ELEV > -1:
    sd = bpy.data.lights.new("Sun", "SUN")
    sd.energy = 4.5 if ELEV > 4 else 3.4
    sd.angle = math.radians(1.0)
    sd.color = (1.0, 0.5, 0.24) if ELEV < 8 else (1.0, 0.64, 0.38)
    so = bpy.data.objects.new("Sun", sd)
    # Light travels from the sun toward the scene.
    a, e = math.radians(AZ), math.radians(ELEV)
    d = Vector((-math.sin(a) * math.cos(e), -math.cos(a) * math.cos(e), -math.sin(e)))
    so.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
    scene.collection.objects.link(so)
else:
    # Night: cool moonlight.
    md = bpy.data.lights.new("Moon", "SUN")
    md.energy = 0.25
    md.color = (0.6, 0.7, 1.0)
    mo = bpy.data.objects.new("Moon", md)
    mo.rotation_euler = (math.radians(55), 0, math.radians(30))
    scene.collection.objects.link(mo)

# ---------------------------------------------------------------- materials
def curtain_wall(name, tint, cell=(3.2, 3.6), lit_share=0.35):
    """Glass curtain wall: metal mullion grid, reflective panes, some lit rooms."""
    m, n, l = mat(name)
    p = n["Principled BSDF"]
    oc = objcoord(n)
    sep = n.new("ShaderNodeSeparateXYZ")
    l.new(oc, sep.inputs[0])
    # Horizontal coordinate along the facade: x + y covers both face orientations.
    add = n.new("ShaderNodeMath")
    add.operation = "ADD"
    l.new(sep.outputs["X"], add.inputs[0])
    l.new(sep.outputs["Y"], add.inputs[1])

    def bands(src, period, width):
        div = n.new("ShaderNodeMath")
        div.operation = "DIVIDE"
        div.inputs[1].default_value = period
        l.new(src, div.inputs[0])
        fr = n.new("ShaderNodeMath")
        fr.operation = "FRACT"
        l.new(div.outputs[0], fr.inputs[0])
        lt = n.new("ShaderNodeMath")
        lt.operation = "LESS_THAN"
        lt.inputs[1].default_value = width
        l.new(fr.outputs[0], lt.inputs[0])
        return lt.outputs[0], div.outputs[0]

    vmask, vcell = bands(add.outputs[0], cell[0], 0.07)
    hmask, hcell = bands(sep.outputs["Z"], cell[1], 0.1)
    frame = n.new("ShaderNodeMath")
    frame.operation = "MAXIMUM"
    l.new(vmask, frame.inputs[0])
    l.new(hmask, frame.inputs[1])
    # Random value per window cell -> lit or dark room.
    fl1 = n.new("ShaderNodeMath")
    fl1.operation = "FLOOR"
    l.new(vcell, fl1.inputs[0])
    fl2 = n.new("ShaderNodeMath")
    fl2.operation = "FLOOR"
    l.new(hcell, fl2.inputs[0])
    comb = n.new("ShaderNodeCombineXYZ")
    l.new(fl1.outputs[0], comb.inputs["X"])
    l.new(fl2.outputs[0], comb.inputs["Y"])
    wn_ = n.new("ShaderNodeTexWhiteNoise")
    wn_.noise_dimensions = "3D"
    l.new(comb.outputs[0], wn_.inputs["Vector"])
    gt = n.new("ShaderNodeMath")
    gt.operation = "GREATER_THAN"
    gt.inputs[1].default_value = 1 - lit_share
    l.new(wn_.outputs["Value"], gt.inputs[0])
    notframe = n.new("ShaderNodeMath")
    notframe.operation = "SUBTRACT"
    notframe.inputs[0].default_value = 1
    l.new(frame.outputs[0], notframe.inputs[1])
    litm = n.new("ShaderNodeMath")
    litm.operation = "MULTIPLY"
    l.new(gt.outputs[0], litm.inputs[0])
    l.new(notframe.outputs[0], litm.inputs[1])
    warm = n.new("ShaderNodeMix")
    warm.data_type = "RGBA"
    warm.inputs["A"].default_value = (1.0, 0.62, 0.32, 1)
    warm.inputs["B"].default_value = (1.0, 0.85, 0.62, 1)
    l.new(wn_.outputs["Value"], warm.inputs["Factor"])
    emis = n.new("ShaderNodeMix")
    emis.data_type = "RGBA"
    emis.inputs["A"].default_value = (0, 0, 0, 1)
    l.new(litm.outputs[0], emis.inputs["Factor"])
    l.new(warm.outputs["Result"], emis.inputs["B"])
    l.new(emis.outputs["Result"], p.inputs["Emission Color"])
    p.inputs["Emission Strength"].default_value = GLOW
    base = n.new("ShaderNodeMix")
    base.data_type = "RGBA"
    base.inputs["A"].default_value = tint
    base.inputs["B"].default_value = (0.06, 0.065, 0.07, 1)
    l.new(frame.outputs[0], base.inputs["Factor"])
    l.new(base.outputs["Result"], p.inputs["Base Color"])
    rough = n.new("ShaderNodeMapRange")
    rough.inputs["To Min"].default_value = 0.04
    rough.inputs["To Max"].default_value = 0.35
    l.new(frame.outputs[0], rough.inputs["Value"])
    l.new(rough.outputs["Result"], p.inputs["Roughness"])
    p.inputs["Metallic"].default_value = 0.9
    return m


def simple(name, color, metallic=0.0, rough=0.5, emit=None, strength=0.0):
    m, n, l = mat(name)
    p = n["Principled BSDF"]
    p.inputs["Base Color"].default_value = color
    p.inputs["Metallic"].default_value = metallic
    p.inputs["Roughness"].default_value = rough
    if emit:
        p.inputs["Emission Color"].default_value = emit
        p.inputs["Emission Strength"].default_value = strength
    return m


glass_blue = curtain_wall("GlassBlue", (0.05, 0.09, 0.12, 1))
glass_teal = curtain_wall("GlassTeal", (0.04, 0.1, 0.1, 1), cell=(2.8, 3.4), lit_share=0.28)
glass_bronze = curtain_wall("GlassBronze", (0.12, 0.08, 0.05, 1), cell=(3.6, 3.8), lit_share=0.4)
boc_glass = curtain_wall("BOCGlass", (0.08, 0.12, 0.15, 1), cell=(2.6, 3.0), lit_share=0.22)
steel = simple("Steel", (0.18, 0.19, 0.2, 1), metallic=1.0, rough=0.3)
white_steel = simple("WhiteSteel", (0.85, 0.86, 0.88, 1), metallic=0.6, rough=0.25)
concrete = simple("Concrete", (0.36, 0.34, 0.32, 1), rough=0.9)
asphalt = simple("Asphalt", (0.035, 0.035, 0.04, 1), rough=0.75)
streetlight = simple("StreetLight", (0.1, 0.08, 0.05, 1), emit=(1.0, 0.7, 0.4, 1), strength=6.0)
red_energy = simple("Energy", (0.2, 0.0, 0.0, 1), emit=(1.0, 0.08, 0.04, 1), strength=40.0)

water, n, l = mat("Water")
p = n["Principled BSDF"]
p.inputs["Base Color"].default_value = (0.015, 0.04, 0.055, 1)
p.inputs["Roughness"].default_value = 0.03
p.inputs["Metallic"].default_value = 0.3
wave = n.new("ShaderNodeTexWave")
wave.inputs["Scale"].default_value = 0.9
wave.inputs["Distortion"].default_value = 7
wave.inputs["Detail"].default_value = 6
bump = n.new("ShaderNodeBump")
bump.inputs["Strength"].default_value = 0.18
l.new(wave.outputs["Fac"], bump.inputs["Height"])
l.new(bump.outputs["Normal"], p.inputs["Normal"])
wave.inputs["Phase Offset"].driver_add("default_value").driver.expression = "frame * 0.06"

clouds, n, l = mat("Clouds")
n.remove(n["Principled BSDF"])
vol = n.new("ShaderNodeVolumePrincipled")
cn = n.new("ShaderNodeTexNoise")
cn.noise_dimensions = "4D"
cn.inputs["Scale"].default_value = 4.5  # broken cumulus, not one overcast sheet
cn.inputs["Detail"].default_value = 8
cn.inputs["W"].driver_add("default_value").driver.expression = "frame * 0.004"
cm = n.new("ShaderNodeMapRange")
cm.inputs["From Min"].default_value = 0.56
cm.inputs["From Max"].default_value = 0.78
cm.inputs["To Max"].default_value = 0.22
l.new(cn.outputs["Fac"], cm.inputs["Value"])
l.new(cm.outputs["Result"], vol.inputs["Density"])
vol.inputs["Color"].default_value = (1.0, 0.8, 0.66, 1) if ELEV > 0 else (0.45, 0.5, 0.7, 1)
vol.inputs["Anisotropy"].default_value = 0.5
l.new(vol.outputs[0], n["Material Output"].inputs["Volume"])

haze, n, l = mat("Haze")
n.remove(n["Principled BSDF"])
hv = n.new("ShaderNodeVolumePrincipled")
hv.inputs["Density"].default_value = 0.00016 if ELEV > 0 else 0.0006
hv.inputs["Color"].default_value = (1.0, 0.74, 0.52, 1) if ELEV > 0 else (0.5, 0.55, 0.8, 1)
hv.inputs["Anisotropy"].default_value = 0.6
l.new(hv.outputs[0], n["Material Output"].inputs["Volume"])


# ---------------------------------------------------------------- geometry
def box(loc, size, m, name="box"):
    bpy.ops.mesh.primitive_cube_add(location=loc)
    o = bpy.context.object
    o.name = name
    o.scale = (size[0] / 2, size[1] / 2, size[2] / 2)
    o.data.materials.append(m)
    return o


def tower(x, y, w, d, h, m):
    """Generic tower with setbacks and a rooftop crown."""
    tiers = random.choice([1, 2, 2, 3])
    z = 0
    for t in range(tiers):
        th = h * (0.6 if t == 0 else 0.4 / max(1, tiers - 1)) if tiers > 1 else h
        k = 1 - 0.18 * t
        box((x, y, z + th / 2), (w * k, d * k, th), m)
        z += th
    box((x, y, z + 1.5), (w * 0.5, d * 0.5, 3), steel)
    if random.random() < 0.4:
        box((x, y, z + 3 + 6), (0.6, 0.6, 12), steel)  # antenna


HSBC = Vector((-30, 70, 0))
BOC = Vector((38, 92, 0))

for i in range(110):
    x = random.uniform(-200, 200)
    y = random.uniform(-10, 300)
    if (Vector((x, y, 0)) - HSBC).length < 55 or (Vector((x, y, 0)) - BOC).length < 55:
        continue
    if -60 < x < 70 and 20 < y < 150:
        continue  # keep the stage between the two banks clear for the hero shots
    if x > 60 and y < 60:
        continue  # clear sight line for the effect / cause cameras
    if (Vector((x, y, 0)) - Vector((-12, 16, 0))).length < 24:
        continue  # fix camera stands here
    near = abs(x) < 90
    h = random.uniform(30, 120) * (1.3 if near else 1.0) * (1 + y / 400)
    w = random.uniform(14, 28)
    tower(x, y, w, w * random.uniform(0.8, 1.3), h, random.choice([glass_blue, glass_teal, glass_bronze, glass_blue]))

# HSBC: stepped blocks hung from a steel exoskeleton (masts + truss bands).
for dx, h in ((-10, 150), (0, 178), (10, 130)):
    box((HSBC.x + dx, HSBC.y, h / 2), (10, 26, h), glass_bronze, "hsbc_block")
for sx in (-16, 16):
    for sy in (-14, 14):
        box((HSBC.x + sx, HSBC.y + sy, 89), (2.2, 2.2, 178), steel, "hsbc_mast")  # ends at the roof line
for zt in (40, 80, 120, 160):
    box((HSBC.x, HSBC.y - 14, zt), (34, 1.6, 4.5), steel, "hsbc_truss")
    for sgn in (-1, 1):
        bpy.ops.mesh.primitive_cube_add(location=(HSBC.x + sgn * 8, HSBC.y - 14.6, zt - 9))
        b = bpy.context.object
        b.scale = (0.6, 0.6, 11)
        b.rotation_euler = (0, sgn * math.radians(35), 0)
        b.data.materials.append(steel)

# Bank of China: four triangular prisms rising to different heights, white X bracing.
for k, (qx, qy, h) in enumerate(((-7, -7, 150), (7, -7, 190), (7, 7, 230), (-7, 7, 170))):
    bpy.ops.mesh.primitive_cylinder_add(vertices=3, radius=11, depth=h, location=(BOC.x + qx, BOC.y + qy, h / 2))
    pr = bpy.context.object
    pr.rotation_euler = (0, 0, math.radians(45 + 90 * k))
    pr.data.materials.append(boc_glass)
    for zt in range(20, int(h) - 10, 36):
        for sgn in (-1, 1):
            bpy.ops.mesh.primitive_cube_add(location=(BOC.x + qx * 1.55, BOC.y + qy * 1.55 - 0.2, zt + 18))
            br = bpy.context.object
            br.scale = (0.5, 0.5, 21)
            br.rotation_euler = (0, sgn * math.radians(32), math.radians(45 + 90 * k))
            br.data.materials.append(white_steel)
for mx in (-3, 3):
    box((BOC.x + 7 + mx, BOC.y + 7, 230 + 18), (0.9, 0.9, 36), white_steel, "boc_mast")

# Rooftop "cannons": two window-cleaning cranes on HSBC.
cranes = []
for cx in (-3.2, 3.2):
    # Both sit on the tallest (178 m) block.
    pivot = bpy.data.objects.new(f"crane_pivot{cx}", None)
    pivot.location = (HSBC.x + cx, HSBC.y + 6 * (1 if cx > 0 else -1), 178)
    pivot.scale = (1.5, 1.5, 1.5)  # read as "cannons" at reel size
    scene.collection.objects.link(pivot)
    base = box((0, 0, 0), (3, 3, 3), steel, "crane_base")
    base.parent = pivot
    base.location = (0, 0, 1.5)
    arm = box((0, 0, 0), (3.2, 24, 3.0), steel, "crane_arm")
    arm.parent = pivot
    arm.location = (0, 10, 3.5)
    tip = box((0, 0, 0), (4.0, 4.0, 4.0), steel, "crane_tip")
    tip.parent = pivot
    tip.location = (0, 23, 3.5)
    beacon = box((0, 0, 0), (1.2, 1.2, 1.2), red_energy, "crane_beacon")
    beacon.parent = pivot
    beacon.location = (0, 25.5, 4.5)
    cranes.append(pivot)

# Ground, harbour water, haze volume, cloud deck.
bpy.ops.mesh.primitive_plane_add(size=1200, location=(0, 300, 0))
bpy.context.object.data.materials.append(asphalt)
# Street grid: rows of warm lamps so the ground reads as a city, not a slab.
for gx in range(-200, 201, 40):
    for gy in range(0, 301, 12):
        box((gx, gy, 0.3), (0.8, 0.8, 0.6), streetlight, "lamp")
for gy in range(0, 301, 40):
    for gx in range(-200, 201, 12):
        box((gx, gy, 0.3), (0.8, 0.8, 0.6), streetlight, "lamp")
bpy.ops.mesh.primitive_plane_add(size=1200, location=(0, -620, 0.4))
bpy.context.object.data.materials.append(water)
hz = box((0, 80, 110), (900, 900, 220), haze, "haze")
cl = box((0, 80, 290), (900, 900, 70), clouds, "clouds")

# ---------------------------------------------------------------- camera presets
cam_d = bpy.data.cameras.new("Cam")
cam_d.clip_end = 4000
cam = bpy.data.objects.new("Cam", cam_d)
scene.collection.objects.link(cam)
scene.camera = cam
tgt = bpy.data.objects.new("Target", None)
scene.collection.objects.link(tgt)
con = cam.constraints.new("TRACK_TO")
con.target = tgt
con.track_axis = "TRACK_NEGATIVE_Z"
con.up_axis = "UP_Y"


def keys(obj, frames_locs):
    for f, loc in frames_locs:
        obj.location = loc
        obj.keyframe_insert("location", frame=max(1, min(N, int(f))))


mid = (HSBC + BOC) / 2
if SHOT == "sp04-hook":
    cam_d.lens = 22
    # Start inside the cloud deck and break out within ~0.6 s: the reveal is the hook.
    keys(cam, [(1, (20, -330, 300)), (18, (16, -312, 238)), (N * 0.6, (6, -260, 180)), (N, (0, -230, 120))])
    keys(tgt, [(1, (0, 60, 40)), (N, (mid.x, mid.y, 110))])
elif SHOT == "sp04-context":
    cam_d.lens = 30
    keys(cam, [(1, (-70, -70, 30)), (N, (-46, 8, 60))])
    keys(tgt, [(1, (HSBC.x, HSBC.y, 70)), (N, (HSBC.x, HSBC.y, 110))])
elif SHOT == "sp04-cause":
    cam_d.lens = 26
    pts = []
    for i in range(6):
        t = i / 5
        ang = math.radians(-140 + 110 * t)
        pts.append((1 + (N - 1) * t, (BOC.x + math.cos(ang) * 130, BOC.y + math.sin(ang) * 130, 90 + 50 * t)))
    keys(cam, pts)
    keys(tgt, [(1, (BOC.x, BOC.y, 150)), (N, (BOC.x, BOC.y, 200))])
elif SHOT == "sp04-effect":
    cam_d.lens = 26
    keys(cam, [(1, (125, -30, 250)), (N, (100, -5, 240))])
    keys(tgt, [(1, (BOC.x, BOC.y, 190)), (N * 0.6, (mid.x, mid.y, 185)), (N, (HSBC.x, HSBC.y, 185))])
    # Energy "arrow" grows from a BOC edge to the HSBC roof.
    a0 = Vector((BOC.x - 10, BOC.y - 6, 195))
    a1 = Vector((HSBC.x + 12, HSBC.y + 4, 182))
    bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=0.7, depth=1, location=(0, 0, 0))
    beam = bpy.context.object
    beam.data.materials.append(red_energy)
    direction = a1 - a0
    beam.rotation_euler = direction.to_track_quat("Z", "Y").to_euler()
    for f, t in ((1, 0.0), (int(N * 0.3), 0.0), (int(N * 0.62), 1.0), (N, 1.0)):
        beam.location = a0 + direction * (t / 2)
        beam.scale = (1, 1, max(0.001, direction.length * t))
        beam.keyframe_insert("location", frame=max(1, f))
        beam.keyframe_insert("scale", frame=max(1, f))
elif SHOT == "sp04-fix":
    # Side-on low angle, perpendicular to the HSBC -> BOC line: the cranes swing
    # across the frame and lock pointing right at BOC, like cannons taking aim.
    cam_d.lens = 20
    keys(cam, [(1, (-11.5, 12, 172)), (N, (-12, 19, 174))])
    keys(tgt, [(1, (-5, 72, 194)), (N, (-2, 74, 196))])
    # Cranes swing toward BOC and lock with a small spring overshoot.
    aim = math.atan2(BOC.x - HSBC.x, BOC.y - HSBC.y)
    for pv in cranes:
        for f, a in ((1, math.radians(180)), (int(N * 0.35), math.radians(175)), (int(N * 0.62), -aim - math.radians(6)),
                     (int(N * 0.7), -aim + math.radians(3)), (int(N * 0.78), -aim)):
            pv.rotation_euler = (0, 0, a)
            pv.keyframe_insert("rotation_euler", frame=max(1, f))
elif SHOT == "sp04-payoff":
    cam_d.lens = 32
    keys(cam, [(1, (0, -170, 55)), (N, (0, -330, 85))])
    keys(tgt, [(1, (mid.x, mid.y, 110)), (N, (mid.x, mid.y, 120))])
elif SHOT == "sp04-cta":
    cam_d.lens = 24
    keys(cam, [(1, (0, -230, 70)), (N, (0, -190, 260))])
    keys(tgt, [(1, (mid.x, mid.y, 90)), (N, (mid.x, mid.y + 200, 420))])

# ---------------------------------------------------------------- compositor glow
try:
    tree = bpy.data.node_groups.new("Comp", "CompositorNodeTree")
    rl = tree.nodes.new("CompositorNodeRLayers")
    glare = tree.nodes.new("CompositorNodeGlare")
    for attr, val in (("glare_type", "FOG_GLOW"), ("quality", "HIGH"), ("threshold", 1.0)):
        if hasattr(glare, attr):
            setattr(glare, attr, val)
    if "Threshold" in glare.inputs:
        glare.inputs["Threshold"].default_value = 1.0
    if "Strength" in glare.inputs:
        glare.inputs["Strength"].default_value = 0.6
    gout = tree.nodes.new("NodeGroupOutput")
    tree.interface.new_socket("Image", in_out="OUTPUT", socket_type="NodeSocketColor")
    tree.links.new(rl.outputs["Image"], glare.inputs["Image"])
    tree.links.new(glare.outputs["Image"], gout.inputs[0])
    scene.compositing_node_group = tree
    print("COMPOSITOR glow on")
except Exception as exc:  # compositor API differs between versions: render without glow
    print("COMPOSITOR skipped:", exc)

for f in range(F0, F1 + 1):
    scene.frame_set(f)
    scene.render.filepath = f"{OUT.rstrip('/')}/frame_{f:04d}"
    bpy.ops.render.render(write_still=True)
print("HK_DONE", SHOT, F0, F1)
