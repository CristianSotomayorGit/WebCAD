# **How OtterCAD Draws Splines**

While Bezier curves are a popular way of drawings splines in design applications. OtterCAD uses Catmull-Rom splines. While both these curves types are used to create smooth curves, they differ fundamentally in how they handle control points. 

Bézier curves are defined by control points that influence the shape of the curve but do not necessarily lie on it, offering precise control over tangents and geometry, making them ideal for detailed designs like typography or logos. In contrast, Catmull-Rom splines pass directly through the control points, with tangents calculated automatically from neighboring points, creating naturally smooth curves without requiring user adjustments. This makes Catmull-Rom splines intuitive and well-suited for interactive applications like CAD tools, where users expect the curve to align seamlessly with their input and point snapping features may be required.

---

### **Sources**

1. [Bézier Curve](https://en.wikipedia.org/wiki/B%C3%A9zier_curve)  
2. [Cubic Hermite Spline: Catmull–Rom Spline](https://en.wikipedia.org/wiki/Cubic_Hermite_spline#Catmull%E2%80%93Rom_spline)  
3. [Centripetal Catmull–Rom Spline](https://en.wikipedia.org/wiki/Centripetal_Catmull%E2%80%93Rom_spline)

---

## **2. How OtterCAD's Code Handles Splines**

To implement and render splines, the following files are required:

- **[`src/domain/entities/Spline.ts`](https://github.com/CristianSotomayorGit/WebCAD/blob/master/src/domain/entities/Spline.ts)**:
  - Manages spline creation, updates, and rendering.
  - Handles GPU buffer updates and control point interpolation.

- **[`src/domain/entities/Point.ts`](https://github.com/CristianSotomayorGit/WebCAD/blob/master/src/domain/entities/Point.ts)**:
  - Represents individual control points used by the spline.

- **[`src/shaders/SplineShader.ts`](https://github.com/CristianSotomayorGit/WebCAD/blob/master/src/shaders/PolylineShader.ts)**:
  - Defines the vertex and fragment shaders for rendering splines.
  - Responsible for transforming curve vertices and applying colors.

- **[`src/tools/SplineTool.ts`](https://github.com/CristianSotomayorGit/WebCAD/blob/master/src/domain/tools/DrawingTools/SplineTool.ts)**:
  - A user-interactive tool that allows adding, updating, and removing control points.
  - Provides the interface for drawing and manipulating splines in the application.

---

## **3. Rendering Catmull-Rom Splines**

### **How the Curve Is Rendered**

#### **Core Concept**

Catmull-Rom splines create smooth transitions by interpolating the curve between control points. Each segment of the curve is calculated using four control points:

$$
P_0, P_1, P_2, \text{ and } P_3
$$

Here:

- The current segment of the curve is defined by:

$$
P_1 \text{ and } P_2
$$

- The tangents, ensuring smooth interpolation, are influenced by:

$$
P_0 \text{ and } P_3
$$

Mathematically, a Catmull-Rom spline segment between \( P_1 \) and \( P_2 \), with neighbors \( P_0 \) and \( P_3 \), is defined as:

$$
P(t) = 0.5 \times 
\begin{bmatrix} 
1 & t & t^2 & t^3 
\end{bmatrix}
\begin{bmatrix}
0 & 2 & 0 & 0 \\
-1 & 0 & 1 & 0 \\
2 & -5 & 4 & -1 \\
-1 & 3 & -3 & 1
\end{bmatrix}
\begin{bmatrix} 
P_0 \\ 
P_1 \\ 
P_2 \\ 
P_3 
\end{bmatrix}
$$


#### **Key Features**
- **Dynamic Control Point Handling**: Points can be added, updated, or removed, and the curve updates in real-time.
- **Smooth Rendering**: Adjustable segment density ensures high-quality curves.
- **GPU Acceleration**: Efficient rendering with WebGPU shaders.
- **Interactive Tool**: `SplineTool` allows users to draw and manipulate splines directly within the application.

---

Here’s the **Steps in Rendering** section with a more specific explanation for the shader part:

#### **Steps in Rendering**

1. **User Interaction via `SplineTool`**:  
   Users interact with the spline through the [`SplineTool`](https://github.com/CristianSotomayorGit/WebCAD/blob/master/src/domain/tools/DrawingTools/SplineTool.ts). This tool provides intuitive controls that allow users to:
   - **Add new control points** to define the curve.
   - **Update existing control points** to adjust the shape of the curve.
   - **Remove unwanted control points** for editing flexibility.
   
   Example of handling a user interaction in `SplineTool.ts`:
   ```typescript
   public onPointerClick(event: PointerEvent): void {
       const point = new Point(event.x, event.y);
       this.spline.addControlPoint(point);
   }
   ```

2. **Add Control Points to the Spline**:  
   Once control points are defined, they are passed to the spline, implemented in [`Spline.ts`](https://github.com/CristianSotomayorGit/WebCAD/blob/master/src/domain/entities/Spline.ts):
   ```typescript
   public addControlPoint(point: Point): void {
       this.controlPoints.push(point);
       this.updateVertexBuffer();
   }
   ```

3. **Update the Curve Geometry**:  
   Each time control points change, the GPU buffer is updated to reflect the new spline geometry. This is part of the spline's implementation in [`Spline.ts`](https://github.com/CristianSotomayorGit/WebCAD/blob/master/src/domain/entities/Spline.ts):
   ```typescript
   public updateVertexBuffer(): void {
       const vertices: number[] = [];
       const numSegments = 20; // Smoothness of the curve

       for (let i = 0; i < this.controlPoints.length - 1; i++) {
           for (let j = 0; j <= numSegments; j++) {
               const t = j / numSegments;
               const point = this.calculateSplinePoint(i, t);
               vertices.push(point.x, point.y);
           }
       }

       // Write vertex data to the GPU buffer...
   }
   ```

   **Catmull-Rom Interpolation Formula**:  
   The spline point calculation uses Catmull-Rom interpolation to determine the position of the curve at a specific parameter \( t \) within a segment. This is implemented in the following method:
   ```typescript
   private calculateSplinePoint(segmentIndex: number, t: number): { x: number; y: number } {
       const p0 = this.getControlPoint(segmentIndex - 1);
       const p1 = this.getControlPoint(segmentIndex);
       const p2 = this.getControlPoint(segmentIndex + 1);
       const p3 = this.getControlPoint(segmentIndex + 2);

       const t2 = t * t;
       const t3 = t2 * t;

       const x =
           0.5 *
           ((2 * p1.getX()) +
               (-p0.getX() + p2.getX()) * t +
               (2 * p0.getX() - 5 * p1.getX() + 4 * p2.getX() - p3.getX()) * t2 +
               (-p0.getX() + 3 * p1.getX() - 3 * p2.getX() + p3.getX()) * t3);

       const y =
           0.5 *
           ((2 * p1.getY()) +
               (-p0.getY() + p2.getY()) * t +
               (2 * p0.getY() - 5 * p1.getY() + 4 * p2.getY() - p3.getY()) * t2 +
               (-p0.getY() + 3 * p1.getY() - 3 * p2.getY() + p3.getY()) * t3);

       return { x, y };
   }
   ```

4. **Render the Curve**:  
   The spline is rendered by drawing the vertices stored in the GPU buffer. The rendering relies on a pipeline that includes vertex and fragment shaders written in **WGSL**. The vertex and fragment shaders are implemented in [`PolylineShader.ts`](https://github.com/CristianSotomayorGit/WebCAD/blob/master/src/shaders/PolylineShader.ts).

   **Vertex Shader**:  
   The vertex shader transforms the spline's world-space positions into clip-space for rendering. It also applies zoom and pan transformations using uniforms.

   ```wgsl
   struct Uniforms {
       cameraOffset: vec2<f32>,  // Pan offset in world-space
       zoomFactor: f32,          // Zoom level
       padding: f32,             // Alignment padding, unused
   }

   @group(0) @binding(0) var<uniform> uniforms: Uniforms;

   struct VertexOutput {
       @builtin(position) position: vec4<f32>, // Clip-space position for rendering
       @location(0) worldPosition: vec2<f32>,  // Pass-through world-space position
   }

   @vertex
   fn main(@location(0) position: vec2<f32>) -> VertexOutput {
       var output: VertexOutput;

       // Transform the position based on the camera offset and zoom factor
       let transformedPosition = (position - uniforms.cameraOffset) * uniforms.zoomFactor;

       output.position = vec4<f32>(transformedPosition, 0.0, 1.0); // Clip-space position
       output.worldPosition = position; // Preserve the world-space position
       return output;
   }
   ```

   **Fragment Shader**:  
   The fragment shader applies a uniform color to the spline during rendering.

   ```wgsl
   @group(0) @binding(1) var<uniform> color: vec4<f32>; // Uniform color for the spline

   @fragment
   fn main(@location(0) worldPosition: vec2<f32>) -> @location(0) vec4<f32> {
       // Return the uniform color for rendering the spline
       return color;
   }
   ```

   **Render Call**:  
   The `draw` method in [`Spline.ts`](https://github.com/CristianSotomayorGit/WebCAD/blob/master/src/domain/entities/Spline.ts) sets up the pipeline and sends the vertex data to the GPU for rendering:
   ```typescript
   public override draw(renderPass: GPURenderPassEncoder, drawVertices: boolean): void {
       if (this.numVertices > 0 && this.vertexBuffer) {
           renderPass.setPipeline(this.pipeline);  // Set the rendering pipeline
           renderPass.setBindGroup(0, this.bindGroup);  // Bind uniform data
           renderPass.setVertexBuffer(0, this.vertexBuffer);  // Provide vertex data
           renderPass.draw(this.numVertices);  // Draw the spline
       }
   }
   ```

   The shaders and rendering pipeline ensure the spline is displayed smoothly, with dynamic adjustments for zoom, pan, and color.
```

