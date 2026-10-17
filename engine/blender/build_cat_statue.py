# A cat sitting up, for a shop's sculpture on the pavement (assets/cat_statue.glb, kit/shops.js statue 'cat'): a chibi cat, its head
# large, cheeks full, its tail curled round to its front paws. Built of simple shapes (body, chest, haunches, legs,
# paws, head, cheeks, muzzle, tail) as spheres, ellipsoids and capsules, cone ears, remeshed into one skin,
# smoothed and thinned.
# Made facing Blender's -Y (glTF's +Z), its feet at z = 0, about 2.3 high.
#   blender -b -P blender/build_cat_statue.py -- assets/cat_statue.glb [preview.png [front|back]]

import sys, math
import bpy
from mathutils import Vector, Quaternion

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
out = argv[0] if argv else 'assets/cat_statue.glb'
preview = argv[1] if len(argv) > 1 else None
view = argv[2] if len(argv) > 2 else 'front'   # (the preview from the front, or from behind: 'back')

bpy.ops.wm.read_factory_settings(use_empty=True)

def sph(co, radii):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, radius=1, location=co)
    o = bpy.context.active_object; o.scale = radii
def cap(a, b, r):
    a, b = Vector(a), Vector(b); d = b - a
    bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=r, depth=d.length, location=(a + b) / 2)
    bpy.context.active_object.rotation_euler = Vector((0, 0, 1)).rotation_difference(d.normalized()).to_euler()
    for p in (a, b): sph(p, (r, r, r))

# the body, sitting: a pear, its chest forward; a neck joining it to the head
sph((0, 0.05, 0.6), (0.52, 0.46, 0.62))
sph((0, -0.08, 0.92), (0.36, 0.34, 0.4))
sph((0, -0.06, 1.2), (0.32, 0.3, 0.3))
# haunches, and the hind paws forward of them
for f in (-1, 1):
    sph((f * 0.28, 0.1, 0.34), (0.24, 0.36, 0.3))
    sph((f * 0.34, -0.22, 0.07), (0.11, 0.18, 0.08))
# the front legs, straight down, and their paws
for f in (-1, 1):
    cap((f * 0.14, -0.3, 0.12), (f * 0.13, -0.2, 0.8), 0.1)
    sph((f * 0.15, -0.37, 0.07), (0.12, 0.15, 0.085))
# the head, large and wider than tall; its cheeks; its muzzle and nose
sph((0, -0.08, 1.62), (0.55, 0.5, 0.47))
for f in (-1, 1):
    sph((f * 0.24, -0.25, 1.5), (0.25, 0.25, 0.25))
for f in (-1, 1):
    sph((f * 0.085, -0.5, 1.46), (0.1, 0.08, 0.085))
sph((0, -0.57, 1.54), (0.05, 0.04, 0.035))
# the ears: cones, tilted out and a little back
for f in (-1, 1):
    bpy.ops.mesh.primitive_cone_add(vertices=24, radius1=0.25, radius2=0.03, depth=0.5, location=(f * 0.31, -0.06, 2.0))
    bpy.context.active_object.rotation_euler = (0.1, f * 0.4, 0)
# the tail: from the rump behind, round its side on the ground, curling in to its front paws
from mathutils import geometry
# (from its root, high on the rump behind and thick, down round its side on the ground, thinning, its tip curling up
# by its front paws)
ctrl = [Vector(p) for p in [(0.0, 0.36, 0.34), (0.12, 0.52, 0.2), (0.4, 0.42, 0.08), (0.58, 0.1, 0.07), (0.52, -0.24, 0.07), (0.32, -0.44, 0.08), (0.14, -0.5, 0.14)]]
# (smoothly: a Catmull-Rom curve through those points, in short pieces)
def cr(p0, p1, p2, p3, t):
    return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t)
ext = [ctrl[0] * 2 - ctrl[1]] + ctrl + [ctrl[-1] * 2 - ctrl[-2]]
pts = []
for i in range(1, len(ext) - 2):
    for k in range(6): pts.append(cr(ext[i - 1], ext[i], ext[i + 1], ext[i + 2], k / 6))
pts.append(ctrl[-1])
for i in range(len(pts) - 1):
    cap(pts[i], pts[i + 1], 0.115 - 0.07 * i / len(pts))

for o in bpy.context.scene.objects: o.select_set(o.type == 'MESH')
bpy.context.view_layer.objects.active = [o for o in bpy.context.scene.objects if o.type == 'MESH'][0]
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
bpy.ops.object.join()
cat = bpy.context.active_object

# one smooth skin: remeshed, smoothed, thinned
m = cat.modifiers.new('remesh', 'REMESH'); m.mode = 'VOXEL'; m.voxel_size = 0.018
m = cat.modifiers.new('smooth', 'SMOOTH'); m.factor = 0.6; m.iterations = 6
m = cat.modifiers.new('decimate', 'DECIMATE'); m.ratio = 0.15
bpy.ops.object.convert(target='MESH')
bpy.ops.object.shade_smooth()
print('cat triangles:', sum(len(p.vertices) - 2 for p in cat.data.polygons))

bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', use_selection=True, export_apply=True, export_materials='NONE', export_texcoords=False)

if preview:
    sc = bpy.context.scene
    sc.render.engine = 'BLENDER_WORKBENCH'
    sc.render.resolution_x, sc.render.resolution_y = 900, 900
    sc.display.shading.light = 'STUDIO'
    sc.display.shading.color_type = 'SINGLE'
    sc.display.shading.single_color = (0.95, 0.9, 0.82)
    cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam'))
    sc.collection.objects.link(cam)
    cam.location = (2.6, -4.2, 1.9) if view == 'front' else (-2.4, 4.4, 1.7)
    cam.rotation_euler = (Vector((0, 0, 1.05)) - cam.location).to_track_quat('-Z', 'Y').to_euler()
    sc.camera = cam
    sc.render.filepath = preview
    bpy.ops.render.render(write_still=True)
