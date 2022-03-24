import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/build/three.module.js';
import { PointerLockControls } from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/examples/jsm/controls/PointerLockControls.js'
const c = 5;

// Input Control
const modeButton = document.getElementById('modeButton');
modeButton.onclick = changeMode;
const viewButton = document.getElementById('viewButton');
viewButton.onclick = changeView;
const downloadButton = document.getElementById('downloadButton');
downloadButton.onclick = prepareDownload;
const loadFileButton = document.getElementById('loadfileButton');
loadFileButton.onclick = openFile;

const mytimeElement = document.getElementById('mytime');
const speedSlider = document.getElementById("speedslider");
const speedOutput = document.getElementById("speedvalue");

const instructions = document.getElementById("instructions");
const crossbar = document.getElementById("crossbar");
const topui = document.getElementById("ui");
const objui = document.getElementById("objui");

const objectRadio = document.getElementById("bottomui");
const createObjectButton = document.getElementById("objectcreate");
createObjectButton.onclick = () => {
    worlds[currentObjectId].setOpacity(0.3);
    createObject();
};
const deleteObjectButton = document.getElementById("objectdelete");
deleteObjectButton.onclick = deleteObject;
const objvxInput = document.getElementById("objvx");
const objvyInput = document.getElementById("objvy");
const objvzInput = document.getElementById("objvz");
const objSubmit = document.getElementById("objsubmit");
objvxInput.onfocus = lockControl;
objvyInput.onfocus = lockControl;
objvzInput.onfocus = lockControl;
objSubmit.onclick = setWorldVelocity;

var editing = true;
var usingRelativity = 0;
var currentObjectId;
const worlds = {};
var worldNum = 0;
var controllock = false;

function lockControl() {
    controllock = true;
}

function changeMode() {
    modeButton.blur();
    if (modeButton.value == "Editing Mode") {
        modeButton.value = "Viewing Mode";
        modeButton.style.background = "red";
        editing = false;
        for (const world of Object.values(worlds)) {
            world.setOpacity(1);
        }
        crossbar.style.display = 'none';
    } else {
        modeButton.value = "Editing Mode";
        modeButton.style.background = "white";
        if (cameracontrols.isLocked) {
            crossbar.style.display = 'flex';
        }
        for (const world of Object.values(worlds)) {
            world.setOpacity(0.3);
        }
        worlds[currentObjectId].setOpacity(1);
        editing = true;
        player.time = 0;
    }
}

function changeView() {
    viewButton.blur();
    if (usingRelativity == 0) {
        viewButton.value = "Weak Relativity";
        viewButton.style.background = "orange";
        usingRelativity = 1;
    } else if (usingRelativity == 1) {
        viewButton.value = "Strong Relativity";
        viewButton.style.background = "red";
        usingRelativity = 2;
    } else {
        viewButton.value = "Relativity OFF";
        viewButton.style.background = "white";
        usingRelativity = 0;
    }
}


function doLengthContraction(x, y, z, ux, uy, uz) {
    const beta = Math.sqrt(ux*ux + uy*uy + uz*uz) / c;
    if (beta==0) {return [x,y,z]}
    const gamma = 1 / Math.sqrt(1-beta*beta);
    const factor = 1/gamma - 1;
    const px = ux/Math.sqrt(ux*ux + uy*uy + uz*uz);
    const py = uy/Math.sqrt(ux*ux + uy*uy + uz*uz);
    const pz = uz/Math.sqrt(ux*ux + uy*uy + uz*uz);
    const xprime = (1+ factor*px*px)*x + factor*px*py*y + factor*px*pz*z;
    const yprime = factor*px*py*x + (1+factor*py*py)*y + factor*py*pz*z;
    const zprime = factor*px*pz*x + factor*py*pz*y + (1+factor*pz*pz)*z;
    return [xprime, yprime, zprime];
}


function applyRelativity1(x0, y0, z0, vx, vy, vz, ux, uy, uz, tb) {
    const v = Math.sqrt(vx*vx + vy*vy + vz*vz);
    const beta = v / c;
    const gamma = 1 / Math.sqrt(1-beta*beta);
    const betau = Math.sqrt(ux*ux + uy*uy + uz*uz) / c
    const gammau = 1 / Math.sqrt(1-betau*betau);
    const ta = (gamma*c*c*tb + vx*x0 + vy*y0 + vz*z0) / (c*c - ux*vx - uy*vy - uz*vz);

    const xprime = x0 + ux*ta;
    const yprime = y0 + uy*ta;
    const zprime = z0 + uz*ta;

    const tobj = ta/gammau - gammau * (ux*x0 + uy*y0 + uz*z0) / (c*c);
    
    if (v == 0) {return [xprime, yprime, zprime, tobj];}
    
    const factor = gamma - 1;
    const px = vx/v;
    const py = vy/v;
    const pz = vz/v;
    const xb = (1+ factor*px*px)*xprime + factor*px*py*yprime + factor*px*pz*zprime + gamma*v*(gamma*tb - ta)*px;
    const yb = factor*px*py*xprime + (1+factor*py*py)*yprime + factor*py*pz*zprime + gamma*v*(gamma*tb - ta)*py;
    const zb = factor*px*pz*xprime + factor*py*pz*yprime + (1+factor*pz*pz)*zprime + gamma*v*(gamma*tb - ta)*pz;
    return [xb, yb, zb, tobj];
}


