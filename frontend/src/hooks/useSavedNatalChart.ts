import { useCallback, useEffect, useRef, useState } from "react";
import {
  loadSavedNatalAscendantSign,
  loadSavedNatalChartForApi,
  natalChartCacheKey,
  type NatalChartApiPayload,
} from "../utils/natalChartStorage";
import { apiService } from "../services/api";

type Options = {
  /** When false, skip /chart for rising (e.g. tab bar only needs storage). Default true. */
  fetchRisingSign?: boolean;
};

export function useSavedNatalChart(options: Options = {}) {
  const { fetchRisingSign = true } = options;
  const [hasNatal, setHasNatal] = useState(false);
  const [natalPayload, setNatalPayload] = useState<NatalChartApiPayload | null>(
    null,
  );
  const [risingSign, setRisingSign] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const cacheKeyRef = useRef("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const payload = await loadSavedNatalChartForApi();
      const ok = payload != null;
      const nextKey = natalChartCacheKey(payload);
      const keyUnchanged = nextKey === cacheKeyRef.current && ok;

      setHasNatal(ok);
      if (!keyUnchanged) {
        cacheKeyRef.current = nextKey;
        setNatalPayload(payload);
      }

      if (!ok) {
        setRisingSign(null);
        cacheKeyRef.current = "";
        return;
      }

      if (!fetchRisingSign) return;

      const storedRising = await loadSavedNatalAscendantSign();
      if (storedRising) {
        setRisingSign(storedRising);
        if (keyUnchanged) return;
      }

      const chart = await apiService.getBirthChart(payload!);
      const asc = chart.data?.houses?.ascendantSign ?? null;
      setRisingSign(asc);
    } catch {
      setHasNatal(false);
      setNatalPayload(null);
      setRisingSign(null);
      cacheKeyRef.current = "";
    } finally {
      setLoading(false);
    }
  }, [fetchRisingSign]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    hasNatal,
    natalPayload,
    risingSign,
    loading,
    refresh,
    natalCacheKey: natalChartCacheKey(natalPayload),
  };
}
