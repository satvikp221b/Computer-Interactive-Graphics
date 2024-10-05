const orange = new Float32Array([1, 0.373, 0.02, 1]);
var gl;
var canvas;
var shaderProgram;
var resolution=128;
var camPosition = glMatrix.vec3.fromValues(0 ,-7, 4);
var camAngle = glMatrix.quat.create();
var camDir = glMatrix.vec3.fromValues(0.0, 2.0, -1);
var camSpeed = 0.5; 
var fractures=100;
var fog=0.0;
var ground=0.0;
let slot=0;
var objData;
var shaderProgram_obj;
const width=4;
var obj=0;
var vertices = {
    "triangles":
        [[0,3,2],
         [0,1,3]
        ]
    ,"attributes":
        {
        "position":
            [[-1.0, -1.0, 0.0],
             [-1.0, 1.0, 0.0],
             [1.0, -1.0, 0.0],
             [1.0, 1.0, 0.0]]
        }
  };
var modelViewMatrix = glMatrix.mat4.create();
var projectionMatrix = glMatrix.mat4.create();
var normalMatrix = glMatrix.mat3.create();
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
  var colormapImage = new Image();
  url="Map.jpg"
  colormapImage.crossOrigin = "anonymous";
  colormapImage.src=url 
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
    shaderProgram.aPositionLocation = gl.getAttribLocation(shaderProgram, 'position');
    shaderProgram.aTexCoordLocation = gl.getAttribLocation(shaderProgram, 'uv');
    shaderProgram.normalMatrix=gl.getAttribLocation(shaderProgram,'normal');
    shaderProgram.fog=gl.getUniformLocation(shaderProgram,'fog');
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

    const scaleFactor = 0.5;
    const heightFactor = (maxX - minX) * scaleFactor;

    if (heightFactor !== 0) {
        for (let i = 0; i < vertices_terrain.attributes.position.length; i++) {
            const normalizedHeight = (vertices_terrain.attributes.position[i][2] - minZ) * heightFactor / (maxZ - minZ);
            vertices_terrain.attributes.position[i][2] = normalizedHeight - (heightFactor / 2);
        }
    }

    Normalize_vertices(vertices_terrain);
    var textureCoordinates = calculateTextureCoordinates(vertices_terrain);
    vertices_terrain.attributes.texture = textureCoordinates;

    return vertices_terrain;
}
function draw_terrain() {
gl.useProgram(shaderProgram);
gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
const near = 0.1;
const far = 200.0;
glMatrix.mat4.perspective(projectionMatrix, 45*Math.PI/180,gl.viewportWidth / gl.viewportHeight, near, far);
let eye = glMatrix.vec3.clone(camPosition);
let up = currentUp();
let center = glMatrix.vec3.create();
let currentViewDir = currentDir();
glMatrix.vec3.add(center, camPosition, currentViewDir);
glMatrix.mat4.lookAt(modelViewMatrix, eye, center, up);
gl.bindVertexArray(vert.vao)
gl.uniform3fv(shaderProgram.lightdir, normalize([-1,-1,-1]))
gl.uniform4fv(shaderProgram.color, orange)
gl.uniformMatrix4fv(shaderProgram.uMvMatrix, false,modelViewMatrix);
gl.uniformMatrix4fv(shaderProgram.projectionMatrix, false,projectionMatrix);
let colormapImage = gl.getUniformLocation(shaderProgram, 'colormap');
gl.uniform1i(colormapImage, slot);
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices.attributes.position.flat()), gl.STATIC_DRAW);
const texCoordBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices.attributes.texture.flat()), gl.STATIC_DRAW);
const normal = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, normal);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices.attributes.normal.flat()), gl.STATIC_DRAW);
gl.enableVertexAttribArray(shaderProgram.aPositionLocation);
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.vertexAttribPointer(shaderProgram.aPositionLocation, 3, gl.FLOAT, false, 0, 0);

gl.enableVertexAttribArray(shaderProgram.aTexCoordLocation);
gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
gl.vertexAttribPointer(shaderProgram.aTexCoordLocation, 2, gl.FLOAT, false, 0, 0);

