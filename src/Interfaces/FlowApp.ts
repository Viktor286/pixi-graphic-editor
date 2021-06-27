import { CgEngine } from './GraphicsEngine';
import StageEvents from './InteractionEvents/StageEvents';
import Keyboard from './InteractionEvents/Keyboard';
import DevMonitor from './DevMonitor';
import Board from './Board';
import WebUI from './WebUI';
import GUI from './GUI';
import StateManager from '../StateManager';
import Project from './Project';
import Viewport from './Viewport';

declare global {
  interface Window {
    app: FlowApp;
    automationScreenshot: string | undefined;
    performance: {
      now(): number;
    };
  }
}

export default class FlowApp {
  public readonly engine: CgEngine;
  public readonly hostHTML: HTMLElement;
  public readonly viewport: Viewport;
  public readonly devMonitor: DevMonitor | null; // TODO: replace for "Debug" with included prod logic
  public readonly board: Board;
  public readonly gui: GUI;
  public readonly webUi: WebUI;
  public readonly stageEvents: StageEvents;
  public readonly stateManager: StateManager;
  public readonly project: Project;
  public readonly keyboard: Keyboard;
  public readonly env: string | undefined;

  constructor(targetDiv: HTMLElement) {
    this.env = process.env.NODE_ENV;
    this.hostHTML = targetDiv;
    this.engine = new CgEngine();
    console.log('this', this);
    console.log('engine', this.engine);
    this.hostHTML.appendChild(this.engine.view);
    // this.devMonitor = new DevMonitor();
    this.devMonitor = null;
    this.stageEvents = new StageEvents(this);
    this.viewport = new Viewport(this);
    this.engine.addDisplayObject(this.viewport.instance);
    this.board = new Board(this);
    this.stateManager = new StateManager(this);
    this.project = new Project(this);
    this.gui = new GUI(this);
    this.webUi = new WebUI(this);
    this.keyboard = new Keyboard(this);

    if (this.env !== 'production') {
      window.app = this;
    }
  }

  get hostHTMLWidth() {
    return this.hostHTML.clientWidth;
  }

  get hostHTMLHeight() {
    return this.hostHTML.clientHeight;
  }
}
