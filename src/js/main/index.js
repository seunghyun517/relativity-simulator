import * as THREE from "three";

import changeMode from "./functions/changeMode";
import cameracontrols, { camera, canvas } from "./functions/cameracontrols";
import {
  tileSize,
  tileTextureWidth,
  tileTextureHeight,
  chunkSize,
  worldSize,
  chunkSliceSize,
} from "./constants";
import player from "./controls/player";
import speedSlider from "./controls/speedSlider";
import worlds from "./controls/worlds";
import modeButton from "./controls/modeButton";
import currentObjectId from "./controls/currentObjectId";
import init from "./functions/init";
import createWorld from "./functions/createWorld";

init();

const c = 5;

// Input Control

const mytimeElement = document.getElementById("mytime");

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

var worldNum = 0;
var controllock = false;

function lockControl() {
  controllock = true;
}

let controls = {};

const dt = 0.04;

player.y = player.height;

speedSlider.oninput = function () {
  speedOutput.innerHTML = `Max Speed: ${Number(speedSlider.value).toFixed(2)}c`;
  player.maxSpeed = Number(speedSlider.value) * c;
  player.acceleration = Number(speedSlider.value) * 0.2 * c;
  speedSlider.blur();
};

const renderer = new THREE.WebGLRenderer({ canvas });

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

const scene = new THREE.Scene();
scene.background = new THREE.Color("lightblue");

const loader = new THREE.TextureLoader();

const texture = loader.load(TextureImage);
texture.magFilter = THREE.NearestFilter;
texture.minFilter = THREE.NearestFilter;

const sunlight = new THREE.DirectionalLight(0xffffff, 0.7);
sunlight.position.set(15, 20, 10);
scene.add(sunlight);
const backlight = new THREE.DirectionalLight(0xffffff, 0.2);
backlight.position.set(-20, 20, -5);
scene.add(backlight);
const backgroundlight = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(backgroundlight);

instructions.addEventListener("click", function () {
  cameracontrols.lock();
});

cameracontrols.addEventListener("lock", function () {
  instructions.style.display = "none";
  topui.style.display = "none";
  crossbar.style.display = "flex";
  objui.style.display = "none";
  clockForm.style.display = "none";
  worldNameForm.style.display = "none";
  controllock = false;
  if ((modeButton.value = "Viewing Mode")) {
    changeMode();
  }
  window.addEventListener("pointerdown", preparePlaceVoxel);
});

cameracontrols.addEventListener("unlock", function () {
  if ((modeButton.value = "Viewing Mode")) {
    changeMode();
  }
  instructions.style.display = "flex";
  topui.style.display = "block";
  crossbar.style.display = "none";
  objui.style.display = "block";
  updateObjectVelocityUI();
  window.removeEventListener("pointerdown", preparePlaceVoxel);
});

const neighborOffsets = [
  [0, 0, 0], // self
  [-1, 0, 0], // left
  [1, 0, 0], // right
  [0, -1, 0], // down
  [0, 1, 0], // up
  [0, 0, -1], // back
  [0, 0, 1], // front
];

let currentVoxel = 1;

function getRandInt(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}

document
  .querySelectorAll("#ui .tiles input[type=radio][name=voxel]")
  .forEach((elem) => {
    elem.addEventListener("click", voxeltypeClick);
  });

document
  .querySelectorAll("#bottomui input[type=radio][name=object]")
  .forEach((elem) => {
    elem.addEventListener("click", objectClick);
  });

function voxeltypeClick() {
  currentVoxel = parseInt(this.value);
  return;
}

function objectClick() {
  const newWorldId = parseInt(this.value) - 1;
  if (newWorldId === currentObjectId) {
    return;
  }
  worlds[currentObjectId].setOpacity(0.3);
  worlds[newWorldId].setOpacity(1);
  currentObjectId = newWorldId;
  objvxInput.value = worlds[currentObjectId].ux / c;
  objvyInput.value = worlds[currentObjectId].uy / c;
  objvzInput.value = worlds[currentObjectId].uz / c;
  return;
}

const objectIdtoRadio = {};

