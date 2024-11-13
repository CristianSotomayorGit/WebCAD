// src/shaders/GridShader.ts

export enum GridShader {
  VERTEX = `
// src/shaders/grid_vertex.wgsl

struct Uniforms {
  cameraOffset: vec2<f32>,
  zoomFactor: f32,
  padding: f32, // Padding for alignment
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
}

@vertex
fn main(@location(0) position: vec2<f32>) -> VertexOutput {
  var output: VertexOutput;
  
  // Apply pan offset and zoom factor
  let transformedPos = (position - uniforms.cameraOffset) * uniforms.zoomFactor;
  
  // Convert to clip space (-1 to 1)
  output.position = vec4<f32>(transformedPos, 0.0, 1.0);
  
  return output;
}

  `,

  FRAGMENT = `
    // src/shaders/grid_fragment.wgsl

    @group(0) @binding(1) var<uniform> color: vec4<f32>; // Grid line color

    @fragment
    fn main() -> @location(0) vec4<f32> {
      return color; // Apply uniform color to the grid line
    }
  `
}