function applyRelativity2(x0, y0, z0, vx, vy, vz, ux, uy, uz, tb) {
    const v = Math.sqrt(vx*vx + vy*vy + vz*vz);
    const beta = v / c;
    const usquare = ux*ux + uy*uy + uz*uz;
    const ud = ux*x0 + uy*y0 + uz*z0;
    const gamma = 1 / Math.sqrt(1-beta*beta);
    const betau = Math.sqrt(ux*ux + uy*uy + uz*uz) / c
    const gammau = 1 / Math.sqrt(1-betau*betau);
    const dsquare = x0*x0 + y0*y0 + z0*z0;
    const paren1 = ud + gamma*c*c*tb;
    const ta = (paren1 - Math.sqrt(paren1*paren1 + (c*c - usquare)*(dsquare - gamma*gamma*c*c*tb*tb)))/(c*c - usquare)
    const xprime = x0 + ux*ta;
    const yprime = y0 + uy*ta;
    const zprime = z0 + uz*ta;

    const tobj = ta/gammau - gammau * ud / (c*c);

    if (v == 0) {return [xprime, yprime, zprime, tobj];}

    const factor = gamma - 1;
    const px = vx/v;
    const py = vy/v;
    const pz = vz/v;
    const xb = (1+ factor*px*px)*xprime + factor*px*py*yprime + factor*px*pz*zprime + gamma*v*(gamma*tb - ta)*px;
    const yb = factor*px*py*xprime + (1+factor*py*py)*yprime + factor*py*pz*zprime + gamma*v*(gamma*tb - ta)*py;
    const zb = factor*px*pz*xprime + factor*py*pz*yprime + (1+factor*pz*pz)*zprime + gamma*v*(gamma*tb - ta)*pz;
    return [xb, yb, zb, tobj];
}

let controls = {};
let player = {
    x: 0,
    y: 0,
    z: 0,
    height: 1.4,
    maxSpeed: speedSlider.value * c,
    acceleration: 0.2 * speedSlider.value * c,
    vx: 0,
    vy: 0,
    vz: 0,
    speed: 0,
    beta: 0,
    gamma: 1,
    time: 0
};

const dt = 0.04;

player.y = player.height;

speedSlider.oninput = function() {
    speedOutput.innerHTML = `Max Speed: ${Number(speedSlider.value).toFixed(2)}c`;
    player.maxSpeed = Number(speedSlider.value) * c;
    player.acceleration = Number(speedSlider.value) * 0.2 * c;
    speedSlider.blur();
}

const canvas = document.querySelector('#c');
const renderer = new THREE.WebGLRenderer({canvas});

function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
    renderer.setSize(width, height, false);
    }
    return needResize;
}


// Scene: Setup
const chunkSize = 32;
const worldSize = 40;
const chunkSliceSize = chunkSize * chunkSize;
const fov = 75;
const aspect = 2;  // the canvas default
const near = 0.1;
const far = 1000;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
// Camera:Setup
camera.position.set(0, player.height, 0);
camera.rotation.x = 0;
camera.rotation.y = Math.PI;
camera.rotation.z = 0;
camera.rotation.order = "YXZ";

const scene = new THREE.Scene();
scene.background = new THREE.Color('lightblue');

const tileSize = 16;
const tileTextureWidth = 256;
const tileTextureHeight = 64;
const loader = new THREE.TextureLoader();
const texture = loader.load('texture.png');
texture.magFilter = THREE.NearestFilter;
texture.minFilter = THREE.NearestFilter;

const sunlight = new THREE.DirectionalLight(0XFFFFFF, 0.7);
sunlight.position.set(15, 20, 10);
scene.add(sunlight)
const backlight = new THREE.DirectionalLight(0xFFFFFF, 0.2);
backlight.position.set(-20, 20, -5);
scene.add(backlight);
const backgroundlight = new THREE.AmbientLight(0xFFFFFF, 0.2);
scene.add(backgroundlight);

const cameracontrols = new PointerLockControls(camera, canvas);

instructions.addEventListener('click', function () {
    cameracontrols.lock();
})

cameracontrols.addEventListener('lock', function () {
    instructions.style.display = 'none';
    topui.style.display = 'none';
    crossbar.style.display = 'flex';
    objui.style.display = 'none';
    clockForm.style.display = 'none';
    worldNameForm.style.display = 'none';
    controllock = false;
    if (modeButton.value = "Viewing Mode") {
        changeMode();
    }
    window.addEventListener('pointerdown', preparePlaceVoxel);
})

cameracontrols.addEventListener('unlock', function () {
    if (modeButton.value = "Viewing Mode") {
        changeMode();
    }
    instructions.style.display = 'flex';
    topui.style.display = 'block';
    crossbar.style.display = 'none';
    objui.style.display = 'block';
    updateObjectVelocityUI();
    window.removeEventListener('pointerdown', preparePlaceVoxel);
})

const neighborOffsets = [
    [ 0,  0,  0], // self
    [-1,  0,  0], // left
    [ 1,  0,  0], // right
    [ 0, -1,  0], // down
    [ 0,  1,  0], // up
    [ 0,  0, -1], // back
    [ 0,  0,  1], // front
];

let currentVoxel = 1;

