// src/shaders/PointShader.ts

export enum PointShader {
  FRAGMENT = `
  @group(0) @binding(1) var<uniform> color: vec4<f32>;

  @fragment
  fn main(@location(0) vUV: vec2<f32>) -> @location(0) vec4<f32> {
    let dist = length(vUV);
    let outlineWidth = 0.1; // Adjust the outline thickness as needed
    if (dist > 0.5 || dist < 0.5 - outlineWidth) {
      discard;
    }
    return color;
  }
  `,
  VERTEX = `
  struct Uniforms {
    cameraOffset: vec2<f32>,
    zoomFactor: f32,
    pointSize: f32,
    pointPosition: vec2<f32>,
  }

  @group(0) @binding(0) var<uniform> uniforms: Uniforms;

  struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) vUV: vec2<f32>,
  }

  @vertex
  fn main(@location(0) vertexPosition: vec2<f32>) -> VertexOutput {
    var output: VertexOutput;

    // Compute the center position
    let center = (uniforms.pointPosition - uniforms.cameraOffset) * uniforms.zoomFactor;

    // Transform to clip space
    let centerClip = vec4<f32>(center, 0.0, 1.0);

    // Compute the offsets in NDC units
    let offset = vertexPosition * uniforms.pointSize;

    // Add the offset to the center position in clip space
    output.position = centerClip + vec4<f32>(offset, 0.0, 0.0);

    output.vUV = vertexPosition;

    return output;
  }
  `,
}
