Infinite Grid Renderer with Drawing Tools

Welcome to the Infinite Grid Renderer with Drawing Tools project! This application leverages WebGPU to render an infinite grid that supports intuitive zooming and panning. Additionally, it provides tools to draw lines, polylines, and points on the grid with consistent visual behavior regardless of zoom level.

This project aims to be a lightweight challenger to professional CAD software like AutoCAD, offering essential drawing functionalities in a simplified and accessible web-based environment.
Table of Contents

    Introduction
    Features
    Demo
    Getting Started
        Prerequisites
        Installation
        Running the Application
    Project Structure
    Usage
        Zooming and Panning
        Drawing Tools
            Line Tool
            Polyline Tool
            Point Rendering
    Technical Details
        Rendering Pipeline
        Shader Logic
        Uniform Buffers
    Contributing
    License
    Acknowledgments
    Contact

Introduction

This project showcases an interactive infinite grid rendered using WebGPU. It is designed to be a lightweight challenger to professional CAD software like AutoCAD, offering essential drawing features for users who need a simpler tool for creating and manipulating graphical elements.

The application features:

    Intuitive zooming and panning controls.
    Consistent rendering of grid lines, ensuring grid density adjusts appropriately with zoom levels.
    Drawing tools to create lines and polylines on the grid.
    Points that maintain a constant size on the screen, regardless of zoom level.

Why a Lightweight Challenger?

While AutoCAD and similar applications offer extensive capabilities, they can be overwhelming for users who require only basic drawing functionalities. This project aims to fill that gap by providing a streamlined, web-based alternative that is easy to use and accessible from any device with a modern browser.
Features

    Infinite Grid Rendering: An infinite grid that adjusts dynamically as the user pans and zooms, providing a seamless experience akin to professional CAD environments.
    Zoom and Pan Controls: Intuitive controls using mouse wheel for zooming and click-and-drag for panning, emulating familiar CAD interactions.
    Drawing Tools:
        Line Tool: Draw straight lines between two points, similar to basic line drawing in AutoCAD.
        Polyline Tool: Draw connected lines (polylines) with multiple vertices, allowing the creation of complex shapes.
    Consistent Point Rendering: Points are rendered as squares that maintain a constant size on the screen, regardless of zoom level, ensuring precision in placement and visibility.
    WebGPU Powered: Leverages the power of WebGPU for high-performance rendering, providing smooth interactions even with complex drawings.

Demo

[Include screenshots or GIFs demonstrating the application's features, showcasing similarities to AutoCAD's interface and functionalities.]
Getting Started
Prerequisites

    WebGPU Support: Ensure your browser supports WebGPU. Currently, WebGPU is available in the latest versions of Chromium-based browsers (e.g., Chrome, Edge) behind an experimental flag.
    Node.js: Version 14 or higher is recommended.
    npm: Comes bundled with Node.js.

Installation

    Clone the Repository

    bash

git clone https://github.com/your-username/infinite-grid-renderer.git
cd infinite-grid-renderer

Install Dependencies

bash

    npm install

Running the Application

    Start the Development Server

    bash

    npm start

    Open the Application in a Browser

    Navigate to http://localhost:3000 in a WebGPU-compatible browser.

Project Structure

plaintext

infinite-grid-renderer/
├── src/
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── Camera.ts
│   │   │   ├── Grid.ts
│   │   │   ├── Line.ts
│   │   │   ├── Point.ts
│   │   │   └── Polyline.ts
│   │   ├── managers/
│   │   │   └── EntityManager.ts
│   │   └── tools/
│   │       ├── Tool.ts
│   │       ├── LineTool.ts
│   │       └── PolylineTool.ts
│   ├── infrastructure/
│   │   ├── rendering/
│   │   │   ├── Renderer.ts
│   │   │   └── shaders/
│   │   │       ├── gridFragmentShader.wgsl
│   │   │       ├── gridVertexShader.wgsl
│   │   │       ├── lineFragmentShader.wgsl
│   │   │       ├── lineVertexShader.wgsl
│   │   │       ├── pointFragmentShader.wgsl
│   │   │       └── pointVertexShader.wgsl
│   ├── app.ts
│   └── index.html
├── package.json
├── tsconfig.json
└── README.md