function createObject(id = worldNum) {
  createObjectButton.blur();
  createWorld(
    {
      ux: 0.0,
      uy: 0.0,
      uz: 0.0,
      x: player.x - 0.5,
      y: player.y - player.height + 1,
      z: player.z - 0.5,
    },
    id
  );
  objui.style.display = "block";
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
  const radioInput = document.createElement("input");
  radioInput.setAttribute("type", "radio");
  radioInput.setAttribute("name", "object");
  radioInput.setAttribute("id", "object" + String(val));
  radioInput.setAttribute("value", String(val));
  radioInput.checked = true;
  const label = document.createElement("label");
  const text = document.createElement("p");
  label.setAttribute("for", "object" + String(val));
  label.setAttribute("id", "object" + String(val) + "label");
  text.innerText = String(val);
  label.appendChild(text);
  objectRadio.insertBefore(radioInput, createObjectButton);
  objectRadio.insertBefore(label, createObjectButton);
  radioInput.addEventListener("click", objectClick);
  objectIdtoRadio[objectId] = { radioInput, label };
}

function setWorldVelocity() {
  var objvx = Number(objvxInput.value);
  var objvy = Number(objvyInput.value);
  var objvz = Number(objvzInput.value);
  if (isFinite(objvx) && isFinite(objvy) && isFinite(objvz)) {
    if (objvx * objvx + objvy * objvy + objvz * objvz >= 1) {
      alert("Object speed must be less than light speed");
    } else {
      worlds[currentObjectId].setVelocity({
        newux: objvx * c,
        newuy: objvy * c,
        newuz: objvz * c,
      });
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
          console.log("invalid mouse input");
          break;
      }
    }
  }
  if (worlds[currentObjectId].voxelcnt == 0) {
    deleteObject(currentObjectId);
    if (Object.keys(worlds).length > 0) {
      currentObjectId = Number(Object.keys(worlds)[0]);
      updateObjectVelocityUI();
      worlds[currentObjectId].show();
    } else {
      currentObjectId = 0;
    }
  }
  window.removeEventListener("pointerup", placeVoxelIfGoodCondition);
}

function preparePlaceVoxel(event) {
  event.preventDefault();
  window.addEventListener("pointerup", placeVoxelIfGoodCondition);
}

const labelContainerElem = document.getElementById("clocklabels");
const clockContainerElem = document.getElementById("clocks");
const clockForm = document.getElementById("clockform");
const nameInput = document.getElementById("nameinput");
nameInput.onfocus = lockControl;
const nameSubmit = document.getElementById("namesubmit");
nameSubmit.onclick = function () {
  const intersection = JSON.parse(intersectionElem.value);
  const [clockx, clocky, clockz] =
    worlds[currentObjectId].computeClockCoordinate(intersection);
  const newClockName = nameInput.value;
  if (newClockName && !clockNameSet.has(newClockName)) {
    createClock(newClockName, currentObjectId, clockx, clocky, clockz);
    controllock = false;
  } else {
    alert("This clock name is already used");
  }
};
const intersectionElem = document.getElementById("intersection");
const selectClockElem = document.getElementById("selectclock");
const deleteClockElem = document.getElementById("deleteclock");
selectClockElem.onclick = function () {
  for (const clock of Object.values(clocks)) {
    clock.showCheckbox();
  }
  selectClockElem.style.display = "none";
  deleteClockElem.style.display = "block";
};
deleteClockElem.onclick = function () {
  const query = 'input[name="clockcheck"]:checked';
  const selectedEls = document.querySelectorAll(query);

  selectedEls.forEach((elm) => {
    deleteClock(Number(elm.value));
  });

  for (const clock of Object.values(clocks)) {
    clock.hideCheckbox();
  }

  deleteClockElem.style.display = "none";
  selectClockElem.style.display = "block";
};
var clockNameSet = new Set();
var clockNum = 0;
const clocks = {};

function makeClockLabel(clockName, clockId) {
  const labelelem = document.createElement("div");
  labelelem.textContent = clockName;
  labelContainerElem.appendChild(labelelem);
  const clockInstanceElem = document.createElement("div");
  const clockelem = document.createElement("p");
  clockelem.innerText = clockName + " : " + "0.00s";
  const clockcheckelem = document.createElement("input");
  clockcheckelem.setAttribute("type", "checkbox");
  clockcheckelem.setAttribute("name", "clockcheck");
  clockcheckelem.setAttribute("id", "clockcheck" + String(clockId));
  clockcheckelem.setAttribute("value", String(clockId));
  clockcheckelem.checked = false;
  clockcheckelem.style.display = "none";
  clockInstanceElem.appendChild(clockcheckelem);
  clockInstanceElem.appendChild(clockelem);
  clockContainerElem.appendChild(clockInstanceElem);
  return { labelelem, clockelem, clockcheckelem, clockInstanceElem };
}

