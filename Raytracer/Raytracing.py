import sys
import re
import numpy as np
from math import atan2, pi
from PIL import Image

def normalize(vector):
    return vector / np.linalg.norm(vector)

def reflected(vector, axis):
    return vector - 2 * np.dot(vector, axis) * axis

def sphere_intersect(center, radius, ray_origin, ray_direction):
    b = 2 * np.dot(ray_direction, ray_origin - center)
    c = np.linalg.norm(ray_origin - center) ** 2 - radius ** 2
    delta = b ** 2 - 4 * c
    if delta > 0:
        t1 = (-b + np.sqrt(delta)) / 2
        t2 = (-b - np.sqrt(delta)) / 2
        if t1 > 0 and t2 > 0:
            return min(t1, t2)
    return None

def nearest_intersected_object(objects, ray_origin, ray_direction):
    nearest_object = None
    min_distance = np.inf
    distances=[]
    for obj in objects:
        if obj['type']=='Sphere':
            distances.append(sphere_intersect(obj['center'], obj['radius'], ray_origin, ray_direction))
        elif obj['type']=='Plane':
            plane_normal = np.array([obj['A'], obj['B'], obj['C']])
            numerator = -(obj['D'] + np.dot(plane_normal, ray_origin))
            denominator = np.dot(plane_normal, ray_direction)
            if np.abs(denominator) > 1e-6:  # avoid division by zero
                distance = numerator / denominator
                if distance <= 0:  # the plane is behind the ray origin
                    distance = None
            else:
                distance = None
            distances.append(distance)
        elif obj['type']=='Triangle':
            distance = ray_triangle_intersection(ray_origin, ray_direction, obj)
            distances.append(distance)
    for index, distance in enumerate(distances):
        if distance and distance < min_distance:
            min_distance = distance
            nearest_object = objects[index]
    return nearest_object, min_distance


def reflect(ray, normal):
    return ray - 2 * np.dot(ray, normal) * normal

def ray_triangle_intersection(ray_origin, ray_direction, triangle):
    vertex0, vertex1, vertex2 = triangle['vertex']
    edge1 = vertex1 - vertex0
    edge2 = vertex2 - vertex0
    h = np.cross(ray_direction, edge2)
    a = np.dot(edge1, h)
    if abs(a) < 1e-8:
        return None
    f = 1.0 / a
    s = ray_origin - vertex0
    u = f * np.dot(s, h)
    if u < 0.0 or u > 1.0:
        return None
    q = np.cross(s, edge1)
    v = f * np.dot(ray_direction, q)
    if v < 0.0 or u + v > 1.0:
        return None
    t = f * np.dot(edge2, q)
    if t > 1e-8:  # ray intersection
        return t
    else:
        return None
def convert_rgb_to_srgb(rgb):
    srgb = np.zeros_like(rgb)
    mask = rgb <= 0.0031308
    srgb[mask] = 12.92 * rgb[mask]
    srgb[~mask] = 1.055 * np.power(rgb[~mask], 1/2.4) - 0.055
    return np.clip(srgb, 0, 1)
def get_exposure(rgb,v):
    l_exposed = 1 - np.exp(-rgb * v)
    return l_exposed

def get_ray_direction(theta, phi, forward, up, right):
    # Convert spherical coordinates to Cartesian coordinates
    direction = np.array([
        np.cos(phi) * np.sin(theta),
        np.sin(phi),
        np.cos(phi) * np.cos(theta)
    ])
    # Convert direction to world coordinates
    return normalize(direction[0] * right + direction[1] * up + direction[2] * forward)
def get_texture_color(texture_img, u, v):
    height, width, _ = texture_img.shape
    x = int(u * width) % width
    y = int(v * height) % height
    color_srgb = texture_img[y, x]/255
    color_srgb=color_srgb[:3]
    color_srgb=convert_srgb_to_linear(color_srgb)
    return color_srgb

def get_sphere_texture_coords(normal):
    u = 0.5 + atan2(normal[2], normal[0]) / (2 * pi)
    v = 0.5 - np.arcsin(normal[1]) / pi
    return u, v
def convert_srgb_to_linear(color_srgb):
    # sRGB to linear color space conversion
    color_linear = np.where(color_srgb <= 0.04045,
                            color_srgb / 12.92,
                            ((color_srgb + 0.055) / 1.055) ** 2.4)
    return color_linear


