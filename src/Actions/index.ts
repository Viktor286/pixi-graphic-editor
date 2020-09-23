import FlowApp from '../Interfaces/FlowApp';
import ViewportActions from './Viewport';
import MemoActions from './Memo';

export default class Actions {
  public readonly viewport: ViewportActions;
  public readonly memo: MemoActions;
  constructor(public app: FlowApp) {
    this.viewport = new ViewportActions(app);
    this.memo = new MemoActions(app);
  }
}
