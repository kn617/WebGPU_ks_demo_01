const canvas = document.querySelector('canvas')! as HTMLCanvasElement;
const video = document.createElement('video');
video.autoplay = true;
video.style.display = 'none';
document.body.appendChild(video);

interface Uniforms {
  time: number;
  segments: number;
  shape: number;
  resolution: [number, number];
}

async function start() {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;
  await video.play();

  if (!navigator.gpu) throw new Error('WebGPU not supported');
  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter!.requestDevice();

  const context = canvas.getContext('webgpu')!;
  const format = navigator.gpu.getPreferredCanvasFormat();
  context.configure({ device, format });

  const uniforms: Uniforms = {
    time: 0,
    segments: Number(localStorage.getItem('segments') || 6),
    shape: localStorage.getItem('shape') === 'triangle' ? 1 : 0,
    resolution: [canvas.width, canvas.height]
  };

  const uniformBuffer = device.createBuffer({
    size: 4 * 4,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  });

  const sampler = device.createSampler({ magFilter: 'linear', minFilter: 'linear' });

  const shader = device.createShaderModule({
    code: `struct Uniforms { time: f32, segments: f32, shape: f32, width: f32 };@group(0) @binding(0) var<uniform> uni: Uniforms;@group(0) @binding(1) var img: texture_external;@group(0) @binding(2) var samp: sampler;
      @vertex fn vs(@builtin(vertex_index) i: u32) -> @builtin(position) vec4f {
        var pos = array<vec2f,6>(
          vec2f(-1,-1), vec2f(1,-1), vec2f(-1,1),
          vec2f(-1,1), vec2f(1,-1), vec2f(1,1)
        );
        return vec4f(pos[i],0,1);
      }
      fn kaleido(uv: vec2f) -> vec2f {
        let r = length(uv);
        var a = atan2(uv.y, uv.x) + uni.time;
        let k = uni.segments / 2.0;
        a = abs(mod(a, 2.0*3.14159265/k) - 3.14159265/k);
        return vec2f(cos(a), sin(a)) * r;
      }
      @fragment fn fs(@builtin(position) pos: vec4f) -> @location(0) vec4f {
        var uv = (pos.xy/uni.width)*2.0 - 1.0;
        var coord = kaleido(uv);
        var color = textureSampleLevel(img, samp, coord*0.5+0.5, 0.0);
        if (uni.shape < 0.5 && length(uv) > 1.0) { discard; }
        return color;
      }`
  });

  const pipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: { module: shader, entryPoint: 'vs' },
    fragment: { module: shader, entryPoint: 'fs', targets: [{ format }] },
    primitive: { topology: 'triangle-list' }
  });

  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: uniformBuffer } },
      { binding: 1, resource: device.importExternalTexture({ source: video }) },
      { binding: 2, resource: sampler }
    ]
  });

  function frame(t: number) {
    uniforms.time = t / 1000;
    device.queue.writeBuffer(uniformBuffer, 0, new Float32Array([
      uniforms.time,
      uniforms.segments,
      uniforms.shape,
      canvas.width
    ]));

    const encoder = device.createCommandEncoder();
    const pass = encoder.beginRenderPass({
      colorAttachments: [
        { view: context.getCurrentTexture().createView(), loadOp: 'clear', storeOp: 'store' }
      ]
    });
    pass.setPipeline(pipeline);
    pass.setBindGroup(0, bindGroup);
    pass.draw(6);
    pass.end();
    device.queue.submit([encoder.finish()]);

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

start().catch(err => console.error(err));
