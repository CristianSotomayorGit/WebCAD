export enum LineShader {
    FRAGMENT =
    `
    @fragment
    fn main() -> @location(0) vec4<f32> {
        // Cyan color for the lines being drawn
        return vec4<f32>(0.0, 1.0, 1.0, 1.0);
    }
`,
    VERTEX= `
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