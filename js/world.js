
import * as THREE from "three";

export class World {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    scene.add(this.group);

    this.doors = [];
    this.lights = [];
    this.loopCount = 0;
    this.exitDoor = null;
    this.anomalyDoor = null;

    this.materials = {
      wall: new THREE.MeshStandardMaterial({
        color: 0x65616a,
        roughness: 0.95
      }),
      floor: new THREE.MeshStandardMaterial({
        color: 0x34343a,
        roughness: 1
      }),
      ceiling: new THREE.MeshStandardMaterial({
        color: 0x48464e,
        roughness: 1
      }),
      door: new THREE.MeshStandardMaterial({
        color: 0x493b38,
        roughness: 0.85
      }),
      anomaly: new THREE.MeshStandardMaterial({
        color: 0x8b171e,
        emissive: 0x4b0000
      }),
      exit: new THREE.MeshStandardMaterial({
        color: 0x165d46,
        emissive: 0x062a1c
      })
    };

    this.build();
  }

  box(w, h, d, material, x, y, z, parent = this.group) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      material
    );

    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);

    return mesh;
  }

  build() {
    // 복도 바닥, 천장, 양쪽 벽
    this.box(7, 0.2, 140, this.materials.floor, 0, -0.1, -55);
    this.box(7, 0.2, 140, this.materials.ceiling, 0, 3.3, -55);
    this.box(0.2, 3.5, 140, this.materials.wall, -3.5, 1.65, -55);
    this.box(0.2, 3.5, 140, this.materials.wall, 3.5, 1.65, -55);

    // 걸레받이
    this.box(0.12, 0.18, 140, this.materials.door, -3.36, 0.12, -55);
    this.box(0.12, 0.18, 140, this.materials.door, 3.36, 0.12, -55);

    // 아파트 문과 천장 조명
    for (let i = 0; i < 16; i++) {
      const z = -i * 8;

      for (const side of [-1, 1]) {
        const door = this.box(
          0.08, 2.2, 1.25,
          this.materials.door,
          side * 3.34, 1.1, z - 3.5
        );

        door.userData = {
          side,
          z: z - 3.5,
          originalColor: this.materials.door.color.getHex(),
          anomaly: false
        };

        this.doors.push(door);

        // 문 손잡이
        this.box(
          0.08, 0.08, 0.08,
          new THREE.MeshStandardMaterial({
            color: 0xaaa08a,
            metalness: 0.6
          }),
          side * 3.27, 1.05, z - 3.5
        );
      }

      const light = new THREE.PointLight(0xc4d2ff, 1.1, 10);
      light.position.set(0, 3.0, z);
      this.group.add(light);
      this.lights.push(light);

      this.box(
        1.0, 0.05, 0.3,
        new THREE.MeshBasicMaterial({ color: 0xd4ddff }),
        0, 3.12, z
      );
    }

    // 복도 끝 벽
    this.box(7, 3.5, 0.25, this.materials.wall, 0, 1.65, -125);

    // 탈출문
    this.exitDoor = this.box(
      1.8, 2.6, 0.16,
      this.materials.exit,
      0, 1.3, -10
    );

    this.exitDoor.visible = false;
    this.exitDoor.userData.type = "exit";

    this.setAnomaly(0);
  }

  setAnomaly(loop) {
    for (const door of this.doors) {
      door.userData.anomaly = false;
      door.material = this.materials.door;
    }

    const index = (loop * 7 + 3) % this.doors.length;

    this.anomalyDoor = this.doors[index];
    this.anomalyDoor.userData.anomaly = true;
    this.anomalyDoor.material = this.materials.anomaly;
  }

  update(player) {
    // 복도가 반복되는 효과
    if (player.position.z < -75) {
      player.position.z += 100;
      this.loopCount++;
      this.setAnomaly(this.loopCount);
    }

    // 불규칙한 조명 깜빡임
    const t = performance.now() / 1000;

    this.lights.forEach((light, i) => {
      const flicker = Math.sin(t * (3 + i % 4) + i * 2);

      light.intensity =
        flicker > 0.94 ? 0.15 : 0.8 + flicker * 0.2;
    });

    // 다섯 구역 통과 후 탈출문 표시
    this.exitDoor.visible = this.loopCount >= 5;

    if (this.exitDoor.visible) {
      this.exitDoor.position.z =
        player.position.z - this.group.position.z - 8;
    }
  }

  getObjects() {
    return {
      doors: this.doors,
      exitDoor: this.exitDoor,
      anomalyDoor: this.anomalyDoor
    };
  }
}
