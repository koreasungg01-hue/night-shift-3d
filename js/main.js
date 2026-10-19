
import * as THREE from "three";
import { World } from "./world.js";
import { Player } from "./player.js";
import { Monster } from "./monster.js";
import { Interaction } from "./interaction.js";
import { UI } from "./ui.js";

const container = document.getElementById("game");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x08090d);
scene.fog = new THREE.Fog(0x08090d, 3, 25);

const camera = new THREE.PerspectiveCamera(
  72, window.innerWidth / window.innerHeight, 0.1, 150
);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: "high-performance"
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = false;
container.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0x778099, 0x171319, 0.65));

const world = new World(scene);
const ui = new UI();
const player = new Player(camera, renderer, ui);
const monster = new Monster(scene);

let interaction;
let running = false;
let lastTime = 0;
let gameEnded = false;

function resetGame() {
  player.position.set(0, 1.65, 0);
  player.yaw = 0;
  player.pitch = 0;
  player.keys = {};
  player.joyX = 0;
  player.joyY = 0;

  world.loopCount = 0;
  world.group.position.set(0, 0, 0);
  world.exitDoor.visible = false;
  world.exitDoor.position.z = -10;
  world.setAnomaly(0);

  monster.reset();
  interaction.examined.clear();

  camera.position.copy(player.position);
  camera.rotation.set(0, 0, 0);

  gameEnded = false;
  ui.start();
  running = true;
  lastTime = performance.now();

  if (!ui.isTouchDevice()) {
    renderer.domElement.requestPointerLock?.();
  }
}

function winGame() {
  if (gameEnded) return;
  gameEnded = true;
  running = false;
  ui.end(true);
}

function loseGame() {
  if (gameEnded) return;
  gameEnded = true;
  running = false;
  ui.end(false);
}

interaction = new Interaction(player, world, ui, winGame);

document.getElementById("startBtn")
  .addEventListener("click", resetGame);

document.getElementById("restartBtn")
  .addEventListener("click", resetGame);

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
});

function animate(now) {
  requestAnimationFrame(animate);

  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;

  if (running && !gameEnded) {
    player.update(dt);
    world.update(player);

    const caught = monster.update(
      dt, player, camera, world.loopCount
    );

    interaction.update(dt);
    ui.update(dt, world.loopCount);

    const monsterDistance = monster.group.position.distanceTo(
      player.position
    );

    ui.showDanger(
      monster.active && monsterDistance < 7
    );

    if (caught) {
      loseGame();
    }
  }

  renderer.render(scene, camera);
}

requestAnimationFrame(animate);
