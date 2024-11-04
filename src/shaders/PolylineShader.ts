export enum PolylineShader {
    FRAGMENT =
    `
  @group(0) @binding(1) var<uniform> color: vec4<f32>; // Add color uniform

  @fragment
  fn main() -> @location(0) vec4<f32> {
    return color; // Use the uniform color
  }
`,
    VERTEX = `

    struct Uniforms {
        cameraOffset: vec2<f32>,
        zoomFactor: f32,
        padding: f32, // For alignment
      };
      
      @group(0) @binding(0) var<uniform> uniforms: Uniforms;
      
      @vertex
      fn main(@location(0) position: vec2<f32>) -> @builtin(position) vec4<f32> {
        let worldPosition = (position + uniforms.cameraOffset) * uniforms.zoomFactor;
        return vec4<f32>(worldPosition, 0.0, 1.0);
      }
    `
}