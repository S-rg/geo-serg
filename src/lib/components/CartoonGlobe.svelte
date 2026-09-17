<script lang="ts">
  import { onMount } from 'svelte';
  import { worldLandmasses } from '$lib/data/worldLandmasses';

  interface Props {
    size?: number;
  }

  let { size = 560 }: Props = $props();

  let canvasEl = $state<HTMLCanvasElement | null>(null);
  let isDragging = $state(false);

  // Rotation angles (in radians)
  let rotLon = 1.2; // initial horizontal rotation
  let rotLat = 0.35; // ~20 deg axial tilt
  let velLon = -0.0035; // steady auto-spin (eastward)
  let velLat = 0;
  let targetAutoSpin = -0.0035;

  let lastPointerX = 0;
  let lastPointerY = 0;
  let lastMoveTime = 0;

  // Vertex shader source
  const vsSource = `
    attribute vec2 aPosition;
    varying vec2 vUv;
    void main() {
      vUv = aPosition;
      gl_Position = vec4(aPosition, 0.0, 1.0);
    }
  `;

  // Fragment shader source
  const fsSource = `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uTexture;
    uniform float uRotLon;
    uniform float uRotLat;
    uniform float uRadiusRatio;

    void main() {
      // Scale coordinates so globe fits nicely inside canvas with room for halo
      vec2 p = vUv / uRadiusRatio;
      float r2 = dot(p, p);

      // Outside sphere: Atmosphere glow halo
      if (r2 > 1.0) {
        float r = sqrt(r2);
        if (r < 1.32) {
          float halo = pow(1.0 - (r - 1.0) / 0.32, 2.5) * 0.42;
          vec3 haloColor = mix(vec3(0.15, 0.8, 1.0), vec3(0.55, 0.25, 1.0), (r - 1.0) / 0.32);
          gl_FragColor = vec4(haloColor * halo, halo);
        } else {
          gl_FragColor = vec4(0.0);
        }
        return;
      }

      // 3D Sphere Surface Normal
      float z = sqrt(1.0 - r2);
      vec3 n = vec3(p.x, p.y, z);

      // 1. Axial tilt around X axis
      float sLat = sin(uRotLat);
      float cLat = cos(uRotLat);
      vec3 p1 = vec3(n.x, n.y * cLat - n.z * sLat, n.y * sLat + n.z * cLat);

      // 2. Spin around Y axis
      float sLon = sin(uRotLon);
      float cLon = cos(uRotLon);
      vec3 p2 = vec3(p1.x * cLon + p1.z * sLon, p1.y, -p1.x * sLon + p1.z * cLon);

      // Equirectangular projection
      float lat = asin(clamp(p2.y, -1.0, 1.0));
      float lon = atan(p2.x, p2.z);

      float u = (lon / 3.1415926535 + 1.0) * 0.5;
      float v = (lat / 1.5707963267 + 1.0) * 0.5;

      vec4 surfaceColor = texture2D(uTexture, vec2(u, v));

      // Lighting & Cartoon Shading (Light from upper left)
      vec3 lightDir = normalize(vec3(-0.55, 0.6, 0.75));
      float diff = dot(n, lightDir);

      // Cel-shading step
      float shadowStep = smoothstep(-0.25, 0.2, diff);
      vec3 litColor = mix(surfaceColor.rgb * 0.45 + vec3(0.02, 0.04, 0.12), surfaceColor.rgb, 0.35 + 0.65 * shadowStep);

      // Fresnel rim light (cyan atmosphere ring)
      float fresnel = pow(1.0 - z, 2.4);
      vec3 rim = vec3(0.1, 0.88, 1.0) * fresnel * 0.75;

      vec3 finalColor = litColor + rim;
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `;

  function createTexture(gl: WebGLRenderingContext): WebGLTexture | null {
    const texCanvas = document.createElement('canvas');
    const tw = 2048;
    const th = 1024;
    texCanvas.width = tw;
    texCanvas.height = th;
    const ctx = texCanvas.getContext('2d');
    if (!ctx) return null;

    // 1. Ocean Base (Solid Vibrant Cartoon Tropical Azure - No wave reflections)
    const oceanGrad = ctx.createLinearGradient(0, 0, 0, th);
    oceanGrad.addColorStop(0, '#1a6ecc');
    oceanGrad.addColorStop(0.5, '#227fda');
    oceanGrad.addColorStop(1, '#155bb5');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, tw, th);

    const lonToX = (lon: number) => ((lon + 180) / 360) * tw;
    const latToY = (lat: number) => ((90 - lat) / 180) * th;

    // 2. Draw Continents
    ctx.fillStyle = '#38d46a'; // Cartoon emerald green
    ctx.strokeStyle = '#1e9948'; // Rich darker green border
    ctx.lineWidth = 3.0;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    for (const land of worldLandmasses) {
      if (!land.exterior || land.exterior.length === 0) continue;

      // Draw standard and offset for wrapping
      for (const offsetX of [0, tw, -tw]) {
        ctx.beginPath();
        let started = false;
        let prevLon = 0;

        for (const [lon, lat] of land.exterior) {
          const x = lonToX(lon) + offsetX;
          const y = latToY(lat);
          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else if (Math.abs(lon - prevLon) > 120) {
            // Antimeridian wrap: break line so it does not shoot across the world
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          prevLon = lon;
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }

    // 3. Upload texture to WebGL
    const texture = gl.createTexture();
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texCanvas);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    return texture;
  }

  onMount(() => {
    if (!canvasEl) return;
    const canvas = canvasEl;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = size * dpr;
    canvas.height = size * dpr;

    const gl = canvas.getContext('webgl', { alpha: true, antialias: true });
    if (!gl) {
      console.warn('WebGL not supported');
      return;
    }

    // Compile Shaders
    const createShader = (type: number, src: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vs = createShader(gl.VERTEX_SHADER, vsSource);
    const fs = createShader(gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
      return;
    }
    gl.useProgram(program);

    // Quad geometry covering [-1, 1]
    const quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1, -1,
         1, -1,
        -1,  1,
        -1,  1,
         1, -1,
         1,  1,
      ]),
      gl.STATIC_DRAW
    );

    const aPositionLoc = gl.getAttribLocation(program, 'aPosition');
    gl.enableVertexAttribArray(aPositionLoc);
    gl.vertexAttribPointer(aPositionLoc, 2, gl.FLOAT, false, 0, 0);

    const uTextureLoc = gl.getUniformLocation(program, 'uTexture');
    const uRotLonLoc = gl.getUniformLocation(program, 'uRotLon');
    const uRotLatLoc = gl.getUniformLocation(program, 'uRotLat');
    const uRadiusRatioLoc = gl.getUniformLocation(program, 'uRadiusRatio');

    gl.uniform1i(uTextureLoc, 0);
    gl.uniform1f(uRadiusRatioLoc, 0.74); // globe takes ~74% of canvas, leaving border for atmosphere

    // Create and bind texture
    const texture = createTexture(gl);
    if (!texture) return;

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Pointer Drag Controls
    const handlePointerDown = (e: PointerEvent) => {
      isDragging = true;
      lastPointerX = e.clientX;
      lastPointerY = e.clientY;
      lastMoveTime = performance.now();
      velLon = 0;
      velLat = 0;
      canvas.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const now = performance.now();
      const dt = Math.max(now - lastMoveTime, 1);
      const dx = e.clientX - lastPointerX;
      const dy = e.clientY - lastPointerY;

      const sensitivity = 0.005;
      rotLon -= dx * sensitivity;
      rotLat -= dy * sensitivity;

      // Clamp vertical tilt
      rotLat = Math.max(-0.85, Math.min(0.85, rotLat));

      velLon = -(dx / dt) * 0.05;
      velLat = -(dy / dt) * 0.05;

      lastPointerX = e.clientX;
      lastPointerY = e.clientY;
      lastMoveTime = now;
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (!isDragging) return;
      isDragging = false;
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {}
    };

    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointercancel', handlePointerUp);

    let animId: number;

    const render = () => {
      // Auto-spin & momentum
      if (!isDragging) {
        rotLon += velLon;
        rotLat += velLat;

        velLon = velLon * 0.95 + targetAutoSpin * 0.05;
        velLat *= 0.92;

        // Smoothly settle pitch toward ~20 deg
        rotLat += (0.35 - rotLat) * 0.015;
      }

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.uniform1f(uRotLonLoc, rotLon);
      gl.uniform1f(uRotLatLoc, rotLat);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('pointercancel', handlePointerUp);
    };
  });
</script>

<div class="cartoon-globe-wrapper">
  <canvas
    bind:this={canvasEl}
    class="globe-canvas {isDragging ? 'is-dragging' : ''}"
    style="width: {size}px; height: {size}px;"
  ></canvas>
</div>

<style>
  .cartoon-globe-wrapper {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    user-select: none;
    touch-action: none;
  }

  .globe-canvas {
    display: block;
    cursor: grab;
    transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
    filter: drop-shadow(0 20px 40px rgba(0, 0, 0, 0.55));
  }

  .globe-canvas:hover {
    transform: scale(1.02);
  }

  .globe-canvas.is-dragging {
    cursor: grabbing;
    transform: scale(1.03);
  }
</style>
