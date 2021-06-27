export default class ViewportZoomScales {
  public readonly steps: number[] = [0.03125, 0.0625, 0.125, 0.25, 0.5, 1, 2, 4, 8, 16, 32];

  public getNextScaleStepDown(currentScale: number, runAhead: number): number {
    for (let i = 0; i < this.steps.length; i++) {
      const firstStep = this.steps[0];
      if (currentScale <= firstStep) {
        return firstStep;
      }

      const lastStep = this.steps[this.steps.length - 1];
      if (currentScale > lastStep) {
        return this.steps[this.steps.length - (1 - runAhead)];
      }

      if (currentScale === this.steps[i]) {
        return this.steps[i - (1 - runAhead)] || firstStep;
      }

      if (currentScale > this.steps[i] && currentScale < this.steps[i + 1]) {
        if (currentScale - this.steps[i] / 2 < this.steps[i]) {
          // avoid the short jump case when next step less than halfway (without runAhead)
          return this.steps[i - 1] || firstStep;
        }
        return this.steps[i - runAhead] || firstStep;
      }
    }

    return 0;
  }

  public getNextScaleStepUp(currentScale: number, runAhead: number): number {
    for (let i = 0; i < this.steps.length; i++) {
      const firstStep = this.steps[0];
      if (currentScale < firstStep) {
        return this.steps[runAhead];
      }

      const lastStep = this.steps[this.steps.length - 1];
      if (currentScale >= lastStep) {
        return lastStep;
      }

      if (currentScale === this.steps[i]) {
        return this.steps[i + (1 + runAhead)] || lastStep;
      }

      const nextStep = this.steps[i + 1];
      if (currentScale > this.steps[i] && currentScale < nextStep) {
        if (currentScale + nextStep / 2 > nextStep) {
          // avoid the short jump case when next step less than halfway (without runAhead)
          return this.steps[i + 2] || lastStep;
        }
        return this.steps[i + (1 + runAhead)] || lastStep;
      }
    }

    return 0;
  }
}