function showClockUI(intersection) {
  clockForm.style.display = "block";
  nameInput.focus();
  intersectionElem.value = JSON.stringify(intersection);
  cameracontrols.unlock();
}

function createClock(name, objectId, x, y, z, clockId = clockNum) {
  const { labelelem, clockelem, clockcheckelem, clockInstanceElem } =
    makeClockLabel(name, clockId);
  clocks[clockId] = new Clock({
    id: clockId,
    name,
    objectId,
    labelelem,
    clockelem,
    clockcheckelem,
    clockInstanceElem,
    x,
    y,
    z,
  });
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
  worlds[clockToDelete.objectId].clocks.delete();
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
  const data = { worldData: {}, clockData: {} };
  for (const [objectId, world] of Object.entries(worlds)) {
    data.worldData[objectId] = world.extract();
  }
  for (const [clockId, clock] of Object.entries(clocks)) {
    data.clockData[clockId] = clock.extract();
  }
  return data;
}

const worldNameInput = document.getElementById("worldnameinput");
worldNameInput.onfocus = lockControl;
const worldNameSubmit = document.getElementById("worldnamesubmit");
worldNameSubmit.onclick = function () {
  const worldName = worldNameInput.value;
  if (worldName) {
    download(worldName);
  } else {
    alert("Please write a name of this world");
  }
};

function download(worldName) {
  worldNameForm.style.display = "none";
  const content = JSON.stringify(extractData());
  const fileName = worldName + ".txt";
  const contentType = "text/plain";
  var a = document.createElement("a");
  var file = new Blob([content], { type: contentType });
  a.href = URL.createObjectURL(file);
  a.download = fileName;
  a.click();
}

function processFile(file) {
  var reader = new FileReader();
  reader.onload = () => {
    var loadedData = JSON.parse(reader.result);
    deleteAllClock();
    deleteAllObject();
    for (const [loaded_objectId, loaded_world] of Object.entries(
      loadedData.worldData
    )) {
      createObject(loaded_objectId);
      worlds[loaded_objectId].load(loaded_world);
    }
    for (const [loaded_clockId, loaded_clock] of Object.entries(
      loadedData.clockData
    )) {
      createClock(
        loaded_clock.name,
        loaded_clock.objectId,
        loaded_clock.x,
        loaded_clock.y,
        loaded_clock.z,
        loaded_clockId
      );
    }
  };
  reader.readAsText(file, /* optional */ "euc-kr");
}

