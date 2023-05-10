<template>
  <div id="preload">.</div>
  <div class="container" ref="container">
    <canvas id="canvas" ref="canvas" v-bind:width="width" v-bind:height="height"></canvas>
    <div v-if="showMenu" class="menu-container" :style="menuContainerStyle">
      <h1 class="title-text">PONG</h1>
      <div class="button-container">
        <div class="button-wrapper">
          <button
            class="centered-button"
            @click="handleButton1Click"
            @mouseenter="handleButton1Enter"
            @mouseleave="handleButton1Leave"
            :class="{ 'button-pressed': button1Pressed, 'button-fadeout': button2Pressed }"
          >{{ button1Text }}</button>
          <div class="hover-text left-text" :class="{ 'hover-text-visible': button1Hovered }">
            <p>Ruleset:</p>
            <p>- 1 vs 1</p>
            <p>- Normal Pong</p>
            <p>- 5 points</p>
          </div>
        </div>
        <div class="button-wrapper">
          <button
            class="centered-button"
            @click="handleButton2Click"
            @mouseenter="handleButton2Enter"
            @mouseleave="handleButton2Leave"
            :class="{ 'button-pressed': button2Pressed, 'button-fadeout': button1Pressed }"
          >{{ button2Text }}</button>
          <div class="hover-text right-text" :class="{ 'hover-text-visible': button2Hovered }">
            <p>Ruleset:</p>
            <p>- 2 vs 2</p>
            <p>- 2D moveset</p>
            <p>- 10 points</p>
          </div>
        </div>
      </div>
      <div class="overlay-text" :class="{ 'active': button1Pressed || button2Pressed }">{{ overlayText }}</div>
      <!-- FIXME remove -->
      <input v-model="inputText" type="text" placeholder="Enter id here" />
      <br/>
      <button @click="spectate(inputText)">Spectate</button>
      <!-- .FIXME remove -->
    </div>
    <div v-if="showBottomButton" class="bottom-button-wrapper" :style="bottomButtonWrapperStyle">
      <button
        class="centered-button bottom-button"
        @click="handleBottomButton"
      >{{ bottomButtonText }}</button>
    </div>
    <!--<div @click="alert()"></div>-->
    <!--<div class="play-button"></div>-->
  </div>
</template>

<script setup lang=ts>
import {
  onMounted,
  onUpdated,
  onUnmounted,
  ref,
} from 'vue';

import socket from "../services/ws.js";

// FIXME remove
const inputText = ref("");

/** VAR  --------------------------------------- */

const colorWhite: string = "#c3c3c3"
const colorBlack: string = "#131313"

let width = ref(858);
let height = ref(525);
const org_width: number = width.value;
const org_height: number = height.value;
let scale: number = width.value / org_width;

const menuContainerStyle = ref({});

const button1DefText: string = "Normal";
const button2DefText: string = "Special";
const button1Text = ref<string>(button1DefText)
const button2Text = ref<string>(button2DefText)
const button1Pressed = ref(false);
const button2Pressed = ref(false);
const button1Hovered = ref(false);
const button2Hovered = ref(false);
const overlayText = ref<string>('In queue...');
const showMenu = ref(false);

const showBottomButton = ref(false);
const bottomButtonText = ref('Exit');
const bottomButtonWrapperStyle = ref({});

const container = ref<HTMLElement>();
const canvas = ref<HTMLCanvasElement>();
let ctx: CanvasRenderingContext2D | null;

/** CLASS  ------------------------------------- */

class Score {
  public p1_: number = 0;
  public p2_: number = 0;
}

class Players {
  public yourTeam: string[] = [];
  public otherTeam: string[] = [];
}

interface Vector2 {
  x: number;
  y: number;
}
class GameObject {
  constructor(
    public id: number = 0,
    public pos: Vector2 = { x: 0, y: 0 },
    public scale: Vector2 = { x: 0, y: 0 },
  ) {}

