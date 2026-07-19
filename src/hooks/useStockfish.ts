import { useState, useEffect, useRef, useCallback } from 'react';

export function useStockfish() {
  const [isEngineReady, setIsEngineReady] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  
  const workerRef = useRef<Worker | null>(null);
  const callbackRef = useRef<((move: string) => void) | null>(null);
  const evalCallbackRef = useRef<((score: number, isMate: boolean) => void) | null>(null);
  const jobIdRef = useRef<number>(0);
  const fenRef = useRef<string>('');

  useEffect(() => {
    const worker = new Worker('/stockfish.js');
    workerRef.current = worker;

    worker.onmessage = (e) => {
      const msg = typeof e.data === 'string' ? e.data : (e.data?.data || '');
      
      if (msg === 'uciok') {
        // UCI is ok
      } else if (msg === 'readyok') {
        setIsEngineReady(true);
      } else if (msg.startsWith('info') && msg.includes('score')) {
        const cpMatch = msg.match(/score cp (-?\d+)/);
        const mateMatch = msg.match(/score mate (-?\d+)/);
        
        if (evalCallbackRef.current) {
          const isBlackTurn = fenRef.current.split(' ')[1] === 'b';
          if (cpMatch) {
            let score = parseInt(cpMatch[1]) / 100;
            if (isBlackTurn) score = -score;
            evalCallbackRef.current(score, false);
          } else if (mateMatch) {
            let mate = parseInt(mateMatch[1]);
            if (isBlackTurn) mate = -mate;
            evalCallbackRef.current(mate, true);
          }
        }
      } else if (msg.startsWith('bestmove')) {
        const move = msg.split(' ')[1];
        setIsThinking(false);
        if (callbackRef.current && move) {
          callbackRef.current(move);
        }
      }
    };

    worker.postMessage('uci');
    worker.postMessage('isready');

    return () => {
      worker.terminate();
    };
  }, []);

  const evaluatePosition = useCallback(
    (
      fen: string, 
      depth: number, 
      onBestMove?: (move: string) => void,
      onEval?: (evalScore: number, isMate: boolean) => void
    ) => {
      if (!workerRef.current || !isEngineReady) return;

      const jobId = ++jobIdRef.current;
      fenRef.current = fen;

      // Stop any ongoing search
      workerRef.current.postMessage('stop');
      
      setIsThinking(!!onBestMove);

      callbackRef.current = (move) => {
        if (jobIdRef.current === jobId && onBestMove) onBestMove(move);
      };
      
      evalCallbackRef.current = (score, isMate) => {
        if (jobIdRef.current === jobId && onEval) onEval(score, isMate);
      };
      
      workerRef.current.postMessage('ucinewgame');
      workerRef.current.postMessage(`position fen ${fen}`);
      workerRef.current.postMessage(`go depth ${depth}`);
    },
    [isEngineReady]
  );

  return { isEngineReady, isThinking, evaluatePosition };
}
