// src/shaders/ArcShader.ts

export enum ArcShader {
    VERTEX = `
      struct Uniforms {
        cameraOffset : vec2<f32>,
        zoom : f32,
      };
  
      @binding(0) @group(0) var<uniform> uniforms : Uniforms;
  
      struct VertexOutput {
        @builtin(position) Position : vec4<f32>,
        @location(0) fragPosition : vec2<f32>,
      };
  
      @vertex
      fn main(@location(0) position : vec2<f32>) -> VertexOutput {
        var output : VertexOutput;
        // Apply camera transformation
        let zoomedPosition = (position - uniforms.cameraOffset) * uniforms.zoom;
        output.Position = vec4<f32>(zoomedPosition, 0.0, 1.0);
        output.fragPosition = position;
        return output;
      }
    `,

    FRAGMENT = `
      struct FragmentInput {
        @location(0) fragPosition : vec2<f32>,
      };
  
      struct ColorUniform {
        color : vec4<f32>,
      };
  
      @binding(1) @group(0) var<uniform> colorUniform : ColorUniform;
  
      @fragment
      fn main(input : FragmentInput) -> @location(0) vec4<f32> {
        // Simply output the uniform color
        return colorUniform.color;
      }
    `
}
