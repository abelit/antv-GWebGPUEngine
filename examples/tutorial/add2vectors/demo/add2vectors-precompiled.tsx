import { World } from '@antv/g-webgpu';
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';

const App = React.memo(function Add2Vectors() {
  const [result, setResult] = useState([]);
  useEffect(() => {
    const world = new World({
      engineOptions: {
        supportCompute: true,
      },
    });

    const compute = world.createComputePipeline({
      precompiled: true,
      shader:
        '{"shaders":{"WebGPU":"\\nlayout (\\n  local_size_x = 8,\\n  local_size_y = 1,\\n  local_size_z = 1\\n) in;\\n\\n\\n\\nlayout(std430, set = 0, binding = 0) buffer   GWebGPUBuffer0 {\\n  float vectorA[];\\n} gWebGPUBuffer0;\\n\\nlayout(std430, set = 0, binding = 1) buffer readonly  GWebGPUBuffer1 {\\n  float vectorB[];\\n} gWebGPUBuffer1;\\n\\n\\nivec3 globalInvocationID = ivec3(gl_GlobalInvocationID);\\nivec3 workGroupSize = ivec3(gl_WorkGroupSize);\\nivec3 workGroupID = ivec3(gl_WorkGroupID);\\nivec3 localInvocationID = ivec3(gl_LocalInvocationID);\\nivec3 numWorkGroups = ivec3(gl_NumWorkGroups);\\nint localInvocationIndex = int(gl_LocalInvocationIndex);\\n\\n\\nfloat sum(float a,float b) {\\nreturn (a + float(b));}\\nvoid main() {\\nfloat a = gWebGPUBuffer0.vectorA[globalInvocationID.x];\\nfloat b = gWebGPUBuffer1.vectorB[globalInvocationID.x];\\ngWebGPUBuffer0.vectorA[globalInvocationID.x] = float(sum(a,b));}\\n","WebGL":"\\n#ifdef GL_FRAGMENT_PRECISION_HIGH\\n  precision highp float;\\n#else\\n  precision mediump float;\\n#endif\\n\\nuniform sampler2D vectorA;\\nuniform sampler2D vectorB;\\n\\nvec2 addrTranslation_1Dto2D(float address1D, vec2 texSize) {\\n  vec2 conv_const = vec2(1.0 / texSize.x, 1.0 / (texSize.x * texSize.y));\\n  vec2 normAddr2D = float(address1D) * conv_const;\\n  return vec2(fract(normAddr2D.x), normAddr2D.y);\\n}\\n\\nvoid barrier() {}\\n  \\n\\nuniform vec2 vectorASize;\\nfloat getDatavectorA(vec2 address2D) {\\n  return float(texture2D(vectorA, address2D).r);\\n}\\nfloat getDatavectorA(float address1D) {\\n  return getDatavectorA(addrTranslation_1Dto2D(address1D, vectorASize));\\n}\\nfloat getDatavectorA(int address1D) {\\n  return getDatavectorA(float(address1D));\\n}\\n\\n\\nuniform vec2 vectorBSize;\\nfloat getDatavectorB(vec2 address2D) {\\n  return float(texture2D(vectorB, address2D).r);\\n}\\nfloat getDatavectorB(float address1D) {\\n  return getDatavectorB(addrTranslation_1Dto2D(address1D, vectorBSize));\\n}\\nfloat getDatavectorB(int address1D) {\\n  return getDatavectorB(float(address1D));\\n}\\n\\nuniform vec2 u_OutputTextureSize;\\nuniform int u_OutputTexelCount;\\nvarying vec2 v_TexCoord;\\n\\nfloat sum(float a,float b) {\\nreturn (a + float(b));}\\nvoid main() {\\nivec3 workGroupSize = ivec3(8, 1, 1);\\nivec3 numWorkGroups = ivec3(1, 1, 1);     \\nint globalInvocationIndex = int(floor(v_TexCoord.x * u_OutputTextureSize.x))\\n  + int(floor(v_TexCoord.y * u_OutputTextureSize.y)) * int(u_OutputTextureSize.x);\\nint workGroupIDLength = globalInvocationIndex / (workGroupSize.x * workGroupSize.y * workGroupSize.z);\\nivec3 workGroupID = ivec3(workGroupIDLength / numWorkGroups.y / numWorkGroups.z, workGroupIDLength / numWorkGroups.x / numWorkGroups.z, workGroupIDLength / numWorkGroups.x / numWorkGroups.y);\\nint localInvocationIDZ = globalInvocationIndex / (workGroupSize.x * workGroupSize.y);\\nint localInvocationIDY = (globalInvocationIndex - localInvocationIDZ * workGroupSize.x * workGroupSize.y) / workGroupSize.x;\\nint localInvocationIDX = globalInvocationIndex - localInvocationIDZ * workGroupSize.x * workGroupSize.y - localInvocationIDY * workGroupSize.x;\\nivec3 localInvocationID = ivec3(localInvocationIDX, localInvocationIDY, localInvocationIDZ);\\nivec3 globalInvocationID = workGroupID * workGroupSize + localInvocationID;\\nint localInvocationIndex = localInvocationID.z * workGroupSize.x * workGroupSize.y\\n                + localInvocationID.y * workGroupSize.x + localInvocationID.x;\\n\\nfloat a = getDatavectorA(globalInvocationID.x);\\nfloat b = getDatavectorB(globalInvocationID.x);\\ngl_FragColor = vec4(sum(a,b));}\\n    "},"context":{"name":"Add2Vectors","dispatch":[1,1,1],"threadGroupSize":[8,1,1],"maxIteration":1,"defines":[],"uniforms":[{"name":"vectorA","type":"sampler2D","format":"float[]","readonly":false,"writeonly":false,"size":[1,1]},{"name":"vectorB","type":"sampler2D","format":"float[]","readonly":true,"writeonly":false,"size":[1,1]}],"globalDeclarations":[],"output":{"name":"vectorA","size":[1,1],"length":8,"outputElementsPerTexel":1}}}',
      dispatch: [1, 1, 1],
      onCompleted: (r) => {
        setResult(r);
        // 计算完成后销毁相关 GPU 资源
        world.destroy();
      },
    });

    world.setBinding(compute, 'vectorA', [1, 2, 3, 4, 5, 6, 7, 8]);
    world.setBinding(compute, 'vectorB', [1, 2, 3, 4, 5, 6, 7, 8]);
  }, []);

  return (
    <>
      <h2> Add 2 Vectors (with precompiled bundle)</h2>
      <ul>
        <li>WorkGroup: 1</li>
        <li>Threads per WorkGroup: 8</li>
        <li>VectorA: 1, 2, 3, 4, 5, 6, 7, 8</li>
        <li>VectorB: 1, 2, 3, 4, 5, 6, 7, 8</li>
      </ul>
      Result: {result.toString()}
    </>
  );
});

ReactDOM.render(<App />, document.getElementById('wrapper'));
