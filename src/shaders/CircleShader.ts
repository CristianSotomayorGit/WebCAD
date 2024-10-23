export enum CircleShader {
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
      padding: f32,
    }

    @group(0) @binding(0) var<uniform> uniforms: Uniforms;

    struct VertexOutput {
      @builtin(position) position: vec4<f32>,
    }

    @vertex
    fn main(@location(0) position: vec2<f32>) -> VertexOutput {
      var output: VertexOutput;
      let pos = (position - uniforms.cameraOffset) * uniforms.zoomFactor;
      output.position = vec4<f32>(pos, 0.0, 1.0);
      return output;
    }
    `
}