import StageEvents, { StageEvent } from './StageEvents';
import FlowApp from '../FlowApp';
import BoardElement from '../BoardElement';
import { IScreenCoords, IWorldCoords } from '../GraphicsEngine';

interface IGestureEvent extends StageEvent {
  screenClick: IScreenCoords;
  worldClick: IWorldCoords;
  isBoardElementHit?: BoardElement | undefined;
}

// TODO: rename InteractionEvents into something like "input controllers"?

// Timed-gestures event manager
export default class TimedGesture {
  private app: FlowApp;
  private awaiting: boolean | string = false;
  private isGateDown = false;
  private wasGateUp = false;
  private isDoubleClick = false;
  private mainTimer: ReturnType<typeof setTimeout> | null = null;
  private wasGateUpTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(public stageEvents: StageEvents) {
    this.app = stageEvents.app;
  }

  public pointerDownGate(e: StageEvent) {
    // safety catch for double down cases
    if (this.isGateDown) return;
    this.isGateDown = true;

    // DoubleClick condition
    if (this.wasGateUp) this.isDoubleClick = true;

    // Timed-gestures manager
    this.awaiting = true;

    // this.resetGlc();
    // this.markGlc('Dw Gate');

    // Tier 0: Immediate "Select" press
    // Block second immediate click for double-click case
    if (!this.isDoubleClick) {
      // Required data from the input event should be preserved here
      // otherwise event data will be obtained respecting the Gestures delay state (not state from a click)
      const gestureEvent = this.getGestureEvent(e);
      this.pressDownImmediate(gestureEvent);

      // pressDownQuick
      this.mainTimer = setTimeout(() => {
        if (this.app.viewport.slideControls.isSliding) this.awaiting = false;
        if (this.awaiting) {
          // Tier 1: quick-press
          this.awaiting = 'quick';
          this.pressDownQuick(gestureEvent);

          // pressDownMedium
          this.mainTimer = setTimeout(() => {
            if (this.app.viewport.slideControls.isSliding) this.awaiting = false;
            if (this.awaiting) {
              // Tier 2: medium-press
              this.awaiting = 'medium';
              this.pressDownMedium(gestureEvent);

              // pressDownLong
              // this.mainTimer = setTimeout(() => {
              // if (this.app.viewport.slideControls.isSliding) this.awaiting = false;
              // if (this.awaiting) {
              //   // Tier 3: long-press
              //   this.awaiting = 'long';
              //   this.pressDownLong(gestureEvent);
              // }
              // }, 1000);
            }
          }, 700);
        }
      }, 450);
      // the lowest value 220 (refined to 215) was determined by trackpad tap speed length
      // it could be different on different laptops, but 220 seems long enough
    }
  }

  public pointerUpGate(e: StageEvent) {
    // safety catch against up-without-down cases
    if (!this.isGateDown) return;
    this.isGateDown = false;

    this.wasGateUp = true;
    if (this.wasGateUpTimer) clearTimeout(this.wasGateUpTimer);
    this.wasGateUpTimer = setTimeout(() => (this.wasGateUp = false), 160);

    // this.markGlc('Up Gate');

    // Timed-gestures handlers
    // Required data from the input event should be preserved here
    // otherwise event data will be obtained respecting the Gestures delay state (not state from a click)
    const gestureEvent = this.getGestureEvent(e);

    if (this.app.board.isMemberDragging) {
      // TODO: use board action here instead of direct interface
      // const boardElement = this.app.board.selection.getSelectedElement();
      // if (boardElement && this.wasBoardElementMovedFromStartDragPoint(boardElement, gestureEvent)) {
      //   this.app.stateManager.actions.board.stopDragElement(boardElement);
      //   this.awaiting = false;
      // }
    }

    // Distinguish single click and double click handlers
    // filter out timed gestures while double-click
    if (this.isDoubleClick) {
      // Double click handlers
      this.doubleClick(gestureEvent);
      this.stopGesture();
      setTimeout(() => {
        this.isDoubleClick = false;
      }, 160);
    } else {
      // wait until doubleClick resolved
      setTimeout(() => {
        if (!this.isDoubleClick) {
          // Tier 0: Immediate "Select" press
          // No ImmediatePressUp while timed gestures are active
          if (this.awaiting !== 'quick' && this.awaiting !== 'medium' && this.awaiting !== 'long')
            this.pressUpImmediate(gestureEvent);

          // Tier 1: quick-press
          if (this.awaiting === 'quick') this.pressUpQuick(gestureEvent);

          // Tier 2: medium-press
          if (this.awaiting === 'medium') this.pressUpMedium(gestureEvent);

          // // Tier 3: long-press
          // if (this.awaiting === 'long') this.pressUpLong(gestureEvent);

          this.stopGesture();
        }
      }, 160);
    }
  }

  private stopGesture() {
    this.awaiting = false;
    if (this.mainTimer) clearTimeout(this.mainTimer);
    this.app.viewport.slideControls.unpauseSlideControls();
  }

  // Timed-gestures special events
  // Press Up events
  private pressUpImmediate(e: IGestureEvent) {
    this.app.stateManager.actions.board.selectBoardElement(e.isBoardElementHit);
    this.sendToMonitor('Immediate Press Up', e);
  }

  private pressUpQuick(e: IGestureEvent) {
    // this.markGlc('Up Quick');
    this.app.stateManager.actions.viewport.moveTo(e.worldClick);

    // here most likely will be rectangular selection start

    this.sendToMonitor('Quick Press Up', e);
  }