function getRandInt(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

document.querySelectorAll('#ui .tiles input[type=radio][name=voxel]').forEach((elem) => {
    elem.addEventListener('click', voxeltypeClick);
});

document.querySelectorAll('#bottomui input[type=radio][name=object]').forEach((elem) => {
    elem.addEventListener('click', objectClick);
});

function voxeltypeClick() {
    currentVoxel = parseInt(this.value);
    return;
}

function objectClick() {
    const newWorldId= parseInt(this.value) - 1;
    if (newWorldId === currentObjectId) {return;}
    worlds[currentObjectId].setOpacity(0.3);
    worlds[newWorldId].setOpacity(1);
    currentObjectId = newWorldId;
    objvxInput.value = worlds[currentObjectId].ux / c;
    objvyInput.value = worlds[currentObjectId].uy / c;
    objvzInput.value = worlds[currentObjectId].uz / c;
    return;
}

class VoxelWorld {
    constructor(options) {
        this.id = options.id;
        this.material = new THREE.MeshLambertMaterial({
            map: texture,
            side: THREE.DoubleSide,
            opacity: 1,
            transparent: true,
        });;
        this.ux = options.ux;
        this.uy = options.uy;
        this.uz = options.uz;
        this.x0 = options.x;
        this.y0 = options.y;
        this.z0 = options.z;
        this.visible = true;
        this.chunks = {};
        this.absolute_positions = {};
        this.chunkIdToMesh = {};
        this.voxelcnt = 0;
        this.clocks = new Set();
    }

    extract() {
        const {id, ux, uy, uz, x0, y0, z0, chunks, voxelcnt} = this;
        const chunkszip = {};
        for (const [chunkId, chunk] of Object.entries(chunks)) {
            var chunkzip = {};
            for (const [voxelOffset, voxel] of Object.entries(chunk)){
                if (voxel != 0) {
                    chunkzip[voxelOffset] = voxel;
                }
            }
            chunkszip[chunkId] = chunkzip;
        }
        return {id, ux, uy, uz, x0, y0, z0, voxelcnt, chunks: chunkszip};
    }

    load(loaded_world) {
        const {ux, uy, uz, x0, y0, z0, voxelcnt, chunks} = loaded_world;
        this.ux = ux;
        this.uy = uy;
        this.uz = uz;
        this.x0 = x0;
        this.y0 = y0;
        this.z0 = z0;
        this.voxelcnt = voxelcnt;
        this.chunks = chunks;
        for (let chunkId in chunks) {
            var chunkIdinArray = chunkId.split(',');
            this.updateVoxelGeometry(Number(chunkIdinArray[0])*chunkSize, Number(chunkIdinArray[1])*chunkSize, Number(chunkIdinArray[2])*chunkSize);
        }
    }

    computeVoxelOffset(x, y, z) {
        const voxelX = THREE.MathUtils.euclideanModulo(x, chunkSize) | 0;
        const voxelY = THREE.MathUtils.euclideanModulo(y, chunkSize) | 0;
        const voxelZ = THREE.MathUtils.euclideanModulo(z, chunkSize) | 0;
        return voxelY * chunkSliceSize + voxelZ * chunkSize + voxelX;
    }
    computeChunkId(x, y, z) {
        const chunkX = Math.floor(x / chunkSize);
        const chunkY = Math.floor(y / chunkSize);
        const chunkZ = Math.floor(z / chunkSize);
        return `${chunkX},${chunkY},${chunkZ}`;
    }
    addChunkForVoxel(x, y, z) {
        const chunkId = this.computeChunkId(x, y, z);
        let chunk = this.chunks[chunkId];
        if (!chunk) {
            chunk = new Uint8Array(chunkSize * chunkSize * chunkSize);
            this.chunks[chunkId] = chunk;
        }
        return chunk;
    }
    getChunkForVoxel(x, y, z) {
        return this.chunks[this.computeChunkId(x, y, z)];
    }
    setVoxel(x, y, z, v, addChunk = true) {
        if (v==0 && this.getVoxel(x,y,z) != 0) {
            this.voxelcnt--;
        } else if (v!=0 && this.getVoxel(x,y,z) == 0){
            this.voxelcnt++;
        }
        let chunk = this.getChunkForVoxel(x, y, z);
        if (!chunk) {
            if (!addChunk) {
                return;
            }
            chunk = this.addChunkForVoxel(x, y, z);
        }
        const voxelOffset = this.computeVoxelOffset(x, y, z);
        chunk[voxelOffset] = v;
    }
    getVoxel(x, y, z) {
        const chunk = this.getChunkForVoxel(x, y, z);
        if (!chunk) { return 0; }
        const voxelOffset = this.computeVoxelOffset(x, y, z);
        return chunk[voxelOffset];
    }
    generateGeometryDataForChunk(chunkX, chunkY, chunkZ) {
        const positions = [];
        const normals = [];
        const uvs = [];
        const indices = [];
        const startX = chunkX * chunkSize;
        const startY = chunkY * chunkSize;
        const startZ = chunkZ * chunkSize;

        for (let y = 0; y < chunkSize; ++y) {
            const voxelY = startY + y;
            for (let z = 0; z < chunkSize; ++z) {
                const voxelZ = startZ + z;
                for (let x = 0; x < chunkSize; ++x) {
                const voxelX = startX + x;
                const voxel = this.getVoxel(voxelX, voxelY, voxelZ);
                if (voxel) {
                    // voxel 0 is sky (empty) so for UVs we start at 0
                    const uvVoxel = voxel - 1;
                    for (const {dir, corners, uvRow} of VoxelWorld.faces) {
                        const neighbor = this.getVoxel(
                            voxelX + dir[0],
                            voxelY + dir[1],
                            voxelZ + dir[2]);
                        if (!neighbor) {
                            // this voxel has no neighbor in this direction so we need a face.
                            const ndx = positions.length / 3;
                            for (const {pos, uv} of corners) {
                            positions.push(pos[0] + x, pos[1] + y, pos[2] + z);
                            normals.push(...dir);
                            uvs.push(
                                    (uvVoxel +   uv[0]) * tileSize / tileTextureWidth,
                                1 - (uvRow + 1 - uv[1]) * tileSize / tileTextureHeight);
                            }
                            indices.push(
                            ndx, ndx + 1, ndx + 2,
                            ndx + 2, ndx + 1, ndx + 3,
                            );
                        }
                    }
                }
                }
        }
        }

        return {
        positions,
        normals,
        uvs,
        indices,
        };
    }

    intersectRay(start, end) {
        let dx = end.x - start.x;
        let dy = end.y - start.y;
        let dz = end.z - start.z;
        const lenSq = dx * dx + dy * dy + dz * dz;
        const len = Math.sqrt(lenSq);

        dx /= len;
        dy /= len;
        dz /= len;

        let t = 0.0;
        let ix = Math.floor(start.x);
        let iy = Math.floor(start.y);
        let iz = Math.floor(start.z);

        const stepX = (dx > 0) ? 1 : -1;
        const stepY = (dy > 0) ? 1 : -1;
        const stepZ = (dz > 0) ? 1 : -1;

        const txDelta = Math.abs(1 / dx);
        const tyDelta = Math.abs(1 / dy);
        const tzDelta = Math.abs(1 / dz);

        const xDist = (stepX > 0) ? (ix + 1 - start.x) : (start.x - ix);
        const yDist = (stepY > 0) ? (iy + 1 - start.y) : (start.y - iy);
        const zDist = (stepZ > 0) ? (iz + 1 - start.z) : (start.z - iz);

        // location of nearest voxel boundary, in units of t
        let txMax = (txDelta < Infinity) ? txDelta * xDist : Infinity;
        let tyMax = (tyDelta < Infinity) ? tyDelta * yDist : Infinity;
        let tzMax = (tzDelta < Infinity) ? tzDelta * zDist : Infinity;

        let steppedIndex = -1;

        // main loop along raycast vector
        while (t <= len) {
        const voxel = this.getVoxel(ix, iy, iz);
        if (voxel) {
            return {
            position: [
                start.x + t * dx,
                start.y + t * dy,
                start.z + t * dz,
            ],
            normal: [
                steppedIndex === 0 ? -stepX : 0,
                steppedIndex === 1 ? -stepY : 0,
                steppedIndex === 2 ? -stepZ : 0,
            ],
            voxel,
            };
        }

        // advance t to next nearest voxel boundary
        if (txMax < tyMax) {
            if (txMax < tzMax) {
            ix += stepX;
            t = txMax;
            txMax += txDelta;
            steppedIndex = 0;
            } else {
            iz += stepZ;
            t = tzMax;
            tzMax += tzDelta;
            steppedIndex = 2;
            }
        } else {
            if (tyMax < tzMax) {
            iy += stepY;
            t = tyMax;
            tyMax += tyDelta;
            steppedIndex = 1;
            } else {
            iz += stepZ;
            t = tzMax;
            tzMax += tzDelta;
            steppedIndex = 2;
            }
        }
        }
        return null;
    }

    updateChunkGeometry(x, y, z) {
        const {material} = this;
        const chunkX = Math.floor(x / chunkSize);
        const chunkY = Math.floor(y / chunkSize);
        const chunkZ = Math.floor(z / chunkSize);
        const chunkId = `${chunkX},${chunkY},${chunkZ}`;
        let mesh = this.chunkIdToMesh[chunkId];
        const geometry = mesh ? mesh.geometry : new THREE.BufferGeometry();

        const {positions, normals, uvs, indices} = this.generateGeometryDataForChunk(chunkX, chunkY, chunkZ);
        const positionNumComponents = 3;
        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), positionNumComponents));
        const normalNumComponents = 3;
        geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(normals), normalNumComponents));
        const uvNumComponents = 2;
        geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvs), uvNumComponents));
        geometry.setIndex(indices);
        geometry.computeBoundingSphere();

        if (!mesh) {
            mesh = new THREE.Mesh(geometry, material);
            mesh.name = chunkId;
            this.chunkIdToMesh[chunkId] = mesh;
            scene.add(mesh);
            mesh.position.set(0, 0, 0);
            mesh.frustumCulled = false;
            mesh.visible = this.visible;
        }

        this.absolute_positions[chunkId] = [];
        for (let i=0; i<positions.length/3; i++) {
            this.absolute_positions[chunkId].push({x: chunkX*chunkSize + positions[3*i] + this.x0, y: chunkY*chunkSize+positions[3*i+1] + this.y0, z: chunkZ*chunkSize+positions[3*i+2] + this.z0});
        }

        mesh.geometry.attributes.position.needsUpdate = true;
    }

    show() {
        this.visible = true;
        for (const chunkId in this.chunks) {
            this.chunkIdToMesh[chunkId].visible = true;
        }
    }

    setOpacity(opacity) {
        this.material.opacity = opacity;
        for (const chunkId in this.chunks) {
            this.chunkIdToMesh[chunkId].material = this.material;
        }

    }

    hide() {
        this.visible = false;
        for (const chunkId in this.chunks) {
            this.chunkIdToMesh[chunkId].visible = false;
        }
    }

    updateVoxelGeometry(x, y, z) {
        const updatedChunkIds = {};
        for (const offset of neighborOffsets) {
            const ox = x + offset[0];
            const oy = y + offset[1];
            const oz = z + offset[2];
            const chunkId = this.computeChunkId(ox, oy, oz);
            if (!updatedChunkIds[chunkId]) {
                updatedChunkIds[chunkId] = true;       
                if (!(chunkId in this.chunks)) {this.addChunkForVoxel(ox,oy,oz)}
                this.updateChunkGeometry(ox, oy, oz);
            }
        }
    }

    updateRelativisticGeometry() {
        const [ux, uy, uz] = [this.ux, this.uy, this.uz]
        for (const chunkId in this.chunks) {
            const positions = this.chunkIdToMesh[chunkId].geometry.attributes.position.array;
            var idx = 0;
            this.absolute_positions[chunkId].forEach(function (point) {
                if (editing) {
                    var [newx, newy, newz] = [point.x-player.x, point.y-player.y, point.z-player.z];
                    var time = 0;
                } else{
                    if (usingRelativity == 0) {
                        var [newx, newy, newz] = [point.x+ux*player.time-player.x, point.y+uy*player.time-player.y, point.z+uz*player.time-player.z]
                        var time = player.time;
                    } else if (usingRelativity == 1) {
                        var [newx0, newy0, newz0] = doLengthContraction(point.x, point.y, point.z, ux, uy, uz);
                        var [newx, newy, newz, time] = applyRelativity1(newx0-player.x, newy0-player.y, newz0-player.z,player.vx,player.vy,player.vz, ux, uy ,uz, player.time);
                    } else {
                        var [newx0, newy0, newz0] = doLengthContraction(point.x, point.y, point.z, ux, uy, uz);
                        var [newx, newy, newz, time] = applyRelativity2(newx0-player.x, newy0-player.y, newz0-player.z,player.vx,player.vy,player.vz, ux, uy ,uz, player.time);
                    }
                }
                positions[idx++] = newx;
                positions[idx++] = newy;
                positions[idx++] = newz;
                
            });

            this.chunkIdToMesh[chunkId].geometry.attributes.position.needsUpdate = true;
        }
    }

    setVelocity({newux, newuy, newuz}) {
        this.ux = newux;
        this.uy = newuy;
        this.uz = newuz;
        
        for (let clockId of this.clocks) {
            clocks[clockId].setVelocity(newux, newuy, newuz);
        }
    }

    findIntersection() {
        const canvasX = 0.001;
        const canvasY = -0.01;
    
        const start = new THREE.Vector3();
        const end = new THREE.Vector3();
        start.set(camera.position.x + player.x - this.x0, camera.position.y + player.y - this.y0, camera.position.z + player.z - this.z0);
        end.set(canvasX, canvasY, 1).unproject(camera);

        const intersection = this.intersectRay(start, end);
        return intersection
    }

    placeVoxel(intersection) {
        const voxelPos = intersection.position.map((v, ndx) => {
            return v + intersection.normal[ndx] * 0.5;
        });
        this.setVoxel(...voxelPos, currentVoxel);
        this.updateVoxelGeometry(...voxelPos);
    }

    deleteVoxel(intersection) {
        const voxelPos = intersection.position.map((v, ndx) => {
            return v + intersection.normal[ndx] * (-0.5);
        });
        this.setVoxel(...voxelPos, 0);
        this.updateVoxelGeometry(...voxelPos);
    }

    computeClockCoordinate(intersection) {
        const clockPos = intersection.position.map((v, ndx) => {
            return v + intersection.normal[ndx] * (-0.5);
        });
        return [clockPos[0] + this.x0, clockPos[1] + this.y0, clockPos[2] + this.z0];
    }
}

