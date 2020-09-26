import FlowApp from '../FlowApp';
import Viewport from '../Viewport';

export default class SlideControls {
  public activated = false;
  public isSliding = false;
  private moveEndTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(public app: FlowApp, public viewport: Viewport) {}

  public addSlideControls() {
    this.viewport.instance
      .drag()
      .pinch({
        noDrag: true,
      })
      .wheel()
      .decelerate({
        friction: 0.95,
        bounce: 0.8,
        minSpeed: 0.05,
      })
      .clampZoom({
        minScale: this.viewport.zoomScales[0],
        maxScale: this.viewport.zoomScales[this.viewport.zoomScales.length - 1],
      });

    // Both "moved-end" and 'zoomed-end' events have not stable debounce, firing often than should be.
    // It was decided to use only 'moved' callback for everything
    this.viewport.instance.on('moved', this.onSliderMoved);

    this.activated = true;
  }

  public removeSlideControls() {
    this.viewport.instance.plugins.remove('drag');
    this.viewport.instance.plugins.remove('pinch');
    this.viewport.instance.plugins.remove('wheel');

    this.viewport.instance.off('moved', this.onSliderMoved);

    this.activated = false;
  }

  private onSliderMoved = () => {
    if (!this.isSliding) {
      // console.log('onSliderStart');
      this.isSliding = true;
    }

    if (this.moveEndTimer) {
      clearTimeout(this.moveEndTimer);
    }

    // console.log('onSliderMoved');
    this.app.gui.stageBackTile.updateGraphics();

    this.moveEndTimer = setTimeout(this.onSliderEnd, 300); // lower than 300 values start throw doubles
  };

  private onSliderEnd = () => {
    // console.log('onSliderEnd');

    this.isSliding = false;
    this.app.actions.viewport.amendCameraState();
  };
}