def draw_aa(image, height, width, objects, suns, bulbs, aa,exposure):
    eye = np.array([0, 0, 0])
    forward = np.array([0, 0, -1])
    right = np.array([1, 0, 0])
    up = np.array([0, 1, 0])
    
    for y in range(height):
        for x in range(width):
            color_sum = np.zeros((4))
            for _ in range(aa):  
                jitter_x = np.random.uniform() if aa > 1 else 0.5 
                jitter_y = np.random.uniform() if aa > 1 else 0.5
                
                sx = (2 * (x + jitter_x) - width) / max(width, height)
                sy = (height - 2 * (y + jitter_y)) / max(width, height)
                ray_origin = eye
                ray_direction = normalize(forward + sx * right + sy * up)
                
                color = np.zeros((4))
                nearest_object, min_distance = nearest_intersected_object(objects, ray_origin, ray_direction)
                if nearest_object is not None:
                    intersection_point = ray_origin + min_distance * ray_direction
                    if nearest_object['type']=='Sphere':
                        normal_to_surface = normalize(intersection_point - nearest_object['center'])
                    elif nearest_object['type']=='Plane':
                        normal_to_surface = normalize(np.array([nearest_object['A'], nearest_object['B'], nearest_object['C']]))
                    elif nearest_object['type']=='Triangle':
                        v0, v1, v2 = nearest_object['vertex']
                        normal_to_surface = normalize(np.cross(v1 - v0, v2 - v0))
                    color=np.zeros((4))
                    color[3]=1
                    for sun in suns:
                        light_direction = normalize(sun['position'])
                        shadow_obj, _ = nearest_intersected_object(objects, intersection_point + normal_to_surface * 0.0001, light_direction) 
                        if shadow_obj is None:
                            illumination = np.dot(normal_to_surface, light_direction)
                            if illumination > 0:
                                color += nearest_object['color'] * sun['color'] * illumination
                    for bulb in bulbs:
                        light_direction = normalize(bulb['position'] - intersection_point)  
                        shadow_obj, shadow_dist = nearest_intersected_object(objects, intersection_point + normal_to_surface * 0.0001, light_direction)
                        if shadow_obj is None or shadow_dist > np.linalg.norm(bulb['position'] - intersection_point): 
                            illumination = np.dot(normal_to_surface, light_direction)
                            if illumination > 0:
                                bulb_distance = np.linalg.norm(bulb['position'] - intersection_point)
                                color += nearest_object['color'] * bulb['color'] * illumination / (bulb_distance ** 2)
                    color = np.clip(color, 0, 1)
                color_sum += color
            color_sum=convert_rgb_to_srgb(color_sum/aa)
            color_sum=tuple(color_sum*255)
            f_color=(int(color_sum[0]),int(color_sum[1]),int(color_sum[2]),int(color_sum[3]))
            image.im.putpixel((x,y),f_color)


def draw_aa_dof(image, height, width, objects, suns, bulbs, aa, exposure, focal_depth, lens_radius):
    eye = np.array([0, 0, 0])
    forward = np.array([0, 0, -1])
    right = np.array([1, 0, 0])
    up = np.array([0, 1, 0])
    
    for y in range(height):
        for x in range(width):
            color_sum = np.zeros((4))
            for _ in range(aa):  
                jitter_x = np.random.uniform() if aa > 1 else 0.5 
                jitter_y = np.random.uniform() if aa > 1 else 0.5
                
                sx = (2 * (x + jitter_x) - width) / max(width, height)
                sy = (height - 2 * (y + jitter_y)) / max(width, height)
                ray_origin = eye
                ray_direction = normalize(forward + sx * right + sy * up)
                
                # Depth-of-field
                focal_point = ray_origin + focal_depth * ray_direction  
                lens_point = np.random.uniform(-1, 1, size=2) * lens_radius  
                lens_offset = lens_point[0] * right + lens_point[1] * up  
                
                new_ray_origin = ray_origin + lens_offset  
                new_ray_direction = normalize(focal_point - new_ray_origin)  
                
                color = np.zeros((4))
                nearest_object, min_distance = nearest_intersected_object(objects, new_ray_origin, new_ray_direction)
                if nearest_object is not None:
                    intersection_point = new_ray_origin + min_distance * new_ray_direction
                    if nearest_object['type']=='Sphere':
                        normal_to_surface = normalize(intersection_point - nearest_object['center'])
                    elif nearest_object['type']=='Plane':
                        normal_to_surface = normalize(np.array([nearest_object['A'], nearest_object['B'], nearest_object['C']]))
                    elif nearest_object['type']=='Triangle':
                        v0, v1, v2 = nearest_object['vertex']
                        normal_to_surface = normalize(np.cross(v1 - v0, v2 - v0))
                    color=np.zeros((4))
                    color[3]=1
                    for sun in suns:
                        light_direction = normalize(sun['position'])
                        shadow_obj, _ = nearest_intersected_object(objects, intersection_point + normal_to_surface * 0.0001, light_direction) 
                        if shadow_obj is None:
                            illumination = np.dot(normal_to_surface, light_direction)
                            if illumination > 0:
                                color += nearest_object['color'] * sun['color'] * illumination
                    for bulb in bulbs:
                        light_direction = normalize(bulb['position'] - intersection_point)  
                        shadow_obj, shadow_dist = nearest_intersected_object(objects, intersection_point + normal_to_surface * 0.0001, light_direction)
                        if shadow_obj is None or shadow_dist > np.linalg.norm(bulb['position'] - intersection_point):  
                            illumination = np.dot(normal_to_surface, light_direction)
                            if illumination > 0:
                                bulb_distance = np.linalg.norm(bulb['position'] - intersection_point)
                                color += nearest_object['color'] * bulb['color'] * illumination / (bulb_distance ** 2)
                    color = np.clip(color, 0, 1)
                color_sum += color
            color_sum=convert_rgb_to_srgb(color_sum/aa)
            color_sum=tuple(color_sum*255)
            f_color=(int(color_sum[0]),int(color_sum[1]),int(color_sum[2]),int(color_sum[3]))
            image.im.putpixel((x,y),f_color)

