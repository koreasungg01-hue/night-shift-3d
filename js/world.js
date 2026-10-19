
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
        color: 0x65616a, roughness: 0.95
      }),
      floor: new THREE.MeshStandardMaterial({
        color: 0x34343a, roughness: 1
      }),
      ceiling: new THREE.MeshStandardMaterial({
        color: 0x48464e, roughness: 1
      }),
      door: new THREE.MeshStandardMaterial({
        color: 0x493b38, roughness: 0.85
      }),
      anomaly: new THREE.MeshStandardMaterial({
        color: 0x8b171e, emissive: 0x4b0000
      }),
      exit: new THREE.MeshStandardMaterial({
        color: 0x165d46, emissive: 0x062a1c
      })
    };

    this.build();
  }

  box(w, h, d, material, x, y, z, parent = this.group) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d), material
    );
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  build() {
    // 긴 복도: 플레이어가 앞으로 이동한다.
    this.box(7, 0.2, 140, this.materials.floor, 0, -0.1, -55);
    this.box(7, 0.2, 140, this.materials.ceiling, 0, 3.3, -55);
    this.box(0.2, 3.5, 140, this.materials.wall, -3.5, 1.65, -55);
    this.box(0.2, 3.5, 140, this.materials.wall, 3.5, 1.65, -55);

    // 벽 아래쪽의 걸레받이
    this.box(0.12, 0.18, 140, this.materials.door, -3.36, 0.12, -55);
    this.box(0.12, 0.18, 140, this.materials.door, 3.36, 0.12, -55);

    // 반복되는 아파트 문과 천장 조명
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
            color: 0xaaa08a, metalness: 0.6
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

    // 복도 끝의 벽
    this.box(7, 3.5, 0.25, this.materials.wall, 0, 1.65, -125);

    // 처음에는 탈출문이 숨겨져 있다.
    this.exitDoor = this.box(
      1.8, 2.6, 0.16, this.materials.exit, 0, 1.3, -10
    );
    this.exitDoor.visible = false;
    this.exitDoor.userData.type = "exit";

    this.setAnomaly(3);
  }

  setAnomaly(loop) {
    for (const door of this.doors) {
      door.userData.anomaly = false;
      door.material = this.materials.door;
    }

    // 구역마다 이상 현상이 있는 문을 하나 고른다.
    const index = (loop * 7 + 3) % this.doors.length;
    this.anomalyDoor = this.doors[index];
    this.anomalyDoor.userData.anomaly = true;
    this.anomalyDoor.material = this.materials.anomaly;
  }

 update(player) {
  // 플레이어만 재배치하고 복도는 그대로 둔다.
  // 따라서 같은 복도를 반복해서 걷는 효과가 난다.
  if (player.position.z < -75) {
    player.position.z += 100;
    this.loopCount++;
    this.setAnomaly(this.loopCount);
  }

  const t = performance.now() / 1000;

  this.lights.forEach((light, i) => {
    const flicker = Math.sin(t * (3 + i % 4) + i * 2);
    light.intensity =
      flicker > 0.94 ? 0.15 : 0.8 + flicker * 0.2;
  });

  // 5개 구역을 통과하면 고정된 탈출문이 열린다.
  this.exitDoor.visible = this.loopCount >= 5;
}

    }

    // 조명이 불규칙하게 깜빡인다.
    const t = performance.now() / 1000;
    this.lights.forEach((light, i) => {
      const flicker = Math.sin(t * (3 + i % 4) + i * 2);
      light.intensity = flicker > 0.94 ? 0.15 : 0.8 + flicker * 0.2;
    });

    // 다섯 구역을 통과하면 탈출문이 나타난다.
    this.exitDoor.visible = this.loopCount >= 5;

    // 탈출문을 플레이어 앞에 유지한다.
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