VoxelWorld.faces = [
    { // left
        uvRow: 0,
        dir: [ -1,  0,  0, ],
        corners: [
        { pos: [ 0, 1, 0 ], uv: [ 0, 1 ], },
        { pos: [ 0, 0, 0 ], uv: [ 0, 0 ], },
        { pos: [ 0, 1, 1 ], uv: [ 1, 1 ], },
        { pos: [ 0, 0, 1 ], uv: [ 1, 0 ], },
        ],
    },
    { // right
        uvRow: 0,
        dir: [  1,  0,  0, ],
        corners: [
        { pos: [ 1, 1, 1 ], uv: [ 0, 1 ], },
        { pos: [ 1, 0, 1 ], uv: [ 0, 0 ], },
        { pos: [ 1, 1, 0 ], uv: [ 1, 1 ], },
        { pos: [ 1, 0, 0 ], uv: [ 1, 0 ], },
        ],
    },
    { // bottom
        uvRow: 1,
        dir: [  0, -1,  0, ],
        corners: [
        { pos: [ 1, 0, 1 ], uv: [ 1, 0 ], },
        { pos: [ 0, 0, 1 ], uv: [ 0, 0 ], },
        { pos: [ 1, 0, 0 ], uv: [ 1, 1 ], },
        { pos: [ 0, 0, 0 ], uv: [ 0, 1 ], },
        ],
    },
    { // top
        uvRow: 2,
        dir: [  0,  1,  0, ],
        corners: [
        { pos: [ 0, 1, 1 ], uv: [ 1, 1 ], },
        { pos: [ 1, 1, 1 ], uv: [ 0, 1 ], },
        { pos: [ 0, 1, 0 ], uv: [ 1, 0 ], },
        { pos: [ 1, 1, 0 ], uv: [ 0, 0 ], },
        ],
    },
    { // back
        uvRow: 0,
        dir: [  0,  0, -1, ],
        corners: [
        { pos: [ 1, 0, 0 ], uv: [ 0, 0 ], },
        { pos: [ 0, 0, 0 ], uv: [ 1, 0 ], },
        { pos: [ 1, 1, 0 ], uv: [ 0, 1 ], },
        { pos: [ 0, 1, 0 ], uv: [ 1, 1 ], },
        ],
    },
    { // front
        uvRow: 0,
        dir: [  0,  0,  1, ],
        corners: [
        { pos: [ 0, 0, 1 ], uv: [ 0, 0 ], },
        { pos: [ 1, 0, 1 ], uv: [ 1, 0 ], },
        { pos: [ 0, 1, 1 ], uv: [ 0, 1 ], },
        { pos: [ 1, 1, 1 ], uv: [ 1, 1 ], },
        ],
    },
];