def draw_fisheye(image,height,width,objects,suns,bulbs,exposure,eye,forward,up,right):
    forward_length = np.linalg.norm(forward)
    forward = forward / forward_length
    for y in range(height):
        for x in range(width):
            sx = (2 * x - width) / (forward_length * max(width, height))
            sy = (height - 2 * y) / (forward_length * max(width, height))
            r_squared = sx**2 + sy**2
            if r_squared > 1:  
                continue
            ray_origin = eye
            ray_direction = normalize(sx * right + sy * up + np.sqrt(1 - r_squared) * forward)
            color = np.zeros((4))
            nearest_object, min_distance = nearest_intersected_object(objects, ray_origin, ray_direction)
            if nearest_object is not None:
                intersection_point = ray_origin + min_distance * ray_direction
                if nearest_object['type']=='Sphere':
                    normal_to_surface = normalize(intersection_point - nearest_object['center'])
                elif nearest_object['type']=='Plane':
                    normal_to_surface = normalize(np.array([nearest_object['A'], nearest_object['B'], nearest_object['C']]))
                elif nearest_object['type']=='Triangle':
                    v0, v1, v2 = nearest_object['vertex']
                    normal_to_surface = normalize(np.cross(v1 - v0, v2 - v0))
                color=np.zeros((4))
                color[3]=1
                for sun in suns:
                    light_direction = normalize(sun['position'])
                    shadow_obj, _ = nearest_intersected_object(objects, intersection_point + normal_to_surface * 0.0001, light_direction) 
                    if shadow_obj is None:
                        illumination = np.dot(normal_to_surface, light_direction)
                        if illumination > 0:
                            color += nearest_object['color'] * sun['color'] * illumination
                for bulb in bulbs:
                    light_direction = normalize(bulb['position'] - intersection_point)  
                    shadow_obj, shadow_dist = nearest_intersected_object(objects, intersection_point + normal_to_surface * 0.0001, light_direction)
                    if shadow_obj is None or shadow_dist > np.linalg.norm(bulb['position'] - intersection_point):  
                        illumination = np.dot(normal_to_surface, light_direction)
                        if illumination > 0:
                            bulb_distance = np.linalg.norm(bulb['position'] - intersection_point)
                            color += nearest_object['color'] * bulb['color'] * illumination / (bulb_distance ** 2)
                color = np.clip(color, 0, 1)
                if exposure!=np.inf:
                    color=get_exposure(color,exposure)
            color=convert_rgb_to_srgb(color)
            color=tuple(color*255)
            f_color=(int(color[0]),int(color[1]),int(color[2]),int(color[3]))
            image.im.putpixel((x,y),f_color)
    
