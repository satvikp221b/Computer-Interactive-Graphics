var gl;
var canvas;
var shaderProgram;
var vertexPositionBuffer;
var vertexColorBuffer;
var positionBuffer;
var rotAngle = 0;
var modelvMatrix = glMatrix.mat4.create();
var projectionMatrix = glMatrix.mat4.create();
var pTime = 0;
let ball1 = { x: -0.6, y: -0.4, vx: 0.012, vy: 0.008, color: [1, 0, 0, 1] };
let ball2 = { x: 0.6, y: 0.3, vx: -0.012, vy: -0.008, color: [0, 0, 1, 1] };
var logoPosition = glMatrix.vec3.create();
var logoTarget = glMatrix.vec3.create();
var positionBuffer_Psy;
let x = 0.0;
let legAngle = 0.0;
let legDirection = 1;
let lastFrameTime=performance.now();
const rotationSpeed = glMatrix.glMatrix.toRadian(90.0);

// Illinois Logo (Required Part 1)
function degToRad(degrees) {
    return degrees * Math.PI / 180;
}
//Performs Linear Interpolation
function lerp(a, b, c) {
    return a + c * (b - a);
  }


// Creates a context for WebGL
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
  //Setup the Shaders for Required Part 1 Illinois Logo
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
           
    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor"); 
    shaderProgram.modelViewMatrixUniform = gl.getUniformLocation(shaderProgram, "uMvMatrix"); 
    shaderProgram.projectionMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
  
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
    gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);
  }

  //Get the Vertices for the Illinois Logo
  function Illini_Vertices() {
    vertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);

  var IlliniVertices = [
    -0.55, 0.8, -0.05, 
    -0.55, 0.45, -0.05, 
    -0.3, 0.45, -0.05,
    -0.55, 0.8, -0.05,
    -0.3, 0.45, -0.05,
    0.45, 0.8, -0.05, 
    -0.3, 0.45, -0.05,
    0.45, 0.8, -0.05,
    0.2, 0.45, -0.05,
    0.45, 0.8, -0.05,
    0.2, 0.45, -0.05,
    0.45, 0.45, -0.05,
    -0.3, 0.45, -0.05, 
    0.2, 0.45, -0.05, 
    -0.3, -0.3, -0.05, 
    0.2, 0.45, -0.05, 
    -0.3, -0.3, -0.05, 
    0.2, -0.3, -0.05, 
    -0.3, -0.3, -0.05, 
    -0.55, -0.3, -0.05, 
    -0.55, -0.65, -0.05, 
    -0.3, -0.3, -0.05, 
    0.2, -0.3, -0.05, 
    -0.55, -0.65, -0.05, 
    0.2, -0.3, -0.05, 
    -0.55, -0.65, -0.05, 
    0.45, -0.65, -0.05, 
    0.2, -0.3, -0.05, 
    0.45, -0.65, -0.05, 
    0.45, -0.3, -0.05];
    
    var IlliniVertices2 = [
        -0.55, 0.8, -0.05, 
        -0.55, 0.45, -0.05, 
        -0.3, 0.45, -0.05,
        -0.55, 0.8, -0.05,
        -0.3, 0.45, -0.05,
        0.45, 0.8, -0.05, 
        -0.3, 0.45, -0.05,
        0.45, 0.8, -0.05,
        0.2, 0.45, -0.05,
        0.45, 0.8, -0.05,
        0.2, 0.45, -0.05,
        0.45, 0.45, -0.05,
        -0.3, 0.45, -0.05, 
        0.2, 0.45, -0.05, 
        -0.3, -0.3, -0.05, 
        0.2, 0.45, -0.05, 
        -0.3, -0.3, -0.05, 
        0.2, -0.3, -0.05, 
        -0.3, -0.3, -0.05, 
        -0.55, -0.3, -0.05, 
        -0.55, -0.65, -0.05, 
        -0.3, -0.3, -0.05, 
        0.2, -0.3, -0.05, 
        -0.55, -0.65, -0.05, 
        0.2, -0.3, -0.05, 
        -0.55, -0.65, -0.05, 
        0.45, -0.65, -0.05, 
        0.2, -0.3, -0.05, 
        0.45, -0.65, -0.05, 
        0.45, -0.3, -0.05];

    var time = Math.abs(Math.sin(degToRad(7*rotAngle)));
    for (var i = 0; i < IlliniVertices.length; i++) {
    IlliniVertices[i] = lerp(IlliniVertices2[i], IlliniVertices[i], time);
    }

    
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(IlliniVertices), gl.DYNAMIC_DRAW);
  vertexPositionBuffer.itemSize = 3;
  vertexPositionBuffer.numberOfItems = 30;
}