class Clock {
    constructor(options) {
        this.id = options.id;
        this.name = options.name;
        this.objectId = options.objectId;
        this.labelelem = options.labelelem;
        this.clockelem = options.clockelem;
        this.clockcheckelem = options.clockcheckelem;
        this.clockInstanceElem = options.clockInstanceElem;
        this.ux = worlds[this.objectId].ux;
        this.uy = worlds[this.objectId].uy;
        this.uz = worlds[this.objectId].uz;
        this.x = options.x;
        this.y = options.y;
        this.z = options.z;
    }

    extract() {
        const {id, name, objectId, ux, uy, uz, x, y, z} = this
        return {id, name, objectId, ux, uy, uz, x, y, z}
    }

    update() {
        const [ux, uy, uz] = [this.ux, this.uy, this.uz];
        if (editing) {
            var [newx, newy, newz] = [this.x-player.x, this.y-player.y, this.z-player.z];
            var time = 0;
        } else{
            if (usingRelativity == 0) {
                var [newx, newy, newz] = [this.x+ux*player.time-player.x, this.y+uy*player.time-player.y, this.z+uz*player.time-player.z]
                var time = player.time;
            } else if (usingRelativity == 1) {
                var [newx0, newy0, newz0] = doLengthContraction(this.x, this.y, this.z, ux, uy, uz);
                var [newx, newy, newz, time] = applyRelativity1(newx0-player.x, newy0-player.y, newz0-player.z,player.vx,player.vy,player.vz, ux, uy ,uz, player.time);
            } else {
                var [newx0, newy0, newz0] = doLengthContraction(this.x, this.y, this.z, ux, uy, uz);
                var [newx, newy, newz, time] = applyRelativity2(newx0-player.x, newy0-player.y, newz0-player.z,player.vx,player.vy,player.vz, ux, uy ,uz, player.time);
            }
        }

        const {name, labelelem, clockelem} = this;
        clockelem.innerText = `${name} : ${time.toFixed(2)}s`;

        const tempV = new THREE.Vector3(newx, newy, newz);
        tempV.project(camera);
        if (Math.abs(tempV.z) > 1) {
            labelelem.style.display = 'none';
        } else {
            labelelem.style.display = 'block';
            // convert the normalized position to CSS coordinates
            if (-0.95 < tempV.x && tempV.x < 0.95 && -0.93 < tempV.y && tempV.y < 0.93) {
                const x = (tempV.x *  .5 + .5) * canvas.clientWidth - labelelem.offsetWidth / 2;
                const y = (tempV.y * -.5 + .5) * canvas.clientHeight - labelelem.offsetHeight / 2;

                // move the elem to that position
                // labelelem.style.transform = `translate(${x}px,${y}px)`;
                labelelem.style.left = `${x}px`;
                labelelem.style.top = `${y}px`;

                // 정렬을 위해 z-index 값을 설정합니다.
                labelelem.style.zIndex = (-tempV.z * .5 + .5) * 100000 | 0;
            } else {
                labelelem.style.display = 'none';
            }
        }
    }