def draw_panaroma(image, height, width, objects, suns, bulbs, exposure, eye, forward, up, right):
    for y in range(height):
        for x in range(width):
            sx = 2 * x / (width - 1) - 1
            sy = 1- 2 * y / (height - 1) 
            theta = sx * np.pi  
            phi = sy * np.pi / 2  
            ray_direction = (np.cos(phi) * np.cos(theta) * forward+ np.sin(phi) * up+ np.cos(phi) * np.sin(theta) * right)
            ray_direction = normalize(ray_direction)
            ray_origin=eye
            color = np.zeros((4))
            nearest_object, min_distance = nearest_intersected_object(objects, ray_origin, ray_direction)
            if nearest_object is not None:
                intersection_point = ray_origin + min_distance * ray_direction
                if nearest_object['type']=='Sphere':
                    normal_to_surface = normalize(intersection_point - nearest_object['center'])
                elif nearest_object['type']=='Plane':
                    normal_to_surface = normalize(np.array([nearest_object['A'], nearest_object['B'], nearest_object['C']]))
                elif nearest_object['type']=='Triangle':
                    v0, v1, v2 = nearest_object['vertex']
                    normal_to_surface = normalize(np.cross(v1 - v0, v2 - v0))
                color=np.zeros((4))
                color[3]=1
                for sun in suns:
                    light_direction = normalize(sun['position'])
                    shadow_obj, _ = nearest_intersected_object(objects, intersection_point + normal_to_surface * 0.0001, light_direction) 
                    if shadow_obj is None:
                        illumination = np.dot(normal_to_surface, light_direction)
                        if illumination > 0:
                            color += nearest_object['color'] * sun['color'] * illumination
                for bulb in bulbs:
                    light_direction = normalize(bulb['position'] - intersection_point)
                    shadow_obj, shadow_dist = nearest_intersected_object(objects, intersection_point + normal_to_surface * 0.0001, light_direction)
                    if shadow_obj is None or shadow_dist > np.linalg.norm(bulb['position'] - intersection_point):  
                        illumination = np.dot(normal_to_surface, light_direction)
                        if illumination > 0:
                            bulb_distance = np.linalg.norm(bulb['position'] - intersection_point)
                            color += nearest_object['color'] * bulb['color'] * illumination / (bulb_distance ** 2)
                color = np.clip(color, 0, 1)
                if exposure!=np.inf:
                    color=get_exposure(color,exposure)
            color=convert_rgb_to_srgb(color)
            color=tuple(color*255)
            f_color=(int(color[0]),int(color[1]),int(color[2]),int(color[3]))
            image.im.putpixel((x,y),f_color)

def draw_texture(image, height, width, objects, suns, bulbs, exposure, eye, forward, up, right):
    for y in range(height):
        for x in range(width):
            sx = (2 * x - width) / max(width, height)
            sy = (height - 2 * y) / max(width, height)
            ray_origin = eye
            ray_direction = normalize(forward + sx * right + sy * up)
            color = np.zeros((4))
            nearest_object, min_distance = nearest_intersected_object(objects, ray_origin, ray_direction)
            if nearest_object is not None:
                color = np.zeros((4))
                color_tex=np.zeros((4))
                color[3]=1
                color_tex[3]=1
                intersection_point = ray_origin + min_distance * ray_direction
                if nearest_object['type'] == 'Sphere':
                    normal_to_surface = normalize(intersection_point - nearest_object['center'])
                    if 'texture' in nearest_object:
                        u, v = get_sphere_texture_coords(normal_to_surface)
                        texture_img = nearest_object['texture']
                        color_tex = get_texture_color(texture_img, u, v)
                        color_tex=np.append(color_tex,1)
                        for sun in suns:
                            light_direction = normalize(sun['position'])
                            shadow_obj, _ = nearest_intersected_object(objects, intersection_point + normal_to_surface * 0.0001, light_direction)
                            if shadow_obj is not None:
                                color_tex=np.zeros((4))
                                color_tex[3]=1
                        color_tex=convert_rgb_to_srgb(color_tex)
                        color_tex=tuple(color_tex*255)
                        f_color=(int(color_tex[0]),int(color_tex[1]),int(color_tex[2]),int(color_tex[3]))
                        image.im.putpixel((x,y),f_color)
                        continue
                for sun in suns:
                    light_direction = normalize(sun['position'])
                    shadow_obj, _ = nearest_intersected_object(objects, intersection_point + normal_to_surface * 0.0001, light_direction)
                    if shadow_obj is None:
                        illumination = np.dot(normal_to_surface, light_direction)
                        if illumination > 0:
                            color += nearest_object['color']*sun['color'] * illumination
                color = np.clip(color, 0, 1)
                if exposure != np.inf:
                    color = get_exposure(color, exposure)
            color=convert_rgb_to_srgb(color)
            color=tuple(color*255)
            f_color_shadow=(int(color[0]),int(color[1]),int(color[2]),int(color[3]))
            image.im.putpixel((x,y),f_color_shadow)


