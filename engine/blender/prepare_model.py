# Make a model ready for the city (kit/holomodel.js holoModel, or a sculpture): one mesh, its transforms applied,
# no materials or textures (the city colours it), fewer triangles, its foot at the ground and its middle over the
# origin, facing glTF's +Z (Blender's -Y), as .glb.
#
#   blender -b -P blender/prepare_model.py -- in.glb|in.gltf|in.fbx|in.obj out.glb [--tris 20000] [--height 2]
#     [--turn 0] [--preview preview.png]
#
# --tris: at most this many triangles (decimated if more); --height: scaled to this many metres high (the page
# scales it again to what it is given; this only keeps things sane); --turn: degrees about the vertical, to face it
# the right way; --preview: a picture of it, to check.

import sys, math
import bpy
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
if len(argv) < 2:
    raise SystemExit('usage: blender -b -P prepare_model.py -- in out.glb [--tris N] [--height H] [--turn deg] [--preview p.png]')
src, out = argv[0], argv[1]
opt = {k: v for k, v in zip(argv[2::2], argv[3::2])}
tris = int(opt.get('--tris', 20000))
height = float(opt.get('--height', 2))
turn = math.radians(float(opt.get('--turn', 0)))
preview = opt.get('--preview')

bpy.ops.wm.read_factory_settings(use_empty=True)
ext = src.lower().rsplit('.', 1)[-1]
if ext in ('glb', 'gltf'):
    bpy.ops.import_scene.gltf(filepath=src)
elif ext == 'fbx':
    bpy.ops.import_scene.fbx(filepath=src)
elif ext == 'obj':
    bpy.ops.wm.obj_import(filepath=src)
else:
    raise SystemExit(f'cannot read .{ext}')

# its meshes only, posed as they stand (armatures applied), joined into one
meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
if not meshes:
    raise SystemExit('no mesh in it')
bpy.ops.object.select_all(action='DESELECT')
for o in meshes:
    o.select_set(True)
    for m in list(o.modifiers):
        if m.type == 'ARMATURE':
            bpy.context.view_layer.objects.active = o
            bpy.ops.object.modifier_apply(modifier=m.name)
bpy.context.view_layer.objects.active = meshes[0]
for o in meshes:
    o.parent = None
bpy.ops.object.join() if len(meshes) > 1 else None
obj = bpy.context.view_layer.objects.active
for o in list(bpy.context.scene.objects):
    if o != obj:
        bpy.data.objects.remove(o, do_unlink=True)
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
obj.data.materials.clear()

# fewer triangles
n = sum(len(p.vertices) - 2 for p in obj.data.polygons)
if n > tris:
    d = obj.modifiers.new('decimate', 'DECIMATE')
    d.ratio = tris / n
    bpy.ops.object.modifier_apply(modifier=d.name)

# its foot on the ground, its middle over the origin, turned, so many metres high
pts = [obj.matrix_world @ v.co for v in obj.data.vertices]
lo = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
mid = (lo + hi) / 2
for v in obj.data.vertices:
    v.co -= Vector((mid.x, mid.y, lo.z))
obj.rotation_euler = (0, 0, turn)
k = height / max(hi.z - lo.z, 1e-6)
obj.scale = (k, k, k)
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
n = sum(len(p.vertices) - 2 for p in obj.data.polygons)
print(f'prepared: {n} triangles, {height} m high')

bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', use_selection=False, export_materials='NONE', export_animations=False)

if preview:
    sc = bpy.context.scene
    cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam'))
    sc.collection.objects.link(cam)
    cam.location = (0, -height * 2.6, height * 0.9)
    cam.rotation_euler = (math.radians(80), 0, 0)
    sc.camera = cam
    sun = bpy.data.objects.new('sun', bpy.data.lights.new('sun', 'SUN'))
    sc.collection.objects.link(sun)
    sun.rotation_euler = (math.radians(50), 0, math.radians(30))
    sc.render.engine = 'BLENDER_WORKBENCH'
    sc.render.resolution_x = sc.render.resolution_y = 512
    sc.render.filepath = preview
    bpy.ops.render.render(write_still=True)
