import { useCallback, useRef, useState } from 'react';
import type { StreamHandlers } from '@/lib/api';

type Starter = (handlers: StreamHandlers) => Promise<string>;

/**
 * Drives any streaming AI surface (briefing, coach, insight). Call `run` with a
 * starter that wires the api stream function; tokens append live to `text`.
 */
export function useStreamedText() {
  const [text, setText] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const run = useCallback(async (starter: Starter) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setText('');
    setError(null);
    setStreaming(true);
    try {
      await starter({
        signal: controller.signal,
        onToken: (chunk) => setText((t) => t + chunk),
      });
    } catch (e) {
      if (!controller.signal.aborted) {
        setError(e instanceof Error ? e.message : 'Something went wrong');
      }
    } finally {
      if (controllerRef.current === controller) setStreaming(false);
    }
  }, []);

  const reset = useCallback(() => {
    controllerRef.current?.abort();
    setText('');
    setError(null);
    setStreaming(false);
  }, []);

  return { text, streaming, error, run, reset };
}
