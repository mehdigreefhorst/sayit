export default class Progress {
  public message: string;
  public working: boolean;
  public layoutCompletion: number;
  private listeners: Set<() => void>;

  constructor() {
    this.message = '';
    this.working = false;
    this.layoutCompletion = 0;
    this.listeners = new Set();
  }

  reset() {
    this.message = '';
    this.working = false;
    this.layoutCompletion = 0;
    this.notify();
  }

  startDownload() {
    this.working = true;
    this.message = 'Downloading graph data...';
    this.notify();
  }

  updateLayout(queueLength: number, currentWord: string) {
    this.message = `Building graph... (${queueLength} pending)`;
    this.notify();
  }

  downloadError(error: string) {
    this.message = error;
    this.working = true;
    this.notify();
  }

  startLayout() {
    this.working = true;
    this.message = 'Computing layout...';
    this.notify();
  }

  setLayoutCompletion(percent: number) {
    this.layoutCompletion = percent;
    this.message = `Computing layout... ${percent}%`;
    this.notify();
  }

  done() {
    this.working = false;
    this.message = '';
    this.notify();
  }

  onChange(callback: () => void) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }
}
