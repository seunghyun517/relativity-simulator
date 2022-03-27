import cameracontrols from "./cameracontrols";
import worlds from "../controls/worlds";
import currentObjectId from "../controls/currentObjectId";

function changeMode() {
  modeButton.blur();
  if (modeButton.value == "Editing Mode") {
    modeButton.value = "Viewing Mode";
    modeButton.style.background = "red";
    editing = false;
    for (const world of Object.values(worlds)) {
      world.setOpacity(1);
    }
    crossbar.style.display = "none";
  } else {
    modeButton.value = "Editing Mode";
    modeButton.style.background = "white";
    if (cameracontrols.isLocked) {
      crossbar.style.display = "flex";
    }
    for (const world of Object.values(worlds)) {
      world.setOpacity(0.3);
    }
    worlds[currentObjectId].setOpacity(1);
    editing = true;
    player.time = 0;
  }
}

export default changeMode;
