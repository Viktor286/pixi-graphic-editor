import PIXI from 'pixi.js';
import { GraphicsEngine } from './GraphicsEngine';
import { Viewport as PixiViewport } from 'pixi-viewport';
import FlowApp from './FlowApp';
import { ViewportAnimations } from './Animations';

export type WordScreenCoords = {
  wX: number;
  wY: number;
};

// Viewport documentation: https://davidfig.github.io/pixi-viewport/jsdoc/Viewport.html
// Module: node_modules/pixi-viewport/dist/viewport.es.js

export default class Viewport {
  instance: PixiViewport;
  engine: GraphicsEngine;
  animations: ViewportAnimations;
  zoomScale: number[];

  constructor(public app: FlowApp) {
    this.engine = app.engine;
    this.instance = this.setupViewport(this.engine.hostHTML.clientWidth, this.engine.hostHTML.clientHeight);
    this.animations = new ViewportAnimations(this);
    this.zoomScale = [0.03125, 0.0625, 0.125, 0.25, 0.5, 1, 2, 4, 8, 16];
    app.stage.addChild(this.instance);
  }

  getNextScaleStepDown() {
    const currentScale = this.instance.scale.x;

    for (let i = 0; i < this.zoomScale.length; i++) {
      if (currentScale <= this.zoomScale[0]) {
        return this.zoomScale[0];
      }

      if (currentScale > this.zoomScale[this.zoomScale.length - 1]) {
        return this.zoomScale[this.zoomScale.length - 1];
      }

      if (currentScale === this.zoomScale[i]) {
        return this.zoomScale[i - 1];
      }

      if (currentScale > this.zoomScale[i] && currentScale < this.zoomScale[i + 1]) {
        return this.zoomScale[i];
      }
    }
  }

  getNextScaleStepUp() {
    const currentScale = this.instance.scale.x;

    for (let i = 0; i < this.zoomScale.length; i++) {
      if (currentScale < this.zoomScale[0]) {
        return this.zoomScale[0];
      }

      if (currentScale >= this.zoomScale[this.zoomScale.length - 1]) {
        return this.zoomScale[this.zoomScale.length - 1];
      }

      if (currentScale === this.zoomScale[i]) {
        return this.zoomScale[i + 1];
      }

      if (currentScale > this.zoomScale[i] && currentScale < this.zoomScale[i + 1]) {
        return this.zoomScale[i + 1];
      }
    }
  }

  setupViewport(hostHTMLWidth: number, hostHTMLHeight: number) {
    // Code Examples:
    // this.pixiViewport.moveCenter(3, 3);

    // Viewport
    const viewport = new PixiViewport({
      screenWidth: hostHTMLWidth,
      screenHeight: hostHTMLHeight,
      worldWidth: hostHTMLWidth,
      worldHeight: hostHTMLHeight,
      // interaction: this.engine.instance.renderer.plugins.interaction, // the interaction module is important for wheel to work properly when renderer.view is placed or scaled
    });

    // viewport.drag().pinch().wheel().decelerate();

    return viewport;
  }

  addToViewport(displayObject: PIXI.DisplayObject) {
    return this.instance.addChild(displayObject);
  }

  getZoom(): string {
    return Math.round(this.instance.scale.x * 100).toString();
  }
  //
  // setZoom(absPercent: number) {
  //   this.instance.setZoom(absPercent / 100, true);
  // }

  screenToWorld(sX: number, sY: number) {
    return this.instance.toWorld(sX, sY);
  }

  getScreeCenterInWord(): WordScreenCoords {
    return {
      wX: this.instance.worldScreenWidth / 2 - this.instance.x / this.instance.scale.x,
      wY: this.instance.worldScreenHeight / 2 - this.instance.y / this.instance.scale.y,
    };
  }

  onCameraAnimationEnds = () => {
    this.app.actions.updateZoomBtn();
  };
}
