import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { cloud } from "./client";
export function useCloudSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(Boolean(cloud));
  useEffect(() => {
    if (!cloud) return;
    let active = true;
    void cloud.auth
      .getSession()
      .then(({ data, error }) => {
        if (active) {
          setSession(error ? null : data.session);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    const { data } = cloud.auth.onAuthStateChange((_event, next) => {
      if (active) {
        setSession(next);
        setLoading(false);
      }
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);
  return { session, loading };
}
