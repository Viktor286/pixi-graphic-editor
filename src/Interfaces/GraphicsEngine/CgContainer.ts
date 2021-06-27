import * as PIXI from 'pixi.js';
import { CgBaseObject } from './index';

export class CgContainer extends CgBaseObject {
  store = new Array<CgContainer>();
  indexHashes = new Map<string, number>();

  constructor(public cgObj: PIXI.Container = new PIXI.Container()) {
    super(cgObj);
  }

  prependElement(element: CgContainer): string {
    // Engine bindings
    this.cgObj.addChild(element.cgObj);
    this.cgObj.setChildIndex(element.cgObj, 0);

    // CgContainer hashed array store
    const hash = Math.random().toString(32).slice(2);

    const newIndex = new Map<string, number>();
    newIndex.set(hash, 0);
    this.indexHashes.forEach((index, hash) => {
      newIndex.set(hash, index + 1);
    });

    this.indexHashes = newIndex;
    this.store = [element, ...this.store];
    return hash;
  }

  getElement(hash: string): CgContainer | undefined {
    const index = this.indexHashes.get(hash);
    if (index) {
      return this.store[index];
    }
  }

  getElementsIndex(hash: string): number | undefined {
    return this.indexHashes.get(hash);
  }

  deleteElement(hash: string): boolean {
    const element = this.getElement(hash);
    const elementIdx = this.getElementsIndex(hash);
    if (element && elementIdx) {
      this.cgObj.removeChild(element.cgObj);
      this.store = [...this.store.slice(0, elementIdx), ...this.store.slice(elementIdx + 1)];
      this.indexHashes.delete(hash);

      // Re-arrange engine indexes
      this.indexHashes.forEach((index, hash) => {
        const el = this.getElement(hash);
        if (el) {
          this.cgObj.setChildIndex(el.cgObj, index);
        }
      });
      return true;
    }
    return false;
  }

  getAllElements(): CgContainer[] {
    return this.store;
  }
}