//Fill Color for the Illini Logo
function Illini_Colors() {
    vertexColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
  var colors = [
        1, 0.373, 0.02, 1.0,
        1, 0.373, 0.02, 1.0,
        1, 0.373, 0.02, 1.0,

        1, 0.373, 0.02, 1.0,
        1, 0.373, 0.02, 1.0,
        1, 0.373, 0.02, 1.0,

        1, 0.373, 0.02, 1.0,
        1, 0.373, 0.02, 1.0,
        1, 0.373, 0.02, 1.0,

        1, 0.373, 0.02, 1.0,
        1, 0.373, 0.02, 1.0,
        1, 0.373, 0.02, 1.0,

        1, 0.373, 0.02, 1.0,
        1, 0.373, 0.02, 1.0,
        1, 0.373, 0.02, 1.0,

        1, 0.373, 0.02, 1.0,
        1, 0.373, 0.02, 1.0,
        1, 0.373, 0.02, 1.0,

        1, 0.373, 0.02, 1.0,
        1, 0.373, 0.02, 1.0,
        1, 0.373, 0.02, 1.0,

        1, 0.373, 0.02, 1.0,
        1, 0.373, 0.02, 1.0,
        1, 0.373, 0.02, 1.0,

        1, 0.373, 0.02, 1.0,
        1, 0.373, 0.02, 1.0,
        1, 0.373, 0.02, 1.0,

        1, 0.373, 0.02, 1.0,
        1, 0.373, 0.02, 1.0,
        1, 0.373, 0.02, 1.0,
    ];
    
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
  vertexColorBuffer.itemSize = 4;
  vertexColorBuffer.numItems = 105;  
}
//Setup the Buffers for Illini Logo
function setupBuffers() {   
    Illini_Vertices();
    Illini_Colors();
  }

//Initialize the modelview and projection matrices
function setupUniforms(){
    glMatrix.mat4.ortho(projectionMatrix,-1,1,-1,1,-1,1);
    gl.uniformMatrix4fv(shaderProgram.projectionMatrixUniform, false, projectionMatrix); 
    glMatrix.mat4.identity(modelvMatrix);
    gl.uniformMatrix4fv(shaderProgram.modelViewMatrixUniform, false, modelvMatrix); 
}

function draw_illini() { 
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight); 
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, vertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.uniformMatrix4fv(shaderProgram.modelViewMatrixUniform, false, modelvMatrix);
      
    // Draw the Logo
    gl.drawArrays(gl.TRIANGLES, 0, vertexPositionBuffer.numberOfItems);
  }

  function animate_illini(s) {

    draw_illini();
    s *= 0.001;
    var TimeDiff = s - pTime;
    pTime = s;
    
    rotAngle += 50*TimeDiff;
    if (rotAngle > 45)
        rotAngle = -45;
    
    
    glMatrix.mat4.identity(modelvMatrix);
    glMatrix.mat4.fromYRotation(modelvMatrix, degToRad(rotAngle));
    glMatrix.mat4.scale(modelvMatrix, modelvMatrix, [rotAngle/40,0.5,0.5]);
    glMatrix.mat4.translate(modelvMatrix, modelvMatrix, [0,rotAngle/50,0]);
    
    Illini_Vertices();
    window.pending=requestAnimationFrame(animate_illini);
  }


//Psychedellic Logo
function setupShaders_psy() {
    vertexShader_psy = loadShaderFromDOM("shader-vs_psy");
    fragmentShader_psy = loadShaderFromDOM("shader-fs_psy");
    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader_psy);
    gl.attachShader(shaderProgram, fragmentShader_psy);
    gl.linkProgram(shaderProgram);
  
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      alert("Failed to setup shaders");
    }
  
    gl.useProgram(shaderProgram);     
    shaderProgram.vertexPositionAttribute_psy = gl.getAttribLocation(shaderProgram, "aVertexPosition_psy");
    shaderProgram.timeUniformLocation_psy = gl.getUniformLocation(shaderProgram, "time_psy");      
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute_psy);
  }
  //Make the logo entire canvas big
  function loadVertices_psy(){
    positionBuffer_Psy = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer_Psy);

    const positions = [
        -1, -1,
         1, -1,
        -1,  1,
         1,  1,
    ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
}
//Animate the Psychedellic Logo
function animate_psyc(s){
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute_psy);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer_Psy);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute_psy, 2, gl.FLOAT, false, 0, 0);
    gl.uniform1f(shaderProgram.timeUniformLocation_psy, performance.now() / 1000);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    s *= 0.001;
    var TimeDiff = s - pTime;
    pTime = s;
   window.pending=requestAnimationFrame(animate_psyc);
}

//Collision Logo