def draw(image,height,width,objects,suns,bulbs,exposure,eye,forward,up,right):
    for y in range(height):
        for x in range(width):
            sx = (2 * x - width) / max(width, height)
            sy = (height - 2 * y) / max(width, height)
            ray_origin = eye
            ray_direction = normalize(forward + sx * right + sy * up)
            color = np.zeros((4))
            nearest_object, min_distance = nearest_intersected_object(objects, ray_origin, ray_direction)
            if nearest_object is not None:
                intersection_point = ray_origin + min_distance * ray_direction
                color=np.zeros((4))
                color[3]=1
                if nearest_object['type']=='Sphere':
                    normal_to_surface = normalize(intersection_point - nearest_object['center'])
                elif nearest_object['type']=='Plane':
                    normal_to_surface = normalize(np.array([nearest_object['A'], nearest_object['B'], nearest_object['C']]))
                elif nearest_object['type']=='Triangle':
                    v0, v1, v2 = nearest_object['vertex']
                    normal_to_surface = normalize(np.cross(v1 - v0, v2 - v0))
                if np.dot(normal_to_surface, ray_direction) > 0:
                    normal_to_surface = -normal_to_surface
                for sun in suns:
                    light_direction = normalize(sun['position'])
                    shadow_obj, _ = nearest_intersected_object(objects, intersection_point + normal_to_surface * 0.0001, light_direction) 
                    if shadow_obj is None:
                        illumination = np.dot(normal_to_surface, light_direction)
                        if illumination > 0:
                            color += nearest_object['color'] * sun['color'] * illumination
                for bulb in bulbs:
                    light_direction = normalize(bulb['position'] - intersection_point)  
                    shadow_obj, shadow_dist = nearest_intersected_object(objects, intersection_point + normal_to_surface * 0.0001, light_direction)
                    if shadow_obj is None or shadow_dist > np.linalg.norm(bulb['position'] - intersection_point):
                        illumination = np.dot(normal_to_surface, light_direction)
                        if illumination > 0:
                            bulb_distance = np.linalg.norm(bulb['position'] - intersection_point)
                            color += nearest_object['color'] * bulb['color'] * illumination / (bulb_distance ** 2)
                color = np.clip(color, 0, 1)
                if exposure!=np.inf:
                    color=get_exposure(color,exposure)
            color=convert_rgb_to_srgb(color)
            color=tuple(color*255)
            f_color=(int(color[0]),int(color[1]),int(color[2]),int(color[3]))
            image.im.putpixel((x,y),f_color)

