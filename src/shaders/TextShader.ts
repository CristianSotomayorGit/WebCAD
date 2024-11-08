// src/shaders/TextShader.ts

export enum TextShader {
    VERTEX = `
    struct Uniforms {
        cameraOffset: vec2<f32>,
        zoomFactor: f32,
    }
  
    @group(0) @binding(0) var<uniform> uniforms: Uniforms;
  
    struct VertexOutput {
        @builtin(position) position: vec4<f32>,
        @location(0) texCoord: vec2<f32>,
    }
  
    @vertex
    fn main(@location(0) position: vec2<f32>, @location(1) texCoord: vec2<f32>) -> VertexOutput {
        var output: VertexOutput;
        let pos = (position - uniforms.cameraOffset) * uniforms.zoomFactor;
        output.position = vec4<f32>(pos, 0.0, 1.0);
        output.texCoord = texCoord;
        return output;
    }
    `,
    FRAGMENT = `
    @group(0) @binding(1) var textTexture: texture_2d<f32>;
    @group(0) @binding(2) var textSampler: sampler;
    @group(0) @binding(3) var<uniform> color: vec4<f32>; // Color uniform
  
    @fragment
    fn main(@location(0) texCoord: vec2<f32>) -> @location(0) vec4<f32> {
        let sampledColor = textureSample(textTexture, textSampler, texCoord);
        return sampledColor * color; // Apply the color to the sampled texture color
    }
    `
  }
  