function main() {
  createWorld({ ux: 0, uy: 0, uz: 0, x: 0, y: 0, z: 0 }, 0);
  const ref_world = worlds[0];
  for (let y = 0; y < worldSize; ++y) {
    for (let z = -worldSize; z < worldSize; ++z) {
      for (let x = -worldSize; x < worldSize; ++x) {
        const height = 1;
        if (y < height) {
          ref_world.setVoxel(x, y, z, getRandInt(14, 17));
        }
        // if ((x*x + (y-worldSize/2)*(y-worldSize/2) + z*z < (worldSize/2)*(worldSize/2))) {
        //     ref_world.setVoxel(x, y, z, 7);
        // }
      }
    }
  }
  for (let chunkId in ref_world.chunks) {
    var chunkIdinArray = chunkId.split(",");
    ref_world.updateVoxelGeometry(
      Number(chunkIdinArray[0]) * chunkSize,
      Number(chunkIdinArray[1]) * chunkSize,
      Number(chunkIdinArray[2]) * chunkSize
    ); // 0,0,0 will generate
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

  window.addEventListener(
    "touchstart",
    (event) => {
      // prevent scrolling
      event.preventDefault();
    },
    { passive: false }
  );

  // Controls:Listeners
  window.addEventListener("keydown", ({ keyCode }) => {
    controls[keyCode] = true;
  });
  window.addEventListener("keyup", ({ keyCode }) => {
    controls[keyCode] = false;
  });

  function controlPlayerPosition(dx, dy, dz) {
    player.x += dx;
    player.z += dz;
    player.y += dy;
  }

  var modechangecnt = 0;
  var viewchangecnt = 0;

  function control() {
    if (controllock) {
      return;
    }
    // Controls:Engine
    if (controls[87]) {
      // w
      player.vx += -Math.sin(camera.rotation.y) * player.acceleration;
      player.vz += -Math.cos(camera.rotation.y) * player.acceleration;
    }
    if (controls[83]) {
      // s
      player.vx += Math.sin(camera.rotation.y) * player.acceleration;
      player.vz += Math.cos(camera.rotation.y) * player.acceleration;
    }
    if (controls[65]) {
      // a
      player.vx += -Math.cos(camera.rotation.y) * player.acceleration;
      player.vz += Math.sin(camera.rotation.y) * player.acceleration;
    }
    if (controls[68]) {
      // d
      player.vx += Math.cos(camera.rotation.y) * player.acceleration;
      player.vz += -Math.sin(camera.rotation.y) * player.acceleration;
    }
    if (controls[32]) {
      // space
      player.vy += player.acceleration;
    }
    if (controls[16]) {
      // shift
      player.vy -= player.acceleration;
    }
    if (controls[69]) {
      // e
      if (modechangecnt == 0) {
        changeMode();
        modechangecnt = 10; // prevent too quick view change
      }
    }
    if (controls[82]) {
      // r
      if (viewchangecnt == 0) {
        changeView();
        viewchangecnt = 5; // prevent too quick view change
      }
    }
    if (controls[88]) {
      // x
      speedSlider.value = Number(speedSlider.value) + 0.01;
      speedOutput.innerHTML = `Max Speed: ${Number(speedSlider.value).toFixed(
        2
      )}c`;
      player.maxSpeed = Number(speedSlider.value) * c;
      player.acceleration = Number(speedSlider.value) * 0.2 * c;
    }
    if (controls[90]) {
      // z
      speedSlider.value = Number(speedSlider.value) - 0.01;
      speedOutput.innerHTML = `Max Speed: ${Number(speedSlider.value).toFixed(
        2
      )}c`;
      player.maxSpeed = Number(speedSlider.value) * c;
      player.acceleration = Number(speedSlider.value) * 0.2 * c;
    }
    if (controls[81]) {
      // q
      if (cameracontrols.isLocked) {
        cameracontrols.unlock();
      }
    }

    player.speed = Math.sqrt(
      player.vx * player.vx + player.vy * player.vy + player.vz * player.vz
    );
    if (player.speed) {
      var fricx = (player.vx / player.speed) * player.acceleration * 0.5;
      var fricz = (player.vz / player.speed) * player.acceleration * 0.5;
      var fricy = (player.vy / player.speed) * player.acceleration * 0.5;
      if (Math.abs(player.vx) > Math.abs(fricx)) {
        player.vx -= fricx;
      } else {
        player.vx = 0;
      }
      if (Math.abs(player.vz) > Math.abs(fricz)) {
        player.vz -= fricz;
      } else {
        player.vz = 0;
      }
      if (Math.abs(player.vy) > Math.abs(fricy)) {
        player.vy -= fricy;
      } else {
        player.vy = 0;
      }
    }

    player.speed = Math.sqrt(
      player.vx * player.vx + player.vy * player.vy + player.vz * player.vz
    );
    if (player.speed > player.maxSpeed) {
      player.vx *= player.maxSpeed / player.speed;
      player.vz *= player.maxSpeed / player.speed;
      player.vy *= player.maxSpeed / player.speed;
    }

    if (player.y < player.height && player.vy < 0) {
      player.vy = 0;
    }
    player.speed = Math.sqrt(
      player.vx * player.vx + player.vy * player.vy + player.vz * player.vz
    );

    if (!editing && usingRelativity) {
      player.beta = player.speed / c;
      player.gamma = 1 / Math.sqrt(1 - player.beta * player.beta);
      controlPlayerPosition(
        player.gamma * player.vx * dt,
        player.gamma * player.vy * dt,
        player.gamma * player.vz * dt
      );
    } else {
      controlPlayerPosition(player.vx * dt, player.vy * dt, player.vz * dt);
    }

    if (modechangecnt > 0) {
      modechangecnt--;
    }
    if (viewchangecnt > 0) {
      viewchangecnt--;
    }
  }

  window.addEventListener("resize", requestRenderIfNotRequested);

  function loop() {
    requestAnimationFrame(loop);
    requestRenderIfNotRequested();
  }

  console.log("loop start");
  loop();
}

main();
