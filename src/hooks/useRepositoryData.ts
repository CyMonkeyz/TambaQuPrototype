import { useEffect, useState } from "react";

interface RepositoryData<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  retry: () => void;
}

type RepositoryState<T> = Omit<RepositoryData<T>, "retry">;

export function useRepositoryData<T>(
  loader: () => Promise<T>,
  dependencyKey: string,
): RepositoryData<T> {
  const [state, setState] = useState<RepositoryState<T>>({
    data: null,
    isLoading: true,
    error: null,
  });
  const [attempt, setAttempt] = useState(0);

  /* oxlint-disable react-hooks/exhaustive-deps -- caller controls the stable repository key */
  useEffect(() => {
    let active = true;
    setState((current) => ({ ...current, isLoading: true, error: null }));
    loader()
      .then((data) => {
        if (active) setState({ data, isLoading: false, error: null });
      })
      .catch((error: unknown) => {
        if (active)
          setState({
            data: null,
            isLoading: false,
            error:
              error instanceof Error
                ? error
                : new Error("Data tidak dapat dimuat"),
          });
      });
    return () => {
      active = false;
    };
  }, [dependencyKey, attempt]);
  /* oxlint-enable react-hooks/exhaustive-deps */

  return { ...state, retry: () => setAttempt((value) => value + 1) };
}
