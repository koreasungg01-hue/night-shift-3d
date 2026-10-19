
export class UI {
  constructor() {
    this.menu = document.getElementById("menu");
    this.hud = document.getElementById("hud");
    this.endScreen = document.getElementById("endScreen");
    this.message = document.getElementById("message");
    this.prompt = document.getElementById("prompt");
    this.danger = document.getElementById("danger");
    this.loopText = document.getElementById("loopText");
    this.objective = document.getElementById("objective");
    this.endTitle = document.getElementById("endTitle");
    this.endText = document.getElementById("endText");

    this.playing = false;
    this.messageTimer = 0;
  }

  isTouchDevice() {
    return matchMedia("(pointer: coarse)").matches;
  }

  isPlaying() {
    return this.playing;
  }

  start() {
    this.playing = true;
    this.menu.classList.add("hidden");
    this.endScreen.classList.add("hidden");
    this.hud.classList.remove("hidden");
    this.danger.classList.add("hidden");
    this.showMessage("복도 끝까지 이동하라.");
  }

  showMessage(text) {
    this.message.textContent = text;
    this.messageTimer = 3.5;
  }

  setPrompt(text) {
    this.prompt.textContent = text;
  }

  showDanger(on) {
    this.danger.classList.toggle("hidden", !on);
  }

  update(dt, loopCount) {
    this.loopText.textContent =
      `반복 구역 ${Math.min(loopCount + 1, 6)} / 6`;

    if (this.messageTimer > 0) {
      this.messageTimer -= dt;
      if (this.messageTimer <= 0) {
        this.message.textContent = "";
      }
    }
  }

  end(won) {
    this.playing = false;
    this.hud.classList.add("hidden");
    this.endScreen.classList.remove("hidden");

    this.endTitle.textContent = won ? "탈출 성공" : "근무 종료";
    this.endText.textContent = won
      ? "반복되는 복도를 벗어났다. 하지만 정말 끝난 걸까?"
      : "어둠 속의 무언가가 당신을 발견했다.";

    document.exitPointerLock?.();
  }
}