    setVelocity(ux, uy, uz) {
        this.ux = ux;
        this.uy = uy;
        this.uz = uz;
    }
    
    showCheckbox() {
        this.clockcheckelem.style.display = 'inline';
    }

    hideCheckbox() {
        this.clockcheckelem.style.display = 'none';
    }
}


const objectIdtoRadio = {};


function createObject(id = worldNum) {
    createObjectButton.blur();
    createWorld({
        ux: 0.0, uy: 0.0, uz: 0.0, 
        x: player.x - 0.5, y: player.y - player.height + 1, z: player.z- 0.5}, id);
    objui.style.display = 'block';
    updateObjectVelocityUI();
}

function deleteObject(objectId) {
    deleteObjectButton.blur();
    worlds[objectId].hide();
    deleteObjectRadio(objectId);
    delete worlds[objectId];
}

function deleteAllObject() {
    while (Object.keys(worlds).length > 0) {
        deleteObject(Object.keys(worlds)[0]);
    }
    worldNum = 0;
    currentObjectId = 0;
}


function updateObjectVelocityUI() {
    const radioInputtoCheck = objectIdtoRadio[currentObjectId].radioInput;
    radioInputtoCheck.checked = true;
    objvxInput.value = worlds[currentObjectId].ux / c;
    objvyInput.value = worlds[currentObjectId].uy / c;
    objvzInput.value = worlds[currentObjectId].uz / c;
}


function addWorldtoObjectRadio(val, objectId) {
    const radioInput = document.createElement('input');
    radioInput.setAttribute("type", "radio");
    radioInput.setAttribute("name", "object");
    radioInput.setAttribute("id", "object" + String(val));
    radioInput.setAttribute("value", String(val));
    radioInput.checked = true;
    const label = document.createElement('label');
    const text = document.createElement('p');
    label.setAttribute("for", "object" + String(val));
    label.setAttribute("id", "object"+String(val)+"label")
    text.innerText = String(val);
    label.appendChild(text);
    objectRadio.insertBefore(radioInput, createObjectButton);
    objectRadio.insertBefore(label, createObjectButton);
    radioInput.addEventListener('click', objectClick);
    objectIdtoRadio[objectId] = {radioInput, label};
}


function createWorld({ux,uy,uz,x,y,z}, objectId) {
    const newWorld = new VoxelWorld({
        id: objectId,
        ux, uy, uz, x, y, z
    });
    worlds[objectId] = newWorld;
    currentObjectId = objectId;
    newWorld.setVoxel(0,0,0,currentVoxel);
    for (let chunkId in newWorld.chunks) {
        var chunkIdinArray = chunkId.split(',');
        newWorld.updateVoxelGeometry(Number(chunkIdinArray[0])*chunkSize, Number(chunkIdinArray[1])*chunkSize, Number(chunkIdinArray[2])*chunkSize);  // 0,0,0 will generate
    }
    addWorldtoObjectRadio(worldNum+1, objectId);
    worldNum++;
}

function setWorldVelocity() {
    var objvx = Number(objvxInput.value);
    var objvy = Number(objvyInput.value);
    var objvz = Number(objvzInput.value);
    if (isFinite(objvx) && isFinite(objvy) && isFinite(objvz)) {
        if (objvx*objvx + objvy*objvy + objvz*objvz >= 1) {
            alert("Object speed must be less than light speed");
        }
        else {
            worlds[currentObjectId].setVelocity({newux: objvx*c, newuy: objvy*c, newuz: objvz*c});
        }
    } else {
        alert("Object velocity must be a number");
    }
}


function deleteObjectRadio(objectId) {
    objectRadio.removeChild(objectIdtoRadio[objectId].radioInput);
    objectRadio.removeChild(objectIdtoRadio[objectId].label);
    delete objectIdtoRadio[objectId];
}


function placeVoxelIfGoodCondition(event) {
    if (editing && cameracontrols.isLocked) {
        const intersection = worlds[currentObjectId].findIntersection();
        if (intersection) {
            switch (event.button) {
                case 2: 
                    worlds[currentObjectId].placeVoxel(intersection);
                    break;
                case 0:
                    worlds[currentObjectId].deleteVoxel(intersection);
                    break;
                case 1:
                    showClockUI(intersection);
                    break;
                default:
                    console.log('invalid mouse input');
                    break;
            }
        }
    }
    if (worlds[currentObjectId].voxelcnt == 0) {
        deleteObject(currentObjectId);
        if ( Object.keys(worlds).length > 0 ) {
            currentObjectId = Number(Object.keys(worlds)[0]);
            updateObjectVelocityUI();
            worlds[currentObjectId].show()
        } else {
            currentObjectId = 0;
        }
    }
    window.removeEventListener('pointerup', placeVoxelIfGoodCondition);
}

function preparePlaceVoxel(event) {
    event.preventDefault();
    window.addEventListener('pointerup', placeVoxelIfGoodCondition);
}


