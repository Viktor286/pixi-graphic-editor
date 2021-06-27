import { ImageMedia, TMediaSource } from './MediaResource';
import BoardElement, { IBoardElementPublicState } from './BoardElement';
import Board, { BoardElementId } from './Board';
import { IWorldCoords } from './GraphicsEngine';

export interface IMemoSettings {
  mediaSource: TMediaSource;
}

export interface IMemoPublicState extends IBoardElementPublicState {
  mediaSource: TMediaSource;
}

export default class Memo extends BoardElement {
  public contentElement: ImageMedia;
  public publicState: IMemoPublicState;
  public cornerRadius = 20;

  constructor(public board: Board, id: BoardElementId, settings?: IMemoSettings) {
    super(board, id);
    if (!settings) throw Error('Memo needs settings for construction');

    this.contentElement = new ImageMedia(settings.mediaSource, this);

    this.publicState = {
      ...super.publicState,
      type: 'Memo',
      mediaSource: this.mediaSource,
    };

    // this.addElement(this.contentElement.container);
    this.enableInteractive();
    this.drawSelection();
  }

  get mediaSource() {
    return this.contentElement.mediaSource;
  }

  public startDrag(startPoint: IWorldCoords) {
    this.setDrag();
    super.startDrag(startPoint);
  }

  public stopDrag() {
    this.unsetDrag();
    super.stopDrag();
  }

  // setDrag/unsetDrag used as part of a Group to not invoke full startDrag functionality
  public setDrag() {
    this.contentElement.graphics.tint = 0x91b6e3;
  }

  public unsetDrag() {
    this.contentElement.graphics.tint = 0xffffff;
  }

  public drawSelection(): void {
    const groupFactor = this.inGroup ? this.inGroup.scaleX : 1;
    this.cgDrawContainer.drawRectWithRoundedCorners('selectionDrawing', {
      width: this.width / this.scaleX,
      height: this.height / this.scaleX,
      lineWidth: 4 / this.board.viewport.scale / this.scaleX / groupFactor,
      lineColor: 0x73b2ff,
      cornerRadius: this.cornerRadius,
    });
  }
}
