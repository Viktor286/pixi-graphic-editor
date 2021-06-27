import FlowApp from './FlowApp';
import BoardElement from './BoardElement';
import Memo, { IMemoSettings } from './Memo';
import Group, { IGroupSettings } from './Group';
import { CgEngine, IWorldCoords } from './GraphicsEngine';
import Viewport from './Viewport';

export type BoardElementId = string | undefined;
export type BoardElementType = 'BoardElement' | 'Memo' | 'Group';
export type IBoardImage = {
  data: Blob;
  id: string;
};

export type ShiftModeState = 'off' | 'hold' | 'lock';

// TODO: INFO -- THE CRITICAL CONDITION FOR CURRENT "INTERFACE" METHODS IS
//  THEY SHOULD EVENTUALLY CHANGE ONLY ONE PUBLIC STATE PROPERTY,
//  OFFER GRANULAR CONTROL OVER ITS ENTITIES,
//  SO ACTIONS (CONTROLLERS) WILL DRIVE COMPLEX LOGIC THROUGH STATE UPDATE
//  VEIW (UI) -> CONTROLLER (ACTION) -> MODEL (STATE) -> CONTROLLER (INTERFACE) -> CONTROLLER (ENGINE) -> MODEL (STATE) -> VIEW (GUI)
//  TODO: READ ABOUT ARCHITECTURE PATTERNS VARIATIONS: E.G.

export default class Board {
  public viewport: Viewport;
  public engine: CgEngine;
  public isMemberDragging: boolean | string = false;
  public isMultiSelect: boolean = false;
  public selectedElement: BoardElement | null = null;

  constructor(public app: FlowApp) {
    this.viewport = this.app.viewport;
    this.engine = this.app.engine;

    if (this.app.devMonitor) {
      this.app.devMonitor.addDevMonitor('boardEvents');
    }
  }

  public createBoardElement(
    type: BoardElementType = 'BoardElement',
    id?: BoardElementId,
    settings?: IMemoSettings | IGroupSettings,
  ) {
    let boardElement;

    switch (type) {
      case 'BoardElement':
        boardElement = new BoardElement(this, id);
        break;
      case 'Memo':
        boardElement = new Memo(this, id, settings as IMemoSettings);
        break;
      case 'Group':
        boardElement = new Group(this, id, settings as IGroupSettings);
        break;
    }

    this.viewport.addBoardElementToViewport(boardElement);
    return boardElement;
  }

  // // TODO: this is currently a temp shortcut method, we need to add elements properly through the actions (state update)
  // public addNewMemosToBoardFromTextures(textures?: PIXI.Texture[]) {
  //   if (textures && textures.length > 0) {
  //     textures.forEach((texture) => {
  //       this.addElementToBoard(new Memo(texture, this.app));
  //     });
  //   }
  // }

  public addElementToBoard<T extends BoardElement>(boardElement: T): T {
    boardElement.zIndex = 1;
    this.app.viewport.addToViewport(boardElement.cgObj);
    return boardElement;
  }

  // todo: how to make "undo" for "hard" delete of Sprites? never really delete BoardElement?
  //   probably this need two variations: soft/hard deletion
  public deleteBoardElement<T extends BoardElement>(boardElement: T, hard: boolean = false): boolean {
    if (boardElement instanceof Group) {
      boardElement.isTempGroup = false; // keep from rm on deselect. TODO: can we do it some "proper" way?
    }

    boardElement.delete(hard);
    return true;
  }

  // public resetBoard() {
  //   // Looks like in order to fully reset the board we just need to remove all board elements
  //   const allBoardElements = this.getAllBoardElements();
  //   allBoardElements.forEach((el) => this.deleteBoardElement(el, true));
  //   return true;
  // }

  public startDragElement(
    boardElement: BoardElement,
    startPoint: IWorldCoords = { wX: boardElement.x, wY: boardElement.y },
  ) {
    if (!this.isMemberDragging) {
      this.isMemberDragging = boardElement.id;
      // this.selection.selectElement(boardElement);
      this.app.viewport.instance.pause = true;
      boardElement.startDrag(startPoint);
    }
  }

  public stopDragElement(boardElement: BoardElement) {
    // Small delay to prevent immediate actions after stopDrag, e.g. removeFromGroup on shift+select
    setTimeout(() => {
      this.isMemberDragging = false;
    }, 500);
    this.app.viewport.instance.pause = false;
    boardElement.stopDrag();
  }

  // public getElementById(elementId: string): BoardElement | null {
  //   const displayObjects = this.app.viewport.instance.children.filter(
  //     (el) => el instanceof CgBaseObject && el.boardElement.id === elementId,
  //   ) as CgBaseObject[];
  //
  //   return displayObjects.length > 0 ? displayObjects[0].boardElement : null;
  // }
  //
  // public getAllBoardElements() {
  //   // API design: Should we get all elements in a flat way, including inner group members?
  //
  //   const displayObjects = this.app.viewport.instance.children.filter(
  //     (el) => el instanceof CgBaseObject,
  //   ) as CgBaseObject[];
  //
  //   return displayObjects.map((container) => container.boardElement) as BoardElement[];
  // }
  //
  // public getAllMemos(): Memo[] {
  //   const displayObjects = this.app.viewport.instance.children.filter(
  //     (el) => el instanceof CgBaseObject && el.boardElement instanceof Memo,
  //   ) as CgBaseObject[];
  //
  //   return displayObjects.map((container) => container.boardElement) as Memo[];
  // }
  //
  // public getAllGroups() {
  //   const displayObjects = this.app.viewport.instance.children.filter(
  //     (el) => el instanceof CgBaseObject && el.boardElement instanceof Group,
  //   ) as CgBaseObject[];
  //
  //   return displayObjects.map((container) => container.boardElement);
  // }

  public sendEventToMonitor(boardElement: BoardElement, eventName: string, msg: string = '') {
    if (this.app.devMonitor) {
      this.app.devMonitor.dispatchMonitor('boardEvents', `[${boardElement.id}] ${eventName}`, msg);
    }
  }

  public updateSelectionGraphics() {
    if (this.selectedElement) {
      this.selectedElement.drawSelection();
    }
  }
}
