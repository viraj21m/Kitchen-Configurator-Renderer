import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

const loader = new GLTFLoader();


export async function loadGlb(inPath) {
    return new Promise((resolve, reject) => {
        loader.load(
            // resource URL
            inPath,
            // called when the resource is loaded
            function (gltf) {
                const root = gltf.scene;
                resolve(root)
            }, undefined, reject);
    });
}