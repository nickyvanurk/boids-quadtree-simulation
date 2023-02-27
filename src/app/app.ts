import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';

import { createPointCloudSphere } from "./helpers";
import { AssetManager } from "./asset_manager";
import { Fleet } from "./fkeet";
import Station from "./station";

export class App {
    running: boolean;
    renderer: THREE.WebGLRenderer;
    camera: THREE.PerspectiveCamera;
    scene: THREE.Scene;
    controls: OrbitControls;
    fleet: Fleet;
    assetManager: AssetManager;
    station: Station;
    composer: EffectComposer;

    constructor() {
        const canvas = document.querySelector('canvas.webgl');
        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        this.renderer.setClearColor(0x131A29);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.outputEncoding = THREE.sRGBEncoding;

        this.camera = new THREE.PerspectiveCamera(71, window.innerWidth / window.innerHeight, 1, 10000);
        this.camera.position.y = 400;
        this.camera.position.z = 800;

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.1;
        this.controls.maxDistance = 1500;

        this.scene = new THREE.Scene();

        const ambiLight = new THREE.AmbientLight(0xffffff);
        ambiLight.intensity = 0.5;
        this.scene.add(ambiLight);

        const dirLight = new THREE.DirectionalLight(0xffffff);
        dirLight.intensity = 0.8;
        dirLight.position.setScalar(1);
        this.scene.add(dirLight);

        const renderScene = new RenderPass(this.scene, this.camera);
        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(renderScene);

        const loadingManager = new THREE.LoadingManager();
        loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
            const loadingBar: HTMLElement = document.querySelector('.bar');
            const percent = Math.floor((itemsLoaded / itemsTotal * 100));
            loadingBar.style.width =  `${percent}%`;

            if (percent == 100) {
                const loadingScreen: HTMLElement = document.querySelector('.loadingScreen');
                loadingScreen.style.opacity = '0';
                loadingScreen.addEventListener('transitionend', () => {
                    loadingScreen.style.zIndex = '-1';
                });
            }
        };
        loadingManager.onLoad = this.init.bind(this);

        this.assetManager = new AssetManager(loadingManager);
        this.assetManager.loadModel('spaceship', 'assets/models/spaceship.glb');
        this.assetManager.loadModel('station', 'assets/models/station.glb');

        this.addStars();
    }

    init() {
        this.station = new Station(this.assetManager.getModel('station'));
        this.scene.add(this.station.model);

        this.fleet = new Fleet(this.scene, this.renderer, this.assetManager.getModel('spaceship'), 50, 1000);

        this.running = true;
    }

    reset() {
        // empty
    }

    processEvents(keys: { [key: string]: boolean; }) {
        // empty
        console.log(keys);
    }

    update(dt: number) {
        this.station.update(dt);
        this.fleet.update(dt);
    }

    render(alpha: number, dt: number) {
        if (this.running) {
            this.station.render(alpha, dt);
            this.fleet.render(alpha);
        }

        this.controls.update();
        this.composer.render();
    }

    resize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.composer.setSize(window.innerWidth, window.innerHeight);
    }

    addStars() {
        const points = createPointCloudSphere(1000, 6000, 2000);
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(points), 3));
        const material = new THREE.PointsMaterial({color: 0xffffff, size: 12.5, fog: false});
        this.scene.add(new THREE.Points(geometry, material));
    }
}