  public draw() {
    ctx!.fillStyle = colorWhite;
    ctx!.fillRect(
        this.pos.x * scale,
        this.pos.y * scale,
        this.scale.x * scale,
        this.scale.y * scale);
  }
  public draw_invert() {
    ctx!.fillStyle = colorWhite;
    ctx!.fillRect(
        (org_width - (this.pos.x + this.scale.x)) * scale,
        this.pos.y * scale,
        this.scale.x * scale,
        this.scale.y * scale);
  }
}

class Es {
  public remove(id: number) {
    for (const obj of this.entities) {
      if (obj.id === id) this.entities.splice(this.entities.indexOf(obj), 1);
    }
  }
  public clear() {
    this.entities = [];
  }
  public update(obj: GameObject) {
    for (const index in this.entities) {
      if (this.entities[index].id === obj.id) {
        this.entities[index] = obj;
        return;
      }
    }
    this.entities.push(obj);
  }

  public draw() {
    this.entities.forEach( (element) => {
      element.draw();
    });
  }
  public draw_invert() {
    this.entities.forEach( (element) => {
      element.draw_invert();
    });
  }

  private entities: GameObject[] = [];
}

class Engine {
  public static is_right: boolean = true;
  public static text: string | undefined = undefined;
  public static textSize: number = 36;
  public static started: boolean = false;

  public static reset(): void {
    score.p1_ = 0;
    score.p2_ = 0;
    es.clear();
    this.clear();
    this.started = false;
  }
  public static clear(): void {
    ctx!.fillStyle = colorBlack;
    ctx!.fillRect(0, 0, canvas.value!.width, canvas.value!.height);
  }
  public static draw(): void {
    Engine.clear();
    if (this.started) {
      this.drawBorder();
      this.drawLine();
      this.drawEntities();
      this.drawScore();
      this.drawNames();
    }
    if (this.text !== undefined) {
      this.drawBorder();
      this.drawText(this.text, this.textSize, org_width / 2, org_height / 2 + this.textSize / 2);
    }
  }
  public static drawMenu() {
    Engine.clear();
    this.drawBorder();
  }
  public static drawEntities() {
    if (this.is_right === true) {
      es.draw();
    } else {
      es.draw_invert();
    }
  }
  public static drawScore() {
    if (this.is_right === true) {
      Engine.drawText(score.p2_ + "  " + score.p1_, 100, org_width / 2, 100);
    } else {
      Engine.drawText(score.p1_ + "  " + score.p2_, 100, org_width / 2, 100);
    }
  }
  public static drawNames() {
    const yourTeam: string = players.yourTeam.map((str: string) => {
      if (str.length > 12) return str.slice(0, 9) + "...";
      return str;
    }).join(' ');
    const otherTeam: string = players.otherTeam.map((str: string) => {
      if (str.length > 12) return str.slice(0, 9) + "...";
      return str;
    }).join(' ');
    const size: number = 18;
    const modX: number = 80 + (showBottomButton.value ? 70 : 0);
    const modY: number = (players.yourTeam.length + 1) * 17 * scale;
    if (this.is_right === true) {
      Engine.drawText(yourTeam, size, org_width / 2 + modX, org_height - modY, true);
      Engine.drawText(otherTeam, size, org_width / 2 - modX, org_height - modY, true);
    } else {
      Engine.drawText(yourTeam, size, org_width / 2 - modX, org_height - modY, true);
      Engine.drawText(otherTeam, size, org_width / 2 + modX, org_height - modY, true);
    }
  }
  public static drawText(text: string, size: number, w: number, h: number, forceWrap: boolean = false): void {
    ctx!.fillStyle = colorWhite;
    ctx!.font = Math.ceil(size * scale).toString() + "px pixel";
    ctx!.textAlign = "center";

    const wrapText = (text: string, maxWidth: number, forceWrap: boolean): string[] => {
      const words = text.split(' ');
      const lines: string[] = [];
      let line = '';

      for (const word of words) {
        const testLine = line + word + ' ';
        const metrics = ctx!.measureText(testLine);
        const testWidth = metrics.width;

        if (forceWrap || (testWidth > maxWidth && line.length > 0)) {
          lines.push(line.trim());
          line = word + ' ';
        } else {
          line = testLine;
        }
      }

      lines.push(line.trim());
      return lines;
    };

    const maxWidth = org_width * scale * 0.8; // Adjust this value to set the maximum width for the text
    const lineHeight = Math.ceil(size * 1.2 * scale);

    const shouldWrap = forceWrap || ctx!.measureText(text).width > maxWidth;
    const lines = shouldWrap ? wrapText(text, maxWidth, forceWrap) : [text];

    for (let i = 0; i < lines.length; i++) {
      ctx!.fillText(lines[i], w * scale, (h + lineHeight * i) * scale);
    }
  }