//Setup the shader for the Collision Animation
function setupShaders_collision() {
    vertexShader_coll = loadShaderFromDOM("shader-vs_coll");
    fragmentShader_coll = loadShaderFromDOM("shader-fs_coll");
    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader_coll);
    gl.attachShader(shaderProgram, fragmentShader_coll);
    gl.linkProgram(shaderProgram);
  
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      alert("Failed to setup shaders");
    }
  
    gl.useProgram(shaderProgram);

    shaderProgram.vertexPositionAttribute_coll = gl.getAttribLocation(shaderProgram, "aVertexPosition_coll");
    shaderProgram.colorUniformLocation = gl.getUniformLocation(shaderProgram, 'vColor_coll');

    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute_coll);

  }
  
 
  //Initial Buffers Setup
  function col_buf(){
    positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -0.05, -0.05,
        0.05, -0.05,
        -0.05, 0.05,
        0.05, 0.05
    ]), gl.STATIC_DRAW);
  }
  //Draw the ball for each Frame
 function drawBall(x,y,color){
    gl.uniform4fv(shaderProgram.colorUniformLocation, color);
    const positionData = new Float32Array([
        x - 0.05, y - 0.05,
        x + 0.05, y - 0.05,
        x - 0.05, y + 0.05,
        x + 0.05, y + 0.05
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, positionData, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute_coll);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute_coll, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
 }

 //Detec if colliison took place or not
 function detectCollision() {
    //Calculate the distance between the balls
    const dx = ball1.x - ball2.x;
    const dy = ball1.y - ball2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < 0.1;
}

//Update the Posiiton of the ball for each frame depending on whether collision took place or not.
function updatePositions() {
    ball1.x += ball1.vx;
    ball1.y += ball1.vy;
    ball2.x += ball2.vx;
    ball2.y += ball2.vy;

    if (ball1.x < -1 || ball1.x > 1) ball1.vx = -ball1.vx;
    if (ball1.y < -1 || ball1.y > 1) ball1.vy = -ball1.vy;
    if (ball2.x < -1 || ball2.x > 1) ball2.vx = -ball2.vx;
    if (ball2.y < -1 || ball2.y > 1) ball2.vy = -ball2.vy;

    if (detectCollision()) {
        //Get the Collision Angle
        const collisionAngle = Math.atan2(ball2.y - ball1.y, ball2.x - ball1.x);
        const tempVx1 = ball1.vx * Math.cos(collisionAngle) - ball1.vy * Math.sin(collisionAngle);
        const tempVy1 = ball1.vx * Math.sin(collisionAngle) + ball1.vy * Math.cos(collisionAngle);
        const tempVx2 = ball2.vx * Math.cos(collisionAngle) - ball2.vy * Math.sin(collisionAngle);
        const tempVy2 = ball2.vx * Math.sin(collisionAngle) + ball2.vy * Math.cos(collisionAngle);

        const finalVx1 = tempVx2;
        const finalVx2 = tempVx1;
        const finalVy1 = tempVy1;
        const finalVy2 = tempVy2;
        //Calculate Final Ball Direction After Collision
        ball1.vx = Math.cos(collisionAngle) * finalVx1 - Math.sin(collisionAngle) * finalVy1;
        ball1.vy = Math.sin(collisionAngle) * finalVx1 + Math.cos(collisionAngle) * finalVy1;
        ball2.vx = Math.cos(collisionAngle) * finalVx2 - Math.sin(collisionAngle) * finalVy2;
        ball2.vy = Math.sin(collisionAngle) * finalVx2 + Math.cos(collisionAngle) * finalVy2;
}
}
//Animate the Collision Animation
function collision_animate() {

    updatePositions();

    drawBall(ball1.x, ball1.y, ball1.color);
    drawBall(ball2.x, ball2.y, ball2.color);
    window.pending=requestAnimationFrame(collision_animate);
}


//Mouse Movement Logo
//Setup the shaders for Logo Moving Using Mouse Animation
function setupShaders_mouse(){
    vertexShader_mouse = loadShaderFromDOM("shader-vs_mouse");
    fragmentShader_mouse = loadShaderFromDOM("shader-fs_mouse");
    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader_mouse);
    gl.attachShader(shaderProgram, fragmentShader_mouse);
    gl.linkProgram(shaderProgram);
  
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      alert("Failed to setup shaders");
    }
  
    gl.useProgram(shaderProgram);
      
// Set up the vertex position attribute
shaderProgram.vertexPositionAttribute_mouse = gl.getAttribLocation(shaderProgram, "aVertexPosition_mouse");
shaderProgram.vertexColorAttribute_mouse = gl.getAttribLocation(shaderProgram, "aVertexColor_mouse");
shaderProgram.projectionMatrixUniform_mouse = gl.getUniformLocation(shaderProgram, "uProjectionMatrix_mouse");
shaderProgram.modelViewMatrixUniform_mouse = gl.getUniformLocation(shaderProgram, "uModelViewMatrix_mouse");
}


