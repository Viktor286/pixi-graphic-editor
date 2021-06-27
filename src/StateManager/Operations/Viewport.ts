import FlowApp from '../../Interfaces/FlowApp';
import { StateUpdateRequest } from '../StateUpdateRequest';
import { PublicViewportState } from '../PublicState/Viewport';
import { AsyncId } from '../index';
import Viewport from '../../Interfaces/Viewport';

export default class ViewportOperations {
  constructor(public app: FlowApp) {}

  animate(stateUpdate: StateUpdateRequest, asyncId: AsyncId) {
    this.app.viewport
      .animateViewport(stateUpdate.slice as PublicViewportState)
      .then((viewportProps) =>
        this.app.stateManager.setState('viewport', viewportProps, { async: 'animated', asyncId }),
      );
  }

  exec(
    property: Extract<keyof Viewport, string>,
    value: PublicViewportState[keyof PublicViewportState],
    stateUpdate: StateUpdateRequest,
  ) {
    if (Object.prototype.hasOwnProperty.call(this.app.viewport, property)) {
      this.app.viewport[property] = value;
    }
    return value;
  }
}
