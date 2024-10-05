var gl;
var canvas;
var shaderProgram;
//Cube Dimension
const cube_size=50;
//Gravity and other Movement Based Constants
const g=-100;
const drag=0.85;
const elasticity=0.8;
const mass=1;
const density=1;
//Sphere Radius
var sphere_r = [];
//Sphere Color
var sphere_color = [];
//Sphere Static
var spheres_static = [];
//Sphere Positions
var sphere_pos = [];
//Sphere Velocity
var sphere_vel = [];
//Sphere Mass
var sphere_mass=[];
//Sphere Object
var sphere_obj;
//Walls
var walls=[];
//Time Based Variables
const MIN_RESET_TIME = 8000;
const MAX_RESET_TIME = 13000;
let elapsedTimeSinceReset = 0;
let fps=0;
var previousTime = 0;

//Set Matrices
var projectionMatrix = glMatrix.mat4.create();
var normalMatrix = glMatrix.mat3.create();
var modelViewMatrix = glMatrix.mat4.create();
var viewMatrix = glMatrix.mat4.create();

//Lambertian Shading Constants
const ambient_light = [1.0, 1.0, 1.0];
const diffuse_light = [1.0, 1.0, 1.0];
var kDiffuse = [0.8, 0.8, 0.8];

//Returns Random Number generated between min and max
function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
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
  
    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram,"aVertexPosition");
    shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram,"vertexNormal");
    shaderProgram.modelViewMatrixUniform = gl.getUniformLocation(shaderProgram,"uModelViewMatrix");
    shaderProgram.projectionMatrixUniform = gl.getUniformLocation(shaderProgram,"uProjectionMatrix");
    shaderProgram.normalMatrix = gl.getUniformLocation(shaderProgram,"normalMatrix");
    shaderProgram.kDiffuse = gl.getUniformLocation(shaderProgram,"kDiffuse");
    shaderProgram.lightPosition = gl.getUniformLocation(shaderProgram,"lightPosition");
    shaderProgram.ambientLightColor = gl.getUniformLocation(shaderProgram,"ambientLightColor");
    shaderProgram.diffuseLightColor = gl.getUniformLocation(shaderProgram,"diffuseLightColor");
   
  }


  //Generates the invisible cube walls
  function generate_cube() {
    for (var i = 0; i < 3; i++) {
        var positive_wall = [0, 0, 0];
        var negative_wall = [0, 0, 0];
        positive_wall[i] = 1;
        negative_wall[i] = -1;
        walls.push(positive_wall);
        walls.push(negative_wall);
    }
  }
  
  //Creates the sphere geometry
  function createSphere() {
    var color = [Math.random(), Math.random(), Math.random()];
    var radius = randomBetween(2, 6);
    var mass = (radius**3)/50;
    const size = cube_size - radius - 1;
    var position = [randomBetween(-size, size),randomBetween(-size, size),randomBetween(-size, size),];
    var velocity_magnitude = randomBetween(1, 3 * Math.abs(g));
    var velocity = [0, 0, 0];
    glMatrix.vec3.random(velocity, velocity_magnitude);
    sphere_pos.push(position);
    sphere_vel.push(velocity);
    sphere_r.push(radius);
    sphere_color.push(color);
    spheres_static.push(false);
    sphere_mass.push(mass);
  }

  function startup() {
    canvas = document.getElementById("glCanvas");
    gl = createGLContext(canvas);
    setupShaders();
    sphere_obj = new Sphere();
    sphere_obj.setupBuffers(shaderProgram);
    generate_cube();
    // Generate 50 Spheres Initially
    for (var i = 0; i < 50; i++) {
      createSphere();
    }
    const near = -100.0;
    const far = 100.0;
    //Set perspective
    glMatrix.mat4.perspective(projectionMatrix,45*Math.PI/180,gl.viewportWidth / gl.viewportHeight,near,far);
  
    // Set the background color to black (you can change this if you like).
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
  
    // Start animating.
    requestAnimationFrame(animate_spheres);
  }

  function animate_spheres(currentTime) {
    currentTime *= 0.001;
    var deltaTime = currentTime - previousTime;
    elapsedTimeSinceReset += deltaTime * 1000;
    if (previousTime !== 0) {
        const elapsed = currentTime - previousTime;
        fps = Math.round(1000 / elapsed)/1000;
        fps=fps.toFixed(1);
        document.querySelector('#fps').innerHTML = `FPS: ${fps}`
      }
      previousTime = currentTime;
    let resetTime = randomBetween(MIN_RESET_TIME, MAX_RESET_TIME);
    if (elapsedTimeSinceReset >= resetTime) {
      sphere_pos = [];
      sphere_vel = [];
      sphere_r = [];
      sphere_color = [];
      sphere_mass=[];
      for (var i = 0; i < 50; i++) {
          createSphere();
        }
        elapsedTimeSinceReset = 0;
        resetTime=randomBetween(MIN_RESET_TIME, MAX_RESET_TIME);
    }
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
    var modelMatrix = glMatrix.mat4.create();
    var viewMatrix = glMatrix.mat4.create();
  
    // Create the view matrix using lookat.
    const lookAt = glMatrix.vec3.fromValues(0.0, 0.0, 0.0);
    const eye = glMatrix.vec3.fromValues(0.0, 0.0, 200.0);
    const up = glMatrix.vec3.fromValues(0.0, 1.0, 0.0);
    glMatrix.mat4.lookAt(viewMatrix, eye, lookAt, up);
  
    // Setting the ModelView Matrix
    glMatrix.mat4.multiply(modelViewMatrix, viewMatrix, modelMatrix);
  
    //Send to vertex shaders
    gl.uniformMatrix4fv(shaderProgram.modelViewMatrixUniform,false,modelViewMatrix);
    gl.uniformMatrix4fv(shaderProgram.projectionMatrixUniform,false,projectionMatrix);
    glMatrix.mat3.fromMat4(normalMatrix, modelViewMatrix);
    glMatrix.mat3.transpose(normalMatrix, normalMatrix);
    glMatrix.mat3.invert(normalMatrix, normalMatrix);
    gl.uniformMatrix3fv(shaderProgram.normalMatrix,false,normalMatrix);
  
    // Transform the light position to view coordinates
    var lightPosition = glMatrix.vec3.fromValues(-100, 200, 200);
    glMatrix.vec3.transformMat4(lightPosition, lightPosition, viewMatrix);

    //Send to fragment shader
    gl.uniform3fv(shaderProgram.ambientLightColor, ambient_light);
    gl.uniform3fv(shaderProgram.diffuseLightColor, diffuse_light);
    gl.uniform3fv(shaderProgram.lightPosition, lightPosition);
    gl.uniform3fv(shaderProgram.kDiffuse, kDiffuse);

    sphere_obj.bindVAO();
    var trans_mat = glMatrix.mat4.create();
    var r_mat = glMatrix.mat4.create();
    for (var i = 0; i < sphere_pos.length; i++) {
      // update position and velocity
      CheckWallCollisions(i, deltaTime);
      for (var j = 0; j < sphere_pos.length; j++) {
          for(var k=0; k<sphere_pos.length;k++){
          checkSphereSphereCollision(j, k, deltaTime);
        }
      }

      glMatrix.mat4.fromTranslation(trans_mat, sphere_pos[i]);
      var r_vec = [sphere_r[i], sphere_r[i], sphere_r[i]];
      glMatrix.mat4.fromScaling(r_mat, r_vec);
  
      // Updating the model View Matrix After the pos and vel update
      glMatrix.mat4.multiply(modelMatrix, trans_mat, r_mat);
      glMatrix.mat4.multiply(modelViewMatrix, viewMatrix, modelMatrix);
  
      // set colors
      kDiffuse = sphere_color[i];
      
      //Send to shaders again after position and vel update
      gl.uniformMatrix4fv(shaderProgram.modelViewMatrixUniform,false,modelViewMatrix);
      gl.uniformMatrix4fv(shaderProgram.projectionMatrixUniform,false,projectionMatrix);
      glMatrix.mat3.fromMat4(normalMatrix, modelViewMatrix);
      glMatrix.mat3.transpose(normalMatrix, normalMatrix);
      glMatrix.mat3.invert(normalMatrix, normalMatrix);
      gl.uniformMatrix3fv(shaderProgram.normalMatrix,false,normalMatrix);

      gl.uniform3fv(shaderProgram.kDiffuse, kDiffuse);
      // Draw the spheres
      gl.drawArrays(gl.TRIANGLES, 0, sphere_obj.numTriangles * 3);
    }
    sphere_obj.unbindVAO();

    requestAnimationFrame(animate_spheres);
  }

  function CheckWallCollisions(s, deltaTime) {
    
    //Velocity update after drag and acceleration
    glMatrix.vec3.scale(sphere_vel[s], sphere_vel[s], Math.pow(drag, deltaTime));
    var accel = [0, 0, 0];
    glMatrix.vec3.scale(accel, [0,g,0], deltaTime);
    glMatrix.vec3.scaleAndAdd(sphere_vel[s], sphere_vel[s], accel, 1/sphere_mass[s]);
  
    //Position Update
    var initial_pos = glMatrix.vec3.clone(sphere_pos[s]);
    var initial_vel = glMatrix.vec3.clone(sphere_vel[s]);
    var vel = [0, 0, 0];
    glMatrix.vec3.scale(vel, sphere_vel[s], deltaTime);
    glMatrix.vec3.add(sphere_pos[s], sphere_pos[s], vel);
  
    var min_dist = Infinity;
    var wall_init = [0, 0, 0];
    for (var i = 0; i < 3; i++) {
      var pos = sphere_pos[s][i];
      if (pos + sphere_r[s] >= cube_size) {
        var dist = (cube_size - sphere_r[s] - initial_pos[i]) / sphere_vel[s][i];
        if (dist < min_dist) {
          min_dist = dist;
          wall_init = walls[2 * i + 1];
        }
      } else if (pos - sphere_r[s] <= -cube_size) {
        var dist = (-cube_size + sphere_r[s] - initial_pos[i]) / sphere_vel[s][i];
        if (dist < min_dist) {
            min_dist = dist;
            wall_init = walls[2 * i];
          }
        }
      }
      
      //Collision Occurs
      if (min_dist !== Infinity) {
        
        //Velocity Change
        var vel_normal = glMatrix.vec3.dot(sphere_vel[s], wall_init);
        var normal = glMatrix.vec3.clone(wall_init);
        glMatrix.vec3.scale(normal, normal, 2 * vel_normal);
        var final_vel = [0, 0, 0];
        glMatrix.vec3.sub(final_vel, sphere_vel[s], normal);
        glMatrix.vec3.scale(final_vel, final_vel, elasticity);
        sphere_vel[s] = final_vel;
      
        // Position Change
        var vel = [0, 0, 0];
        glMatrix.vec3.scale(vel, initial_vel, min_dist);
        glMatrix.vec3.add(sphere_pos[s], initial_pos, vel);
      }
    }

    function checkSphereSphereCollision(s1, s2, deltaTime) {
    var distVec = [0, 0, 0];
    glMatrix.vec3.sub(distVec, sphere_pos[s1], sphere_pos[s2]);
    var dist = glMatrix.vec3.length(distVec);
    if (dist <= sphere_r[s1] + sphere_r[s2]) {
          // Collision occurred
  var normVec = [0, 0, 0];
  glMatrix.vec3.normalize(normVec, distVec);
  // Relative velocity
  var relVel = [0, 0, 0];
  glMatrix.vec3.sub(relVel, sphere_vel[s1], sphere_vel[s2]);

  // Velocity along normal
  var velAlongNormal = glMatrix.vec3.dot(relVel, normVec);
  if (velAlongNormal > 0) {
    // Spheres are moving away from each other
    return;
  }
  // Impulse magnitude
  var j = -(1 + elasticity) * velAlongNormal;
  j /= 1 / sphere_mass[s1] + 1 / sphere_mass[s2];

  // Impulse vector
  var impulseVec = [0, 0, 0];
  glMatrix.vec3.scale(impulseVec, normVec, j);

  // Final Velocity
  glMatrix.vec3.scaleAndAdd(sphere_vel[s1], sphere_vel[s1], impulseVec, 1 / sphere_mass[s1]);
  glMatrix.vec3.scaleAndAdd(sphere_vel[s2], sphere_vel[s2], impulseVec, -1 / sphere_mass[s2]);

  // Move spheres out of collision
  var distToMove = (sphere_r[s1] + sphere_r[s2] - dist) / (1/sphere_mass[s1] + 1/sphere_mass[s2]);
  var pos1Term = [0, 0, 0];
  glMatrix.vec3.scale(pos1Term, normVec, distToMove);
  glMatrix.vec3.add(sphere_pos[s1], sphere_pos[s1], pos1Term);
  var pos2Term = [0, 0, 0];
  glMatrix.vec3.scale(pos2Term, normVec, -distToMove);
  glMatrix.vec3.add(sphere_pos[s2], sphere_pos[s2], pos2Term);
}
}
      


  function checkSphereSphereCollision(s1, s2, deltaTime) {
    var distVec = [0, 0, 0];
    glMatrix.vec3.sub(distVec, sphere_pos[s1], sphere_pos[s2]);
    var dist = glMatrix.vec3.length(distVec);
    if (dist <= sphere_r[s1] + sphere_r[s2]) {

      // Collision occurred
      var normVec = [0, 0, 0];
      glMatrix.vec3.normalize(normVec, distVec);
      // Relative velocity
      var relVel = [0, 0, 0];
      glMatrix.vec3.sub(relVel, sphere_vel[s1], sphere_vel[s2]);

      // Velocity along normal
      var velAlongNormal = glMatrix.vec3.dot(relVel, normVec);
      if (velAlongNormal > 0) {
        // Spheres are moving away from each other
        return;
      }
      // Impulse magnitude
      var j = -(1 + elasticity) * velAlongNormal;
      j /= 1 / mass + 1 / mass;

      // Impulse vector
      var impulseVec = [0, 0, 0];
      glMatrix.vec3.scale(impulseVec, normVec, j);

      // Final Velocity
      glMatrix.vec3.scaleAndAdd(sphere_vel[s1], sphere_vel[s1], impulseVec, 1 / mass);
      glMatrix.vec3.scaleAndAdd(sphere_vel[s2], sphere_vel[s2], impulseVec, -1 / mass);

      // Move spheres out of collision
      var distToMove = (sphere_r[s1] + sphere_r[s2] - dist) / 2;
      var pos1Term = [0, 0, 0];
      glMatrix.vec3.scale(pos1Term, normVec, distToMove);
      glMatrix.vec3.add(sphere_pos[s1], sphere_pos[s1], pos1Term);
      var pos2Term = [0, 0, 0];
      glMatrix.vec3.scale(pos2Term, normVec, -distToMove);
      glMatrix.vec3.add(sphere_pos[s2], sphere_pos[s2], pos2Term);
    }
  }
