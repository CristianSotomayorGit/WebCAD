# OtterCAD

## License

All rights reserved. You may not use, copy, modify, or share this code without explicit permission from the author.

## Overview

Welcome to **OtterCAD**! This application leverages **WebGPU** to render an infinite grid that supports intuitive zooming and panning. Additionally, it provides tools to draw lines, polylines, and points on the grid with consistent visual behavior regardless of zoom level.

This project aims to be a lightweight challenger to professional CAD software like **AutoCAD**, offering essential drawing functionalities in a simplified and accessible web-based environment.

---

## Introduction

This project showcases an interactive infinite grid rendered using **WebGPU**. It is designed to be a lightweight challenger to professional CAD software like AutoCAD, offering essential drawing features for users who need a simpler tool for creating and manipulating graphical elements.

The application features:
- Intuitive zooming and panning controls.
- Consistent rendering of grid lines, ensuring grid density adjusts appropriately with zoom levels.
- Drawing tools to create lines and polylines on the grid.
- Points that maintain a constant size on the screen, regardless of zoom level.

### Why a Lightweight Challenger?

While AutoCAD and similar applications offer extensive capabilities, they can be overwhelming for users who require only basic drawing functionalities. This project aims to fill that gap by providing a streamlined, web-based alternative that is easy to use and accessible from any device with a modern browser.

---

## Features

### 1. Infinite Grid Rendering
An infinite grid that adjusts dynamically as the user pans and zooms, providing a seamless experience akin to professional CAD environments.

### 2. Zoom and Pan Controls
Intuitive controls using mouse wheel for zooming and click-and-drag for panning, emulating familiar CAD interactions.

### 3. Drawing Tools:
- **Line Tool**: Draw straight lines between two points, similar to basic line drawing in AutoCAD.
- **Polyline Tool**: Draw connected lines (polylines) with multiple vertices, allowing the creation of complex shapes.

### 4. Consistent Point Rendering
Points are rendered as squares that maintain a constant size on the screen, regardless of zoom level, ensuring precision in placement and visibility.

### 5. WebGPU Powered
Leverages the power of **WebGPU** for high-performance rendering, providing smooth interactions even with complex drawings.

---

## Project Roadmap

<div style="background-color: #f4f4f4; padding: 20px; border-radius: 8px;">

### Current Tasks:

- [x] **Point zoom scaling**  
- [x] **Grid zoom scaling**  
- [ ] **More drawing tools**  
- [ ] **Research DXF**

### Future Enhancements:

1. **Additional Drawing Tools**
    - [x] Rectangle Tool: Allows users to draw rectangles by specifying two opposite corners.
    - [x] Polygon Tool: Enables drawing of regular polygons (e.g., triangles, pentagons) by specifying the number of sides and radius.

2. **Arc and Ellipse Tools**
    - [x] Arc Tool: Draw arcs by specifying start point, end point, and radius or angle.
    - [x] Ellipse Tool: Draw ellipses by specifying the major and minor axes.

3. **Text and Annotation Tools**
    - [x] Text Tool: Add text annotations to drawings with options for font style, size, and alignment.
    - [ ] Multiline Text (MTEXT): Supports paragraphs of text with formatting options.

4. **Import/Export Capabilities**
    - [ ] DXF, DWG, PDF, SVG file formats support.
    - [ ] Export options for external application integration.

5. **Dimensioning Tools**
    - [ ] Linear Dimension: Measures the distance between two points.
    - [ ] Angular Dimension: Measures the angle between two lines or at a vertex.
    - [ ] Radial and Diameter Dimensions: For circles and arcs.
    - [ ] Leader Lines: Annotative lines pointing to features with accompanying text.

6. **Hatch and Fill Tools**
    - [ ] Hatch Tool: Fills closed areas with patterns or solid colors.
    - [ ] Gradient Fill: Adds gradient colors for visual effects.

7. **Block and Symbol Tools**
    - [ ] Block Creation: Group objects into reusable blocks.
    - [ ] Block Insertion: Insert predefined blocks into the drawing.

8. **Image and External Reference Tools**
    - [ ] Image Insertion: Import raster images (JPEG, PNG).
    - [ ] External References: Attach external drawing files as references.

### Modify and Editing Tools

- [ ] Move, Copy, Rotate, Scale, Mirror, Stretch tools.
- [ ] Trim, Extend, Fillet, Chamfer, Offset for object refinement.
- [ ] Properties Panel to edit object properties like color, line type, layer, etc.

---

</div>

---

## Conclusion

Incorporating these additional tools and features will significantly enhance **OtterCAD**'s capabilities, making it a more viable alternative to established CAD software like AutoCAD. Prioritize the tools based on user needs and the specific industry you're targeting. Engaging with potential users to gather feedback can also guide you in refining the toolset and features.

Feel free to ask if you need further details on implementing any of these tools or features!

---