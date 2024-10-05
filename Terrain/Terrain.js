const orange = new Float32Array([1, 0.373, 0.02, 1]);
var gl;
var canvas;
var shaderProgram;
var usecolor=0;
var shine=0;
var rocky_cliffs=0;
var vertices = {
    "triangles":
        [[0,3,2],
         [0,1,3]
        ]
    ,"attributes":
        {
        "position":
            [[-2.0, -2.0, 0.0],
             [-2.0, 2.0, 0.0],
             [2.0, -2.0, 0.0],
             [2.0, 2.0, 0.0]]
        }
  };
var vertices_torus={
    'vertices':[],
    'indices':[],
    'normals':[],
    'texCoords':[]
};
function createGLContext(canvas) {
    var context = null;
    context = canvas.getContext("webgl2");
    if (context) {
      context.viewportWidth = canvas.width;
      context.viewportHeight = canvas.height;
    } else {
      alert("Failed to create WebGL!");
    }
    return context;
  }

  function loadShaderFromDOM(id) {
    var shaderScript = document.getElementById(id);
    // Exit if shader not found with the given id
    if (!shaderScript) {
      return null;
    }
      
    var shaderSource = shaderScript.text;
   
    var shader;
    if (shaderScript.type == "x-shader/x-fragment") {
      shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
      shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
      return null;
    }
   
    gl.shaderSource(shader, shaderSource);
    gl.compileShader(shader);
   
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      alert(gl.getShaderInfoLog(shader));
      return null;
    } 
    return shader;
  }

  function setupShaders() {
    vertexShader = loadShaderFromDOM("shader-vs");
    fragmentShader = loadShaderFromDOM("shader-fs");
    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
  
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      alert("Failed to setup shaders");
    }
    gl.useProgram(shaderProgram);
    shaderProgram.lightdir=gl.getUniformLocation(shaderProgram, 'lightdir');
    shaderProgram.color=gl.getUniformLocation(shaderProgram, 'color');
    shaderProgram.uMvMatrix=gl.getUniformLocation(shaderProgram, 'uMvMatrix');
    shaderProgram.projectionMatrix=gl.getUniformLocation(shaderProgram, 'uprojectionMatrix');
    shaderProgram.usecolor=gl.getUniformLocation(shaderProgram, 'usecolor');
    shaderProgram.shine=gl.getUniformLocation(shaderProgram,'shine');
    shaderProgram.rocky_cliffs=gl.getUniformLocation(shaderProgram,'rocky_cliffs');
  }

  function Normalize_vertices(vert) {
    vert.attributes.normal = []
    for(let i=0; i<vert.attributes.position.length; i+=1) {
        vert.attributes.normal.push([0,0,0])
    }
    for(let i=0; i<vert.triangles.length; i+=1) {
        let t = vert.triangles[i]
        let p0 = vert.attributes.position[t[0]]
        let p1 = vert.attributes.position[t[1]]
        let p2 = vert.attributes.position[t[2]]
        let sub1 = sub(p1,p0)
        let sub2 = sub(p2,p0)
        let cr = cross(sub1,sub2)
        vert.attributes.normal[t[0]] = add(vert.attributes.normal[t[0]], cr)
        vert.attributes.normal[t[1]] = add(vert.attributes.normal[t[1]], cr)
        vert.attributes.normal[t[2]] = add(vert.attributes.normal[t[2]], cr)
    }
    for(let i=0; i<vert.attributes.position.length; i+=1) {
        vert.attributes.normal[i] = normalize(vert.attributes.normal[i] )
    } 
  }

  function setupBuffers(data, shaderProgram, vsIn, mode) {
    let buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    let f32 = new Float32Array(data.flat())
    gl.bufferData(gl.ARRAY_BUFFER, f32, mode)
    let loc = gl.getAttribLocation(shaderProgram, vsIn)
    gl.vertexAttribPointer(loc, data[0].length, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(loc)
    return buf;
}

  function initialize_geom(vert) {
    var triangleArray = gl.createVertexArray()
    gl.bindVertexArray(triangleArray)

    for(let name in vert.attributes) {
        let data = vert.attributes[name]
        setupBuffers(data, shaderProgram, name,gl.STATIC_DRAW)
    }

    var indices = new Uint16Array(vert.triangles.flat())
    var indexBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW)

    return {
        mode: gl.TRIANGLES,
        count: indices.length,
        type: gl.UNSIGNED_SHORT,
        vao: triangleArray
    }
}

