import VoxelWorld from "../classes/VoxelWorld";
import { chunkSize } from "../constants";
import worlds from "../controls/worlds";

function createWorld({ ux, uy, uz, x, y, z }, objectId) {
  const newWorld = new VoxelWorld({
    id: objectId,
    ux,
    uy,
    uz,
    x,
    y,
    z,
  });
  worlds[objectId] = newWorld;
  currentObjectId = objectId;
  newWorld.setVoxel(0, 0, 0, currentVoxel);
  for (let chunkId in newWorld.chunks) {
    var chunkIdinArray = chunkId.split(",");
    newWorld.updateVoxelGeometry(
      Number(chunkIdinArray[0]) * chunkSize,
      Number(chunkIdinArray[1]) * chunkSize,
      Number(chunkIdinArray[2]) * chunkSize
    ); // 0,0,0 will generate
  }
  addWorldtoObjectRadio(worldNum + 1, objectId);
  worldNum++;
}

export default createWorld;
