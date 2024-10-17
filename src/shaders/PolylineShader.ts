export enum PolylineShader {
    FRAGMENT =
    `
@fragment
fn fs_main() -> @location(0) vec4<f32> {
  return vec4<f32>(1.0, 1.0, 1.0, 1.0); // White color
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
      fn vs_main(@location(0) position: vec2<f32>) -> @builtin(position) vec4<f32> {
        let worldPosition = (position + uniforms.cameraOffset) / uniforms.zoomFactor;
        return vec4<f32>(worldPosition, 0.0, 1.0);
      }
    `
}