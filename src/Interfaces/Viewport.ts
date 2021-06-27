// PIXI documentation: https://pixijs.download/dev/docs/PIXI.html
//
// Code Examples:
// sprite = new PIXI.Sprite(PIXI.loader.resources["images/anyImage.png"].texture);
// base = new PIXI.BaseTexture(anyImageObject),
// texture = new PIXI.Texture(base),
// sprite = new PIXI.Sprite(texture);
import { Viewport as PixiViewport } from 'pixi-viewport';
import ViewportSlideControls from './ViewportSlideControls';
import ViewportZoomScales from './ViewportZoomScales';
import FlowApp from './FlowApp';
import { StageEvent } from './InteractionEvents/StageEvents';
import PIXI from 'pixi.js';
import BoardElement from './BoardElement';
import { gsap } from 'gsap';
import { IScreenCoords, IWorldCoords } from './GraphicsEngine';

export default class Viewport {
  public readonly instance: PixiViewport;
  public readonly slideControls: ViewportSlideControls;
  public readonly zoomScales = new ViewportZoomScales();
  public readonly fitAreaMarginPercent = 20;

  [key: string]: any;

  constructor(public app: FlowApp) {
    this.instance = new PixiViewport({
      screenWidth: 100,
      screenHeight: 100,
      worldWidth: 100,
      worldHeight: 100,
      // interaction: this.engine.instance.renderer.plugins.interaction, // the interaction module is important for wheel to work properly when renderer.view is placed or scaled
    });

    this.instance.sortableChildren = true;

    this.slideControls = new ViewportSlideControls(this.app, this);
    this.slideControls.installSlideControls();

    window.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });

    // Handler for "pixi engine and Viewport" dimensions dependency on window size
    window.addEventListener('resize', this.resizeViewportHandler);
    setTimeout(() => this.resizeViewportHandler());
    // window.addEventListener('orientationchange', this.orientationchangeViewportHandler, false);

    // For preventing page zoom you should prevent wheel event:
    window.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
      },
      { passive: false },
    );
  }

  set x(x: number) {
    this.instance.x = x;
  }

  get x() {
    return this.instance.x;
  }

  set y(y: number) {
    this.instance.y = y;
  }

  get y() {
    return this.instance.y;
  }

  set scale(val: number) {
    this.instance.scale.x = val;
    this.instance.scale.y = val;
  }

  get scale() {
    return this.instance.scale.x;
  }

  get scaleX() {
    return this.instance.scale.x;
  }

  get scaleY() {
    return this.instance.scale.y;
  }

  set screenWidth(val: number) {
    this.instance.screenWidth = val;
  }

  get screenWidth() {
    return this.instance.screenWidth;
  }

  set screenHeight(val: number) {
    this.instance.screenHeight = val;
  }

  get screenHeight() {
    return this.instance.screenHeight;
  }

  set interactive(val: boolean) {
    this.instance.interactive = val;
  }

  get interactive() {
    return this.instance.interactive;
  }

  public resizeViewportHandler = (): void => {
    // solution ref: https://github.com/davidfig/pixi-viewport/issues/212#issuecomment-608231281
    if (
      this.app.engine.renderScreenWidth !== this.app.hostHTMLWidth ||
      this.app.engine.renderScreenHeight !== this.app.hostHTMLHeight
    ) {
      this.app.engine.resizeRenderScreen(this.app.hostHTMLWidth, this.app.hostHTMLHeight);
      this.resizeViewport(this.app.hostHTMLWidth, this.app.hostHTMLHeight);
    }
  };

  public resizeViewport(width: number, height: number) {
    this.instance.resize(width, height);
    this.app.gui.stageBackTile.updateDimensions(width, height);
  }

  public getScreenCoordsFromEvent(e: StageEvent): IScreenCoords {
    return { sX: e.data.global.x, sY: e.data.global.y };
  }

  public getWorldScreenCoordsFromEvent(e: StageEvent): IWorldCoords {
    const screenClick: IScreenCoords = this.getScreenCoordsFromEvent(e);
    return this.screenToWorld(screenClick);
  }

  public addToViewport(displayObject: PIXI.DisplayObject, index: number = 0): PIXI.DisplayObject {
    return this.instance.addChildAt(displayObject, index);
  }

  public addBoardElementToViewport(boardElement: BoardElement): void {
    this.instance.addChildAt(boardElement.cgObj, 0);
  }

  public removeFromViewport(displayObject: PIXI.DisplayObject): PIXI.DisplayObject {
    return this.instance.removeChild(displayObject);
  }

  public getZoomString(): string {
    return Math.round(this.x * 100).toString();
  }

  public screenToWorld({ sX, sY }: IScreenCoords): IWorldCoords {
    const { x: wX, y: wY } = this.instance.toWorld(sX, sY);
    return { wX, wY };
  }

  public screenCenter(): IScreenCoords {
    return { sX: this.screenWidth / 2, sY: this.screenHeight / 2 };
  }

  public worldScreenCenter(): IWorldCoords {
    return { wX: this.instance.worldScreenWidth / 2, wY: this.instance.worldScreenHeight / 2 };
  }

  // get center()
  // center of screen in world coordinates = worldScreenWidth / 2 - x / scale

  // get worldScreenWidth()
  // worldScreenWidth = screenWidth / scale

  public getScreenCenterInWord(): IWorldCoords {
    return {
      wX: this.instance.worldScreenWidth / 2 - this.instance.x / this.instance.scale.x,
      wY: this.instance.worldScreenHeight / 2 - this.instance.y / this.instance.scale.y,
    };
  }

  public getWorldCoordsFromMouse(): IWorldCoords {
    const { sX, sY } = this.app.engine.getScreenCoordsFromMouse();
    const { x: wX, y: wY } = this.instance.toLocal({ x: sX, y: sY });
    return { wX, wY };
  }

  public findScaleFit(width: number, height: number) {
    return this.instance.findFit(width, height);
  }

  public viewportPropsConversion(targetPoint?: IWorldCoords, targetScale?: number) {
    if (!targetPoint) {
      targetPoint = this.getScreenCenterInWord();
    }

    if (targetScale === undefined) {
      targetScale = this.scale;
    }

    if (targetScale >= 32) targetScale = 32;
    if (targetScale <= 0.01) targetScale = 0.01;

    return {
      x: (this.screenWidth / targetScale / 2 - targetPoint.wX) * targetScale,
      y: (this.screenHeight / targetScale / 2 - targetPoint.wY) * targetScale,
      scale: targetScale,
    };
  }

  public animateViewport(viewportProps: Partial<Viewport>): Promise<Partial<Viewport>> {
    const { x, y, scale } = viewportProps;

    const animateProps = {
      x,
      y,
      scale,
    };
    return new Promise((resolve) => {
      gsap.to(this, {
        ...animateProps,
        duration: 0.5,
        ease: 'power3.out',
        onStart: () => {
          // this.interactive = false;
        },
        onUpdate: () => {
          this.app.gui.stageBackTile.updateGraphics();
          this.app.board.updateSelectionGraphics();
        },
        onComplete: () => {
          // this.interactive = true;
          setTimeout(() => this.onViewportAnimationEnds()); // send exec to next frame
          resolve({ ...animateProps });
        },
      });
    });
  }

  private onViewportAnimationEnds = (): void => {
    this.app.webUi.updateZoomBtn();
  };
}
