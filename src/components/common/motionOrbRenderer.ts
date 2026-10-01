// Original procedural GLSL, owned by Nexior. No MetalForge code or assets.
const vertexSource = `attribute vec2 position;
varying vec2 uv;
void main() { uv = position; gl_Position = vec4(position, 0.0, 1.0); }`;
const fragmentSource = `precision mediump float;
varying vec2 uv;
uniform float time;
void main() {
  vec2 p = uv * 1.16;
  float radius = length(p);
  float mask = 1.0 - smoothstep(0.86, 0.91, radius);
  float z = sqrt(max(0.0, 0.81 - dot(p, p)));
  vec3 normal = normalize(vec3(p, z));
  float phase = time * 0.42;
  float ribbons = sin(p.x * 9.0 + sin(p.y * 5.0 + phase) * 2.3 + z * 7.0 - phase);
  float folds = sin(p.y * 12.0 - p.x * 4.0 + z * 5.0 + phase * 1.4);
  float silk = smoothstep(-0.6, 0.9, ribbons + folds * 0.35);
  vec3 color = mix(vec3(0.12, 0.10, 0.26), vec3(0.64, 0.49, 0.90), silk);
  color = mix(color, vec3(0.50, 0.80, 0.91), smoothstep(0.6, 1.0, folds) * 0.42);
  float diffuse = max(0.0, dot(normal, normalize(vec3(-0.65, 0.8, 1.0))));
  color *= 0.42 + diffuse * 0.85;
  float edge = pow(1.0 - max(z / 0.9, 0.0), 3.0);
  color += edge * vec3(0.35, 0.32, 0.60);
  float shine = pow(max(dot(normal, normalize(vec3(-0.45, 0.65, 1.7))), 0.0), 26.0);
  color += shine * vec3(0.60, 0.58, 0.68);
  float glow = exp(-pow((radius - 0.88) * 20.0, 2.0)) * 0.16;
  float alpha = mask + glow * (1.0 - mask);
  gl_FragColor = vec4(mix(vec3(0.45, 0.34, 0.80), color, mask), alpha);
}`;

export interface OrbRenderer {
  draw: (time: number) => void;
  dispose: () => void;
}
export function createOrbRenderer(canvas: HTMLCanvasElement, pixels: number): OrbRenderer | undefined {
  let gl: WebGLRenderingContext | null;
  try {
    gl = canvas.getContext('webgl', { alpha: true, antialias: false, depth: false, premultipliedAlpha: false });
  } catch {
    return;
  }
  if (!gl) return;
  const context = gl;
  const shaders: WebGLShader[] = [];
  let program: WebGLProgram | null = null;
  let buffer: WebGLBuffer | null = null;
  const dispose = () => {
    if (buffer) context.deleteBuffer(buffer);
    if (program) context.deleteProgram(program);
    shaders.forEach((shader) => context.deleteShader(shader));
  };
  const compile = (type: number, source: string) => {
    const shader = context.createShader(type);
    if (!shader) return null;
    shaders.push(shader);
    context.shaderSource(shader, source);
    context.compileShader(shader);
    return context.getShaderParameter(shader, context.COMPILE_STATUS) ? shader : null;
  };
  const vertex = compile(context.VERTEX_SHADER, vertexSource);
  const fragment = compile(context.FRAGMENT_SHADER, fragmentSource);
  program = context.createProgram();
  if (!vertex || !fragment || !program) {
    dispose();
    return;
  }
  context.attachShader(program, vertex);
  context.attachShader(program, fragment);
  context.linkProgram(program);
  if (!context.getProgramParameter(program, context.LINK_STATUS)) {
    dispose();
    return;
  }
  buffer = context.createBuffer();
  if (!buffer) {
    dispose();
    return;
  }
  canvas.width = canvas.height = Math.max(1, Math.round(pixels));
  context.viewport(0, 0, canvas.width, canvas.height);
  context.useProgram(program);
  context.bindBuffer(context.ARRAY_BUFFER, buffer);
  context.bufferData(
    context.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    context.STATIC_DRAW
  );
  const position = context.getAttribLocation(program, 'position');
  context.enableVertexAttribArray(position);
  context.vertexAttribPointer(position, 2, context.FLOAT, false, 0, 0);
  const time = context.getUniformLocation(program, 'time');
  return {
    draw(seconds) {
      context.uniform1f(time, seconds);
      context.drawArrays(context.TRIANGLES, 0, 6);
    },
    dispose
  };
}
