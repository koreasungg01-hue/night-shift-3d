
import * as THREE from "three";

export class Player {
  constructor(camera, renderer, ui) {
    this.camera = camera;
    this.renderer = renderer;
    this.ui = ui;

    this.position = new THREE.Vector3(0, 1.65, 0);
    this.yaw = 0;
    this.pitch = 0;
    this.keys = {};
    this.joyX = 0;
    this.joyY = 0;
    this.speed = 3.0;
    this.lookPointer = null;
    this.lastLookX = 0;
    this.lastLookY = 0;

    this.camera.rotation.order = "YXZ";
    this.bindKeyboard();
    this.bindMouse();
    this.bindTouch();
  }

  bindKeyboard() {
    window.addEventListener("keydown", e => {
      this.keys[e.code] = true;

      if (["Space", "ArrowUp", "ArrowDown",
           "ArrowLeft", "ArrowRight"].includes(e.code)) {
        e.preventDefault();
      }
    });

    window.addEventListener("keyup", e => {
      this.keys[e.code] = false;
    });

    window.addEventListener("blur", () => {
      this.keys = {};
    });
  }

  bindMouse() {
    this.renderer.domElement.addEventListener("click", () => {
      if (!this.ui.isTouchDevice() &&
          this.ui.isPlaying() &&
          document.pointerLockElement !== this.renderer.domElement) {
        this.renderer.domElement.requestPointerLock?.();
      }
    });

    document.addEventListener("mousemove", e => {
      if (document.pointerLockElement !== this.renderer.domElement) return;

      this.yaw -= e.movementX * 0.002;
      this.pitch -= e.movementY * 0.002;
      this.clampPitch();
    });
  }

  bindTouch() {
    const joystick = document.getElementById("joystick");
    const stick = document.getElementById("stick");
    const hud = document.getElementById("hud");

    let joyId = null;
    let joyCenter = null;

    const resetJoy = () => {
      this.joyX = 0;
      this.joyY = 0;
      joyId = null;
      stick.style.transform = "translate(0px, 0px)";
    };

    joystick.addEventListener("pointerdown", e => {
      joyId = e.pointerId;
      joystick.setPointerCapture(e.pointerId);
      const rect = joystick.getBoundingClientRect();
      joyCenter = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };
      e.preventDefault();
    });

    joystick.addEventListener("pointermove", e => {
      if (e.pointerId !== joyId) return;

      const dx = e.clientX - joyCenter.x;
      const dy = e.clientY - joyCenter.y;
      const max = 36;
      const length = Math.max(1, Math.hypot(dx, dy));
      const scale = Math.min(1, max / length);
      const x = dx * scale;
      const y = dy * scale;

      this.joyX = x / max;
      this.joyY = y / max;
      stick.style.transform = `translate(${x}px, ${y}px)`;
      e.preventDefault();
    });

    joystick.addEventListener("pointerup", resetJoy);
    joystick.addEventListener("pointercancel", resetJoy);

    // 조이스틱과 버튼 바깥에서 드래그하면 시점을 돌린다.
    hud.addEventListener("pointerdown", e => {
      if (e.pointerType !== "touch") return;
      if (e.target.closest("#joystick, #interactBtn")) return;

      this.lookPointer = e.pointerId;
      this.lastLookX = e.clientX;
      this.lastLookY = e.clientY;
    });

    hud.addEventListener("pointermove", e => {
      if (e.pointerId !== this.lookPointer) return;

      this.yaw -= (e.clientX - this.lastLookX) * 0.006;
      this.pitch -= (e.clientY - this.lastLookY) * 0.006;
      this.lastLookX = e.clientX;
      this.lastLookY = e.clientY;
      this.clampPitch();
    });

    const stopLook = e => {
      if (e.pointerId === this.lookPointer) this.lookPointer = null;
    };

    hud.addEventListener("pointerup", stopLook);
    hud.addEventListener("pointercancel", stopLook);
  }

  clampPitch() {
    this.pitch = THREE.MathUtils.clamp(
      this.pitch, -1.25, 1.25
    );
  }

  update(dt) {
    const forward =
      (this.keys.KeyW || this.keys.ArrowUp ? 1 : 0) -
      (this.keys.KeyS || this.keys.ArrowDown ? 1 : 0) -
      this.joyY;

    const strafe =
      (this.keys.KeyD || this.keys.ArrowRight ? 1 : 0) -
      (this.keys.KeyA || this.keys.ArrowLeft ? 1 : 0) +
      this.joyX;

    const length = Math.hypot(forward, strafe) || 1;
    const f = forward / length;
    const s = strafe / length;

    this.position.x +=
      (Math.cos(this.yaw) * s - Math.sin(this.yaw) * f) *
      this.speed * dt;

    this.position.z +=
      (-Math.cos(this.yaw) * f - Math.sin(this.yaw) * s) *
      this.speed * dt;

    this.position.x = THREE.MathUtils.clamp(
      this.position.x, -2.7, 2.7
    );

    this.camera.position.copy(this.position);
    this.camera.rotation.set(this.pitch, this.yaw, 0, "YXZ");
  }
}