//Draw the Illini Logo
function logo_mouse(){
    var Illini_Vertices = [
        -0.55, 0.8, -0.05, 
        -0.55, 0.45, -0.05, 
        -0.3, 0.45, -0.05,
        -0.55, 0.8, -0.05,
        -0.3, 0.45, -0.05,
        0.45, 0.8, -0.05, 
        -0.3, 0.45, -0.05,
        0.45, 0.8, -0.05,
        0.2, 0.45, -0.05,
        0.45, 0.8, -0.05,
        0.2, 0.45, -0.05,
        0.45, 0.45, -0.05,
        -0.3, 0.45, -0.05, 
        0.2, 0.45, -0.05, 
        -0.3, -0.3, -0.05, 
        0.2, 0.45, -0.05, 
        -0.3, -0.3, -0.05, 
        0.2, -0.3, -0.05, 
        -0.3, -0.3, -0.05, 
        -0.55, -0.3, -0.05, 
        -0.55, -0.65, -0.05, 
        -0.3, -0.3, -0.05, 
        0.2, -0.3, -0.05, 
        -0.55, -0.65, -0.05, 
        0.2, -0.3, -0.05, 
        -0.55, -0.65, -0.05, 
        0.45, -0.65, -0.05, 
        0.2, -0.3, -0.05, 
        0.45, -0.65, -0.05, 
        0.45, -0.3, -0.05];

    var colors = [
            1, 0.373, 0.02, 1.0,
            1, 0.373, 0.02, 1.0,
            1, 0.373, 0.02, 1.0,
            1, 0.373, 0.02, 1.0,
            1, 0.373, 0.02, 1.0,
            1, 0.373, 0.02, 1.0,
            1, 0.373, 0.02, 1.0,
            1, 0.373, 0.02, 1.0,
            1, 0.373, 0.02, 1.0,
            1, 0.373, 0.02, 1.0,
            1, 0.373, 0.02, 1.0,
            1, 0.373, 0.02, 1.0,
            1, 0.373, 0.02, 1.0,
            1, 0.373, 0.02, 1.0,
            1, 0.373, 0.02, 1.0,
            1, 0.373, 0.02, 1.0,
            1, 0.373, 0.02, 1.0,
            1, 0.373, 0.02, 1.0,
            1, 0.373, 0.02, 1.0,
            1, 0.373, 0.02, 1.0,
            1, 0.373, 0.02, 1.0,
            1, 0.373, 0.02, 1.0,
            1, 0.373, 0.02, 1.0,
            1, 0.373, 0.02, 1.0,
            1, 0.373, 0.02, 1.0,
            1, 0.373, 0.02, 1.0,
            1, 0.373, 0.02, 1.0,
            1, 0.373, 0.02, 1.0,
            1, 0.373, 0.02, 1.0,
            1, 0.373, 0.02, 1.0,
        ];
    
    var vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(Illini_Vertices), gl.STATIC_DRAW);
    
    var colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute_mouse);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute_mouse, 3, gl.FLOAT, false, 0, 0);


    gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute_mouse);
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute_mouse, 4, gl.FLOAT, false, 0, 0);

    // Set up the projection matrix
    shaderProgram.projectionMatrix_mouse = glMatrix.mat4.create();
    glMatrix.mat4.ortho(shaderProgram.projectionMatrix_mouse, -1, 1, -1, 1, -1, 1);
    gl.uniformMatrix4fv(shaderProgram.projectionMatrixUniform_mouse, false, shaderProgram.projectionMatrix_mouse);

    // Set up the model-view matrix
    shaderProgram.modelViewMatrix_mouse = glMatrix.mat4.create();
    gl.uniformMatrix4fv(shaderProgram.modelViewMatrixUniform_mouse, false, shaderProgram.modelViewMatrix_mouse);
}

//Animate the Mouse Movement Logo
function animate_mouse() {
    // Calculate the difference between the current position and the target position
    var difference = glMatrix.vec3.create();
    glMatrix.vec3.sub(difference, logoTarget, logoPosition);
    // Move the logo gradually towards the target position
    var speed = 0.05;
    glMatrix.vec3.scaleAndAdd(logoPosition, logoPosition, difference, speed);
    
    // Check if the logo is going out of bounds
    var canvasWidth = canvas.clientWidth;
    var canvasHeight = canvas.clientHeight;
    var aspectRatio = canvasWidth / canvasHeight;
    var logoWidth = 1;
    var logoHeight = 1.25; 
    var leftBound = -logoWidth/2
    var rightBound = logoWidth/2
    var topBound = logoHeight / 2;
    var bottomBound = -logoHeight / 2;
    if (logoPosition[0] < leftBound) {
        logoPosition[0] = leftBound;
        logoTarget[0] = leftBound;
    }
    if (logoPosition[0] > rightBound) {
        logoPosition[0] = rightBound;
        logoTarget[0] = rightBound;
    }
    if (logoPosition[1] < bottomBound) {
        logoPosition[1] = bottomBound;
        logoTarget[1] = bottomBound;
    }
    if (logoPosition[1] > topBound) {
        logoPosition[1] = topBound;
        logoTarget[1] = topBound;
    }
    
    // Update the model-view matrix with the new position
    glMatrix.mat4.identity(shaderProgram.modelViewMatrix_mouse);
    glMatrix.mat4.translate(shaderProgram.modelViewMatrix_mouse, shaderProgram.modelViewMatrix_mouse, logoPosition);
    gl.uniformMatrix4fv(shaderProgram.modelViewMatrixUniform_mouse, false, shaderProgram.modelViewMatrix_mouse);
    
    // Define the scaling factor for the logo to make the logo smaller
    var scaleFactor = 0.5; 
    var scaleMatrix = glMatrix.mat4.create();
    glMatrix.mat4.scale(scaleMatrix, scaleMatrix, [scaleFactor, scaleFactor, scaleFactor]);
    glMatrix.mat4.identity(shaderProgram.modelViewMatrix_mouse);
    glMatrix.mat4.translate(shaderProgram.modelViewMatrix_mouse, shaderProgram.modelViewMatrix_mouse, logoPosition);
    glMatrix.mat4.multiply(shaderProgram.modelViewMatrix_mouse, shaderProgram.modelViewMatrix_mouse, scaleMatrix); // Multiply by the scaling matrix
    gl.uniformMatrix4fv(shaderProgram.modelViewMatrixUniform_mouse, false, shaderProgram.modelViewMatrix_mouse);

    // Draw the Illini logo
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 30);
    
    
    // Animate it
    window.pending=requestAnimationFrame(animate_mouse);
    }

