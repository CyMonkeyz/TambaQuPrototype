import { useEffect, useState } from "react";

interface RepositoryData<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  retry: () => void;
}

type RepositoryState<T> = Omit<RepositoryData<T>, "retry"> & {
  scopeKey?: string;
};

export function useRepositoryData<T>(
  loader: () => Promise<T>,
  dependencyKey: string,
  scopeKey?: string,
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
    setState((current) =>
      scopeKey !== undefined && current.scopeKey === scopeKey
        ? { ...current, isLoading: current.data === null, error: null }
        : { data: null, isLoading: true, error: null, scopeKey },
    );
    loader()
      .then((data) => {
        if (active) setState({ data, isLoading: false, error: null, scopeKey });
      })
      .catch((error: unknown) => {
        if (active)
          setState({
            data: null,
            isLoading: false,
            scopeKey,
            error:
              error instanceof Error
                ? error
                : new Error("Data tidak dapat dimuat"),
          });
      });
    return () => {
      active = false;
    };
  }, [dependencyKey, attempt, scopeKey]);
  /* oxlint-enable react-hooks/exhaustive-deps */

  const visible =
    scopeKey !== undefined && state.scopeKey !== scopeKey
      ? { data: null, isLoading: true, error: null }
      : state;
  return { ...visible, retry: () => setAttempt((value) => value + 1) };
}
