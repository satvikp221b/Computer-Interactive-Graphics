For this assignment, I created a webpage that auto-generates and displays a randomly generated terrain as soon as the page loads. The terrain is lit using diffuse lighting. I also implemented user-controlled camera movement, allowing the camera to respond smoothly to keyboard input. The WASD keys move the camera forward, backward, left, and right, while additional controls allow camera pitch and turning. I used texture mapping for the terrain, with a texture sourced from a public domain image.

I completed the following features:

- Camera controls: Implemented controls that allow the camera to move forward, backward, left, and right using the WASD keys, as well as camera rotation using the arrow keys.
- Vehicular movement: Added a toggle with the "G" key that switches between flight mode and on-the-ground mode. In on-the-ground mode, the camera remains at a fixed height above the terrain and moves smoothly across the terrain surface, adjusting to different heights.
- Fog: Added a fog toggle with the "F" key that smoothly transitions between no-fog mode and fog mode. In fog mode, distant fragments are drawn closer to the background fog color, creating an atmospheric effect.
- OBJ loading: Successfully loaded OBJ files, both basic and custom, displaying objects at the center of the terrain. My code handles both position-only and position-and-color OBJ files, with support for additional attributes like surface normals and texture coordinates. Although, it gets wonky/buggy sometimes depending on the OBJ file.

[Link to project](https://satvikp221b.github.io/Computer-Interactive-Graphics/MP4.html)