gl.enableVertexAttribArray(shaderProgram.normalMatrix);
gl.bindBuffer(gl.ARRAY_BUFFER, normal);
gl.vertexAttribPointer(shaderProgram.normalMatrix, 3, gl.FLOAT, false, 0, 0);
gl.uniform1f(shaderProgram.fog, fog);
gl.drawElements(vert.mode, vert.count, vert.type, 0);
if(obj==0){
gl.useProgram(shaderProgram_obj);
render(objData);
}
}
var identity=new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
function animate_terrain(milliseconds) {
    let X_axis=0;
    let Y_axis=0;
    let Z_axis=0;
    let angle_change = glMatrix.quat.create();
    if(ground==0){
      camSpeed=0.1;
    if(keysBeingPressed['w']){
        let forwardDirection = currentDir();
        let changePosition = glMatrix.vec3.create();
        glMatrix.vec3.scale(changePosition, forwardDirection, camSpeed);
        glMatrix.vec3.add(camPosition,camPosition,changePosition);
    }
    if(keysBeingPressed['s']){
        let backwardDirection = currentDir();
        let changePosition = glMatrix.vec3.create();
        glMatrix.vec3.scale(changePosition, backwardDirection, camSpeed);
        glMatrix.vec3.sub(camPosition,camPosition,changePosition);
    }
    if (keysBeingPressed["a"]) {
      Z_axis += 0.01;
      glMatrix.quat.setAxisAngle(angle_change, [0, 0, 1], Z_axis);
      glMatrix.quat.multiply(camAngle, camAngle, angle_change);
    }
    if (keysBeingPressed["d"]) {
      Z_axis -= 0.01;
      glMatrix.quat.setAxisAngle(angle_change, [0, 0, 1], Z_axis);
      glMatrix.quat.multiply(camAngle, camAngle, angle_change);
    }
    if (keysBeingPressed["ArrowUp"]) {
      X_axis += 0.01;
      glMatrix.quat.setAxisAngle(angle_change, [1, 0, 0], X_axis);
      glMatrix.quat.multiply(camAngle, camAngle, angle_change);
    }
    if (keysBeingPressed["ArrowDown"]) {
      X_axis -= 0.01;
      glMatrix.quat.setAxisAngle(angle_change, [1, 0, 0], X_axis);
      glMatrix.quat.multiply(camAngle, camAngle, angle_change);
    }
    if (keysBeingPressed["ArrowLeft"]) {
        Y_axis -= 0.01;
        glMatrix.quat.setAxisAngle(angle_change, [0, 1, 0], Y_axis);
        glMatrix.quat.multiply(camAngle, camAngle, angle_change);
      }
    if (keysBeingPressed["ArrowRight"]) {
        Y_axis += 0.01;
        glMatrix.quat.setAxisAngle(angle_change, [0, 1, 0], Y_axis);
        glMatrix.quat.multiply(camAngle, camAngle, angle_change);
    }
  }
    if(ground==1){
      camSpeed=0.01
      try{
      terrainHeight=getHeightAtCoordinate(camPosition[0],camPosition[1],vertices);
      }catch(error){
        goToEdgeOfTerrain();
      }
      var cameraHeight = terrainHeight + 1.3; // Adjust the camera height as needed
      camPosition[2]=cameraHeight;
      if(keysBeingPressed['w']){
          let forwardDirection = currentDir();
          let changePosition = glMatrix.vec3.create();
          glMatrix.vec3.scale(changePosition, forwardDirection, camSpeed);
          glMatrix.vec3.add(camPosition,camPosition,changePosition);
      }
      if(keysBeingPressed['s']){
          let backwardDirection = currentDir();
          let changePosition = glMatrix.vec3.create();
          glMatrix.vec3.scale(changePosition, backwardDirection, camSpeed);
          glMatrix.vec3.sub(camPosition,camPosition,changePosition);
      }
      if (keysBeingPressed["a"]) {
        Z_axis += 0.01;
        glMatrix.quat.setAxisAngle(angle_change, [0, 0, 1], Z_axis);
        glMatrix.quat.multiply(camAngle, camAngle, angle_change);
      }
      if (keysBeingPressed["d"]) {
        Z_axis -= 0.01;
        glMatrix.quat.setAxisAngle(angle_change, [0, 0, 1], Z_axis);
        glMatrix.quat.multiply(camAngle, camAngle, angle_change);
      }
      if (!isWithinTerrainBounds(camPosition)) {
        goToEdgeOfTerrain();
      }
    }
    draw_terrain(milliseconds);
    requestAnimationFrame(animate_terrain);
  }