  private static drawLine(): void {
    if (ctx === null) return;

    const centerX = org_width * scale / 2;
    const segmentLength = 40 * scale;
    const gapLength = 20 * scale;
    let currentPosition = 0;

    ctx.beginPath();
    ctx.strokeStyle = colorWhite;
    ctx.lineWidth = 4 * scale;

    while (currentPosition < org_height * scale) {
      ctx.moveTo(centerX, currentPosition);
      currentPosition += segmentLength;
      ctx.lineTo(centerX, currentPosition);
      currentPosition += gapLength;
    }

    ctx.stroke();
  }

  public static drawBorder(): void {
    if (ctx === null) return;

    const borderWidth = 4 * scale;

    ctx.beginPath();
    ctx.strokeStyle = colorWhite;
    ctx.lineWidth = borderWidth;

    // Draw top border
    ctx.moveTo(0, borderWidth / 2);
    ctx.lineTo(org_width * scale, borderWidth / 2);

    // Draw right border
    ctx.moveTo(org_width * scale - borderWidth / 2, 0);
    ctx.lineTo(org_width * scale - borderWidth / 2, org_height * scale);

    // Draw bottom border
    ctx.moveTo(org_width * scale, org_height * scale - borderWidth / 2);
    ctx.lineTo(0, org_height * scale - borderWidth / 2);

    // Draw left border
    ctx.moveTo(borderWidth / 2, org_height * scale);
    ctx.lineTo(borderWidth / 2, 0);

    ctx.stroke();
  }
}

const score: Score = new Score();
const players: Players = new Players();
const es: Es = new Es();

/** CANVAS ------------------------------------- */

let calculate_size = function(src_w: number, src_h: number, max_w: number, max_h: number) {
  //console.log("values: { src: " + src_w + " x " + src_h + ", max: " + max_w + " x " + max_h + " }");
  let ratio: number = Math.min(max_w / src_w, max_h / src_h);
  return {
    width: src_w * ratio,
    height: src_h * ratio
  };
};

let resize_canvas = function() {
  if (container && container.value) {
    // resize
    let size = calculate_size(
        width.value,
        height.value,
        container.value.clientWidth,
        container.value.clientHeight);
    width.value = size.width;
    height.value = size.height;
    // set scale appropriately
    scale = width.value / org_width;
    // move exit button
    /*bottomButtonWrapperStyle.value = {
      //bottom: `${((container.value.clientHeight - height.value) / 2) + 20}px`,
      //transform: `translateY(-100%)`,
    };*/
    // move menu
    menuContainerStyle.value = {
      width: `${width.value}px`,
      height: `${height.value}px`,
    };
  }
};

window.addEventListener('resize', resize_canvas);

/** SOCKETS ------------------------------------ */

socket.on('score', (p1: number, p2: number) => {
  score.p1_ = p1;
  score.p2_ = p2;
});

socket.on('position', () => {
	console.log("game socket.id = " + socket.id);
});

