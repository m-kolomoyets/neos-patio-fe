const VERT = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = vec2((a_pos.x + 1.0) * 0.5, 1.0 - (a_pos.y + 1.0) * 0.5);
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const FRAG = `
precision mediump float;
varying vec2 v_uv;
uniform sampler2D u_color;
uniform sampler2D u_depth;
uniform vec2 u_mouse;
uniform vec2 u_uvScale;
uniform float u_strength;
uniform float u_focus;
uniform float u_invert;

float sampleDepth(vec2 uv) {
  float d = texture2D(u_depth, uv).r;
  return mix(d, 1.0 - d, u_invert);
}

void main() {
  vec2 baseUv = (v_uv - 0.5) * u_uvScale + 0.5;
  vec2 uv = baseUv;
  for (int i = 0; i < 10; i++) {
    float d = sampleDepth(uv) - u_focus;
    uv = baseUv + u_mouse * u_strength * d;
  }
  uv = clamp(uv, 0.0, 1.0);
  gl_FragColor = texture2D(u_color, uv);
}
`;

const compile = (gl: WebGLRenderingContext, type: number, src: string): WebGLShader => {
    const sh = gl.createShader(type);
    if (!sh) throw new Error('createShader failed');
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        const log = gl.getShaderInfoLog(sh);
        gl.deleteShader(sh);
        throw new Error(`Shader compile: ${log}`);
    }
    return sh;
};

const link = (gl: WebGLRenderingContext, vs: WebGLShader, fs: WebGLShader): WebGLProgram => {
    const prog = gl.createProgram();
    if (!prog) throw new Error('createProgram failed');
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        const log = gl.getProgramInfoLog(prog);
        gl.deleteProgram(prog);
        throw new Error(`Program link: ${log}`);
    }
    return prog;
};

const uploadTex = (gl: WebGLRenderingContext, bmp: ImageBitmap): WebGLTexture => {
    const tex = gl.createTexture();
    if (!tex) throw new Error('createTexture failed');
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bmp);
    return tex;
};

export type Renderer = {
    setSize: (_w: number, _h: number) => void;
    draw: (_mouseX: number, _mouseY: number) => void;
    setFocus: (_v: number) => void;
    setStrength: (_v: number) => void;
    setInvert: (_v: boolean) => void;
    dispose: () => void;
};

export const createRenderer = (
    canvas: HTMLCanvasElement,
    color: ImageBitmap,
    depth: ImageBitmap,
    initial: { strength: number; focus: number; invert: boolean }
): Renderer | null => {
    const gl = canvas.getContext('webgl', {
        alpha: true,
        antialias: false,
        premultipliedAlpha: true,
    });
    if (!gl) return null;

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    const prog = link(gl, vs, fs);
    gl.deleteShader(vs);
    gl.deleteShader(fs);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const aPos = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uColor = gl.getUniformLocation(prog, 'u_color');
    const uDepth = gl.getUniformLocation(prog, 'u_depth');
    const uMouse = gl.getUniformLocation(prog, 'u_mouse');
    const uUvScale = gl.getUniformLocation(prog, 'u_uvScale');
    const uStrength = gl.getUniformLocation(prog, 'u_strength');
    const uFocus = gl.getUniformLocation(prog, 'u_focus');
    const uInvert = gl.getUniformLocation(prog, 'u_invert');

    const imageAspect = color.width / color.height;

    const colorTex = uploadTex(gl, color);
    const depthTex = uploadTex(gl, depth);

    gl.useProgram(prog);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, colorTex);
    gl.uniform1i(uColor, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, depthTex);
    gl.uniform1i(uDepth, 1);

    let strength = initial.strength;
    let focus = initial.focus;
    let invert = initial.invert ? 1 : 0;

    gl.uniform1f(uStrength, strength);
    gl.uniform1f(uFocus, focus);
    gl.uniform1f(uInvert, invert);
    gl.uniform2f(uUvScale, 1, 1);

    const applyCover = (w: number, h: number) => {
        const canvasAspect = w / h;
        let sx = 1;
        let sy = 1;
        if (imageAspect > canvasAspect) {
            sx = canvasAspect / imageAspect;
        } else {
            sy = imageAspect / canvasAspect;
        }
        gl.uniform2f(uUvScale, sx, sy);
    };

    return {
        setSize(w, h) {
            canvas.width = w;
            canvas.height = h;
            gl.viewport(0, 0, w, h);
            applyCover(w, h);
        },
        draw(mx, my) {
            gl.uniform2f(uMouse, mx, my);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        },
        setFocus(v) {
            focus = v;
            gl.uniform1f(uFocus, v);
        },
        setStrength(v) {
            strength = v;
            gl.uniform1f(uStrength, v);
        },
        setInvert(v) {
            invert = v ? 1 : 0;
            gl.uniform1f(uInvert, invert);
        },
        dispose() {
            gl.deleteTexture(colorTex);
            gl.deleteTexture(depthTex);
            gl.deleteBuffer(buf);
            gl.deleteProgram(prog);
            const ext = gl.getExtension('WEBGL_lose_context');
            ext?.loseContext();
        },
    };
};
