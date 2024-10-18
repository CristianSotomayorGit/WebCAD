// src/shaders/SplineShader.ts

export const SplineShader = {
    VERTEX: `
  struct Uniforms {
    offset: vec2<f32>;
    zoom: f32;
    padding: f32;
  };
  @binding(0) @group(0) var<uniform> uniforms: Uniforms;
  
  @location(0) @vertex
  fn main(position: vec2<f32>) -> @builtin(position) vec4<f32> {
    let pos = (position + uniforms.offset) * uniforms.zoom;
    return vec4<f32>(pos, 0.0, 1.0);
  }
  `,
  
    FRAGMENT: `
  @fragment
  fn main() -> @location(0) vec4<f32> {
    return vec4<f32>(1.0, 1.0, 0.0, 1.0); // Yellow color for the spline
  }
  `,
  };
  