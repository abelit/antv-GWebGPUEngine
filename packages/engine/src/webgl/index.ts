/**
 * render w/ regl
 * @see https://github.com/regl-project/regl/blob/gh-pages/API.md
 */
import { GLSLContext } from '@antv/g-webgpu-compiler';
import {
  IAttribute,
  IAttributeInitializationOptions,
  IBuffer,
  IBufferInitializationOptions,
  IClearOptions,
  IComputeModel,
  IElements,
  IElementsInitializationOptions,
  IFramebuffer,
  IFramebufferInitializationOptions,
  IModel,
  IModelInitializationOptions,
  IReadPixelsOptions,
  IRendererConfig,
  IRendererService,
  ITexture2D,
  ITexture2DInitializationOptions,
} from '@antv/g-webgpu-core';
import { injectable } from 'inversify';
import regl from 'regl';
import ReglAttribute from './ReglAttribute';
import ReglBuffer from './ReglBuffer';
import ReglComputeModel from './ReglComputeModel';
import ReglElements from './ReglElements';
import ReglFramebuffer from './ReglFramebuffer';
import ReglModel from './ReglModel';
import ReglTexture2D from './ReglTexture2D';

/**
 * regl renderer
 */
@injectable()
export class WebGLEngine implements IRendererService {
  public supportWebGPU = false;
  private $canvas: HTMLCanvasElement;
  private gl: regl.Regl;

  public async init(cfg: IRendererConfig): Promise<void> {
    this.$canvas = cfg.canvas;
    // tslint:disable-next-line:typedef
    this.gl = await new Promise((resolve, reject) => {
      regl({
        canvas: cfg.canvas,
        attributes: {
          alpha: true,
          // use TAA instead of MSAA
          // @see https://www.khronos.org/registry/webgl/specs/1.0/#5.2.1
          antialias: cfg.antialias,
          premultipliedAlpha: true,
          preserveDrawingBuffer: true,
        },
        // TODO: use extensions
        extensions: [
          'OES_element_index_uint',
          'OES_texture_float',
          'OES_standard_derivatives', // wireframe
          'angle_instanced_arrays', // VSM shadow map
        ],
        optionalExtensions: [
          'EXT_texture_filter_anisotropic',
          'EXT_blend_minmax',
          'WEBGL_depth_texture',
        ],
        profile: true,
        onDone: (err: Error | null, r?: regl.Regl | undefined): void => {
          if (err || !r) {
            reject(err);
          }
          resolve(r);
        },
      });
    });
  }

  public isFloatSupported() {
    // @see https://github.com/antvis/GWebGPUEngine/issues/26
    // @ts-ignore
    return this.gl.limits.readFloat;
  }

  // public createComputeModel = () => {

  // };

  public createModel = async (
    options: IModelInitializationOptions,
  ): Promise<IModel> => new ReglModel(this.gl, options);

  public createAttribute = (
    options: IAttributeInitializationOptions,
  ): IAttribute => new ReglAttribute(this.gl, options);

  public createBuffer = (options: IBufferInitializationOptions): IBuffer =>
    new ReglBuffer(this.gl, options);

  public createElements = (
    options: IElementsInitializationOptions,
  ): IElements => new ReglElements(this.gl, options);

  public createTexture2D = (
    options: ITexture2DInitializationOptions,
  ): ITexture2D => new ReglTexture2D(this.gl, options);

  public createFramebuffer = (options: IFramebufferInitializationOptions) =>
    new ReglFramebuffer(this.gl, options);

  public useFramebuffer = (
    framebuffer: IFramebuffer | null,
    drawCommands: () => void,
  ) => {
    this.gl({
      framebuffer: framebuffer ? (framebuffer as ReglFramebuffer).get() : null,
    })(drawCommands);
  };

  public createComputeModel = async (
    context: GLSLContext,
  ): Promise<IComputeModel> => {
    return new ReglComputeModel(this.gl, context);
  };

  public clear = (options: IClearOptions) => {
    // @see https://github.com/regl-project/regl/blob/gh-pages/API.md#clear-the-draw-buffer
    const { color, depth, stencil, framebuffer = null } = options;
    const reglClearOptions: regl.ClearOptions = {
      color,
      depth,
      stencil,
    };

    reglClearOptions.framebuffer =
      framebuffer === null
        ? framebuffer
        : (framebuffer as ReglFramebuffer).get();

    this.gl.clear(reglClearOptions);
  };

  public viewport = ({
    x,
    y,
    width,
    height,
  }: {
    x: number;
    y: number;
    width: number;
    height: number;
  }) => {
    if (this.gl && this.gl._gl) {
      // use WebGL context directly
      // @see https://github.com/regl-project/regl/blob/gh-pages/API.md#unsafe-escape-hatch
      this.gl._gl.viewport(x, y, width, height);
      this.gl._refresh();
    }
  };

  public readPixels = (options: IReadPixelsOptions) => {
    const { framebuffer, x, y, width, height } = options;
    const readPixelsOptions: regl.ReadOptions = {
      x,
      y,
      width,
      height,
    };
    if (framebuffer) {
      readPixelsOptions.framebuffer = (framebuffer as ReglFramebuffer).get();
    }
    return this.gl.read(readPixelsOptions);
  };

  public getViewportSize = () => {
    return {
      width: this.gl._gl.drawingBufferWidth,
      height: this.gl._gl.drawingBufferHeight,
    };
  };

  // public getContainer = () => {
  //   return this.$container;
  // };

  public getCanvas = () => {
    return this.$canvas;
  };

  public getGLContext = () => {
    return this.gl._gl;
  };

  public destroy = () => {
    if (this.gl) {
      // @see https://github.com/regl-project/regl/blob/gh-pages/API.md#clean-up
      this.gl.destroy();
    }
  };

  public beginFrame() {
    //
  }

  public endFrame() {
    //
  }
}
