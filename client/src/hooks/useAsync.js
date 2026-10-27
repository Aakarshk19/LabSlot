import { useCallback, useState } from 'react';

export function useAsync(fn) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const run = useCallback(async (...args) => {
    setLoading(true);
    setError('');
    try {
      return await fn(...args);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fn]);
  return { run, loading, error, setError };
}
