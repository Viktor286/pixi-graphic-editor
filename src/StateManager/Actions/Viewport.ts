import FlowApp from '../../Interfaces/FlowApp';
import BoardElement from '../../Interfaces/BoardElement';
import { IWorldCoords } from '../../Interfaces/GraphicsEngine';

export default class ViewportActions {
  private runAheadZoomIn = 0;
  private runAheadZoomOut = 0;

  constructor(public app: FlowApp) {}

  public fitToBoard() {
    const { x: wX, y: wY, width, height } = this.app.viewport.instance.getLocalBounds();
    this.fitToArea({ wX: wX + width / 2, wY: wY + height / 2 }, width, height);
  }

  public fitToBoardElement(boardElement: BoardElement) {
    // route to group if group's member
    if (boardElement.inGroup) {
      boardElement = boardElement.inGroup;
    }
    let { width, height } = boardElement;
    let { x, y } = boardElement.getCenter();
    this.fitToArea({ wX: x, wY: y }, width, height);
  }

  public fitToArea(targetPoint: IWorldCoords, width: number, height: number) {
    const targetScale = this.app.viewport.findScaleFit(width, height);

    this.app.stateManager.setState(
      'viewport',
      this.app.viewport.viewportPropsConversion(
        targetPoint,
        targetScale - (targetScale / 100) * this.app.viewport.fitAreaMarginPercent,
      ),
      { async: 'animation' },
    );
  }

  public moveTo(target: IWorldCoords, targetScale?: number) {
    this.app.stateManager.setState(
      'viewport',
      this.app.viewport.viewportPropsConversion(target, targetScale),
      {
        async: 'animation',
      },
    );
  }

  public zoomIn(zoomPoint?: IWorldCoords) {
    if (this.runAheadZoomIn > 1) this.runAheadZoomIn = 1;

    this.app.stateManager.setState(
      'viewport',
      this.app.viewport.viewportPropsConversion(
        zoomPoint,
        this.app.viewport.zoomScales.getNextScaleStepUp(this.app.viewport.scaleX, this.runAheadZoomIn),
      ),
      { async: 'animation' },
    );

    this.runAheadZoomIn += 1;

    setTimeout(() => {
      this.runAheadZoomIn -= 1;
      if (this.runAheadZoomIn < 0) this.runAheadZoomIn = 0;
    }, 700);
  }

  public zoom100(zoomPoint?: IWorldCoords) {
    const scale = 1;
    this.app.stateManager.setState('viewport', this.app.viewport.viewportPropsConversion(zoomPoint, scale), {
      async: 'animation',
    });
  }

  public zoomOut(zoomPoint?: IWorldCoords) {
    if (this.runAheadZoomOut > 1) this.runAheadZoomOut = 1;

    this.app.stateManager.setState(
      'viewport',
      this.app.viewport.viewportPropsConversion(
        zoomPoint,
        this.app.viewport.zoomScales.getNextScaleStepDown(this.app.viewport.scaleX, this.runAheadZoomOut),
      ),
      { async: 'animation' },
    );

    this.runAheadZoomOut += 1;

    setTimeout(() => {
      this.runAheadZoomOut -= 1;
      if (this.runAheadZoomOut < 0) this.runAheadZoomOut = 0;
    }, 700);
  }

  public amendViewportState() {
    const { x, y, scale } = this.app.viewport;
    this.app.stateManager.setState(
      'viewport',
      {
        x,
        y,
        scale,
      },
      { noOp: true },
    );
  }
}