f=open('mpray_tenthousand.txt',"r")
lines=f.read().splitlines()
f.close()
objects=[]
max_depth = 3
suns = []
bulbs= []
shininess=0
color=(1,1,1,1)
bounces_left=4
vertices=[]
normals=[]
aa=np.inf
exposure=np.inf
eye = np.array([0, 0, 0])
forward = np.array([0, 0, -1])
right = np.array([1, 0, 0])
up = np.array([0, 1, 0])
fisheye=False
panaromic=False
focus=np.inf
lens=np.inf
texture=False
texture_file=None
shiny=False
for line in lines:
    line.strip()
    words=line.split(' ')
    if words[0]=='png':
        outputfilename=words[-1]
        nums=re.findall(r"[-+]?(?:\d*\.*\d+)",line)
        nums=[int(num) for num in nums]
        width=nums[0]
        height=nums[1]
        image=Image.new('RGBA',(width,height),(0,0,0,0))
    if words[0]=='sphere':
        nums=re.findall(r"[-+]?(?:\d*\.*\d+)",line)
        center=[(float(nums[0])),(float(nums[1])),(float(nums[2]))]
        radius=(float(nums[-1]))
        try:
            objects.append({'type':'Sphere', 'center': np.array(center), 'radius': radius, 'color': np.array(color), 'shininess':shininess,'texture':np.asarray(Image.open(texture_file))})
        except:
            objects.append({'type':'Sphere', 'center': np.array(center), 'radius': radius, 'color': np.array(color), 'shininess':shininess})
    if words[0]=='sun':
        nums=re.findall(r"[-+]?(?:\d*\.*\d+)",line)
        position=[(float(nums[0])),(float(nums[1])),(float(nums[2]))]
        suns.append({ 'position': np.array(position), 'color': np.array(color)})
    if words[0]=='color':
        nums=re.findall(r"[-+]?(?:\d*\.*\d+)",line)
        color=((float(nums[0])),(float(nums[1])),(float(nums[2])),1.0)
    if words[0]=='bulb':
        nums=re.findall(r"[-+]?(?:\d*\.*\d+)",line)
        position=[(float(nums[0])),(float(nums[1])),(float(nums[2]))]
        bulbs.append({ 'position': np.array(position), 'color': np.array(color)})
    if words[0]=='shininess':
        nums=re.findall(r"[-+]?(?:\d*\.*\d+)",line)
        shininess=float(nums[0])
        shiny=True
    if words[0]=='plane':
        nums=re.findall(r"[-+]?(?:\d*\.*\d+)",line)
        objects.append({'type':'Plane','A':float(nums[0]),'B':float(nums[1]),'C':float(nums[2]),'D':float(nums[3]),'color':np.array(color)})
    if words[0]=='xyz':
        nums=re.findall(r"[-+]?(?:\d*\.*\d+)",line)
        vertices.append([float(nums[0]),float(nums[1]),float(nums[2])])
    if words[0]=='normal':
        nums=re.findall(r"[-+]?(?:\d*\.*\d+)",line)
        normals.append([float(nums[0]),float(nums[1]),float(nums[2])])
    if words[0]=='aa':
        nums=re.findall(r"[-+]?(?:\d*\.*\d+)",line)
        aa=int(nums[0])
    if words[0]=='expose':
        nums=re.findall(r"[-+]?(?:\d*\.*\d+)",line)
        exposure=float(nums[0])
    if words[0]=='eye':
        nums=re.findall(r"[-+]?(?:\d*\.*\d+)",line)
        nums=[float(num) for num in nums]
        eye=np.array([nums[0], nums[1], nums[2]])
    if words[0]=='forward':
        nums=re.findall(r"[-+]?(?:\d*\.*\d+)",line)
        nums=[float(num) for num in nums]
        forward=np.array([nums[0], nums[1], nums[2]])
        right=np.cross(forward,up)
        right=normalize(right)
        up=np.cross(right,forward)
        up = normalize(up)
    if words[0]=='up':
        nums=re.findall(r"[-+]?(?:\d*\.*\d+)",line)
        nums=[float(num) for num in nums]
        up=np.array([nums[0], nums[1], nums[2]])
        m = np.cross(forward, up)
        m=normalize(m)
        up=np.cross(m,forward)
        up=normalize(up)
        right=np.cross(forward,up)
        right=normalize(right)
    if words[0]=='fisheye':
        fisheye=True
    if words[0]=='panorama':
        panaromic=True
    if words[0]=='dof':
        nums=re.findall(r"[-+]?(?:\d*\.*\d+)",line)
        nums=[float(num) for num in nums]
        focus=nums[0]
        lens=nums[1]
    if words[0]=='texture':
        texture_file=words[1]
        texture=True
    if words[0]=='trif':
        nums=re.findall(r"[-+]?(?:\d*\.*\d+)",line)
        nums=[int(num) for num in nums]
        triangle_vertex=[]
        normal_vertex=[]
        for num in nums:
            if num<0:
                triangle_vertex.append(vertices[num])
                try:
                    normal_vertex.append(normals[num])
                except:
                    continue
            elif num>0:
                triangle_vertex.append(vertices[num-1])
                try:
                    normal_vertex.append(normals[num-1])
                except:
                    continue
        objects.append({'type':"Triangle",'vertex':np.array(triangle_vertex),'normal':np.array(normal_vertex),'color':np.array(color)})
if aa!=np.inf:
    if focus!=np.inf and lens!=np.inf:
        draw_aa_dof(image, height, width, objects, suns, bulbs, aa, exposure, focus, lens)
    else:
        draw_aa(image,height,width,objects,suns,bulbs,aa,exposure)
else:
    if fisheye==True:
        draw_fisheye(image,height,width,objects,suns,bulbs,exposure,eye,forward,up,right)  
    else:
        if panaromic==True:
            draw_panaroma(image,height,width,objects,suns,bulbs,exposure,eye,forward,up,right)
        else:
            if texture==True:
                draw_texture(image,height,width,objects,suns,bulbs,exposure,eye,forward,up,right)
            else:
                draw(image,height,width,objects,suns,bulbs,exposure,eye,forward,up,right)
image.save(outputfilename)



