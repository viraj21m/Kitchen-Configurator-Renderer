import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
// import { v4 as uuidv4 } from 'uuid';
// const uuid = uuidv4();
// import * as THREE from 'three';

export const exportGLB = (inParent, download = false) => {
    // Validate inParent
   
    if (!inParent) {
      console.error('Invalid inParent object');
      return Promise.reject(new Error('Invalid inParent object'));
    }  


  inParent.traverse((child) => { 
    if(child.type === 'Mesh'){
      console.log(child);
    }
    // if (child.type === 'Mesh' || child.type === 'Object3D' || child.type === 'Group' ) {
      // child.castShadow = true;
      // child.receiveShadow = true; 
    // }
});
 console.log(inParent)
  if(!download){
    return 
  } 
    
    return new Promise((resolve, reject) => {
      const exporter = new GLTFExporter();
      
      exporter.parse(
        inParent,
        function (result) {
          const jsonString = JSON.stringify(result);
          console.log(jsonString); 
            const blob = new Blob([result], { type: "application/json" });
              console.log(typeof result);
              downloadFile(blob, 'customize.glb');
              return 
            },
            function (error) {
                console.log('An error happened during export', error);
                reject(error);
            },
            { binary: true } // Ensure the exporter is set to binary mode
        );
    });
};

function downloadFile(data, name) {
    var a = document.createElement('a');
    a.href = window.URL.createObjectURL(data);
    a.download = name;
    a.click();
}

function saveArrayBuffer(buffer, name) {
    var data = new Blob([buffer], { type: 'application/octet-stream' });
    return data;
}

window.exportGLB = exportGLB;
    