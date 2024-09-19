 import * as THREE from "three";
import { GUI } from "dat.gui";
import { loadGlb } from "./loadGlb";
import { ThreeViewer } from "./threeCustom/viewer/ThreeViewer";
import { exportGLB } from "./exportGLB";
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';
import { ReflectorForSSRPass } from "three/examples/jsm/Addons.js";

let threeViewer = new ThreeViewer({
    element: document.getElementById("container3D"),
});

// 1.0 Scene setup
threeViewer.initViewer();

// 2.0 Environment setup
threeViewer.loadENV("img/texture/brown_photostudio_02_1k.hdr"); 

const gui = new GUI();
const spotlightFolder = gui.addFolder('Spotlight');
let spotLight;

// 3.0 Load 3D model and update material properties
loadGlb("./img/model/scene7.gltf").then((root) => {
    let bBox = new THREE.Box3().setFromObject(root);
    console.log(bBox);
    threeViewer.controls.fitToBox(bBox);

    threeViewer.camera.far = bBox.getSize(new THREE.Vector3()).length() * 100;
    threeViewer.camera.near = 0.05;
    threeViewer.camera.updateProjectionMatrix();

    setupLight(threeViewer.scene, bBox);

    root.traverse((child) => {
        if (!child.isMesh) return;
        if(child.name.includes('refrigerator')&& child.name.includes('steel')) {
             child.material.metalness = 0.7;
        }
        if (child.name.includes("floor")) {
            child.material.roughness = 0.3;
        }
        child.castShadow = (child.material.name !== "Marble" && child.material.name !== "Wall" && !child.name.includes("backface") && !child.name.includes("soul"));
        child.receiveShadow = true;
        child.material.depthWrite = true;
        child.material.depthTest = true;
    });
    threeViewer.scene.add(root);
});

function setupLight(scene, inbBox) {
    const shadowMapSize = 2048;
    const shadowCameraSize = Math.max(Math.abs(inbBox.min.x - inbBox.max.x), Math.abs(inbBox.min.y - inbBox.max.y), Math.abs(inbBox.min.z - inbBox.max.z)) / 2;
    const shadowCameraFar = shadowCameraSize * 10;
    const dirTargetPos = new THREE.Vector3((inbBox.min.x + inbBox.max.x) / 2, (inbBox.min.y ), (inbBox.min.z + inbBox.max.z) / 2);

    function addSpotLight(inColor, inIntensity, inPosition, inTarget, inDistance) {
        spotLight = new THREE.SpotLight();
        spotLight.intensity = inIntensity;
        spotLight.color.setHex(inColor);
        spotLight.position.copy(inPosition);
        spotLight.angle = 1.3;
        spotLight.distance = inDistance;
        spotLight.penumbra = 1.8;
        spotLight.decay = 0.01;
        spotLight.castShadow = true;

        const targetObject = new THREE.Object3D();
        targetObject.position.copy(new THREE.Vector3(inTarget.x, 0, inTarget.z));
        scene.add(targetObject);

        spotLight.target = targetObject;
        spotLight.target.updateMatrixWorld();
        scene.add(spotLight);

        const spotLightHelper = new THREE.SpotLightHelper(spotLight);
        // scene.add(spotLightHelper);

        spotLight.shadow.intensity = 2;     
        spotLight.shadow.mapSize.x = shadowMapSize;
        spotLight.shadow.mapSize.y = shadowMapSize;

        spotLight.shadow.bias = -0.0009; 
    }
    function addDirLight(inColor, inIntensity, inPosition) {

        const dirLight = new THREE.DirectionalLight(inColor, inIntensity);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.x = shadowMapSize;
        dirLight.shadow.mapSize.y = shadowMapSize;
        dirLight.shadow.camera.near = 0;
        dirLight.shadow.camera.far = shadowCameraFar;

        dirLight.shadow.camera.top = shadowCameraSize;
        dirLight.shadow.camera.bottom = -shadowCameraSize;
        dirLight.shadow.camera.left = -shadowCameraSize;
        dirLight.shadow.camera.right = shadowCameraSize;
        dirLight.position.copy(inPosition);

        const targetObject = new THREE.Object3D();
        targetObject.position.copy(dirTargetPos);
        scene.add(targetObject);

        dirLight.target = targetObject;
        dirLight.target.updateMatrixWorld();

        scene.add(dirLight);
    } 


    const posLight1 = new THREE.Vector3(inbBox.min.x + (0.3 * Math.abs(inbBox.min.x - inbBox.max.x)), inbBox.max.y + 0.3 * Math.abs(inbBox.max.y - inbBox.min.y), (inbBox.min.z + inbBox.max.z) / 2);
    const posLight2 = new THREE.Vector3((inbBox.min.x + inbBox.max.x) / 2, inbBox.max.y + 0.2 * Math.abs(inbBox.max.y - inbBox.min.y), inbBox.max.z + 0.3 * Math.abs(inbBox.max.z - inbBox.min.z));
    
    const posLight3 = new THREE.Vector3(( inbBox.max.x) , inbBox.max.y + 1.8 * Math.abs(inbBox.max.y - inbBox.min.y), inbBox.min.z - 0.5 * Math.abs(inbBox.max.z - inbBox.min.z));
    
    const hemisphereLight = new THREE.HemisphereLight("0xebf8ff", "white", 2);
    scene.add(hemisphereLight);

    // addDirLight("white", 0.5, posLight1);
    // addDirLight("white", 0.35, posLight2);
    addDirLight("white", 1.5, posLight3);

    const spot1 = new THREE.Vector3(inbBox.min.x + Math.abs(inbBox.min.x - inbBox.max.x) / 4, inbBox.max.y - 0.5, inbBox.min.z + Math.abs(inbBox.min.z - inbBox.max.z) / 4);
    const spot2 = new THREE.Vector3(inbBox.min.x + Math.abs(inbBox.min.x - inbBox.max.x) / 4, inbBox.max.y - 0.5, inbBox.max.z - Math.abs(inbBox.min.z - inbBox.max.z) / 4);

    const spot3 = new THREE.Vector3(inbBox.max.x - Math.abs(inbBox.min.x - inbBox.max.x) / 4, inbBox.max.y - 0.5, inbBox.min.z + Math.abs(inbBox.min.z - inbBox.max.z) / 4);
    const spot4 = new THREE.Vector3(inbBox.max.x - Math.abs(inbBox.min.x - inbBox.max.x) / 4, inbBox.max.y - 0.5, inbBox.max.z - Math.abs(inbBox.min.z - inbBox.max.z) / 4);

    const spotlightDis = 1.5 *Math.abs(inbBox.min.y - inbBox.max.y)

    addSpotLight("0xffffff",  0.8, spot1, spot1,spotlightDis);
    addSpotLight("0xffffff",  0.8, spot2, spot2,spotlightDis); 
    addSpotLight("0xffffff",  0.8, spot3, spot3,spotlightDis);
    addSpotLight("0xffffff", 0.8, spot4, spot4,spotlightDis);

    const ambientLight = new THREE.AmbientLight("gray", 0.5);
    scene.add(ambientLight);

}