async function startup(){
    document.addEventListener('keydown', handleKeyDown, false);
    document.addEventListener('keyup', handleKeyUp, false);
    canvas = document.querySelector("canvas");
    gl = createGLContext(canvas);
    url_obj = window.location.hash.substring(1) || 'example.obj';
    objData = await loadObj(url_obj);
    setupShaders_obj();
    setupShaders();
    gl.enable(gl.DEPTH_TEST)
    Normalize_vertices(vertices)
    var textureCoordinates = calculateTextureCoordinates(vertices);
    vertices.attributes.texture = textureCoordinates;
    window.vert = initialize_geom(vertices)
    blankscreen()
    vertices = fill_terrain(width, resolution, fractures)
    window.vert = initialize_geom(vertices)
    blankscreen();
    let img = new Image();
img.crossOrigin = 'anonymous';
url='Map.jpg';
img.src = url;
img.addEventListener('load', (event) => {
  let texture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0 + slot);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texImage2D(gl.TEXTURE_2D,
    0, 
    gl.RGBA, 
    gl.RGBA, 
    gl.UNSIGNED_BYTE, 
    img,
);
gl.generateMipmap(gl.TEXTURE_2D) ;
})
    animate_terrain();
}
function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
}

var keysBeingPressed = {
    'w': false,
    'a': false,
    's': false,
    'd': false,
    'ArrowLeft':false,
    'ArrowRight':false,
    'ArrowUp':false,
    'ArrowDown':false,
    'f':false,
    'g':false
  };
  
  function handleKeyDown(event) {
    if (event.key === 'w' || event.key === 'a' || event.key === 's' || event.key === 'd'||event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      keysBeingPressed[event.key] = true;
      event.preventDefault();
    }
  }
  
  function handleKeyUp(event) {
    if (event.key === 'w' || event.key === 'a' || event.key === 's' || event.key === 'd'||event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'ArrowUp' || event.key === 'ArrowDown')  {
      keysBeingPressed[event.key] = false;
      event.preventDefault();
    }
  }
  function currentDir() {
    let currentViewDir = glMatrix.vec3.create();
    glMatrix.vec3.transformQuat(currentViewDir, camDir, camAngle)
    glMatrix.vec3.normalize(currentViewDir, currentViewDir);
    return currentViewDir;
  }

  function currentUp() {
    let up = glMatrix.vec3.fromValues(0.0, 1.0, 0.0);
    glMatrix.vec3.transformQuat(up, up, camAngle);
    return up;
  }
  function normalizePosition(position, min, max) {
    return (position - min) / (max - min);
  }
  console
  
  function calculateTextureCoordinates(vertices) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    vertices.attributes.position.forEach(([x, y]) => {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    });
    let textureCoordinates = vertices.attributes.position.map(([x, y]) => {
      let u = normalizePosition(x, minX, maxX);
      let v = normalizePosition(y, minY, maxY);
      return [u, v];
    });
  
    return textureCoordinates;
  }
  document.addEventListener('keydown', function(event) {
    if (event.key === 'f') {
      fog = 1 - fog;
    }
  });
  document.addEventListener('keydown', function(event) {
    if (event.key === 'g') {
      ground = 1 - ground; 
      if(ground==1){
        goToEdgeOfTerrain();
        console.log('Ground');
      }
    }
  });
//Obj Object Rendering
async function loadObj(url) {
  try {
    const response = await fetch(url);
    const objData = await response.text();
    return parseOBJ(objData);
  } catch (error) {
    console.error('Error loading OBJ:', error);
    obj=1;
    return null;
  }
}

