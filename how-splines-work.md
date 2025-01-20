# **How OtterCAD Draws Splines**

While Bexier curves are a popular way of drawings splines in design applications. OtterCAD uses Catmull-Rom splines. While both these curves types are used to create smooth curves, they differ fundamentally in how they handle control points. 

Bézier curves are defined by control points that influence the shape of the curve but do not necessarily lie on it, offering precise control over tangents and geometry, making them ideal for detailed designs like typography or logos. In contrast, Catmull-Rom splines pass directly through the control points, with tangents calculated automatically from neighboring points, creating naturally smooth curves without requiring user adjustments. This makes Catmull-Rom splines intuitive and well-suited for interactive applications like CAD tools, where users expect the curve to align seamlessly with their input and point snapping features may be required.

---

## **1. Difference Between Catmull-Rom Splines and Bézier Curves**

### **Bézier Curves**

Bézier curves are defined by control points that influence the shape of the curve but do not necessarily lie on it. A cubic Bézier curve is mathematically defined as:

$$
P(t) = (1-t)^3 P_0 + 3(1-t)^2 t P_1 + 3(1-t)t^2 P_2 + t^3 P_3
$$

Here:
- \(P_0\) and \(P_3\) are the endpoints.
- \(P_1\) and \(P_2\) are control points influencing the tangents.

#### **Pros**:
- Highly precise for detailed design work (e.g., typography, logos).
- Smooth and continuous control of tangents.

#### **Cons**:
- Requires user adjustment to achieve a desired shape.
- May feel unintuitive in interactive applications since control points don’t lie on the curve.

---

### **Catmull-Rom Splines**

Catmull-Rom splines are cubic Hermite splines designed to pass through all control points. They automatically calculate tangents based on adjacent control points, making them more intuitive for applications like path drawing or CAD software.

#### **Key Characteristics**:
- **Direct Interpolation**: The curve passes through all control points, eliminating the need for users to manipulate tangents manually.
- **Automatic Tangent Calculation**: The tangents are derived from neighboring control points using the formula:

$$
T_i = \frac{P_{i+1} - P_{i-1}}{2}
$$

- **Mathematical Definition**:  
  A Catmull-Rom spline segment between \(P_1\) and \(P_2\), with neighbors \(P_0\) and \(P_3\), is defined as:

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

---
---
- **Intuitive Interactivity**: Adjusting a control point directly changes the curve passing through it, which feels natural to users.

#### **Pros**:
- Automatically smooth and continuous.
- User-friendly for drawing or path modeling in interactive environments.

#### **Cons**:
- Limited control over tangents compared to Bézier curves.
- Less suited for high-precision design tasks where tangent control is critical.

---

### **Summary of Differences**

| **Feature**               | **Bézier Curves**                            | **Catmull-Rom Splines**                  |
|---------------------------|---------------------------------------------|------------------------------------------|
| **Control Point Influence** | Indirect (does not lie on the curve)        | Direct (curve passes through points)     |
| **Tangent Control**        | Manual with explicit handles                | Automatic, derived from neighbors        |
| **Ease of Use**            | Requires more manual adjustment             | Intuitive for interactive applications   |
| **Applications**           | Precise design (e.g., typography, logos)    | Natural paths, CAD modeling, animations  |

---

## **2. Files Needed**

To implement and render splines, the following files are required:

- **`src/domain/entities/Spline.ts`**:
  - Manages spline creation, updates, and rendering.
  - Handles GPU buffer updates and control point interpolation.

- **`src/domain/entities/Point.ts`**:
  - Represents individual control points used by the spline.

- **`src/shaders/SplineShader.ts`**:
  - Defines the vertex and fragment shaders for rendering splines.
  - Responsible for transforming curve vertices and applying colors.

- **`src/tools/SplineTool.ts`**:
  - A user-interactive tool that allows adding, updating, and removing control points.
  - Provides the interface for drawing and manipulating splines in the application.

Ensure these files are available and properly integrated into your project.

---

## **3. Rendering Catmull-Rom Splines**

### **How the Curve Is Rendered**

#### **Core Concept**
Catmull-Rom splines interpolate the curve between control points, ensuring smooth transitions. The curve segments are calculated using four control points \( P_0, P_1, P_2, P_3 \), where \( P_1 \) and \( P_2 \) define the current segment, and \( P_0 \) and \( P_3 \) influence the tangents.

#### **Key Features**
- **Dynamic Control Point Handling**: Points can be added, updated, or removed, and the curve updates in real-time.
- **Smooth Rendering**: Adjustable segment density ensures high-quality curves.
- **GPU Acceleration**: Efficient rendering with WebGPU shaders.
- **Interactive Tool**: `SplineTool` allows users to draw and manipulate splines directly within the application.

#### **Steps in Rendering**

1. **User Interaction via `SplineTool`**:
   Users interact with the spline through `SplineTool`, which provides intuitive controls to:
   - Add new control points.
   - Update existing control points.
   - Remove unwanted control points.
   
   Example from `SplineTool.ts`:
   ```typescript
   public onPointerClick(event: PointerEvent): void {
     const point = new Point(event.x, event.y);
     this.spline.addControlPoint(point);
   }
   ```

2. **Add Control Points to the Spline**:
   Once control points are defined, they are passed to the spline:
   ```typescript
   public addControlPoint(point: Point): void {
     this.controlPoints.push(point);
     this.updateVertexBuffer();
   }
   ```

3. **Update the Curve Geometry**:
   Each time control points change, the GPU buffer is updated to reflect the new spline geometry:
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

4. **Render the Curve**:
   The spline is rendered by drawing the vertices stored in the GPU buffer:
   ```typescript
   public override draw(renderPass: GPURenderPassEncoder, drawVertices: boolean): void {
     if (this.numVertices > 0 && this.vertexBuffer) {
       renderPass.setPipeline(this.pipeline);
       renderPass.setBindGroup(0, this.bindGroup);
       renderPass.setVertexBuffer(0, this.vertexBuffer);
       renderPass.draw(this.numVertices);
     }
   }
   ```

---

This version provides a more in-depth comparison of Bézier curves and Catmull-Rom splines while maintaining clarity and structure. Let me know if you need further refinements!