const labelContainerElem = document.getElementById('clocklabels');
const clockContainerElem = document.getElementById('clocks');
const clockForm = document.getElementById('clockform');
const nameInput = document.getElementById('nameinput');
nameInput.onfocus = lockControl;
const nameSubmit = document.getElementById('namesubmit');
nameSubmit.onclick = function () {
    const intersection = JSON.parse(intersectionElem.value);
    const [clockx, clocky, clockz] = worlds[currentObjectId].computeClockCoordinate(intersection);
    const newClockName = nameInput.value;
    if (newClockName && !(clockNameSet.has(newClockName))) {
        createClock(newClockName, currentObjectId, clockx, clocky, clockz);
        controllock = false;
    } else {
        alert("This clock name is already used");
    }
}
const intersectionElem = document.getElementById('intersection');
const selectClockElem = document.getElementById('selectclock');
const deleteClockElem = document.getElementById('deleteclock');
selectClockElem.onclick = function () {
    for (const clock of Object.values(clocks)) {
        clock.showCheckbox();
    }
    selectClockElem.style.display = 'none';
    deleteClockElem.style.display = 'block';
}
deleteClockElem.onclick = function () {
    const query = 'input[name="clockcheck"]:checked';
    const selectedEls = document.querySelectorAll(query);

    selectedEls.forEach((elm) => {
        deleteClock(Number(elm.value));
    });

    for (const clock of Object.values(clocks)) {
        clock.hideCheckbox();
    }

    deleteClockElem.style.display = 'none';
    selectClockElem.style.display = 'block';
}
var clockNameSet = new Set();
var clockNum = 0;
const clocks = {};


function makeClockLabel(clockName, clockId) {
    const labelelem = document.createElement('div');
    labelelem.textContent = clockName;
    labelContainerElem.appendChild(labelelem);
    const clockInstanceElem = document.createElement('div');
    const clockelem = document.createElement('p');
    clockelem.innerText = clockName + ' : ' + '0.00s';
    const clockcheckelem = document.createElement('input');
    clockcheckelem.setAttribute("type", "checkbox");
    clockcheckelem.setAttribute("name", "clockcheck");
    clockcheckelem.setAttribute("id", "clockcheck" + String(clockId));
    clockcheckelem.setAttribute("value", String(clockId));
    clockcheckelem.checked = false;
    clockcheckelem.style.display = 'none';
    clockInstanceElem.appendChild(clockcheckelem);
    clockInstanceElem.appendChild(clockelem);
    clockContainerElem.appendChild(clockInstanceElem);
    return {labelelem, clockelem, clockcheckelem, clockInstanceElem};
}

function showClockUI(intersection) {
    clockForm.style.display = 'block';
    nameInput.focus();
    intersectionElem.value = JSON.stringify(intersection);
    cameracontrols.unlock();
}

function createClock(name, objectId, x, y, z, clockId=clockNum) {
    const {labelelem, clockelem, clockcheckelem, clockInstanceElem} = makeClockLabel(name, clockId);
    clocks[clockId] = new Clock({id: clockId, name, objectId, labelelem, clockelem, clockcheckelem, clockInstanceElem, x, y, z});
    worlds[objectId].clocks.add(clockId);
    clockNameSet.add(name);
    nameInput.value = "";
    clockNum++;
}


function deleteClock(clockId) {
    // delete clock with clockId
    const clockToDelete = clocks[clockId];
    labelContainerElem.removeChild(clockToDelete.labelelem);
    clockContainerElem.removeChild(clockToDelete.clockInstanceElem);
    worlds[clockToDelete.objectId].clocks.delete()
    clockNameSet.delete(clockToDelete.name);
    delete clocks[clockId];
}


function deleteAllClock() {
    while (Object.keys(clocks).length > 0) {
        deleteClock(Object.keys(clocks)[0]);
    }
    worldNum = 0;
}


function extractData() {
    const data = {worldData: {}, clockData: {}};
    for (const [objectId, world] of Object.entries(worlds)) {
        data.worldData[objectId] =  world.extract();
    }
    for (const [clockId, clock] of Object.entries(clocks)) {
        data.clockData[clockId] = clock.extract();
    }
    return data;
}

const worldNameForm = document.getElementById('worldnameform');
const worldNameInput = document.getElementById('worldnameinput');
worldNameInput.onfocus = lockControl;
const worldNameSubmit = document.getElementById('worldnamesubmit');
worldNameSubmit.onclick = function () {
    const worldName = worldNameInput.value;
    if (worldName) {
        download(worldName);
    } else {
        alert("Please write a name of this world");
    }
};

function prepareDownload() {
    worldNameForm.style.display = 'block';
    downloadButton.blur();
    worldNameInput.focus();
}

function download(worldName) {
    worldNameForm.style.display = 'none';
    const content = JSON.stringify(extractData());
    const fileName = worldName + '.txt';
    const contentType = 'text/plain';
    var a = document.createElement("a");
    var file = new Blob([content], {type: contentType});
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
}

function openFile() {
    loadFileButton.blur();
    var input = document.createElement("input");
    input.type = "file";
    input.accept = "text/plain";
    input.onchange = function (event) {
        processFile(event.target.files[0]);
    };
    input.click();
}

function processFile(file) {
    var reader = new FileReader();
    reader.onload = () => {
        var loadedData = JSON.parse(reader.result);
        deleteAllClock();
        deleteAllObject();
        for (const [loaded_objectId, loaded_world] of Object.entries(loadedData.worldData)) {
            createObject(loaded_objectId);
            worlds[loaded_objectId].load(loaded_world);
        }
        for (const [loaded_clockId, loaded_clock] of Object.entries(loadedData.clockData)) {
            createClock(loaded_clock.name, loaded_clock.objectId, loaded_clock.x, loaded_clock.y, loaded_clock.z, loaded_clockId);
        }
    };
    reader.readAsText(file, /* optional */ "euc-kr");
}


