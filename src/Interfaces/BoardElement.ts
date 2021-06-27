import Group from './Group';
import Board, { BoardElementId, BoardElementType } from './Board';
import { CgDrawContainer, CgInteractiveContainer, animateCgObject, IWorldCoords } from './GraphicsEngine';

export interface IBoardElementPublicState {
  id: BoardElementId;
  type: BoardElementType;
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
}

export default class BoardElement extends CgInteractiveContainer {
  public readonly id: string;
  public publicState: IBoardElementPublicState;
  public cgDrawContainer = new CgDrawContainer();
  public inGroup: Group | undefined = undefined;

  constructor(public board: Board, id?: BoardElementId) {
    super(board.engine, board.viewport);
    this.id = id ? id : Math.random().toString(32).slice(2);

    this.cgDrawContainer.createGraphics('selectionDrawing');
    this.prependElement(this.cgDrawContainer);

    // inner to public state mapping
    this.publicState = {
      type: 'BoardElement',
      id: this.id,
      x: this.x,
      y: this.y,
      scaleX: this.scaleX,
      scaleY: this.scaleY,
    };
  }

  public delete(hard: boolean = false) {
    // TODO: probably this need two variations: soft/hard deletion (same as board.deleteBoardElement)
    this.destroy();
  }

  public onSelect() {
    if (this.inGroup) {
      this.inGroup.onSelect();
    } else {
      if (!this.isSelected) {
        this.isSelected = true;
        this.drawSelection();
        return true;
      }
      return false;
    }
  }

  public onDeselect() {
    if (this.isSelected) {
      this.isSelected = false;
      this.eraseSelectionDrawing();
      return true;
    }
    return false;
  }

  public drawSelection(): void {
    const groupFactor = this.inGroup ? this.inGroup.scaleX : 1;
    this.cgDrawContainer.drawRect('selectionDrawing', {
      width: this.width / this.scaleX,
      height: this.height / this.scaleX,
      lineWidth: 4 / this.board.viewport.scale / this.scaleX / groupFactor,
      lineColor: 0x73b2ff,
    });
  }

  public eraseSelectionDrawing() {
    this.cgDrawContainer.clearGraphics('selectionDrawing');
  }

  public startDrag(startPoint: IWorldCoords) {
    this.inGroup ? this.inGroup.startDrag(startPoint) : super.startDrag(startPoint);
    this.alpha = 0.5;
    this.zIndex = 1;
  }

  public stopDrag() {
    this.inGroup ? this.inGroup.stopDrag() : super.stopDrag();
    this.alpha = 1;
    this.zIndex = 0;
  }

  public async animateBoardElement(boardElementProps: Partial<BoardElement>): Promise<Partial<BoardElement>> {
    this.isScaleFromCenter = true;
    return animateCgObject(this, boardElementProps, {
      onStart: () => {
        this.zIndex = 1;
      },
      onUpdate: () => {
        if (this.isSelected) this.drawSelection();
      },
      onComplete: () => {
        this.zIndex = 0; // bring back zIndex after sorting operation
        this.isScaleFromCenter = false;
      },
    });
  }
}