socket.on('ready', (room_code: string, is_right: boolean, started: boolean = false) => {
	console.log("game socket.id = " + socket.id);
  console.log("ready - game code: " + room_code);
  Engine.is_right = is_right;
  Engine.reset();
  game.changeStatus(Status.GAME);
  hideMenu();
  if (started === true) {
    Engine.started = true;
    showBottomButton.value = true;
  }
  socket.emit("ready");
});
socket.on('start', (countdown: number) => {
  const startCountdown = async (): Promise<void> => {
    Engine.textSize = 36;
    Engine.text = "Match found!";
    await new Promise(resolve => setTimeout(resolve, 1000));
    while (countdown > 0) {
      Engine.textSize = 56;
      Engine.text = countdown.toString() + "...";
      Engine.started = true;
      --countdown;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    Engine.text = undefined;
  };

  if (countdown === 0) return;
  startCountdown();
});
socket.on('stop', (winText: string) => {
  const waitForMenu = async (): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 3000));
    Engine.reset();
    Engine.drawMenu();
    displayMenu();
    game.changeStatus(Status.MENU);
  };

  game.changeStatus(Status.NONE);
  showBottomButton.value = false;
  es.clear();
  Engine.clear();
  Engine.drawBorder();
  Engine.drawScore();
  Engine.drawText(winText, 36, org_width / 2, org_height / 2);
  waitForMenu();
});

socket.on('players', (yourTeam: string[], otherTeam: string[]) => {
  players.yourTeam = yourTeam;
  players.otherTeam = otherTeam;
});

socket.on('update', (id: number, pos_x: number, pos_y: number, scale_x: number, scale_y: number) => {
  es.update(new GameObject(id, { x: pos_x, y: pos_y}, { x: scale_x, y: scale_y }));
});
socket.on('delete', (id: number) => {
  es.remove(id);
});

// TODO this is rnavarre42 part hardcoded
const spectate = (id: string) => {
  socket.emit('get-room', id);
};
socket.on('room', (code: string) => {
  console.log("got room: " + code + ", joining...");
  socket.emit('join-room', code);
});

/** EVENTS ------------------------------------- */

// keys

const onKeyDown = (e: KeyboardEvent) => {
  if (e.repeat) return;
  let key: string = e.key.toLowerCase();
  if (key === "w" || key === "s" || key == "d" || key == "a"
      || key === "," || key === "o" || key == "e"
      || key === "arrowup" || key === "arrowdown" || key === "arrowright" || key === "arrowleft") {
	  socket.emit("down", key);
  }
}

const onKeyUp = (e: KeyboardEvent) => {
  let key: string = e.key.toLowerCase();
  if (key === "w" || key === "s" || key == "d" || key == "a"
      || key === "," || key === "o" || key == "e"
      || key === "arrowup" || key === "arrowdown" || key === "arrowright" || key === "arrowleft") {
	  socket.emit("up", key);
	}
}

window.addEventListener('keyup', onKeyUp);
window.addEventListener('keydown', onKeyDown);

/** COMPOSITION API  --------------------------- */

onMounted(() => {
  // load context
  ctx = canvas.value!.getContext("2d");
  // resize before drawing
  resize_canvas();
  Engine.drawMenu();
  // load font and start loop when loaded
  const pixel = new FontFace('pixel', 'url(https://dl.dropboxusercontent.com/s/hsdwvz761xqphhb/pixel.ttf)');
  pixel.load().then((font) => {
    document.fonts.add(font);
    console.log('Font loaded');
    // game loop
    displayMenu();
    game.changeStatus(Status.MENU);
  });
});

onUnmounted(() => {
  window.removeEventListener('keypress', onKeyUp);
  window.removeEventListener('keypress', onKeyDown);
  window.removeEventListener('resize', resize_canvas);
});

/** BUTTON  ------------------------------------ */

const handleButton1Click = () => {
  if (button1Pressed.value == false) {
    socket.emit("join_queue", "normal");
    button1Text.value = "Cancel";
  } else {
    socket.emit("leave_queue");
    button1Text.value = button1DefText;
  }
  button1Pressed.value = !button1Pressed.value;
};
const handleButton2Click = () => {
  if (button2Pressed.value == false) {
    socket.emit("join_queue", "special");
    button2Text.value = "Cancel";
  } else {
    socket.emit("leave_queue");
    button2Text.value = button2DefText;
  }
  button2Pressed.value = !button2Pressed.value;
};
const handleBottomButton = () => {
  showBottomButton.value = false;
  // return to menu
  Engine.reset();
  displayMenu();
  game.changeStatus(Status.MENU);
}

