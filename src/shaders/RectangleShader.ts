// src/shaders/RectangleShader.ts

export enum RectangleShader  {
    VERTEX =  `
struct Uniforms {
  offset: vec2<f32>,
  zoom: f32,
  padding: f32,
};
@group(0) @binding(0)
var<uniform> uniforms: Uniforms;

@vertex
fn main(@location(0) position: vec2<f32>) -> @builtin(position) vec4<f32> {
  let pos = (position - uniforms.offset) * uniforms.zoom;
  return vec4<f32>(pos, 0.0, 1.0);
}

  `,
    FRAGMENT = `
  @group(0) @binding(1) var<uniform> color: vec4<f32>; // Add color uniform

  @fragment
  fn main() -> @location(0) vec4<f32> {
    return color; // Use the uniform color
  }

  `
  }
  