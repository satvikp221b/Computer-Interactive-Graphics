For this assignment, I submitted a webpage where pressing a button generated and displayed geometry based on selected options, clearing any existing geometry each time. The geometry was displayed in perspective, viewed with a moving camera from slightly above the terrain, and at a reasonable distance to ensure most of the geometry was on-screen. I included lighting with at least one sun-like light source and implemented Lambert’s law for diffuse lighting.

The required part of the assignment involved generating a patch of fractal terrain using the Faulting Method, with user-selectable grid dimensions and a number of faults. The terrain maintained a vertical separation from the highest to lowest points between ½ and ¼ times the horizontal separation of points.

I completed the following parts:

- Terrain: I generated a working terrain patch using the Faulting Method.
- Rocky Cliffs: I added a material in the fragment shader for areas steeper than a specific cutoff, simulating rocky cliffs.
- Height-based Color Ramp: I implemented a color ramp based on world-space height, smoothly interpolating multiple colors in the fragment shader.
- Torus: I created a torus with user options for the number of rings, points per ring, and a control for puffiness (such as inner/outer radius).
- Shiny: I implemented specular highlights where the light color affected the highlights, creating a shiny effect.
