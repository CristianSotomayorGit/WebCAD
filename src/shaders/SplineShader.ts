export enum SplineShader {
  FRAGMENT = `
    @group(0) @binding(1) var<uniform> color: vec4<f32>;

    @fragment
    fn main() -> @location(0) vec4<f32> {
      return color;
    }
  `,
  
  VERTEX = `
    struct Uniforms {
      cameraOffset: vec2<f32>,
      zoomFactor: f32,
      padding: f32,
    }

    @group(0) @binding(0) var<uniform> uniforms: Uniforms;

    struct VertexOutput {
      @builtin(position) position: vec4<f32>,
      @location(0) splineColor: vec4<f32>,
    }

    @vertex
    fn main(@location(0) controlPosition: vec2<f32>, 
            @location(1) interpolatedT: f32) -> VertexOutput {
      
      var output: VertexOutput;
      
      // Apply zoom and camera offset to control points
      let adjustedPosition = (controlPosition - uniforms.cameraOffset) * uniforms.zoomFactor;
      
      // Transform the position for rendering, scaling appropriately
      output.position = vec4<f32>(adjustedPosition, 0.0, 1.0);
      
      // Set color, could be modified per point if gradient effects are needed
      output.splineColor = vec4<f32>(1.0, 1.0, 1.0, 1.0);
      
      return output;
    }
  `
}