//Stickman

//Setup the shader for Stickman Walking Animation
function setupShaders_stickman(){
    vertexShader_stickman = loadShaderFromDOM("shader-vs_stickman");
    fragmentShader_stickman = loadShaderFromDOM("shader-fs_stickman");
    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader_stickman);
    gl.attachShader(shaderProgram, fragmentShader_stickman);
    gl.linkProgram(shaderProgram);
  
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      alert("Failed to setup shaders");
    }
  
    gl.useProgram(shaderProgram);
    shaderProgram.vertexPositionAttribute_stickman = gl.getAttribLocation(shaderProgram, "aVertexPosition_stick");
    shaderProgram.projectionMatrixUniform_stickman = gl.getUniformLocation(shaderProgram, "uProjectionMatrix_stick");
    shaderProgram.modelViewMatrixUniform_stickman = gl.getUniformLocation(shaderProgram, "uModelViewMatrix_stick");
}
function stickman_draw(){
    const vertices = [
        // Body
        -0.05, 0.5,
        0.05, 0.5,
        0.05, 0.5,
        0.05, 0.1,
        0.05, 0.1,
        -0.05, 0.1,
        -0.05, 0.1,
        -0.05, 0.5,

        // Arms
        -0.05, 0.5,
        -0.1, 0.1,
        0.05, 0.5,
        0.1, 0.1,
        // Legs
        0.0, 0.1,
        -0.025, -0.2,
        0.0, 0.1,
        0.025, -0.2,
    ];
        // Define the center of the head
        const center = [0.0, 0.62];

        //We need different x-y radius, other the head looks like an ellipse if we keep a constant radius due to the canvas aspect ratio
        // Define the horizontal radius of the head
        const xRadius = 0.0625;

        // Define the vertical radius of the head
        const yRadius = 0.125;

        // Define the number of points around the head
        const numPoints = 32;

        // Define the vertices of the head
        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * 2.0 * Math.PI;
            const x = center[0] + xRadius * Math.cos(angle);
            const y = center[1] + yRadius * Math.sin(angle);
            vertices.push(x, y);
}
    //Vertices of the ground
    vertices.push(-1,-0.2,1,-0.2);
    for (let i=1;i<vertices.length;i=i+2){
        vertices[i]=vertices[i]-0.2
    }
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute_stickman);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute_stickman, 2, gl.FLOAT, false, 0, 0);
}
// Set the initial position and leg angle of the stickman

