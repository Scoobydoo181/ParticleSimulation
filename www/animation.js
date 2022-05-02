import * as THREE from 'https://cdn.skypack.dev/three@0.132.2'
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.121.1/examples/jsm/controls/OrbitControls.js';

import { drawDistribution } from './ui.js';

function initScene() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb)
    return scene
}

function initCamera() {
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 60;
    camera.position.x = 2;
    camera.position.y = 5;

    return camera
}

function initRenderer() {
    // Initialize WebGL renderer and add it to the page
    const renderer = new THREE.WebGLRenderer({canvas: document.getElementById('animation'), antialias: true});
    renderer.setSize(window.innerWidth, window.innerHeight - 63.4);
    return renderer
}

function initControls(camera, renderer) {
    // Allow clicking and dragging
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.minDistance = 1;
    controls.maxDistance = 100;
    return controls
}

function initPointLight(scene) {
    // Create lighting
    const light = new THREE.PointLight(0xffffff, 3);
    light.position.set(0, 0, 25);
    scene.add(light);

    return light
}

function initAmbientLight(scene) {
    // Create lighting
    const light = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(light);
    return light
}

function createParticle(scene, color) {
    let geometry = new THREE.SphereGeometry(1, 32, 16);
    let material = new THREE.MeshPhongMaterial({ color: Math.random() < 0.015 ? 0xff0000 : color });
    material.side = THREE.DoubleSide

    let particle = new THREE.Mesh(geometry, material);
    scene.add(particle)

    particle.position.set(46 * Math.random() - 23, 46 * Math.random() - 23, 46 * Math.random() - 23)

    particle.velocity = new THREE.Vector3(4*Math.random() - 2, 4*Math.random() - 2, 4*Math.random() - 2)
    
    particle.velocity.reverseX = function() {this.x = -this.x}
    particle.velocity.reverseY = function() {this.y = -this.y}
    particle.velocity.reverseZ = function() {this.z = -this.z}

    return particle
}


function createPlane(scene, size, color, position, rotation) {
    const geometry = new THREE.PlaneGeometry(...size);
    const material = new THREE.MeshPhongMaterial({ color: color });
    material.side = THREE.DoubleSide
    const plane = new THREE.Mesh(geometry, material);
    scene.add(plane)
    plane.position.set(...position)
    plane.rotation.set(...rotation)
    
    return plane
}

function createObjects(scene) {
    // Create box
    createPlane(scene, [50, 50], 0x0f0f0f, [0, 0, -25], [0, 0, 0])
    createPlane(scene, [50, 50], 0x0f0f0f, [-25, 0, 0], [0, Math.PI/2, 0])
    createPlane(scene, [50, 50], 0x0f0f0f, [25, 0, 0], [0, -Math.PI/2, 0])
    createPlane(scene, [50, 50], 0x0f0f0f, [0, 25, 0], [-Math.PI / 2, 0, 0])
    createPlane(scene, [50, 50], 0x0f0f0f, [0, -25, 0], [Math.PI / 2, 0, 0])

    let output = []
    for(let i = 0; i < 1000; i++)
        output.push(createParticle(scene, 0x00ff00))

    return output
}

export function runAnimation(state) {
    // Initialize
    const scene = initScene()
    const camera = initCamera()
    const renderer = initRenderer()
    const controls = initControls(camera, renderer)
    const pointLight = initPointLight(scene)
    const ambientLight = initAmbientLight(scene)

    // Create objects in scene, and assign to global variable
    const objects = createObjects(scene)
    

    // Draw scene, recursively runs once per frame
    animate(state, scene, camera, objects, renderer);
}

function handleWallBounce(particle) {
    let x = Math.abs(particle.position.x)
    let y = Math.abs(particle.position.y)
    let z = Math.abs(particle.position.z)
    if (x >= 24 - Math.abs(particle.velocity.x) && Math.sign(particle.velocity.x)*Math.sign(particle.position.x) == 1) particle.velocity.reverseX()
    if (y >= 24 - Math.abs(particle.velocity.y) && Math.sign(particle.velocity.y)*Math.sign(particle.position.y) == 1) particle.velocity.reverseY()
    if (z >= 24 - Math.abs(particle.velocity.z) && Math.sign(particle.velocity.z)*Math.sign(particle.position.z) == 1) particle.velocity.reverseZ()
}

function handleCollide(particle, particle2) {
    const x1 = Math.abs(particle.position.x)
    const y1 = Math.abs(particle.position.y)
    const z1 = Math.abs(particle.position.z)
    
    const x2 = Math.abs(particle2.position.x)
    const y2 = Math.abs(particle2.position.y)
    const z2 = Math.abs(particle2.position.z)

    const x_velocity1 = Math.abs(particle.velocity.x)
    const y_velocity1 = Math.abs(particle.velocity.y)
    const z_velocity1 = Math.abs(particle.velocity.z)
    
    const x_velocity2 = Math.abs(particle2.velocity.x)
    const y_velocity2 = Math.abs(particle2.velocity.y)
    const z_velocity2 = Math.abs(particle2.velocity.z)

    const pastX = (x1 >= 22 - x_velocity1 || x2 >= 22 - x_velocity2 ) 
    const pastY = (y1 >= 22 - y_velocity1  || y2 >= 22 - y_velocity2 ) 
    const pastZ = (z1 >= 22 - z_velocity1 || z2 >= 22 - z_velocity2 ) 

    if (!pastX && !pastY && !pastZ && particle.position.distanceToSquared(particle2.position) <= 4) {
        const normal = particle.position.clone().addScaledVector(particle2.position, -1).normalize()
        const relativeVelocity = particle.velocity.clone().addScaledVector(particle2.velocity, -1)
        const normalVelocity = relativeVelocity.projectOnVector(normal)

        particle.velocity.addScaledVector(normalVelocity, -1)
        particle2.velocity.addScaledVector(normalVelocity, 1)
    }
}

function animate(state, scene, camera, objects, renderer) {
    // Runce once each frame
    const animateCallback = function() {
        requestAnimationFrame(animateCallback);
    
        // If a particle collides with a wall, bounce off the wall
        for(let i = 0; i < state.numParticles; i++) {
            objects[i].visible = true
            let particle = objects[i]

            // Step forward position by the velocity each frame
            particle.position.x += particle.velocity.x
            particle.position.y += particle.velocity.y
            particle.position.z += particle.velocity.z

            handleWallBounce(particle) 

            // Only check each pair once
            for(let j = i+1; j < state.numParticles; j++) {
                let particle2 = objects[j]

                handleCollide(particle, particle2)
            }
        }
        
        drawDistribution(state, objects)

        for(let i = state.numParticles; i < objects.length; i++)
            objects[i].visible = false
    
        renderer.render(scene, camera);
    }
    animateCallback()
}


