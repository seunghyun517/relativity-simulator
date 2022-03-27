import TextureImage from "../../../../assets/img/texture.png";
import * as THREE from "three";

const texture = loader.load(TextureImage);
texture.magFilter = THREE.NearestFilter;
texture.minFilter = THREE.NearestFilter;

export default texture;
