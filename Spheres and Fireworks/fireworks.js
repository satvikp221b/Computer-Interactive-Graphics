var gl;
var canvas;
var shaderProgram;
const projectionMatrix = glMatrix.mat4.create();
const viewMatrix = glMatrix.mat4.create();
const modelViewProjectionMatrix = glMatrix.mat4.create();

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

  function setupShaders(){
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

  }

  function startup(){
    canvas = document.getElementById("myGLCanvas");
    gl = createGLContext(canvas);
    canvas.clientWidth=canvas.width
    canvas.clientHeight=canvas.height
    setupShaders();
    shaderProgram.positionAttributeLocation = gl.getAttribLocation(shaderProgram, "a_position");
    shaderProgram.colorUniformLocation = gl.getUniformLocation(shaderProgram, "u_color");
    shaderProgram.modelViewProjectionMatrixUniformLocation = gl.getUniformLocation(shaderProgram, "u_modelViewProjectionMatrix");
    shaderProgram.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, shaderProgram.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 0]), gl.STATIC_DRAW);
    glMatrix.mat4.perspective(projectionMatrix, 75*Math.PI / 4, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
    glMatrix.mat4.lookAt(viewMatrix, [0, 0, 0], [0, 0, 0], [0, 0, 0]);
    animate_fireworks(performance.now());
  }


    // Particle class
    class Particle {
        constructor() {
            this.position = glMatrix.vec3.create();
            this.velocity = glMatrix.vec3.create();
            this.lifespan = 0;
            this.dead = false;
            this.color = [1, 1, 1, 1];
        }
        
        update(deltaTime) {
            if (this.dead) return;
        
            this.lifespan -= deltaTime;
            if (this.lifespan <= 0) {
                this.dead = true;
            } else {
                this.velocity[1] -= 9.81 * deltaTime; // gravity
                glMatrix.vec3.scale(this.velocity, this.velocity, 1 - 0.5 * deltaTime); // drag
                glMatrix.vec3.scaleAndAdd(this.position, this.position, this.velocity, deltaTime);
            }
        }
        
        draw() {
            glMatrix.mat4.identity(modelViewProjectionMatrix);
            glMatrix.mat4.translate(modelViewProjectionMatrix, modelViewProjectionMatrix, this.position);
            glMatrix.mat4.multiply(modelViewProjectionMatrix, projectionMatrix, modelViewProjectionMatrix);
            glMatrix.mat4.multiply(modelViewProjectionMatrix, viewMatrix, modelViewProjectionMatrix);
            gl.uniformMatrix4fv(shaderProgram.modelViewProjectionMatrixUniformLocation, false, modelViewProjectionMatrix);
            gl.uniform4fv(shaderProgram.colorUniformLocation, this.color);
            const screenPosition = glMatrix.vec4.create();
            glMatrix.vec4.transformMat4(screenPosition, [0, 0, 0, 1], modelViewProjectionMatrix);
            const x = screenPosition[0] / screenPosition[3];
            const y = screenPosition[1] / screenPosition[3];
            if (x >= -1 && x <= 1 && y >= -1 && y <= 1) {
                gl.drawArrays(gl.POINTS, 0, 1);
            }
    }
    }
const particles = [];
let burstCounter = 0;
const burstInterval = 1; // seconds
let lastBurstTime = performance.now() / 1000 - burstInterval;
function emitParticles(counter) {
    const burstCount = Math.floor(Math.random() * 50) + 50;
    const burstPosition = glMatrix.vec3.fromValues(Math.random() * 10 - 5,Math.random() * 10 - 5,Math.random() * 10 - 5);
    for (let i = 0; i < burstCount; i++) {
        const particle = new Particle();
        glMatrix.vec3.copy(particle.position, burstPosition);
        const direction = glMatrix.vec3.fromValues(Math.random() * 2 - 1,Math.random() * 2 - 1,Math.random() * 2 - 1);
        glMatrix.vec3.normalize(direction, direction);
        glMatrix.vec3.scale(direction, direction, Math.random() * 5 + 2);
        glMatrix.vec3.copy(particle.velocity, direction);
        particle.lifespan = Math.random() * 2 + 1;
        if (counter%2==0) {
            particle.color = [Math.random(),Math.random(),Math.random(),1];
        } else {
            particle.color =[0,1,1,1];
        }
        particles.push(particle);
    }
}

let counter=0;
let startTime = performance.now();
let lastEmitTime = performance.now() / 1000 - burstInterval; // seconds
function animate_fireworks(currentTime) {
    requestAnimationFrame(animate_fireworks);
    const deltaTime = (currentTime - startTime) / 1000;
    startTime = currentTime;
    particles.forEach((particle, index) => {
        particle.update(deltaTime);
        if (particle.dead) {
            particles.splice(index, 1);
        }
    });
    const timeSinceLastBurst = currentTime / 1000 - lastBurstTime;
    if (timeSinceLastBurst >= burstInterval) {
        emitParticles(counter);
        lastBurstTime = currentTime / 1000;
        counter++;
    }
    // Render particles
    gl.viewport(0, 0, canvas.clientWidth, canvas.clientHeight);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enableVertexAttribArray(shaderProgram.positionAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, shaderProgram.positionBuffer);
    gl.vertexAttribPointer(shaderProgram.positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);

    particles.forEach(particle => {
        particle.draw();
    });
}