  private pressUpMedium(e: IGestureEvent) {
    // this.markGlc('Up M');
    this.sendToMonitor('Medium Press Up', e);
  }

  // private pressUpLong(e: IGestureEvent) {
  //   this.sendToMonitor('Long Press Up', e);
  // }

  // Additional events
  private doubleClick(e: IGestureEvent) {
    // this.markGlc('doubleClick');
    this.sendToMonitor('DoubleClick', e);

    const gestureEvent = this.getGestureEvent(e);

    // fitToArea Or ZoomIn
    if (gestureEvent.isBoardElementHit instanceof BoardElement) {
      this.app.stateManager.actions.viewport.fitToBoardElement(gestureEvent.isBoardElementHit);
      this.app.stateManager.actions.board.selectBoardElement(gestureEvent.isBoardElementHit);
    } else {
      // this.app.stateManager.actions.viewport.zoomIn(e.worldClick);
      this.app.stateManager.actions.viewport.fitToBoard();
    }
  }

  // Press Down events
  private pressDownImmediate(e: IGestureEvent) {
    // this.markGlc('Dw I');

    // Warning: ImmediatePressDown is a first fastest milestone,
    // its probably best choice to use pressDownQuick or ImmediatePressUp

    if (e.isBoardElementHit instanceof BoardElement) {
      this.app.viewport.slideControls.pauseSlideControls();

      if (e.isBoardElementHit.isDragging) {
        this.app.stateManager.actions.board.stopDragElement(e.isBoardElementHit);
        this.awaiting = false;
      }
    }

    this.sendToMonitor('Immediate Press Down', e);
  }

  private pressDownQuick(e: IGestureEvent) {
    // this.markGlc('Dw Quick');
    if (e.isBoardElementHit instanceof BoardElement) {
      this.app.viewport.slideControls.pauseSlideControls();

      if (!e.isBoardElementHit.isDragging) {
        this.app.stateManager.actions.board.startDragElement(e.isBoardElementHit, e.worldClick);
        this.awaiting = false;
      }
    }

    this.app.gui.focusPoint.putFocusPoint();
    this.sendToMonitor('Quick Press Down', e);
  }

  private pressDownMedium(e: IGestureEvent) {
    // this.markGlc('Dw M');
    this.app.gui.focusPoint.putFocusPoint();
    this.sendToMonitor('Medium Press Down', e);
  }

  // private pressDownLong(e: IGestureEvent) {
  //   this.app.gui.focusPoint.putFocusPoint(e.worldClick);
  //   this.sendToMonitor('Long Press Down', e);
  // }

  // Helper methods

  private getGestureEvent(e: StageEvent): IGestureEvent {
    const gestureEvent: IGestureEvent = {
      ...e,
      stopPropagation: e.stopPropagation,
      reset: e.reset,
      screenClick: this.app.viewport.getScreenCoordsFromEvent(e),
      worldClick: this.app.viewport.getWorldScreenCoordsFromEvent(e),
    };

    // Perform preliminary hit detection
    const hit = this.app.engine.renderer.plugins.interaction.hitTest({
      x: gestureEvent.screenClick.sX,
      y: gestureEvent.screenClick.sY,
    });

    // if (hit instanceof cgContainer) {
    gestureEvent.isBoardElementHit = hit.boardElement;
    // }

    return gestureEvent;
  }

  public sendToMonitor = (eventName: string, e: IGestureEvent) => {
    // console.log('worldClick', e.worldClick.wX, e.worldClick.wY);
    // console.log('screenClick', e.screenClick.sX, e.screenClick.sY);

    this.stageEvents.sendToMonitor(
      eventName,
      `${Math.round(e.screenClick.sX)} : ${Math.round(e.screenClick.sY)}`,
    );
  };

  // public wasBoardElementMovedFromStartDragPoint(boardElement: BoardElement, gestureEvent: IGestureEvent) {
  //   return (
  //     boardElement &&
  //     boardElement.startDragPoint &&
  //     gestureEvent.worldClick.wX !== boardElement.startDragPoint.wX &&
  //     gestureEvent.worldClick.wY !== boardElement.startDragPoint.wY
  //   );
  // }

  // private isPointerMoving(e: IGestureEvent) {
  //   const { sX, sY } = this.app.viewport.getScreenCoordsFromMouse();
  //   console.log('>> isPointerMoving', e.screenClick.sX !== sX && e.screenClick.sY !== sY);
  //   return e.screenClick.sX !== sX && e.screenClick.sY !== sY;
  // }

  // // Lifecycle debug
  // public gLifeCycle = new Map();
  // public gesturesHistory = new Map();
  // private glcTimestamp = 0;
  //
  // public getTime() {
  //   return Number(window.performance.now().toFixed());
  // }
  //
  // public addToGlcHistory() {
  //   if (this.gLifeCycle.size) {
  //     this.gesturesHistory.set(this.getTime(), new Map(this.gLifeCycle));
  //     console.log('⧖', this.gesturesHistory);
  //   }
  // }
  //
  // public resetGlc() {
  //   this.addToGlcHistory();
  //   this.gLifeCycle.clearGraphics();
  // }
  //
  // public getGlcTimestamp(prev?: number) {
  //   const now = this.getTime();
  //   return this.glcTimestamp > 0 ? now - this.glcTimestamp : now;
  // }
  //
  // public markGlc(title: string) {
  //   const gTs = this.getGlcTimestamp();
  //   console.log('⧖', title);
  //   this.gLifeCycle.set(title, gTs);
  //   this.glcTimestamp = this.getTime();
  // }
}
