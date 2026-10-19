
import * as THREE from "three";

export class Interaction {
  constructor(player, world, ui, onWin) {
    this.player = player;
    this.world = world;
    this.ui = ui;
    this.onWin = onWin;
    this.examined = new Set();
    this.cooldown = 0;

    window.addEventListener("keydown", (e) => {
      if (e.code === "KeyE" && !e.repeat) {
        this.interact();
      }
    });

    const button = document.getElementById("interactBtn");
    if (button) {
      button.addEventListener("click", () => this.interact());
    }
  }

  interact() {
    if (!this.ui.isPlaying() || this.cooldown > 0) return;
    this.cooldown = 0.3;

    const camera = this.player.camera;
    const origin = camera.position.clone();
    const direction = new THREE.Vector3(0, 0, -1)
      .applyQuaternion(camera.quaternion)
      .normalize();

    const ray = new THREE.Raycaster(origin, direction, 0, 3.5);
    const { doors, exitDoor, anomalyDoor } =
      this.world.getObjects();

    const targets = doors.filter((d) => d.visible);

    if (anomalyDoor && anomalyDoor.visible &&
        !targets.includes(anomalyDoor)) {
      targets.push(anomalyDoor);
    }

    if (exitDoor && exitDoor.visible) {
      targets.push(exitDoor);
    }

    const hits = ray.intersectObjects(targets, false);

    if (!hits.length) {
      this.ui.showMessage("조사할 것이 없다.");
      return;
    }

    const object = hits[0].object;

    if (object.userData.type === "exit") {
      if (this.world.loopCount >= 5) {
        this.onWin();
      } else {
        this.ui.showMessage("아직 문이 열리지 않는다.");
      }
      return;
    }

    if (object === anomalyDoor) {
      if (!this.examined.has(object.uuid)) {
        this.examined.add(object.uuid);
        this.ui.showMessage(
          "문에서 이상한 흔적을 발견했다. 복도가 또 반복된다."
        );
      } else {
        this.ui.showMessage("이 문은 이미 조사했다.");
      }
      return;
    }

    this.ui.showMessage("잠긴 아파트 문이다.");
  }

  update(dt) {
    this.cooldown = Math.max(0, this.cooldown - dt);

    const { doors, exitDoor, anomalyDoor } =
      this.world.getObjects();

    const camera = this.player.camera;
    const origin = camera.position.clone();
    const direction = new THREE.Vector3(0, 0, -1)
      .applyQuaternion(camera.quaternion)
      .normalize();

    const ray = new THREE.Raycaster(origin, direction, 0, 3.5);
    const targets = doors.filter((d) => d.visible);

    if (anomalyDoor && anomalyDoor.visible &&
        !targets.includes(anomalyDoor)) {
      targets.push(anomalyDoor);
    }

    if (exitDoor && exitDoor.visible) {
      targets.push(exitDoor);
    }

    const hit = ray.intersectObjects(targets, false)[0];

    if (!this.ui.isPlaying()) {
      this.ui.setPrompt("");
    } else if (hit) {
      this.ui.setPrompt("E / 조사 버튼 — 문 확인");
    } else {
      this.ui.setPrompt("");
    }
  }
}
