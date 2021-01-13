import FlowApp from '../Interfaces/FlowApp';
import IO from './IO';
import Operations from './Operations';
import { AsyncId } from './Operations/Async';
import Actions from './Actions';
import { StateUpdateRequest } from './StateUpdateRequest';
import { IViewportDepositState, PublicViewportState } from './Representations/Viewport';
import { IPublicBoardDepositState, PublicBoardState } from './Representations/Board';

export interface IAppState {
  [index: string]: PublicViewportState | PublicBoardState;
  viewport: PublicViewportState;
  board: PublicBoardState;
}

export type StateScope = Extract<keyof IAppState, string>;
export type StateSlice = Partial<PublicViewportState> | Partial<PublicBoardState>;
export type StateValue = StateSlice[keyof StateSlice] | undefined;

export interface IOpSettings {
  noOp?: boolean;
  noHistory?: boolean;
  async?: AsyncOperationType;
  asyncId?: AsyncId;
}

type AsyncOperationType = 'animation' | 'animated' | undefined; // ex: | 'network'

interface StateUpdateMsg {
  status: 'updated' | 'pending' | 'idle' | 'error';
  msg?: string;
  updateRequest?: StateUpdateRequest;
}

export interface IAppDepositState {
  viewport: IViewportDepositState;
  board: IPublicBoardDepositState;
}

export default class StateManager {
  public readonly actions = new Actions(this.app);
  public readonly operations = new Operations(this.app);
  public readonly io = new IO(this.app);

  public publicState: IAppState = {
    viewport: new PublicViewportState(),
    board: new PublicBoardState(),
  };

  public history: StateUpdateRequest[] = [];
  public historyLevel = 50;

  constructor(public app: FlowApp) {}

  public setState = (
    locator: StateScope,
    slice: StateSlice,
    opSettings: IOpSettings = {},
  ): StateUpdateMsg => {
    const stateUpdate = new StateUpdateRequest(locator, slice, opSettings);

    if (!StateManager.isValidStateSlice(stateUpdate.slice))
      return { status: 'error', msg: 'StateSlice is not valid' };

    // Async change
    if (opSettings.async) {
      switch (opSettings.async) {
        case 'animation':
          // For "animation" all props would be GROUPED (handled simultaneously by GSAP)
          // without any state data update and stop processing any other fields to avoid other changes
          const asyncId = this.operations.execAnimation(stateUpdate);

          if (asyncId) {
            return {
              status: 'pending',
              msg: asyncId,
            };
          }

          return {
            status: 'error',
            msg: 'animation was not executed',
          };

        case 'animated':
          if (stateUpdate.opSettings.asyncId) this.operations.async.remove(stateUpdate.opSettings.asyncId);
      }
    }

    // Sync change
    const prevScopedState = this.getState(stateUpdate.locator);
    const stateUpdates: StateSlice = {};
    let stateUpdatesCnt: number = 0;

    for (const property in stateUpdate.slice) {
      if (Object.prototype.hasOwnProperty.call(stateUpdate.slice, property)) {
        const updateValue: StateValue = stateUpdate.slice[property];
        if (updateValue !== undefined && updateValue !== prevScopedState[property]) {
          stateUpdates[property] = this.operations.execValue(property, updateValue, stateUpdate);
          stateUpdatesCnt += 1;
        }
      }
    }

    if (stateUpdatesCnt > 0) {
      // Mutate state as scope's branch

      // todo LOCATOR-1: locator might have its own api and be instance of the class (upd StateUpdateRequest)
      const _locator = locator.startsWith('/') ? locator.slice(1) : locator;
      const targeting = _locator.split('/');

      if (targeting[1]) {
        // const [domain, target] = targeting;
        // this.publicState[domain][target] = newState;
      } else {
        const [domain] = targeting;
        // @ts-ignore
        this.publicState[domain].merge(stateUpdates);
      }

      if (!opSettings.noHistory) {
        this.saveToHistory(stateUpdate);
      }

      return { status: 'updated', updateRequest: stateUpdate };
    }

    return { status: 'idle' };
  };

  public getState(locator?: StateScope): StateSlice {
    if (locator) {
      // todo LOCATOR-1: locator might have its own api and be instance of the class (upd StateUpdateRequest)
      const _locator = locator.startsWith('/') ? locator.slice(1) : locator;
      const targeting = _locator.split('/');

      if (targeting[1]) {
        const [domain, target] = targeting;
        return Object.assign({}, this.publicState[domain][target]);
      }
      return Object.assign({}, this.publicState[locator]);
    }
    return Object.assign({}, this.publicState);
  }

  public saveToHistory(stateUpdate: StateUpdateRequest) {
    console.log(`[debug] history: `, stateUpdate);
    this.enqueueHistory(stateUpdate);
    console.log(`[debug] state: `, this.getState());
  }

  private enqueueHistory(stateUpdate: StateUpdateRequest) {
    this.history = [stateUpdate, ...this.history.slice(0, this.historyLevel - 1)];
  }

  static isValidStateSlice(stateItem: StateSlice) {
    return typeof stateItem === 'object' || Array.isArray(stateItem);
  }

  static isGlobalStateValid(state: object, stateOrigin: IAppState) {
    if (typeof state === 'object' && !Array.isArray(state)) {
      for (const scope in stateOrigin) {
        if (Object.hasOwnProperty.call(stateOrigin, scope)) {
          return !state.hasOwnProperty(scope);
        }
      }
      return true;
    }
    return false;
  }
}