function blankscreen() {
    let canvas = document.querySelector('canvas')
    document.body.style.margin = '0'
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    canvas.width = canvas.clientWidth
    canvas.height = canvas.clientHeight
    canvas.style.width = ''
    canvas.style.height = ''
  
    if (window.gl) {
        gl.viewport(0,0, canvas.width, canvas.height)
        window.p = m4perspNegZ(0.1, 10, 1.5, canvas.width, canvas.height)
        
    }
  }

function fill_terrain(gridWidth, gridResolution, iterations) {
    const vertices_terrain = {
    triangles: [],
    attributes: {
    position: []
    }
    };
    const startX = -gridWidth / 2;
    const startY = -gridWidth / 2;
    const pointSpacing = gridWidth / gridResolution;

    for (let i = 0; i <= gridResolution; i++) {
        for (let j = 0; j <= gridResolution; j++) {
            vertices_terrain.attributes.position.push([
                startX + pointSpacing * i,
                startY + pointSpacing * j,
                0
            ]);
        }
    }

    const gridSize = gridResolution + 1;
    for (let i = 0; i < gridResolution; i++) {
        for (let j = 0; j < gridResolution; j++) {
            const index = i + gridSize * j;
            vertices_terrain.triangles.push([index, index + 1, index + gridSize]);
            vertices_terrain.triangles.push([index + 1, index + gridSize + 1, index + gridSize]);
        }
    }

    for (let n = 0; n < iterations; n++) {
        const delta = 0.005;
        const randomX = (Math.random() - 0.4) * 1.5 * gridWidth;
        const randomY = (Math.random() - 0.4) * 1.5 * gridWidth;
        const randomPos = [randomX, randomY, 0];
        const randomAngle = Math.random() * 2 * Math.PI;
        const randomDirection = [Math.cos(randomAngle), Math.sin(randomAngle), 0];

        for (let i = 0; i < vertices_terrain.attributes.position.length; i++) {
            const vecDifference = sub(vertices_terrain.attributes.position[i], randomPos);
            if (dot(vecDifference, randomDirection) >= 0) {
                vertices_terrain.attributes.position[i] = add(vertices_terrain.attributes.position[i], [0, 0, delta]);
            } else {
                vertices_terrain.attributes.position[i] = sub(vertices_terrain.attributes.position[i], [0, 0, delta]);
            }
        }
    }

    let minX = 0;
    let minZ = 0;
    let maxX = 0;
    let maxZ = 0;

    for (let i = 0; i < vertices_terrain.attributes.position.length; i++) {
        const currentX = vertices_terrain.attributes.position[i][0];
        const currentZ = vertices_terrain.attributes.position[i][2];

        if (currentX > maxX) maxX = currentX;
        if (currentX < minX) minX = currentX;
        if (currentZ > maxZ) maxZ = currentZ;
        if (currentZ < minZ) minZ = currentZ;
    }

    const scaleFactor = 0.8;
    const heightFactor = (maxX - minX) * scaleFactor;

    if (heightFactor !== 0) {
        for (let i = 0; i < vertices_terrain.attributes.position.length; i++) {
            const normalizedHeight = (vertices_terrain.attributes.position[i][2] - minZ) * heightFactor / (maxZ - minZ);
            vertices_terrain.attributes.position[i][2] = normalizedHeight - (heightFactor / 2);
        }
    }

    Normalize_vertices(vertices_terrain);

    return vertices_terrain;
}
function draw_terrain() {
    gl.clearColor(0, 0, 0, 1)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.bindVertexArray(vert.vao)
    gl.uniform3fv(shaderProgram.lightdir, normalize([-1,-1,-1]))
    gl.uniform4fv(shaderProgram.color, orange)
    gl.uniformMatrix4fv(shaderProgram.uMvMatrix, false, m4mul(v,m))
    gl.uniformMatrix4fv(shaderProgram.projectionMatrix, false, p)
    gl.uniform1f(shaderProgram.usecolor, usecolor)
    gl.uniform1f(shaderProgram.shine, shine)
    gl.uniform1f(shaderProgram.rocky_cliffs,rocky_cliffs)
    gl.drawElements(vert.mode, vert.count, vert.type, 0)
  }
