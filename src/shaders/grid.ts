const vertexShaderCode = `
    struct Uniforms {
        cameraOffset: vec2<f32>,  // Camera offset
        zoomFactor: f32,          // Zoom factor
        padding: f32,             // Padding for alignment
    };
    
    @group(0) @binding(0) var<uniform> uniforms: Uniforms;

    @vertex
    fn main(@location(0) position: vec2<f32>) -> @builtin(position) vec4<f32> {
        let cameraPosition = (position - uniforms.cameraOffset) * uniforms.zoomFactor;  // Apply camera offset and zoom
        return vec4<f32>(cameraPosition, 0.0, 1.0);            // Output final position
    }
`;


const lineFragmentShaderCode = `
    @fragment
    fn main() -> @location(0) vec4<f32> {
        // Cyan color for the lines being drawn
        return vec4<f32>(0.0, 1.0, 1.0, 1.0);
    }
`;

const circleVertexShaderCode = `
    @vertex
    fn main(@location(0) position: vec2<f32>) -> @builtin(position) vec4<f32> {
        let scale = 0.03;  // Increase the size of the vertex dots for lines
        let scaledPosition = position * scale;  // Scale to make larger dots
        return vec4<f32>(scaledPosition, 0.0, 1.0);
    }
`;

const circleFragmentShaderCode = `
    @fragment
    fn main() -> @location(0) vec4<f32> {
        // Gray color for the vertices of the lines
        return vec4<f32>(0.5, 0.5, 0.5, 1.0);
    }
`;

export enum Grid {
    FRAGEMENTSHADER =
    `
    @fragment
    fn main() -> @location(0) vec4<f32> {
        return vec4<f32>(59.0 / 255.0, 65.0 / 255.0, 72.0 / 255.0, 1.0); // Grid color
    }
`
}
