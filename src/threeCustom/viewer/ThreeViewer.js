import * as THREE from "three";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
// import CameraControls from "camera-controls";

// import CameraControls from '../../../dist/camera-controls.module.js';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import CameraControls from 'camera-controls';

import { SSAOPass } from "three/examples/jsm/postprocessing/SSAOPass.js";
import { SAOPass } from "three/examples/jsm/postprocessing/SAOPass.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { SSAARenderPass } from "three/examples/jsm/postprocessing/SSAARenderPass.js"
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { SSRPass } from "three/examples/jsm/postprocessing/SSRPass.js";

import * as dat from 'dat.gui';

CameraControls.install({ THREE: THREE });

class ThreeViewer {
    constructor(params) {
        /**
         * This class is a wrapper for Three.js
         * @param {HTMLElement} params.element
         * @param {string} params.bgColor
         */

        this.params = params;
        this.element = params.element;

        // Create width and height properties on the element
        this.canvasWidth = this.element.clientWidth;
        this.canvasHeight = this.element.clientHeight;

        // Mouse
        this.mouse = new THREE.Vector2();

        // Array for objects that can be picked
        this.pickingObjects = [];

        // For checking click events
        this.timer = 0;
        this.delay = 100;
        this.prevent = false;
        this.clock = new THREE.Clock();
        this.centerHelper = 0;
    } 
    async loadENV(filePath) { 
        new RGBELoader().load(filePath, function (texture) {  
          texture.mapping = THREE.EquirectangularReflectionMapping;
          scene.environment = texture;
        //   scene.background = texture;
          texture.dispose(); 
        });
      } 
    postProcess() {
        let scope = this

        // Initialize EffectComposer and add passes
        scope.composer = new EffectComposer(scope.renderer);
        scope.composer.setSize(window.innerWidth, window.innerHeight);
        scope.composer.setPixelRatio(Math.min(window.devicePixelRatio,2));
        
        scope.renderPass = new RenderPass(scope.scene, scope.camera);
        scope.composer.addPass(scope.renderPass);

        scope.ssaoPass = new SSAOPass(scope.scene, scope.camera, scope.canvasWidth, scope.canvasHeight);
        scope.ssaoPass.kernelRadius = 0; 
        scope.ssaoPass.minDistance = 0.0001;
        scope.ssaoPass.maxDistance = 0.001;
        // scope.ssaoPass.output = SSAOPass.OUTPUT.Default;
        // scope.composer.addPass(scope.ssaoPass);  

        scope.ssaaRenderPass = new SSAARenderPass( scope.scene, scope.camera );
        scope.ssaaRenderPass.sampleLevel = 1;
        // scope.composer.addPass( scope.ssaaRenderPass );
         
        // scope.bloomPass = new UnrealBloomPass(new THREE.Vector2(scope.canvasWidth, scope.canvasHeight), 0, 0, 0);
        // scope.composer.addPass(scope.bloomPass); 

        // ssr pass
        //      renderer,
		// 		scene,
		// 		camera,
		// 		width: innerWidth,
		// 		height: innerHeight,
		// 		groundReflector: params.groundReflector ? groundReflector : null,
		// 		selects: params.groundReflector ? selects : null



        scope.camera.near
        scope.ssrPass = new SSRPass( { renderer: scope.renderer, scene : scope.scene,  camera: scope.camera, width: scope.canvasWidth, height: scope.canvasWidth,groundReflector: null} );
        scope.composer.addPass( scope.ssrPass );

        // composer.addPass( new OutputPass() );
        scope.composer.addPass(new OutputPass());
        
        // scope.initGUI(); 

    }
    initViewer() {
        let scope = this;

        // Create scene, camera and renderer
        scope.scene = new THREE.Scene();

        window.scene = scope.scene;
        scope.scene.background = new THREE.Color(
            scope.params.bgColor || "rgb(112, 114, 115)"
        );

        // Create a camera, scene, renderer
        scope.camera = new THREE.PerspectiveCamera(
            40,
            scope.canvasWidth / scope.canvasHeight,
            0.001,
            100
        );
        scope.camera.position.set(0, 0, 1); 

        scope.scene.add(scope.camera);
        scope.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            logarithmicDepthBuffer: true,
        });
        window.renderer = scope.renderer
        scope.renderer.setSize(
            scope.canvasWidth,
            scope.canvasHeight
        );
        scope.renderer.shadowMap.enabled = true; 
        scope.renderer.setPixelRatio(Math.min(window.devicePixelRatio ,2)); 
        scope.scene.environmentIntensity = 0.1

        // Add canvas to the DOM
        scope.element.appendChild(scope.renderer.domElement);
        scope.renderer.domElement.id = "mainCanvas"; 

        
        // scope.postProcess();
        scope.setupControls();

        window.renderer = scope.renderer

        window.addEventListener(
            "resize",
            () => {
                scope.onWindowResize(scope);
            },
            false
        );
        scope.renderer.domElement.addEventListener("click", () => {
            scope.onclick(scope);
        });
        scope.renderer.domElement.addEventListener("pointermove", (event) => {
            scope.onMouseMove(event, scope);
        });
        scope.animate();
    }
    setupControls() {
        let scope = this;
        scope.controls = new CameraControls(
            scope.camera,
            scope.renderer.domElement
        ); 
        scope.controls.dollyToCursor = true; 
        scope.controls.infinityDolly = true;
        scope.controls.minDistance = 5;
        scope.controls.maxDistance = Infinity; 
    }
    setupOrbitControls() {
        let scope = this;
        scope.OrbitControls = new OrbitControls(
            scope.camera,
            scope.renderer.domElement
        ); 
    }
    onWindowResize(scope) {
        scope.clientWidth = scope.element.clientWidth;
        scope.clientHeight = scope.element.clientHeight;
        scope.camera.aspect =
            scope.clientWidth / scope.clientHeight;
        scope.camera.updateProjectionMatrix();
        scope.renderer.setSize(
            scope.clientWidth,
            scope.clientHeight
        ); 
    }
    render() {
        let scope = this; 
        const delta = scope.clock.getDelta();
        const hasControlsUpdated = scope.controls.update(delta);
        // scope.composer.render(); 
        scope.renderer.render(scope.scene, scope.camera); 
    }

    animate() {
        let scope = this;
        requestAnimationFrame(scope.animate.bind(scope));
        scope.render();
    }
    onclick(scope) {
        scope.timer = setTimeout(function () {
            if (!scope.prevent) {
                scope.intersectionCallback?.();
            }
            scope.prevent = false;
        }, scope.delay);
    }

    onMouseMove(event, scope) {
        scope.mouse.x =
            ((event.clientX - scope.element.getBoundingClientRect().left) /
                scope.element.clientWidth) *
            2 -
            1;
        scope.mouse.y =
            -(
                (event.clientY - scope.element.getBoundingClientRect().top) /
                scope.element.clientHeight
            ) *
            2 +
            1;
        scope.prevent = true;
        setTimeout(() => {
            scope.prevent = false;
        }, scope.delay);
    }
}

export { ThreeViewer };