var identity=new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
function animate_terrain(milliseconds) {
    let seconds = milliseconds/1000;
    window.m = identity;
    window.v = m4view([2*Math.cos(seconds/10),2*Math.sin(seconds/10),2], [0,0,0.5], [0,0,1])
  
    draw_terrain();
    requestAnimationFrame(animate_terrain);
  }
  //Torus
  function setupShaders_torus(){
    vertexShader_torus = loadShaderFromDOM("shader-vs_torus");
    fragmentShader_torus = loadShaderFromDOM("shader-fs_torus");
    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader_torus);
    gl.attachShader(shaderProgram, fragmentShader_torus);
    gl.linkProgram(shaderProgram);
  
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      alert("Failed to setup shaders");
    }  
    gl.useProgram(shaderProgram);
    shaderProgram.positionAttributeLocation_torus = gl.getAttribLocation(shaderProgram, 'position');
    shaderProgram.normalAttributeLocation_torus = gl.getAttribLocation(shaderProgram, 'normal');
    shaderProgram.texcoordAttributeLocation_torus = gl.getAttribLocation(shaderProgram, 'texcoord');
    shaderProgram.matrixUniformLocation_torus = gl.getUniformLocation(shaderProgram, 'u_matrix');
    gl.enableVertexAttribArray(shaderProgram.positionAttributeLocation_torus);
    gl.enableVertexAttribArray(shaderProgram.normalAttributeLocation_torus);
    gl.enableVertexAttribArray(shaderProgram.texcoordAttributeLocation_torus);

  }
  //
  function fill_torus(rings,points,major_r,minor_r){
    vertices_torus.vertices = [];
    vertices_torus.indices = [];
    vertices_torus.normals = [];
    vertices_torus.texCoords = [];
    for (let ring = 0; ring <= rings; ++ring) {
        const v = ring / rings;
        const ring_angle = v * 2 * Math.PI;
        const cos_rings = Math.cos(ring_angle);
        const sin_rings = Math.sin(ring_angle);
        const ring_rad = major_r + minor_r * cos_rings;
  
        for (let point = 0; point <= points; ++point) {
          const u = point / points;
          const point_angle = u * 2 * Math.PI;
          const cos_points = Math.cos(point_angle);
          const sin_points = Math.sin(point_angle);
  
          const x = ring_rad * cos_points;
          const y = ring_rad * sin_points;
          const z = minor_r * sin_rings;
  
          vertices_torus.vertices.push(x, y, z);
          vertices_torus.normals.push(
             cos_rings * sin_points, 
             sin_points * sin_rings, 
             cos_rings);
             vertices_torus.texCoords.push(u);
             vertices_torus.texCoords.push(v);
        }
      }
      const vertsPerRings = points + 1;
      for (let i = 0; i < rings; ++i) {
        let v1 = i * vertsPerRings;
        let v2 = v1 + vertsPerRings;
  
        for (let j = 0; j < points; ++j) {
  
            vertices_torus.indices.push(v1);
            vertices_torus.indices.push(v1 + 1);
            vertices_torus.indices.push(v2);
  
            vertices_torus.indices.push(v2);
            vertices_torus.indices.push(v1 + 1);
            vertices_torus.indices.push(v2 + 1);
  
          v1 += 1;
          v2 += 1;
        }
      }
      var angle = Math.PI / 2.5;
      var mat = glMatrix.mat4.create();
      glMatrix.mat4.rotateX(mat, mat, angle);
      for (var i = 0; i < vertices_torus.vertices.length; i += 3) {
        var vec = glMatrix.vec3.fromValues(vertices_torus.vertices[i], vertices_torus.vertices[i+1], vertices_torus.vertices[i+2]);
        glMatrix.vec3.transformMat4(vec, vec, mat);
        vertices_torus.vertices[i] = vec[0];
        vertices_torus.vertices[i+1] = vec[1];
        vertices_torus.vertices[i+2] = vec[2];
    }
  }

