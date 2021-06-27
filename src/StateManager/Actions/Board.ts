import FlowApp from '../../Interfaces/FlowApp';
import BoardElement from '../../Interfaces/BoardElement';
import { ShiftModeState } from '../../Interfaces/Board';
import { IWorldCoords } from '../../Interfaces/GraphicsEngine';
// import Group from '../../Interfaces/Group';

export default class BoardActions {
  constructor(public app: FlowApp) {}

  public createNewMemoOnBoard() {
    // todo: UP NEXT #2: pipe board actions through stateManager^
  }

  // public selectElementById(id: string) {
  //   const el = this.app.board.getElementById(id);
  //   if (el instanceof BoardElement) {
  //     const selected = this.app.board.selection.selectElement(el);
  //     console.log('selected', selected, selected.createdTempGroup);
  //     // TODO: Update state based on selected: SelectionState
  //   }
  // }

  // High-level history-type state updates (could lead to several consecutive non-history state updates under the hood)
  public selectBoardElement(clickedElement: BoardElement | null | undefined): void {
    // if (!this.app.board.isMemberDragging) {
    //   if (clickedElement instanceof BoardElement) {
    //     if (this.app.board.selection.isMultiSelect) {
    //       if (
    //         this.app.board.selection.selectedElement &&
    //         this.app.board.selection.selectedElement instanceof Group
    //       ) {
    //         if (this.app.board.selection.selectedElement.isElementInGroup(clickedElement)) {
    //           this.multiselectionRemove(clickedElement);
    //           return;
    //         } else {
    //           this.multiselectionAdd(clickedElement);
    //           return;
    //         }
    //       }
    //     }
    //     this.singleSelectElement(clickedElement);
    //   } else {
    //     if (!this.app.viewport.slideControls.isSliding) this.deselectBoardElements();
    //   }
    // }
  }

  public deselectBoardElements() {
    // this.app.board.selectedElement.onSelect();
    // this.app.board.selectedElement = null;
    // this.app.webUi.updateSelectedMode();
    // SHOULD BE HERE: upd webUi.updateSelectedMode
    // use this.multiselectionRemove for each?
    // this.app.stateManager.setState('board/singleselection', { setSelection: null });
    // const deselected = this.app.board.selection.deselectElement();
    // console.log('deselected', deselected);
    // // TODO: Update state based on selected: SelectionState
  }

  public singleSelectElement(boardElement: BoardElement) {
    // this.app.board.selectedElement = boardElement;
    // this.app.board.selectedElement.onSelect();
    // this.app.webUi.updateSelectedMode();
    // this.app.stateManager.setState('board/singleselection', { setSelection: clickedElement });
    // const deletedBoardElements = this.app.board.selection.multiselection.delete();
    // delete operation:
    // const group = this.selection.selectedElement;
    // const explodedGroup = this.selection.selectedElement.explodeGroup();
    // this.board.deleteBoardElement(group);
    // return explodedGroup.boardElements;
    // if (deletedBoardElements.length > 0) {
    // setState move ex groupMembers to board -- deletedBoardElements
    // setState remove empty tempGroup from board -- selection.selectedElement
    // }
    // this.app.board.selection.setSelection(boardElement);
    // setState change selectedElement on board/selectedElement
  }

  public multiselectionAdd(boardElement: BoardElement) {
    // this.app.stateManager.setState('board/multiselection', { add: clickedElement });
    // if (!this.app.board.selection.selectedElement) {
    //   this.app.board.selection.setSelection(boardElement);
    //   // setState change selectedElement on board/selectedElement -- element
    // }
    // const element = this.app.board.selection.multiselection.add(boardElement);
    // this.selection.selectedElement.addToGroup(boardElement);
    // if (this.selection.selectedElement instanceof BoardElement) {
    //   return this.create([this.selection.selectedElement, boardElement]);
    // }
    // if (element instanceof Group) {
    //   // setState create empty group on board -- element
    //   // setState move boardElement to tempGroup -- boardElement to element
    // }
    // if (element instanceof BoardElement) {
    //   // setState move boardElement to tempGroup -- boardElement to selection.selectedElement
    // }
    // this.app.board.selection.setSelection(boardElement); // which controller to use, local or global??
    // setState change selectedElement on board/selectedElement -- element
  }

  public multiselectionRemove(boardElement: BoardElement) {
    // // this.app.stateManager.setState('board/multiselection', { remove: clickedElement });
    //
    // const deletedBoardElements = this.app.board.selection.multiselection.remove(boardElement);
    //
    // // CASE: Second last groupMembers remove
    // if (Array.isArray(deletedBoardElements) && deletedBoardElements.length > 0) {
    //   // setState move ex groupMember to board -- deletedBoardElement
    //   // setState remove empty tempGroup from board -- selection.selectedElement
    //   this.app.board.selection.setSelection(boardElement);
    //   // setState change selectedElement on board/selectedElement
    // }
    //
    // // public remove(boardElement: BoardElement): BoardElement[] | BoardElement | undefined {
    // //     if (this.selection.selectedElement instanceof Group && this.selection.selectedElement.isTempGroup) {
    // //       if (this.selection.selectedElement) {
    // //         const groupMembers = this.selection.selectedElement.getGroupMembers();
    // //         if (groupMembers.length === 1 && groupMembers[0]) {
    // //           return this.delete();
    // //         }
    // //       }
    // //
    // //       this.selection.selectedElement.removeFromGroup(boardElement);
    // //       return boardElement;
    // //     }
    // //   }
  }

  public setShiftModeState(state: ShiftModeState = 'off') {
    this.app.webUi.setShiftModeState(state);
  }

  public deleteSelectedElement() {
    // const boardElement = this.app.board.selection.getSelectedElement();
    // if (boardElement) {
    //   this.app.board.deleteBoardElement(boardElement);
    // }
  }

  public startDragElement(boardElement: BoardElement, startPoint: IWorldCoords) {
    this.app.board.startDragElement(boardElement, startPoint);
  }

  public stopDragElement(boardElement: BoardElement) {
    this.app.board.stopDragElement(boardElement);
    const { id, x, y } = boardElement;
    this.app.stateManager.setState(
      `/board/${id}`,
      { x, y },
      {
        noOp: true,
      },
    );
  }

  public scaleElementById(id: string, targetScale?: number) {
    this.app.stateManager.setState(`/board/${id}`, { scale: targetScale }, { async: 'animation' });
  }

  public moveElementById(id: string, target: IWorldCoords) {
    const { wX: x, wY: y } = target;
    this.app.stateManager.setState(`/board/${id}`, { x, y }, { async: 'animation' });
  }

  public decreaseSelectedElementScale() {
    // const boardElement = this.app.board.selection.getSelectedElement();
    // if (boardElement) {
    //   this.scaleElementById(boardElement.id, boardElement.scale / 1.3);
    // }
  }

  public increaseSelectedElementScale() {
    // const boardElement = this.app.board.selection.getSelectedElement();
    // if (boardElement) {
    //   this.scaleElementById(boardElement.id, boardElement.scale * 1.3);
    // }
  }

  public createNewMemoFromUrl() {
    //
  }

  public createNewMemoFromHTMLImageElement() {
    //
  }

  public createNewMemoFromBlob() {
    //
  }
}