const hideMenu = () => {
  // hide
  showMenu.value = false;
  // reset menu
  if (button1Pressed.value == true) {
    button1Text.value = button1DefText;
    button1Pressed.value = false;
  }
  if (button2Pressed.value == true) {
    button2Text.value = button2DefText;
    button2Pressed.value = false;
  }
  button1Hovered.value = false;
  button2Hovered.value = false;
}
const displayMenu = () => {
  showMenu.value = true;
}

const handleButton1Enter = () => {
  button1Hovered.value = true;
}
const handleButton1Leave = () => {
  button1Hovered.value = false;
}
const handleButton2Enter = () => {
  button2Hovered.value = true;
}
const handleButton2Leave = () => {
  button2Hovered.value = false;
}

/** RENDER  ------------------------------------ */

function interval(interval_ms: number, showFps: boolean = false) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    let interval_id: number | null = null;
    // create a new method that wraps the original with interval logic
    const original_method = descriptor.value;
    const shouldStopMap: Map<PropertyDescriptor, boolean> = new Map();

    descriptor.value = function(...args: any[]): void {
      // fps
      let then: number = performance.now();
      let elapsed: number;
      let start_time: number = then;
      let fps_cnt: number = 0;
      shouldStopMap.set(descriptor, false);
      // loop
      const loop = () => {
        const now = performance.now();
        elapsed = now - then;
        if (elapsed > interval_ms) {
          // fps
          then = now - (elapsed % interval_ms)
          // call the original method
          original_method.apply(this, args); // call the original method
          // fps
          if (showFps) {
            let fps = Math.round(Math.round((1000 / ((now - start_time) / ++fps_cnt)) * 100) / 100);
            Engine.drawText(fps.toString(), 25, 50, 30);
          }
        }
        if (!shouldStopMap.get(descriptor)) {
          interval_id = requestAnimationFrame(loop);
        } else {
          shouldStopMap.delete(descriptor);
        }
      };
      // start
      interval_id = requestAnimationFrame(loop); // start interval
    };

    // define a stop method to cancel the interval
    descriptor.value.stop = function(): void {
      if (interval_id !== null) {
        shouldStopMap.set(descriptor, true);
        cancelAnimationFrame(interval_id);
        interval_id = null;
      }
    };

    return descriptor;
  };
}

const fps_target: number = 60;
const fps_interval: number = 1000 / fps_target;
enum Status {
  NONE = 0,
  MENU,
  GAME,
}
class GameController {
  private status: Status = Status.NONE;
  private menu_interval_id: number | null = null;
  private game_interval_id: number | null = null;

  constructor() {
    // FIXME uncomment this
    //window.addEventListener('blur', this.onBlur.bind(this));
    //window.addEventListener('focus', this.onFocus.bind(this));
  }

  onBlur() {
    if (this.status === Status.MENU && this.menu_interval_id !== null) {
      this.menu_loop.stop();
    } else if (this.status === Status.GAME && this.game_interval_id !== null) {
      this.game_loop.stop();
    }
  }

  onFocus() {
    if (this.status === Status.MENU) {
      this.menu_interval_id = this.menu_loop();
    } else if (this.status === Status.GAME) {
      this.game_interval_id = this.game_loop();
    }
  }

  @interval(1000)
  private menu_loop() {
    Engine.drawMenu();
  }

  @interval(fps_interval)
  private game_loop() {
    Engine.draw();
  }

