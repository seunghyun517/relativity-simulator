import * as THREE from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls";
import { fov, aspect, near, far } from "../constants";
import player from "../controls/player";

export const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
// Camera:Setup
camera.position.set(0, player.height, 0);
camera.rotation.x = 0;
camera.rotation.y = Math.PI;
camera.rotation.z = 0;
camera.rotation.order = "YXZ";

export const canvas = document.querySelector("#c");

const cameracontrols = new PointerLockControls(camera, canvas);

export default cameracontrols;