function parseOBJ(text) {
  const lines = text.split('\n');

  const vertices = [];
  const resultVertices = [];

  lines.forEach(line => {
    const tokens = line.split(/\s+/);
    const tag = tokens[0];

    if (tag === 'v') {
      // Vertex data (assuming three components x, y, z)
      const x = parseFloat(tokens[1]);
      const y = parseFloat(tokens[2]);
      const z = parseFloat(tokens[3]);
      vertices.push(x, y, z);
    } else if (tag === 'f') {
      // Face data (assuming triangles)
      for (let i = 1; i <= 3; i++) {
        const vertexIndex = parseInt(tokens[i]) - 1;
        const vertex = vertices.slice(vertexIndex * 3, vertexIndex * 3 + 3);
        resultVertices.push(...vertex);
      }
    }
  });
  return {
    vertices: resultVertices
  };
}
function setupShaders_obj(){
  vertexShader_obj=loadShaderFromDOM('shader-vs_obj');
  fragmentShader_obj=loadShaderFromDOM('shader-fs_obj');
  shaderProgram_obj = gl.createProgram();
  gl.attachShader(shaderProgram_obj,vertexShader_obj);
  gl.attachShader(shaderProgram_obj,fragmentShader_obj);
  gl.linkProgram(shaderProgram_obj);
  if (!gl.getProgramParameter(shaderProgram_obj, gl.LINK_STATUS)) {
    alert("Failed to setup shaders");
  }
  gl.useProgram(shaderProgram_obj);
}
function setupBuffers_obj(objData) {
  // Set up vertex, normal, and texture coordinate buffers
  const vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(objData.vertices), gl.STATIC_DRAW);

  const normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(objData.normals), gl.STATIC_DRAW);

  const textureCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(objData.textureCoords), gl.STATIC_DRAW);

  return {
    vertex: vertexBuffer,
    normal: normalBuffer,
    textureCoord: textureCoordBuffer,
  };
}
function render(objData) {
  const translationMatrix = glMatrix.mat4.create();
  glMatrix.mat4.translate(translationMatrix, translationMatrix, [0,0,2]);
  const modelViewMatrixCopy = glMatrix.mat4.clone(modelViewMatrix);
  glMatrix.mat4.multiply(modelViewMatrixCopy, modelViewMatrixCopy, translationMatrix);
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  //gl.enable(gl.DEPTH_TEST);
  //gl.depthFunc(gl.LEQUAL);
  //gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  // Set up attribute pointers
  const buffers = setupBuffers_obj(objData);
  gl.useProgram(shaderProgram_obj);
  const uModelViewMatrix = gl.getUniformLocation(shaderProgram_obj, 'uModelViewMatrix');
  const uProjectionMatrix = gl.getUniformLocation(shaderProgram_obj, 'projectionMatrix');
  //const uNormalMatrix = gl.getUniformLocation(shaderProgram_obj, 'uNormalMatrix');
  gl.uniformMatrix4fv(uModelViewMatrix, false, modelViewMatrixCopy);
  gl.uniformMatrix4fv(uProjectionMatrix, false, projectionMatrix);
  //gl.uniformMatrix4fv(uNormalMatrix, false, normalMatrix);

  const aVertexPosition = gl.getAttribLocation(shaderProgram_obj, 'aVertexPosition');
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertex);
  gl.vertexAttribPointer(aVertexPosition, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(aVertexPosition);

  const aVertexNormal = gl.getAttribLocation(shaderProgram_obj, 'aVertexNormal');
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
  gl.vertexAttribPointer(aVertexNormal, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(aVertexNormal);
  gl.drawArrays(gl.TRIANGLES, 0, objData.vertices.length/3);
}
function findCornerHeight(terrain, corner) {
  const gridSize = Math.sqrt(terrain.attributes.position.length);
  let index;

  switch (corner) {
      case 'topLeft':
          index = 0;
          break;
      case 'topRight':
          index = gridSize - 1;
          break;
      case 'bottomLeft':
          index = (gridSize - 1) * gridSize;
          break;
      case 'bottomRight':
          index = terrain.attributes.position.length - 1;
          break;
      default:
          throw new Error('Invalid corner specified.');
  }

  return terrain.attributes.position[index][2];
}



function goToEdgeOfTerrain() {
  // Move the camera to the top edge of the terrain
  const terrainHeight = findCornerHeight(vertices,'topLeft'); // Replace with the actual height of your terrain
  const cameraHeight = terrainHeight + 1.3; // Adjust the camera height as needed
  glMatrix.vec3.set(camPosition, 0.0, -2.0, cameraHeight);
}

function getHeightAtCoordinate(x, y, terrain) {
  const gridSize = Math.sqrt(terrain.attributes.position.length);
  const gridWidth = width;
  const pointSpacing = gridWidth / (gridSize - 1);

  // Calculate the indices of the vertices surrounding the (x, y) coordinate
  const i = Math.abs(Math.floor((x + gridWidth / 2) / pointSpacing));
  const j = Math.abs(Math.floor((y + gridWidth / 2) / pointSpacing));



  // Get the heights of the surrounding vertices
  const h00 = terrain.attributes.position[i + j * gridSize][2];
  const h10 = terrain.attributes.position[(i + 1) + j * gridSize][2];
  const h01 = terrain.attributes.position[i + (j + 1) * gridSize][2];
  const h11 = terrain.attributes.position[(i + 1) + (j + 1) * gridSize][2];

  // Calculate the interpolation factors
  const u = (x + gridWidth / 2) / pointSpacing - i;
  const v = (y + gridWidth / 2) / pointSpacing - j;

  // Perform bilinear interpolation
  const height = h00 * (1 - u) * (1 - v) + h10 * u * (1 - v) + h01 * (1 - u) * v + h11 * u * v;

  return height;
}

function isWithinTerrainBounds(position) {
  const terrainSize = width;
  const halfTerrainSize = terrainSize / 2;

  if (
    position[0] < -halfTerrainSize ||
    position[0] > halfTerrainSize ||
    position[1] < -halfTerrainSize ||
    position[1] > halfTerrainSize
  ) {
    return false;
  }

  return true;
}

