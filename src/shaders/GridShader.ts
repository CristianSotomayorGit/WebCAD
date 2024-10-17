// export enum GridShader {
//     FRAGMENT =
//     `
//     @fragment
//     fn main() -> @location(0) vec4<f32> {
//         return vec4<f32>(59.0 / 255.0, 65.0 / 255.0, 72.0 / 255.0, 1.0); // Grid color
//     }
// `,

//     VERTEX = `
//         struct Uniforms {
//         cameraOffset: vec2<f32>,  
//         zoomFactor: f32,      
//         padding: f32,      
//     };

//     @group(0) @binding(0) var<uniform> uniforms: Uniforms;

//     @vertex
//     fn main(@location(0) position: vec2<f32>) -> @builtin(position) vec4<f32> {
//         let cameraPosition = (position - uniforms.cameraOffset) * uniforms.zoomFactor;  
//         return vec4<f32>(cameraPosition, 0.0, 1.0);            
//     }; 
// `
// }

export enum GridShader {
    FRAGMENT =
    `
@fragment
fn fs_main(
    @location(0) fragPosition: vec2<f32>,
    @location(1) zoomFactor: f32
) -> @location(0) vec4<f32> {
  // Grid parameters
  let minorGridSpacing: f32 = 0.125;
  let lineThickness: f32 = 0.003125;

  // Calculate distance to nearest minor grid lines
  let distXMinor = ((fragPosition.x / zoomFactor) - floor((fragPosition.x / zoomFactor) / minorGridSpacing) * minorGridSpacing) ;
  let distYMinor = ((fragPosition.y / zoomFactor) - floor((fragPosition.y / zoomFactor) / minorGridSpacing) * minorGridSpacing);
  let minorOnLine = (distXMinor < lineThickness) || (distYMinor < lineThickness);

  // Define colors
  let colorMinor: vec4<f32> = vec4<f32>(59.0 / 255.0, 65.0 / 255.0, 72.0 / 255.0, 1.0); // Light gray

  // Determine final color
  if (minorOnLine) {
    return colorMinor;
  } 
  // Background color can be added here if needed
  return vec4<f32>(0.1294, 0.1569,  0.1882,  1 ); // Default background color (black)
}
`,

    VERTEX = `
struct Uniforms {
  cameraOffset: vec2<f32>,
  zoomFactor: f32,
};

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) fragPosition: vec2<f32>,
  @location(1) zoomFactor: f32, // Added zoomFactor to output
};

@vertex
fn vs_main(@location(0) position: vec2<f32>) -> VertexOutput {
  var out: VertexOutput;
  out.position = vec4<f32>(position, 0.0, 1.0);
  out.fragPosition = (position + uniforms.cameraOffset);
  out.zoomFactor = uniforms.zoomFactor; // Pass zoomFactor to fragment shader

  return out;
}
`
}


// struct Uniforms {
//     cameraOffset: vec2<f32>,
//     zoomFactor: f32,
//     padding: f32,
//   }

//   @group(0) @binding(0) var<uniform> uniforms: Uniforms;

//   struct VertexOutput {
//     @builtin(position) position: vec4<f32>,
//   }

//   @vertex
//   fn main(@location(0) position: vec2<f32>) -> VertexOutput {
//     var output: VertexOutput;
//     let pos = (position - uniforms.cameraOffset) * uniforms.zoomFactor;
//     output.position = vec4<f32>(pos, 0.0, 1.0);
//     return output;
//   }
// }