function animate_stickman(){
        // Clear the canvas
        gl.clearColor(1.0, 1.0, 1.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
    
        // Set the projection matrix
        const projectionMatrix = glMatrix.mat4.create();
        glMatrix.mat4.ortho(projectionMatrix, -1.0, 1.0, -1.0, 1.0, -1.0, 1.0);
        gl.uniformMatrix4fv(shaderProgram.projectionMatrixUniform_stickman, false, projectionMatrix);
    
        // Set the model-view matrix for the body
        const modelViewMatrix = glMatrix.mat4.create();
        glMatrix.mat4.translate(modelViewMatrix, modelViewMatrix, [x, 0.0, 0.0]);
        gl.uniformMatrix4fv(shaderProgram.modelViewMatrixUniform_stickman, false, modelViewMatrix);
    
        // Draw the body
        gl.drawArrays(gl.LINES, 0, 8);
    
        // Set the model-view matrix for the left leg
        const leftLegModelViewMatrix = glMatrix.mat4.create();
        glMatrix.mat4.translate(leftLegModelViewMatrix, modelViewMatrix, [0.0, 0.0, 0.0]);
        glMatrix.mat4.rotateZ(leftLegModelViewMatrix, leftLegModelViewMatrix, legAngle);
        gl.uniformMatrix4fv(shaderProgram.modelViewMatrixUniform_stickman, false, leftLegModelViewMatrix);
    
        // Draw the left leg
        gl.drawArrays(gl.LINES, 12, 2);
    
        // Set the model-view matrix for the right leg
        const rightLegModelViewMatrix = glMatrix.mat4.create();
        glMatrix.mat4.translate(rightLegModelViewMatrix, modelViewMatrix, [0.0, 0.0, 0.0]);
        glMatrix.mat4.rotateZ(rightLegModelViewMatrix, rightLegModelViewMatrix, -legAngle);
        gl.uniformMatrix4fv(shaderProgram.modelViewMatrixUniform_stickman, false, rightLegModelViewMatrix);
    
        // Draw the right leg
        gl.drawArrays(gl.LINES, 14, 2);
    
        // Set the model-view matrix for the left arm
        const leftArmModelViewMatrix = glMatrix.mat4.create();
        glMatrix.mat4.translate(leftArmModelViewMatrix, modelViewMatrix, [0.0, 0.0, 0.0]);
        gl.uniformMatrix4fv(shaderProgram.modelViewMatrixUniform_stickman, false, leftArmModelViewMatrix);
    
        // Draw the left arm
        gl.drawArrays(gl.LINES, 8, 2);
    
        // Set the model-view matrix for the right arm
        const rightArmModelViewMatrix = glMatrix.mat4.create();
        glMatrix.mat4.translate(rightArmModelViewMatrix, modelViewMatrix, [0.00, 0.0, 0.0]);
        gl.uniformMatrix4fv(shaderProgram.modelViewMatrixUniform_stickman, false, rightArmModelViewMatrix);
    
        // Draw the right arm
        gl.drawArrays(gl.LINES, 10, 2);

        //Set the model-view Matrix for the head
        const headModelViewMatrix=glMatrix.mat4.create();
        glMatrix.mat4.translate(headModelViewMatrix,modelViewMatrix,[0.0,0.0,0.0]);
        gl.uniformMatrix4fv(shaderProgram.modelViewMatrixUniform_stickman,false,headModelViewMatrix);

        //Draw the head
        gl.drawArrays(gl.LINE_LOOP,16,32);

        //Set the model-view Matrix for the ground
        const lineModelViewMatrix = glMatrix.mat4.create();
        glMatrix.mat4.translate(lineModelViewMatrix, lineModelViewMatrix, [0, 0.0, 0.0]);
        gl.uniformMatrix4fv(shaderProgram.modelViewMatrixUniform_stickman, false, lineModelViewMatrix);

        //Draw the ground
        gl.drawArrays(gl.LINES,48,2);
    
        // Update the position and leg angle of the stickman
        x += 0.005;
        if (x > 1.0) {
            x = -1.0;
        }
        legAngle += 0.05 * legDirection;
        if (legAngle > 0.5 || legAngle < -0.5) {
            legDirection = -legDirection;
        }
    window.pending=requestAnimationFrame(animate_stickman);
}
function setupShaders_gpu(){
    vertexShader_gpu = loadShaderFromDOM("shader-vs_gpu");
    fragmentShader_gpu = loadShaderFromDOM("shader-fs_gpu");
    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader_gpu);
    gl.attachShader(shaderProgram, fragmentShader_gpu);
    gl.linkProgram(shaderProgram);
  
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      alert("Failed to setup shaders");
    }
  
    gl.useProgram(shaderProgram);
      
    // Get the positions of the atytributes and uniforms in the shader program     
    shaderProgram.vertexPositionAttribute_gpu = gl.getAttribLocation(shaderProgram, "aVertexPosition_gpu");
    shaderProgram.vertexColorAttribute_gpu = gl.getAttribLocation(shaderProgram, "aVertexColor_gpu"); 
    shaderProgram.projectionMatrixUniform_gpu = gl.getUniformLocation(shaderProgram, "uProjectionMatrix_gpu");
    shaderProgram.modelViewMatrixUniform_gpu = gl.getUniformLocation(shaderProgram, "uModelViewMatrix_gpu");
    shaderProgram.uTime_gpu=gl.getUniformLocation(shaderProgram,'uTime_gpu');
}
function draw_logo_gpu(){
    var Illini_Vertices = [
        -0.55, 0.8, -0.05, 
        -0.55, 0.45, -0.05, 
        -0.3, 0.45, -0.05,
        -0.55, 0.8, -0.05,
        -0.3, 0.45, -0.05,
        0.45, 0.8, -0.05, 
        -0.3, 0.45, -0.05,
        0.45, 0.8, -0.05,
        0.2, 0.45, -0.05,
        0.45, 0.8, -0.05,
        0.2, 0.45, -0.05,
        0.45, 0.45, -0.05,
        -0.3, 0.45, -0.05, 
        0.2, 0.45, -0.05, 
        -0.3, -0.3, -0.05, 
        0.2, 0.45, -0.05, 
        -0.3, -0.3, -0.05, 
        0.2, -0.3, -0.05, 
        -0.3, -0.3, -0.05, 
        -0.55, -0.3, -0.05, 
        -0.55, -0.65, -0.05, 
        -0.3, -0.3, -0.05, 
        0.2, -0.3, -0.05, 
        -0.55, -0.65, -0.05, 
        0.2, -0.3, -0.05, 
        -0.55, -0.65, -0.05, 
        0.45, -0.65, -0.05, 
        0.2, -0.3, -0.05, 
        0.45, -0.65, -0.05, 
        0.45, -0.3, -0.05];

    var colors = [
            1, 0.373, 0.02, 1.0,
            1, 0.373, 0.02, 1.0,
            1, 0.373, 0.02, 1.0,
    
            1, 0.373, 0.02, 1.0,
            1, 0.373, 0.02, 1.0,
            1, 0.373, 0.02, 1.0,
    
            1, 0.373, 0.02, 1.0,
            1, 0.373, 0.02, 1.0,
            1, 0.373, 0.02, 1.0,
    
            1, 0.373, 0.02, 1.0,
            1, 0.373, 0.02, 1.0,
            1, 0.373, 0.02, 1.0,
    
            1, 0.373, 0.02, 1.0,
            1, 0.373, 0.02, 1.0,
            1, 0.373, 0.02, 1.0,
    
            1, 0.373, 0.02, 1.0,
            1, 0.373, 0.02, 1.0,
            1, 0.373, 0.02, 1.0,
    
            1, 0.373, 0.02, 1.0,
            1, 0.373, 0.02, 1.0,
            1, 0.373, 0.02, 1.0,
    
            1, 0.373, 0.02, 1.0,
            1, 0.373, 0.02, 1.0,
            1, 0.373, 0.02, 1.0,
    
            1, 0.373, 0.02, 1.0,
            1, 0.373, 0.02, 1.0,
            1, 0.373, 0.02, 1.0,
    
            1, 0.373, 0.02, 1.0,
            1, 0.373, 0.02, 1.0,
            1, 0.373, 0.02, 1.0,
        ];

    // Create the vertex buffer and set the data
    shaderProgram.vertexBuffer_gpu = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, shaderProgram.vertexBuffer_gpu);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(Illini_Vertices), gl.STATIC_DRAW);

    // Create the color buffer and set the data
    shaderProgram.colorBuffer_gpu = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, shaderProgram.colorBuffer_gpu);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    // Set up the projection matrix
    const aspect = canvas.width / canvas.height;
    const fov = Math.PI / 4;
    const zNear = 0.1;
    const zFar = 100.0;
    shaderProgram.projectionMatrix_gpu = glMatrix.mat4.create();
    glMatrix.mat4.perspective(shaderProgram.projectionMatrix_gpu, fov, aspect, zNear, zFar);

    // Set up the view matrix
    const eye = glMatrix.vec3.fromValues(0.0, 0.0, 2.0);
    const center = glMatrix.vec3.fromValues(0.0, 0.0, 0.0);
    const up = glMatrix.vec3.fromValues(0.0, 1.0, 0.0);
    shaderProgram.viewMatrix_gpu = glMatrix.mat4.create();
    glMatrix.mat4.lookAt(shaderProgram.viewMatrix_gpu, eye, center, up);
}
let t=0
function animate_gpu() {
    // Update the time uniform
    t += 0.01;
    gl.uniform1f(shaderProgram.uTime_gpu, t);
  
    // Clear the canvas
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
  
    // Bind the shader program and set the attribute pointers
    gl.bindBuffer(gl.ARRAY_BUFFER, shaderProgram.vertexBuffer_gpu);
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute_gpu);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute_gpu, 3, gl.FLOAT, false, 0, 0);
  
    gl.bindBuffer(gl.ARRAY_BUFFER, shaderProgram.colorBuffer_gpu);
    gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute_gpu);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute_gpu, 4, gl.FLOAT, false, 0, 0);
  
    // Set the uniform matrices
    gl.uniformMatrix4fv(shaderProgram.projectionMatrixUniform_gpu, false, shaderProgram.projectionMatrix_gpu);
    gl.uniformMatrix4fv(shaderProgram.modelViewMatrixUniform_gpu, false, shaderProgram.viewMatrix_gpu);
  
    // Draw the triangles
    gl.drawArrays(gl.TRIANGLES, 0, 30);
  
    // Request another animation frame
    window.pending=requestAnimationFrame(animate_gpu);
  }  
  //Required Part Cube
  function setupShaders_cube(){
    vertexShader_cube = loadShaderFromDOM("shader-vs_cube");
    fragmentShader_cube = loadShaderFromDOM("shader-fs_cube");
    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader_cube);
    gl.attachShader(shaderProgram, fragmentShader_cube);
    gl.linkProgram(shaderProgram);
  
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      alert("Failed to setup shaders");
    }
  
    gl.useProgram(shaderProgram);
      
    // Get the positions of the atytributes and uniforms in the shader program     
    shaderProgram.vertexPositionAttribute_cube = gl.getAttribLocation(shaderProgram, "aVertexPosition_cube");
    shaderProgram.vertexColorAttribute_cube = gl.getAttribLocation(shaderProgram, "aVertexColor_cube"); 
    shaderProgram.projectionMatrixUniform_cube = gl.getUniformLocation(shaderProgram, "uProjectionMatrix_cube");
    shaderProgram.modelViewMatrixUniform_cube = gl.getUniformLocation(shaderProgram, "uModelViewMatrix_cube");
 
  }
  function draw_cube(){
    const colors = [
        [1.0, 0.0, 0.0], 
        [1.0, 0.5, 0.0], 
        [1.0, 1.0, 0.0], 
        [0.0, 1.0, 0.0],
        [0.0, 0.0, 1.0], 
        [0.5, 0.0, 1.0]
      ];

      // Define the vertices for each face of the cube
      const cubeVertices = [
        -1.0, -1.0,  1.0,
         1.0, -1.0,  1.0,
         1.0,  1.0,  1.0,
        -1.0,  1.0,  1.0,
        -1.0, -1.0, -1.0,
        -1.0,  1.0, -1.0,
         1.0,  1.0, -1.0,
         1.0, -1.0, -1.0,
        -1.0,  1.0, -1.0,
        -1.0,  1.0,  1.0,
         1.0,  1.0,  1.0,
         1.0,  1.0, -1.0,
        -1.0, -1.0, -1.0,
         1.0, -1.0, -1.0,
         1.0, -1.0,  1.0,
        -1.0, -1.0,  1.0,
         1.0, -1.0, -1.0,
         1.0,  1.0, -1.0,
         1.0,  1.0,  1.0,
         1.0, -1.0,  1.0,
        -1.0, -1.0, -1.0,
        -1.0, -1.0, -1.0,
        -1.0, -1.0,  1.0,
        1.0, -1.0,  1.0,
  ];
  const cubeIndices = [    0,  1,  2,      0,  2,  3,     4,  5,  6,      4,  6,  7,   8,  9,  10,     8,  10, 11,   12, 13, 14,     12, 14, 15,     16, 17, 18,     16, 18, 19,   20, 21, 22,     20, 22, 23,  ];

  // Create a buffer to hold the cube vertices
  const vertexBuffer_cube = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer_cube);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeVertices), gl.STATIC_DRAW);

  // Create a buffer to hold the cube indices
  const indexBuffer_cube = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer_cube);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeIndices), gl.STATIC_DRAW);
  
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute_cube);
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer_cube);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute_cube, 3, gl.FLOAT, false, 0, 0);

  
  gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute_cube);
  const colorBuffer_cube = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer_cube);
  let cubeColors = [];
  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < 6; j++) {
      cubeColors = cubeColors.concat(colors[i]);
    }
  }
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeColors), gl.STATIC_DRAW);
  gl.vertexAttribPointer(shaderProgram.vertexColorAttribute_cube, 3, gl.FLOAT, false, 0, 0);

  // Set up the model view matrix
  shaderProgram.modelViewMatrix_cube = glMatrix.mat4.create();

  // Set up the projection matrix
  shaderProgram.projectionMatrix_cube = glMatrix.mat4.create();
  const fieldOfView = glMatrix.glMatrix.toRadian(45);
  const aspectRatio = canvas.width / canvas.height;
  const nearClippingPlane = 0.1;
  const farClippingPlane = 100.0;
  glMatrix.mat4.perspective(shaderProgram.projectionMatrix_cube, fieldOfView, aspectRatio, nearClippingPlane, farClippingPlane);
  }
  
  //Animate the cube
  function animate_cube(){
        // Calculate the elapsed time since the last frame
        const now = performance.now();
        const deltaTime = (now - lastFrameTime) / 1000;
        lastFrameTime = now;
    
        rotAngle += rotationSpeed * deltaTime;
    
        // Set up the model view matrix with the current rotation angle
        glMatrix.mat4.identity(shaderProgram.modelViewMatrix_cube);
        glMatrix.mat4.translate(shaderProgram.modelViewMatrix_cube, shaderProgram.modelViewMatrix_cube, [0.0, 0.0, -6.0]);
        glMatrix.mat4.rotateY(shaderProgram.modelViewMatrix_cube, shaderProgram.modelViewMatrix_cube, rotAngle);
        glMatrix.mat4.rotateX(shaderProgram.modelViewMatrix_cube, shaderProgram.modelViewMatrix_cube, rotAngle);
    
        
        gl.uniformMatrix4fv(shaderProgram.modelViewMatrixUniform_cube, false, shaderProgram.modelViewMatrix_cube);
        gl.uniformMatrix4fv(shaderProgram.projectionMatrixUniform_cube, false, shaderProgram.projectionMatrix_cube);
    
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clearDepth(1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
        gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
    
        window.pending=requestAnimationFrame(animate_cube);
  }
  function radioChanged() {
    let chosen = document.querySelector('input[name="example"]:checked').value
    cancelAnimationFrame(window.pending)
    if (chosen=='illinois'){
        gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT)
        setupShaders(); 
        setupBuffers();
        requestAnimationFrame(animate_illini); 
    }
    else if(chosen=='cube'){
        gl.clear(gl.COLOR_BUFFER_BIT);
        setupShaders_cube();
        gl.enable(gl.DEPTH_TEST);
        draw_cube();
        animate_cube();
    }
    else if (chosen=='psychedellic'){
        gl.clear(gl.COLOR_BUFFER_BIT);
        setupShaders_psy();
        loadVertices_psy();
        animate_psyc();
    }
    else if (chosen=='collision'){
        gl.clear(gl.COLOR_BUFFER_BIT);
        setupShaders_collision();
        col_buf();
        collision_animate();
    }
    else if (chosen=='mouse'){
        gl.clear(gl.COLOR_BUFFER_BIT);
        setupShaders_mouse();
        logo_mouse();
        canvas.addEventListener("mousemove", function(event) {
            // Calculate the direction vector towards the mouse
            var mouseX = event.clientX / canvas.width * 2 - 1;
            var mouseY = -event.clientY / canvas.height * 2 + 1;
            var direction = glMatrix.vec3.fromValues(mouseX, mouseY, 0);
            glMatrix.vec3.sub(direction, direction, logoPosition);
            glMatrix.vec3.normalize(direction, direction);
            // Set the new target position
            glMatrix.vec3.scaleAndAdd(logoTarget, logoPosition, direction, 0.1);
        });
        animate_mouse();
    }
    else if(chosen=='stickman'){
        gl.clear(gl.COLOR_BUFFER_BIT);
        setupShaders_stickman();
        stickman_draw();
        animate_stickman();
    }
    else if(chosen=='illinois_GPU'){
        gl.clear(gl.COLOR_BUFFER_BIT);
        setupShaders_gpu();
        draw_logo_gpu();
        animate_gpu();
    }
}
window.addEventListener('load',(event)=>{
    canvas = document.getElementById("myGLCanvas");
    gl = createGLContext(canvas);
    document.querySelectorAll('input[name="example"]').forEach(elem => {
        elem.addEventListener('change', radioChanged)
    })
    radioChanged();
})