  changeStatus(status: Status) {
    // do nothing if not changed
    if (status === this.status) {
      return;
    }

    // stop
    if (this.status === Status.MENU && this.menu_interval_id !== null) {
      this.menu_loop.stop();
    } else if (this.status === Status.GAME && this.game_interval_id !== null) {
      this.game_loop.stop();
    }

    // update and start
    this.status = status;
    if (status === Status.MENU) {
      this.menu_interval_id = this.menu_loop();
    } else if (status === Status.GAME) {
      this.game_interval_id = this.game_loop();
    }
  }
}
const game: GameController = new GameController();

/*function update() {
  requestAnimationFrame(update);
  const now = performance.now();

  if (focused == false) {
    return;
  }

  elapsed = now - then;
  if (elapsed > fps_interval) {
    // fps
    then = now - (elapsed % fps_interval)
    let fps = Math.round(Math.round((1000 / ((now - start_time) / ++fps_cnt)) * 100) / 100);
    // render
    Engine.draw();
    Engine.drawtext(fps.toString(), "25", 50, 30);
  }
}*/

</script>

<style>

/*@font-face {
  font-family: "pixel";
  src: url("https://dl.dropboxusercontent.com/s/hsdwvz761xqphhb/pixel.ttf");
}*/

#preload {
  font-family: "pixel";
  opacity: 0;
  height: 0;
  width: 0;
  display: inline-block;
}

html, body {
  overflow: hidden !important;
}

body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  /*justify-content: center;*/
}

.container {
  padding: 0;
  /*width: calc(100% - 20px);*/
  width: 100%;
  margin-left: 10px;
  margin-right: 10px;
  /*height: calc(100% - 20px);*/
  height: 100%;
  margin-top: 10px;
  margin-bottom: 10px;
  /*position: relative;*/
}

canvas {
  /* pixel perfect */
  image-rendering: -moz-crisp-edges;
  image-rendering: -webkit-crisp-edges;
  image-rendering: pixelated;
  /* dimensions */
  max-width: 100%;
  max-height: 100%;
  /* border: #c3c3c3 4px solid; */
  /* center */
  padding: 0;
  margin: auto;
  display: block;
  position: relative;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
}

.menu-container {
  position: relative;
  transform: translateY(-100%);
  margin: auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  /*height: 150px; /* set a fixed height for the container */
  /*width: 200px; /* fixed width so text displays in one line */
}

.title-text {
  color: #c3c3c3;
  font-size: 100px;
  font-family: 'pixel', sans-serif;
}

.button-container {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px; /* Add gap between buttons */
}
.button-wrapper {
  display: flex;
  align-items: center;
  position: relative;
}

.centered-button {
  width: 110px;
  height: 50px;
  background-color:  #c3c3c3;
  color: #131313;
  border: none;
  font-size: 24px;
  font-family: 'pixel', sans-serif;
  cursor: pointer;
  transition: transform 0.2s ease, background-color 0.2s ease, opacity 0.2s ease;
}
.centered-button:hover {
  transform: scale(1.05);
}
.centered-button:active {
  transform: scale(0.95);
}
.button-pressed {
  background-color: #f45050;
  color: #c3c3c3;
}
.button-fadeout {
  opacity: 0.5;
  pointer-events: none;
}

.overlay-text {
  font-size: 16px;
  font-family: 'pixel', sans-serif;
  color: #c3c3c3;
  opacity: 0;
  transition: opacity 0.5s ease;
  pointer-events: none; /*  allow button press even when text is displayed */
  margin-top: 10px;
}
.overlay-text.active {
  opacity: 1;
}

.hover-text {
  position: absolute;
  font-size: 16px;
  font-family: 'pixel', sans-serif;
  color: #c3c3c3;
  opacity: 0;
  transition: opacity 0.5s ease;
  pointer-events: none;
}
.hover-text-visible {
  opacity: 1;
}
.left-text {
  margin-right: 120px;
  left: calc(50% - 200px);
}
.right-text {
  margin-left: 120px;
  right: calc(50% - 200px);
}

.bottom-button-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  transform: translateY(calc(-100% - 10px));
}
.bottom-button {
  background-color: #f45050;
  color: #c3c3c3;
}

</style>
