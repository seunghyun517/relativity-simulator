import speedSlider from "./speedSlider";

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
  time: 0,
};

export default player;
