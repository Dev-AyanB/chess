export interface EngineResult {
  score: number;
  isMate: boolean;
  bestMove: string;
}

class StockfishPool {
  private workers: Worker[] = [];
  private idleWorkers: Worker[] = [];
  private queue: { fen: string; depth: number; resolve: (r: EngineResult) => void; reject: (e: any) => void }[] = [];
  private maxWorkers: number;

  constructor() {
    this.maxWorkers = typeof navigator !== 'undefined' && navigator.hardwareConcurrency ? navigator.hardwareConcurrency : 4;
    this.initPool();
  }

  private initPool() {
    this.workers = [];
    this.idleWorkers = [];
    for (let i = 0; i < this.maxWorkers; i++) {
      const worker = new Worker('/stockfish.js');
      worker.postMessage('uci');
      
      worker.onmessage = (e) => {
        const msg = typeof e.data === 'string' ? e.data : (e.data?.data || '');
        if (msg === 'readyok') {
          worker.onmessage = null;
          this.idleWorkers.push(worker);
          this.processQueue();
        }
      };
      worker.postMessage('isready');
      this.workers.push(worker);
    }
  }

  public evaluate(fen: string, depth: number): Promise<EngineResult> {
    return new Promise((resolve, reject) => {
      this.queue.push({ fen, depth, resolve, reject });
      this.processQueue();
    });
  }

  private processQueue() {
    if (this.queue.length === 0 || this.idleWorkers.length === 0) {
      return;
    }

    const task = this.queue.shift()!;
    const worker = this.idleWorkers.pop()!;

    const isBlackTurn = task.fen.split(' ')[1] === 'b';
    let latestScore = 0;
    let latestIsMate = false;
    
    worker.onmessage = (e) => {
      const msg = typeof e.data === 'string' ? e.data : (e.data?.data || '');
      if (msg.startsWith('info') && msg.includes('score')) {
        const cpMatch = msg.match(/score cp (-?\d+)/);
        const mateMatch = msg.match(/score mate (-?\d+)/);
        
        if (cpMatch) {
          latestScore = parseInt(cpMatch[1], 10) / 100;
          if (isBlackTurn) latestScore = -latestScore;
          latestIsMate = false;
        } else if (mateMatch) {
          const mate = parseInt(mateMatch[1], 10);
          latestScore = mate > 0 ? (100 - mate) : (-100 - mate);
          if (isBlackTurn) latestScore = -latestScore;
          latestIsMate = true;
        }
      } else if (msg.startsWith('bestmove')) {
        const move = msg.split(' ')[1];
        
        task.resolve({ score: latestScore, isMate: latestIsMate, bestMove: move || '(none)' });
        
        worker.onmessage = null;
        this.idleWorkers.push(worker);
        this.processQueue();
      }
    };

    worker.postMessage('ucinewgame');
    worker.postMessage(`position fen ${task.fen}`);
    worker.postMessage(`go depth ${task.depth}`);
  }

  public terminateAll() {
    this.workers.forEach(w => w.terminate());
    this.queue.forEach(q => q.reject(new Error('Analysis cancelled')));
    this.queue = [];
    this.initPool(); // Recreate pool immediately so it's ready for the next review
  }
}

export const stockfishPool = new StockfishPool();