Usage
Zooming and Panning

    Zoom In/Out: Use the mouse wheel to zoom in or out.
        Scroll Up: Zoom in (grid becomes denser), similar to zooming in CAD software.
        Scroll Down: Zoom out (grid becomes sparser).
    Panning: Click and drag the canvas to pan across the grid, mimicking the pan functionality in AutoCAD.

Drawing Tools
Line Tool

    Activate Line Tool: Select the line tool from the toolbar or press the L key.
    Draw a Line:
        First Click: Click on the canvas to set the starting point of the line.
        Second Click: Click again to set the ending point and finalize the line.
    Cancel Drawing: Press the Escape key to cancel the line drawing.

Polyline Tool

    Activate Polyline Tool: Select the polyline tool from the toolbar or press the P key.
    Draw a Polyline:
        First Click: Click on the canvas to set the first vertex.
        Subsequent Clicks: Click to add more vertices to the polyline.
        Finish Drawing: Press the Enter, Return, or Spacebar key to finalize the polyline.
    Cancel Drawing: Press the Escape key to cancel the polyline drawing.

Point Rendering

    Points are rendered as small squares on the canvas.
    Consistent Size: Points maintain a constant size on the screen regardless of zoom level, ensuring they are always visible and easy to interact with.

Technical Details
Rendering Pipeline

    WebGPU: Utilizes WebGPU for rendering, providing high-performance graphics capabilities in the browser, rivaling desktop CAD applications.
    Infinite Grid:
        Renders a grid that extends infinitely in all directions.
        Adjusts grid line spacing and density based on zoom level for optimal visual feedback, similar to the dynamic grids in CAD software.
    Entity Management:
        An EntityManager class manages all drawable entities (lines, polylines, points).
        Each entity handles its own rendering logic and GPU resources.

Shader Logic
Grid Shaders

    Vertex Shader:
        Calculates fragPosition by applying camera offset and zoom factor.
        Uses inverse zoom (dividing by zoomFactor) to align zoom direction with user expectations.
    Fragment Shader:
        Dynamically adjusts minorGridSpacing based on zoomFactor.
        Ensures consistent grid density relative to zoom level.
        Optionally adjusts lineThickness for visual consistency.

Line and Polyline Shaders

    Vertex Shader:
        Applies transformations consistently with the grid to maintain synchronization.
    Fragment Shader:
        Simple color output, rendering lines in a specified color.

Point Shaders

    Vertex Shader:
        Keeps point size constant on screen by adjusting vertex offsets inversely with zoomFactor.
        Applies camera transformations to the point's center position.
    Fragment Shader:
        Renders the point with a specified color.

Uniform Buffers

    Uniforms Structure:
        Contains cameraOffset, zoomFactor, and necessary padding for alignment.
        Passed to shaders to apply consistent transformations across all entities.
    Updating Uniforms:
        Uniform buffers are updated whenever the camera moves or the zoom level changes.
        Ensures synchronization between the application state and shader inputs.

Contributing

Contributions are welcome! Please follow these steps:

    Fork the Repository

    Create a Feature Branch

    bash

git checkout -b feature/your-feature-name

Commit Your Changes

bash

git commit -m "Add your message here"

Push to Your Fork

bash

    git push origin feature/your-feature-name

    Open a Pull Request

License

This project is licensed under the MIT License.
Acknowledgments

    WebGPU Community: For providing resources and support on WebGPU development.
    Contributors: Thanks to everyone who has contributed to this project.
    AutoCAD Inspiration: Inspired by the functionalities of AutoCAD, aiming to provide a lightweight alternative for basic drawing needs.
    OpenAI's ChatGPT: For assisting in code explanations and optimizations.

Contact

For questions or suggestions, please open an issue on the repository or contact your-email@example.com.

Happy Coding!