//Torus Animate
function animate_torus(time){
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices_torus.vertices), gl.STATIC_DRAW);
// gl.enableVertexAttribArray(shaderProgram.positionAttributeLocation_torus);
gl.vertexAttribPointer(shaderProgram.positionAttributeLocation_torus, 3, gl.FLOAT, false, 0, 0);
const normalBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices_torus.normals), gl.STATIC_DRAW);
// gl.enableVertexAttribArray(shaderProgram.normalAttributeLocation_torus);
gl.vertexAttribPointer(shaderProgram.normalAttributeLocation_torus, 3, gl.FLOAT, false, 0, 0);
const texcoordBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices_torus.texCoords), gl.STATIC_DRAW);
// gl.enableVertexAttribArray(shaderProgram.texcoordAttributeLocation_torus);
gl.vertexAttribPointer(shaderProgram.texcoordAttributeLocation_torus, 2, gl.FLOAT, false, 0, 0);
const indexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(vertices_torus.indices), gl.STATIC_DRAW);
gl.enable(gl.DEPTH_TEST);
gl.enable(gl.CULL_FACE);
gl.clearColor(0.0, 0.0, 0.0, 1.0);
gl.clearDepth(1.0);
gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
let mat = glMatrix.mat4.create();
glMatrix.mat4.perspective(mat,45 * Math.PI / 180, 1, 0.1, 100);
glMatrix.mat4.translate(mat, mat, [0, 0, -7]);
glMatrix.mat4.rotateY(mat, mat, time * 0.001);
gl.uniformMatrix4fv(shaderProgram.matrixUniformLocation_torus, false, mat);
gl.drawElements(gl.TRIANGLES, vertices_torus.indices.length, gl.UNSIGNED_SHORT, 0);
window.pending=requestAnimationFrame(animate_torus);
}
async function setupScene(scene, options) {
    cancelAnimationFrame(window.pending)
    if (options.color == false) {
        usecolor = 0
    } else {
        usecolor = 1
    }
    if (options.shiny==false){
        shine=0
    } else{
        shine=1
    }
    if (options.rocky_cliffs==false){
        rocky_cliffs=0
    } else{
        rocky_cliffs=1
    }
    if (scene=='terrain'){
        vertices = fill_terrain(4, options.resolution, options.slices)
        window.vert = initialize_geom(vertices)
        blankscreen();
        animate_terrain();
    }
    else if (scene=='torus'){
        setupShaders_torus();
        fill_torus(options.res1,options.res2,options.r1,options.r2);
        animate_torus();
    }
  }
window.addEventListener('load',(event)=>{
    canvas = document.querySelector("canvas");
    gl = createGLContext(canvas);
    setupShaders();
    gl.enable(gl.DEPTH_TEST)
    Normalize_vertices(vertices)
    window.vert = initialize_geom(vertices)
    blankscreen()
});
window.addEventListener('resize', blankscreen);