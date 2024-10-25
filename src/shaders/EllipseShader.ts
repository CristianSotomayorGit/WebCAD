// src/shaders/EllipseShader.ts

export enum EllipseShader {
    VERTEX = `
    struct Uniforms {
      cameraOffset: vec2<f32>,
      cameraZoom: f32,
      padding: f32, // Padding to align to 16 bytes (vec4 size)
    };
  
    @group(0) @binding(0) var<uniform> uniforms: Uniforms;
  
    @vertex
    fn main(@location(0) position: vec2<f32>) -> @builtin(position) vec4<f32> {
      // Apply camera transformation
      var pos = (position - uniforms.cameraOffset) * uniforms.cameraZoom;
      return vec4<f32>(pos, 0.0, 1.0);
    }
    `,

    FRAGMENT = `
    @group(0) @binding(1) var<uniform> colorUniform: vec4<f32>;
  
    @fragment
    fn main() -> @location(0) vec4<f32> {
      return colorUniform;
    }
    `
}