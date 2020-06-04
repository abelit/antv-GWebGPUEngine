import { builtinFunctions, Target } from '../builtin-functions';
import { GLSLContext } from '../index';
import { IShaderGenerator } from './IShaderGenerator';

/**
 * 生成供 WebGL 使用的 GLSL 100
 * 内容大致为：
 * 1. WorkGroup 声明 layout (local_size_x
 * 2. 常量 #define
 * 3. 变量 layout(std140, set = 0, binding = 0) uniform GWebGPUParams
 * 4. Buffers
 * 5. 全局变量声明
 * 6. 函数声明
 *   6.1 内置 import
 *   6.2 用户自定义
 * 7. main 函数
 */
export class WebGLShaderGenerator implements IShaderGenerator {
  private bufferBindingIndex = -1;

  public generateShaderCode(glslContext: GLSLContext, main: string): string {
    this.bufferBindingIndex = -1;
    return `
#ifdef GL_FRAGMENT_PRECISION_HIGH
  precision highp float;
#else
  precision mediump float;
#endif
${this.generateDefines(glslContext)}
${this.generateUniforms(glslContext)}
${builtinFunctions[Target.WebGL]}
${this.generateDataTextureGetters(glslContext)}
uniform vec2 u_OutputTextureSize;
uniform int u_OutputTexelCount;
varying vec2 v_TexCoord;

${main}
    `.replace(/this\./g, ''); // 替换掉所有 'this.' 全局作用域;
  }

  public generateDefines(glslContext: GLSLContext): string {
    // 生成编译时 defines
    return glslContext.defines
      .filter((define) => !define.runtime)
      .map((define) => `#define ${define.name} ${define.value}`)
      .join('\n');
  }

  public generateUniforms(glslContext: GLSLContext): string {
    return glslContext.uniforms
      .map((uniform) => `uniform ${uniform.type} ${uniform.name};`)
      .join('\n')
      .trim();
  }

  public generateDataTextureGetters(glslContext: GLSLContext): string {
    return glslContext.uniforms
      .filter((u) => u.type === 'sampler2D')
      .map(({ name, format }) => {
        const returnFormat = format.replace('[]', '');
        return `
uniform vec2 ${name}Size;
${returnFormat} getData${name}(vec2 address2D) {
  return ${returnFormat}(texture2D(${name}, address2D)${this.generateSwizzling(
          returnFormat,
        )});
}
${returnFormat} getData${name}(float address1D) {
  return getData${name}(addrTranslation_1Dto2D(address1D, ${name}Size));
}
${returnFormat} getData${name}(int address1D) {
  return getData${name}(float(address1D));
}
`;
      })
      .join('\n');
  }

  private generateSwizzling(type: string): string {
    if (type.endsWith('ec3')) {
      return '.rgb';
    } else if (type.endsWith('ec2')) {
      return '.rg';
    } else if (type.endsWith('ec4')) {
      return '.rgba';
    } else {
      return '.r';
    }
  }
}
