For this assignment, I submitted a file named **burst.html** that displays a physics-based animation with 50 randomly generated spheres inside an invisible bounding box. The spheres move according to momentum, gravity, and experience drag, while they bounce off the walls of the invisible cube. Each sphere is assigned a random color, and they are rendered large enough to appear as spheres. Periodic resets are implemented to randomize the simulation when energy dissipates. The simulation includes a perspective view with diffuse lighting.

I completed the following optional features:

- Burst: The 50 spheres were initialized with random positions, velocities, and colors. They move within the cube, bouncing off walls with elastic collisions.
- FPS Counter: I added an FPS counter, which displays the current frame rate at the bottom-right corner of the screen. This updates dynamically based on the animation's performance.
- Sphere-sphere collision: I implemented sphere-sphere collision detection, ensuring that spheres do not overlap. Collision response is based on the angle of impact, creating realistic physics-based interactions.
- Variable Radii: Each sphere was given a random radius, with at least a three-fold difference between the largest and smallest spheres. The collision detection system accounts for these variable radii.
- Variable Mass: I assigned each sphere a different mass, with at least a ten-fold mass difference between the most and least massive spheres. The collision responses are adjusted based on these varying masses, resulting in more realistic momentum exchange.

Fireworks: I created a **fireworks.html** file where glowing particles burst from random locations, using additive blending to create bright overlapping effects. The particles experience weak gravity, strong drag, and disappear after a finite lifespan. The bursts are randomized in timing and density, resulting in a visually dynamic display.

These completed features contribute to a dynamic and interactive simulation with realistic physics and visual effects.

[Link to Spheres Project](https://satvikp221b.github.io/Computer-Interactive-Graphics/burst.html)

[Link to Fireworks Project](https://satvikp221b.github.io/Computer-Interactive-Graphics/fireworks.html)
