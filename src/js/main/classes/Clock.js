import player from "../controls/player";
import doLengthContraction from "../functions/doLengthContraction";
import applyRelativity1 from "../functions/applyRelativity1";
import applyRelativity2 from "../functions/applyRelativity2";

export default class Clock {
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
    const { id, name, objectId, ux, uy, uz, x, y, z } = this;
    return { id, name, objectId, ux, uy, uz, x, y, z };
  }

  update() {
    const [ux, uy, uz] = [this.ux, this.uy, this.uz];
    if (editing) {
      var [newx, newy, newz] = [
        this.x - player.x,
        this.y - player.y,
        this.z - player.z,
      ];
      var time = 0;
    } else {
      if (usingRelativity == 0) {
        var [newx, newy, newz] = [
          this.x + ux * player.time - player.x,
          this.y + uy * player.time - player.y,
          this.z + uz * player.time - player.z,
        ];
        var time = player.time;
      } else if (usingRelativity == 1) {
        var [newx0, newy0, newz0] = doLengthContraction(
          this.x,
          this.y,
          this.z,
          ux,
          uy,
          uz
        );
        var [newx, newy, newz, time] = applyRelativity1(
          newx0 - player.x,
          newy0 - player.y,
          newz0 - player.z,
          player.vx,
          player.vy,
          player.vz,
          ux,
          uy,
          uz,
          player.time
        );
      } else {
        var [newx0, newy0, newz0] = doLengthContraction(
          this.x,
          this.y,
          this.z,
          ux,
          uy,
          uz
        );
        var [newx, newy, newz, time] = applyRelativity2(
          newx0 - player.x,
          newy0 - player.y,
          newz0 - player.z,
          player.vx,
          player.vy,
          player.vz,
          ux,
          uy,
          uz,
          player.time
        );
      }
    }

    const { name, labelelem, clockelem } = this;
    clockelem.innerText = `${name} : ${time.toFixed(2)}s`;

    const tempV = new THREE.Vector3(newx, newy, newz);
    tempV.project(camera);
    if (Math.abs(tempV.z) > 1) {
      labelelem.style.display = "none";
    } else {
      labelelem.style.display = "block";
      // convert the normalized position to CSS coordinates
      if (
        -0.95 < tempV.x &&
        tempV.x < 0.95 &&
        -0.93 < tempV.y &&
        tempV.y < 0.93
      ) {
        const x =
          (tempV.x * 0.5 + 0.5) * canvas.clientWidth -
          labelelem.offsetWidth / 2;
        const y =
          (tempV.y * -0.5 + 0.5) * canvas.clientHeight -
          labelelem.offsetHeight / 2;

        // move the elem to that position
        // labelelem.style.transform = `translate(${x}px,${y}px)`;
        labelelem.style.left = `${x}px`;
        labelelem.style.top = `${y}px`;

        // 정렬을 위해 z-index 값을 설정합니다.
        labelelem.style.zIndex = ((-tempV.z * 0.5 + 0.5) * 100000) | 0;
      } else {
        labelelem.style.display = "none";
      }
    }
  }

  setVelocity(ux, uy, uz) {
    this.ux = ux;
    this.uy = uy;
    this.uz = uz;
  }

  showCheckbox() {
    this.clockcheckelem.style.display = "inline";
  }

  hideCheckbox() {
    this.clockcheckelem.style.display = "none";
  }
}
