













































export function installShaderEdit(material, key, edit) {
  if (!material.userData) material.userData = {};
  const edits = material.userData.shaderEdits || (material.userData.shaderEdits = []);
  edits.push({ key, edit });
  
  
  
  
  material.onBeforeCompile = (shader, renderer) => {
    for (const e of edits) e.edit(shader, renderer);
  };
  
  
  
  
  
  material.customProgramCacheKey = () => edits.map((e) => e.key).join('|');
  return material;
}


export function shaderEditKeys(material) {
  return (material?.userData?.shaderEdits ?? []).map((e) => e.key);
}
