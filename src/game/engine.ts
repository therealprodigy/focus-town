import {
  canStand,
  getNearbyInteraction,
  HOUSE_DESK_SEAT,
  HOUSE_BED_POSITION,
  WORLDS,
  type SceneId,
  type Player,
  type Point,
  type WorldScene,
  type Interaction,
} from "./world";
import { renderWorld, type Peer } from "./renderer";
import { getCamera } from "./camera";
import type { DiscoveryId, DiscoveryEffect } from "./discoveries";
import type { UpgradeId } from "./townCatalog";
export const PLAYER_SPEED = 150;
export function movePlayer(
  scene: WorldScene,
  p: Player,
  dx: number,
  dy: number,
  seconds: number,
): Player {
  if (![p.x, p.y, dx, dy, seconds].every(Number.isFinite)) return p;
  const length = Math.hypot(dx, dy);
  if (!length || seconds <= 0) return p;
  const distance = PLAYER_SPEED * Math.min(seconds, 0.1),
    steps = Math.ceil(distance / 3);
  const next = {
    ...p,
    facing: (Math.abs(dx) > Math.abs(dy)
      ? dx < 0
        ? "left"
        : "right"
      : dy < 0
        ? "up"
        : "down") as Player["facing"],
  };
  for (let i = 0; i < steps; i++) {
    const x = next.x + ((dx / length) * distance) / steps,
      y = next.y + ((dy / length) * distance) / steps;
    if (canStand(scene, x, next.y)) next.x = x;
    if (canStand(scene, next.x, y)) next.y = y;
  }
  if (next.x !== p.x || next.y !== p.y) next.walkFrame += seconds * 8;
  return next;
}
type Callbacks = {
  onInteract: (i: Interaction) => void;
  onNearby: (i: Interaction | undefined) => void;
  onScene: (s: SceneId) => void;
};
export class GameEngine {
  scene: SceneId = "village";
  player: Player = { ...WORLDS.village.spawn, facing: "down", walkFrame: 0 };
  sharedMinutes = 0;
  characterName = "";
  discoveries: DiscoveryId[] = [];
  upgrades: UpgradeId[] = [];
  private idleSeconds = 0;
  private effect?: { kind: DiscoveryEffect; until: number };
  reveal(kind: DiscoveryEffect) {
    this.effect = { kind, until: performance.now() + 7000 };
  }
  private peers: Peer[] = [];
  private peerTargets: Peer[] = [];
  setPeers(peers: Peer[]) {
    this.peerTargets = peers;
    this.peers = this.peers.filter((p) =>
      peers.some((target) => target.id === p.id),
    );
    for (const target of peers) {
      const current = this.peers.find((p) => p.id === target.id);
      if (!current) this.peers.push({ ...target });
      else if (
        current.scene !== target.scene ||
        Math.hypot(current.x - target.x, current.y - target.y) > 150
      )
        Object.assign(current, target);
    }
  }
  visible = true;
  blocked = false;
  streak = 0;
  reducedMotion = false;
  paused = false;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private callbacks: Callbacks;
  private keys = new Set<string>();
  private frame = 0;
  private last = 0;
  private elapsed = 0;
  private nearId = "";
  private session: "focus" | "break" | null = null;
  private route: Point[] = [];
  constructor(canvas: HTMLCanvasElement, callbacks: Callbacks) {
    this.canvas = canvas;
    this.callbacks = callbacks;
    this.ctx = canvas.getContext("2d")!;
    canvas.addEventListener("keydown", this.down);
    canvas.addEventListener("keyup", this.up);
    canvas.addEventListener("blur", this.clear);
    window.addEventListener("blur", this.clear);
    document.addEventListener("visibilitychange", this.clear);
    this.frame = requestAnimationFrame(this.tick);
  }
  private down = (event: KeyboardEvent) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const k = event.key.toLowerCase();
    if (
      [
        "w",
        "a",
        "s",
        "d",
        "arrowup",
        "arrowdown",
        "arrowleft",
        "arrowright",
        "e",
      ].includes(k)
    ) {
      event.preventDefault();
      if (k === "e") {
        if (!event.repeat) this.interact();
      } else this.key(k, true);
    }
  };
  private up = (event: KeyboardEvent) =>
    this.key(event.key.toLowerCase(), false);
  private clear = () => {
    this.keys.clear();
    this.last = 0;
  };
  key(key: string, pressed: boolean) {
    if (pressed) this.keys.add(key);
    else this.keys.delete(key);
  }
  focus() {
    this.canvas.focus({ preventScroll: true });
  }
  interact() {
    if (this.blocked || this.session) return;
    const i = getNearbyInteraction(WORLDS[this.scene], this.player);
    if (!i) return;
    if (i.targetScene && i.targetSpawn) {
      this.setScene(i.targetScene, i.targetSpawn);
    } else this.callbacks.onInteract(i);
  }
  setScene(scene: SceneId, point: Point) {
    this.effect = undefined;
    this.idleSeconds = 0;
    this.scene = scene;
    this.player = { ...point, facing: "down", walkFrame: 0 };
    this.clear();
    this.nearId = "";
    this.callbacks.onNearby(undefined);
    this.callbacks.onScene(scene);
  }
  setSession(kind: "focus" | "break" | null, restore = false) {
    if (kind === this.session) return;
    const old = this.session;
    this.session = kind;
    this.nearId = "";
    this.callbacks.onNearby(undefined);
    this.clear();
    this.route = [];
    if (kind === "focus") {
      this.setScene("house", HOUSE_DESK_SEAT);
      this.player.facing = "up";
    }
    if (kind === "break") {
      if (restore || this.scene !== "house") {
        this.setScene("house", HOUSE_BED_POSITION);
      } else if (this.player.x < 550) {
        this.route = [
          { x: 530, y: this.player.y },
          { x: 530, y: 372 },
          { x: 644, y: 372 },
        ];
      } else
        this.route = [
          { x: this.player.x, y: 372 },
          { x: 644, y: 372 },
        ];
    }
    if (!kind && old === "break") this.setScene("house", { x: 644, y: 372 });
  }
  private tick = (now: number) => {
    const dt = this.last ? Math.min((now - this.last) / 1000, 0.05) : 0;
    this.last = now;
    this.elapsed += dt * 1000;
    if (this.effect && now >= this.effect.until) this.effect = undefined;
    this.idleSeconds =
      !this.session && !this.blocked && !this.keys.size
        ? this.idleSeconds + dt
        : 0;
    for (const p of this.peers) {
      const target = this.peerTargets.find((t) => t.id === p.id)!;
      const distance = Math.hypot(target.x - p.x, target.y - p.y),
        mix = this.reducedMotion ? 1 : 1 - Math.exp(-dt * 6);
      p.x += (target.x - p.x) * mix;
      p.y += (target.y - p.y) * mix;
      p.facing = target.facing;
      p.name = target.name;
      p.walking = distance > 2;
      p.walkFrame = (p.walkFrame ?? 0) + dt * 8;
    }
    let activity: "idle" | "walking" | "focusing" | "sleeping" = "idle";
    if (this.session === "focus") activity = this.paused ? "idle" : "focusing";
    else if (this.session === "break") {
      const target = this.route[0];
      if (target) {
        const dx = target.x - this.player.x,
          dy = target.y - this.player.y;
        if (Math.hypot(dx, dy) < 3) {
          this.player = { ...this.player, ...target };
          this.route.shift();
        } else {
          this.player = movePlayer(
            WORLDS[this.scene],
            this.player,
            dx,
            dy,
            Math.min(dt, Math.hypot(dx, dy) / PLAYER_SPEED),
          );
          activity = "walking";
        }
      } else {
        this.player = { ...this.player, ...HOUSE_BED_POSITION };
        activity = "sleeping";
      }
    } else if (!this.blocked) {
      const dx =
        Number(this.keys.has("d") || this.keys.has("arrowright")) -
        Number(this.keys.has("a") || this.keys.has("arrowleft"));
      const dy =
        Number(this.keys.has("s") || this.keys.has("arrowdown")) -
        Number(this.keys.has("w") || this.keys.has("arrowup"));
      const next = movePlayer(WORLDS[this.scene], this.player, dx, dy, dt);
      if (next.x !== this.player.x || next.y !== this.player.y)
        activity = "walking";
      this.player = next;
    }
    const nearby =
      this.blocked || this.session
        ? undefined
        : getNearbyInteraction(WORLDS[this.scene], this.player);
    if ((nearby?.id ?? "") !== this.nearId) {
      this.nearId = nearby?.id ?? "";
      this.callbacks.onNearby(nearby);
    }
    if (this.visible) {
      const bounds = this.canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.round(bounds.width * ratio));
      const height = Math.max(1, Math.round(bounds.height * ratio));
      if (this.canvas.width !== width || this.canvas.height !== height) {
        this.canvas.width = width;
        this.canvas.height = height;
      }
      this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      const camera = getCamera(
        WORLDS[this.scene],
        this.player,
        bounds.width,
        bounds.height,
      );
      this.ctx.scale(camera.scale, camera.scale);
      this.ctx.translate(-Math.round(camera.x), -Math.round(camera.y));
      renderWorld(this.ctx, this.scene, this.player, {
        discoveries: this.discoveries,
        upgrades: this.upgrades,
        effect: this.effect?.kind,
        idleSeconds: this.idleSeconds,
        camera,
        peers: this.peers,
        sharedMinutes: this.sharedMinutes,
        characterName: this.characterName,
        time: this.reducedMotion ? 0 : this.elapsed,
        activity,
        streak: this.streak,
        interactionId: nearby?.id,
      });
    }
    this.frame = requestAnimationFrame(this.tick);
  };
  destroy() {
    cancelAnimationFrame(this.frame);
    this.canvas.removeEventListener("keydown", this.down);
    this.canvas.removeEventListener("keyup", this.up);
    this.canvas.removeEventListener("blur", this.clear);
    window.removeEventListener("blur", this.clear);
    document.removeEventListener("visibilitychange", this.clear);
  }
}
