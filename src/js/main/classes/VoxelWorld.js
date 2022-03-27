import * as THREE from "three";
import doLengthContraction from "../functions/doLengthContraction";
import applyRelativity2 from "../functions/applyRelativity2";

export default class VoxelWorld {
  constructor(options) {
    this.id = options.id;
    this.material = new THREE.MeshLambertMaterial({
      map: texture,
      side: THREE.DoubleSide,
      opacity: 1,
      transparent: true,
    });
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
    const { id, ux, uy, uz, x0, y0, z0, chunks, voxelcnt } = this;
    const chunkszip = {};
    for (const [chunkId, chunk] of Object.entries(chunks)) {
      var chunkzip = {};
      for (const [voxelOffset, voxel] of Object.entries(chunk)) {
        if (voxel != 0) {
          chunkzip[voxelOffset] = voxel;
        }
      }
      chunkszip[chunkId] = chunkzip;
    }
    return { id, ux, uy, uz, x0, y0, z0, voxelcnt, chunks: chunkszip };
  }

  load(loaded_world) {
    const { ux, uy, uz, x0, y0, z0, voxelcnt, chunks } = loaded_world;
    this.ux = ux;
    this.uy = uy;
    this.uz = uz;
    this.x0 = x0;
    this.y0 = y0;
    this.z0 = z0;
    this.voxelcnt = voxelcnt;
    this.chunks = chunks;
    for (let chunkId in chunks) {
      var chunkIdinArray = chunkId.split(",");
      this.updateVoxelGeometry(
        Number(chunkIdinArray[0]) * chunkSize,
        Number(chunkIdinArray[1]) * chunkSize,
        Number(chunkIdinArray[2]) * chunkSize
      );
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
    if (v == 0 && this.getVoxel(x, y, z) != 0) {
      this.voxelcnt--;
    } else if (v != 0 && this.getVoxel(x, y, z) == 0) {
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
    if (!chunk) {
      return 0;
    }
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
            for (const { dir, corners, uvRow } of VoxelWorld.faces) {
              const neighbor = this.getVoxel(
                voxelX + dir[0],
                voxelY + dir[1],
                voxelZ + dir[2]
              );
              if (!neighbor) {
                // this voxel has no neighbor in this direction so we need a face.
                const ndx = positions.length / 3;
                for (const { pos, uv } of corners) {
                  positions.push(pos[0] + x, pos[1] + y, pos[2] + z);
                  normals.push(...dir);
                  uvs.push(
                    ((uvVoxel + uv[0]) * tileSize) / tileTextureWidth,
                    1 - ((uvRow + 1 - uv[1]) * tileSize) / tileTextureHeight
                  );
                }
                indices.push(ndx, ndx + 1, ndx + 2, ndx + 2, ndx + 1, ndx + 3);
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

    const stepX = dx > 0 ? 1 : -1;
    const stepY = dy > 0 ? 1 : -1;
    const stepZ = dz > 0 ? 1 : -1;

    const txDelta = Math.abs(1 / dx);
    const tyDelta = Math.abs(1 / dy);
    const tzDelta = Math.abs(1 / dz);

    const xDist = stepX > 0 ? ix + 1 - start.x : start.x - ix;
    const yDist = stepY > 0 ? iy + 1 - start.y : start.y - iy;
    const zDist = stepZ > 0 ? iz + 1 - start.z : start.z - iz;

    // location of nearest voxel boundary, in units of t
    let txMax = txDelta < Infinity ? txDelta * xDist : Infinity;
    let tyMax = tyDelta < Infinity ? tyDelta * yDist : Infinity;
    let tzMax = tzDelta < Infinity ? tzDelta * zDist : Infinity;

    let steppedIndex = -1;

    // main loop along raycast vector
    while (t <= len) {
      const voxel = this.getVoxel(ix, iy, iz);
      if (voxel) {
        return {
          position: [start.x + t * dx, start.y + t * dy, start.z + t * dz],
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
    const { material } = this;
    const chunkX = Math.floor(x / chunkSize);
    const chunkY = Math.floor(y / chunkSize);
    const chunkZ = Math.floor(z / chunkSize);
    const chunkId = `${chunkX},${chunkY},${chunkZ}`;
    let mesh = this.chunkIdToMesh[chunkId];
    const geometry = mesh ? mesh.geometry : new THREE.BufferGeometry();

    const { positions, normals, uvs, indices } =
      this.generateGeometryDataForChunk(chunkX, chunkY, chunkZ);
    const positionNumComponents = 3;
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(
        new Float32Array(positions),
        positionNumComponents
      )
    );
    const normalNumComponents = 3;
    geometry.setAttribute(
      "normal",
      new THREE.BufferAttribute(new Float32Array(normals), normalNumComponents)
    );
    const uvNumComponents = 2;
    geometry.setAttribute(
      "uv",
      new THREE.BufferAttribute(new Float32Array(uvs), uvNumComponents)
    );
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
    for (let i = 0; i < positions.length / 3; i++) {
      this.absolute_positions[chunkId].push({
        x: chunkX * chunkSize + positions[3 * i] + this.x0,
        y: chunkY * chunkSize + positions[3 * i + 1] + this.y0,
        z: chunkZ * chunkSize + positions[3 * i + 2] + this.z0,
      });
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
        if (!(chunkId in this.chunks)) {
          this.addChunkForVoxel(ox, oy, oz);
        }
        this.updateChunkGeometry(ox, oy, oz);
      }
    }
  }

  updateRelativisticGeometry() {
    const [ux, uy, uz] = [this.ux, this.uy, this.uz];
    for (const chunkId in this.chunks) {
      const positions =
        this.chunkIdToMesh[chunkId].geometry.attributes.position.array;
      var idx = 0;
      this.absolute_positions[chunkId].forEach(function (point) {
        if (editing) {
          var [newx, newy, newz] = [
            point.x - player.x,
            point.y - player.y,
            point.z - player.z,
          ];
          var time = 0;
        } else {
          if (usingRelativity == 0) {
            var [newx, newy, newz] = [
              point.x + ux * player.time - player.x,
              point.y + uy * player.time - player.y,
              point.z + uz * player.time - player.z,
            ];
            var time = player.time;
          } else if (usingRelativity == 1) {
            var [newx0, newy0, newz0] = doLengthContraction(
              point.x,
              point.y,
              point.z,
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
              point.x,
              point.y,
              point.z,
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
        positions[idx++] = newx;
        positions[idx++] = newy;
        positions[idx++] = newz;
      });

      this.chunkIdToMesh[
        chunkId
      ].geometry.attributes.position.needsUpdate = true;
    }
  }

  setVelocity({ newux, newuy, newuz }) {
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
    start.set(
      camera.position.x + player.x - this.x0,
      camera.position.y + player.y - this.y0,
      camera.position.z + player.z - this.z0
    );
    end.set(canvasX, canvasY, 1).unproject(camera);

    const intersection = this.intersectRay(start, end);
    return intersection;
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
      return v + intersection.normal[ndx] * -0.5;
    });
    this.setVoxel(...voxelPos, 0);
    this.updateVoxelGeometry(...voxelPos);
  }

  computeClockCoordinate(intersection) {
    const clockPos = intersection.position.map((v, ndx) => {
      return v + intersection.normal[ndx] * -0.5;
    });
    return [
      clockPos[0] + this.x0,
      clockPos[1] + this.y0,
      clockPos[2] + this.z0,
    ];
  }
}