function main() {

    createWorld({ux: 0, uy: 0, uz: 0, x: 0, y: 0, z: 0}, 0);
    const ref_world = worlds[0];
    for (let y = 0; y < worldSize; ++y) {
        for (let z = -worldSize; z < worldSize; ++z) {
            for (let x = -worldSize; x < worldSize; ++x) {
                const height = 1;
                if (y<height) {
                    ref_world.setVoxel(x,y,z,getRandInt(14,17))
                }
                // if ((x*x + (y-worldSize/2)*(y-worldSize/2) + z*z < (worldSize/2)*(worldSize/2))) {
                //     ref_world.setVoxel(x, y, z, 7);
                // }
            }
        }
    }
    for (let chunkId in ref_world.chunks) {
        var chunkIdinArray = chunkId.split(',');
        ref_world.updateVoxelGeometry(Number(chunkIdinArray[0])*chunkSize, Number(chunkIdinArray[1])*chunkSize, Number(chunkIdinArray[2])*chunkSize);  // 0,0,0 will generate
    }


    let renderRequested = false;

    function render() {
        renderRequested = false;
    
        if (resizeRendererToDisplaySize(renderer)) {
            const canvas = renderer.domElement;
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
        }
    
        for (const world of Object.values(worlds)) {
            world.updateRelativisticGeometry();
        }

        for (const clock of Object.values(clocks)) {
            clock.update();
        }

        if (!editing) {
            player.time += dt;
        }
        mytimeElement.innerText = `My Time: ${player.time.toFixed(2)}s`;
        
        renderer.render(scene, camera);
    }

    render();

    function requestRenderIfNotRequested() {
        if (!renderRequested) {
            renderRequested = true;
            requestAnimationFrame(render);
            control();
        }
    }

    window.addEventListener('touchstart', (event) => {
        // prevent scrolling
        event.preventDefault();
    }, {passive: false});

    // Controls:Listeners
    window.addEventListener('keydown', ({ keyCode }) => { controls[keyCode] = true });
    window.addEventListener('keyup', ({ keyCode }) => { controls[keyCode] = false });

    function controlPlayerPosition(dx, dy, dz) {
        player.x += dx;
        player.z += dz;
        player.y += dy;
    }

    var modechangecnt = 0;
    var viewchangecnt = 0;

    function control() {
        if (controllock) {return;}
        // Controls:Engine 
        if(controls[87]){ // w
            player.vx += -Math.sin(camera.rotation.y) * player.acceleration;
            player.vz += -Math.cos(camera.rotation.y) * player.acceleration;
        }
        if(controls[83]){ // s
            player.vx += Math.sin(camera.rotation.y) * player.acceleration;
            player.vz += Math.cos(camera.rotation.y) * player.acceleration;
        }
        if(controls[65]){ // a
            player.vx += - Math.cos(camera.rotation.y) * player.acceleration;
            player.vz += Math.sin(camera.rotation.y) * player.acceleration;
        }
        if(controls[68]){ // d
            player.vx += Math.cos(camera.rotation.y) * player.acceleration;
            player.vz += -Math.sin(camera.rotation.y) * player.acceleration;
        }
        if(controls[32]) { // space
            player.vy += player.acceleration;
        }
        if(controls[16]) { // shift
            player.vy -= player.acceleration;
        }
        if(controls[69]) { // e
            if (modechangecnt == 0) {
                changeMode();
                modechangecnt = 10; // prevent too quick view change
            }
        }
        if(controls[82]) { // r
            if (viewchangecnt == 0) {
                changeView();
                viewchangecnt = 5; // prevent too quick view change
            }
        }
        if(controls[88]) { // x
            speedSlider.value = Number(speedSlider.value) + 0.01;
            speedOutput.innerHTML = `Max Speed: ${Number(speedSlider.value).toFixed(2)}c`;
            player.maxSpeed = Number(speedSlider.value) * c;
            player.acceleration = Number(speedSlider.value) * 0.2 * c;
        }
        if(controls[90]) { // z
            speedSlider.value = Number(speedSlider.value) - 0.01;
            speedOutput.innerHTML = `Max Speed: ${Number(speedSlider.value).toFixed(2)}c`;
            player.maxSpeed = Number(speedSlider.value) * c;
            player.acceleration = Number(speedSlider.value) * 0.2 * c;
        }
        if(controls[81]) { // q
            if (cameracontrols.isLocked) {
                cameracontrols.unlock();
            }
        }

        player.speed = Math.sqrt(player.vx*player.vx + player.vy*player.vy + player.vz*player.vz);
        if (player.speed) {
            var fricx = player.vx/player.speed * player.acceleration * 0.5;
            var fricz = player.vz/player.speed * player.acceleration * 0.5;
            var fricy = player.vy/player.speed * player.acceleration * 0.5;
            if (Math.abs(player.vx) > Math.abs(fricx)) {
                player.vx -= fricx;
            } else { player.vx = 0; }
            if (Math.abs(player.vz) > Math.abs(fricz)) {
                player.vz -= fricz;
            } else { player.vz = 0; }  
            if (Math.abs(player.vy) > Math.abs(fricy)) {
                player.vy -= fricy;
            } else { player.vy = 0; } 
        }
        
        player.speed = Math.sqrt(player.vx*player.vx + player.vy*player.vy + player.vz*player.vz)
        if (player.speed > player.maxSpeed) {
            player.vx *= player.maxSpeed / player.speed;
            player.vz *= player.maxSpeed / player.speed;
            player.vy *= player.maxSpeed / player.speed;
        }

        if (player.y < player.height && player.vy <0) {
            player.vy = 0;
        }
        player.speed = Math.sqrt(player.vx*player.vx + player.vy*player.vy + player.vz*player.vz);

        if ((!editing) && usingRelativity) {
            player.beta = player.speed / c;
            player.gamma = 1 / Math.sqrt(1-player.beta*player.beta);
            controlPlayerPosition(player.gamma*player.vx*dt, player.gamma*player.vy*dt, player.gamma*player.vz*dt);
        } else {
            controlPlayerPosition(player.vx*dt, player.vy*dt, player.vz*dt);
        }

        if (modechangecnt > 0) {modechangecnt--;}
        if (viewchangecnt > 0) {viewchangecnt--;}
        
    }

    window.addEventListener('resize', requestRenderIfNotRequested);

    function loop() {
        requestAnimationFrame(loop);
        requestRenderIfNotRequested();
    }

    console.log('loop start');
    loop();
}

main();