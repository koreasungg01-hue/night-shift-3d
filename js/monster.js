
import * as THREE from "three";

export class Monster {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.visible = false;
    this.active = false;
    this.elapsed = 0;
    this.hiddenTime = 0;
    this.appearAfter = 22;
    this.speed = 1.15;

    const dark = new THREE.MeshStandardMaterial({
      color: 0x09090b,
      roughness: 1
    });

    const eye = new THREE.MeshBasicMaterial({
      color: 0xb51e2a
    });

    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.34, 1.05, 4, 8), dark
    );
    body.position.y = 1.05;
    this.group.add(body);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 12, 12), dark
    );
    head.position.y = 1.9;
    this.group.add(head);

    for (const x of [-0.105, 0.105]) {
      const e = new THREE.Mesh(
        new THREE.SphereGeometry(0.045, 8, 8), eye
      );
      e.position.set(x, 1.93, -0.26);
      this.group.add(e);
    }

    this.group.visible = false;
    scene.add(this.group);
  }

  trigger(player) {
    if (this.active) return;

    this.active = true;
    this.visible = true;
    this.group.visible = true;
    this.hiddenTime = 0;

    // 플레이어가 바라보는 방향의 반대쪽에 나타난다.
    this.group.position.set(
      player.position.x,
      0,
      player.position.z + 8
    );
  }

  update(dt, player, camera, loopCount) {
    this.elapsed += dt;
    this.hiddenTime += dt;

    // 어느 정도 진행한 뒤 괴물이 활동하기 시작한다.
    if (!this.active &&
        this.elapsed >= this.appearAfter &&
        loopCount >= 1) {
      this.trigger(player);
    }

    if (!this.active) return false;

    const target = new THREE.Vector3(
      player.position.x, 0, player.position.z
    );

    const direction = target.clone()
      .sub(this.group.position);
    const distance = direction.length();

    if (distance > 0.001) {
      direction.normalize();
      this.group.position.addScaledVector(
        direction, this.speed * dt
      );
      this.group.rotation.y = Math.atan2(
        direction.x, direction.z
      );
    }

    // 가까워지면 플레이어를 붙잡는다.
    if (distance < 1.15) {
      return true;
    }

    // 잠복형: 한 번 나타난 뒤 시야에서 사라졌다가
    // 다시 나타날 수 있다. 첫 출현은 보장된다.
    if (this.hiddenTime > 35 && distance > 8) {
      this.group.visible = false;
      this.visible = false;
    }

    if (!this.visible && this.hiddenTime > 43) {
      this.group.position.set(
        player.position.x, 0, player.position.z + 6
      );
      this.group.visible = true;
      this.visible = true;
      this.hiddenTime = 0;
    }

    return false;
  }

  reset() {
    this.elapsed = 0;
    this.hiddenTime = 0;
    this.active = false;
    this.visible = false;
    this.group.visible = false;
  }
}
