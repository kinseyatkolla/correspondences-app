import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { sharedUI } from "../styles/sharedUI";
import { apiService, ZrPeriod } from "../services/api";
import { useSavedNatalChart } from "../hooks/useSavedNatalChart";
import { zodiacSignToUnicodeEmoji } from "../utils/zodiacNavEmoji";
import {
  OPEN_ASTROLOGY_SETTINGS_KEY,
  OPEN_ASTROLOGY_SETTINGS_SECTION_KEY,
  OPEN_ASTROLOGY_SETTINGS_RETURN_TAB_KEY,
} from "../navigation/astrologySettingsKeys";
import {
  formatReleasingDate,
  formatRulerLabel,
  formatSwitchCountdown,
  isWithinSwitchCountdownWindow,
  periodStatusSuffix,
  releasingAgeAtMs,
  SIGN_MINOR_YEARS,
} from "../utils/zrDisplayUtils";

const LOT_GRID_MIN_TILE_WIDTH = 148;
const LOT_GRID_GAP = 10;
const NOW_CARD_GAP = 8;
const SCREEN_HORIZONTAL_PAD = 32;

const NOW_LEVELS = [
  { key: "l1" as const, label: "L1", level: 1 },
  { key: "l2" as const, label: "L2", level: 2 },
  { key: "l3" as const, label: "L3", level: 3 },
  { key: "l4" as const, label: "L4", level: 4 },
];

const LOT_OPTIONS: { id: string; label: string }[] = [
  { id: "fortune", label: "Lot of Fortune" },
  { id: "spirit", label: "Lot of Spirit" },
  { id: "eros", label: "Lot of Eros" },
  { id: "necessity", label: "Lot of Necessity" },
  { id: "courage", label: "Lot of Courage" },
  { id: "victory", label: "Lot of Victory" },
  { id: "nemesis", label: "Lot of Nemesis" },
];

function signAbbrev(sign: string): string {
  return sign.slice(0, 3);
}

function isSamePeriod(
  a: ZrPeriod | null | undefined,
  b: ZrPeriod,
): boolean {
  return a != null && a.startMs === b.startMs && a.level === b.level;
}

type ActivePeriods = {
  l1: ZrPeriod | null;
  l2: ZrPeriod | null;
  l3: ZrPeriod | null;
  l4: ZrPeriod | null;
};

type Props = {
  navigation: { navigate: (name: string) => void };
};

export default function ZodiacalReleasingScreen({ navigation }: Props) {
  const {
    hasNatal,
    natalPayload,
    natalCacheKey,
    loading: natalLoading,
  } = useSavedNatalChart({ fetchRisingSign: false });

  const timelineLoadKeyRef = useRef<string | null>(null);
  const timelineLoadingRef = useRef(false);

  const [releaseLotId, setReleaseLotId] = useState("fortune");
  const [lots, setLots] = useState<Record<string, any> | null>(null);
  const [sect, setSect] = useState<any>(null);
  const [l1Periods, setL1Periods] = useState<ZrPeriod[]>([]);
  const [expandedL1, setExpandedL1] = useState<number | null>(null);
  const [l2ByL1, setL2ByL1] = useState<Record<number, ZrPeriod[]>>({});
  const [expandedL2Key, setExpandedL2Key] = useState<string | null>(null);
  const [l3ByKey, setL3ByKey] = useState<Record<string, ZrPeriod[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeNow, setActiveNow] = useState<ActivePeriods | null>(null);
  const [countdownNowMs, setCountdownNowMs] = useState(() => Date.now());

  const { width: windowWidth } = useWindowDimensions();

  const displayTimeZone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    [],
  );

  const lotTileWidth = useMemo(() => {
    const contentWidth = windowWidth - SCREEN_HORIZONTAL_PAD;
    const columns = Math.max(
      1,
      Math.floor(
        (contentWidth + LOT_GRID_GAP) /
          (LOT_GRID_MIN_TILE_WIDTH + LOT_GRID_GAP),
      ),
    );
    return (contentWidth - LOT_GRID_GAP * (columns - 1)) / columns;
  }, [windowWidth]);

  const nowCardWidth = useMemo(() => {
    const contentWidth = windowWidth - SCREEN_HORIZONTAL_PAD;
    return (contentWidth - NOW_CARD_GAP * 3) / 4;
  }, [windowWidth]);

  const birthMs = useMemo(() => {
    if (!natalPayload) return null;
    return Date.UTC(
      natalPayload.year,
      natalPayload.month - 1,
      natalPayload.day,
      natalPayload.hour,
      natalPayload.minute,
      natalPayload.second,
    );
  }, [natalPayload]);

  const openNatalSettings = async () => {
    await AsyncStorage.setItem(OPEN_ASTROLOGY_SETTINGS_KEY, "1");
    await AsyncStorage.setItem(OPEN_ASTROLOGY_SETTINGS_SECTION_KEY, "natal");
    await AsyncStorage.setItem(
      OPEN_ASTROLOGY_SETTINGS_RETURN_TAB_KEY,
      "Releasing",
    );
    navigation.navigate("Astrology");
  };

  const refreshActiveNow = useCallback(async () => {
    if (!natalPayload) return;
    try {
      const activeRes = await apiService.getZodiacalReleasingActive(
        natalPayload,
        { lotId: releaseLotId },
      );
      setActiveNow(activeRes.data.active);
    } catch {
      setActiveNow(null);
    }
  }, [natalPayload, releaseLotId]);

  useFocusEffect(
    useCallback(() => {
      refreshActiveNow();
    }, [refreshActiveNow]),
  );

  const loadTimeline = useCallback(async () => {
    if (!natalPayload || birthMs == null || !natalCacheKey) return;
    const loadKey = `${natalCacheKey}:${releaseLotId}`;
    if (timelineLoadingRef.current) return;
    if (timelineLoadKeyRef.current === loadKey) return;

    timelineLoadingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const horizon = birthMs + 100 * 360 * 24 * 60 * 60 * 1000;

      const [lotsRes, l1Res] = await Promise.all([
        apiService.getNatalLots(natalPayload),
        apiService.getZodiacalReleasingPeriods(natalPayload, {
          level: 1,
          lotId: releaseLotId,
          fromMs: birthMs,
          toMs: horizon,
        }),
      ]);
      setLots(lotsRes.data.lots);
      setSect(lotsRes.data.sect);
      setL1Periods(l1Res.data.periods);
      setL2ByL1({});
      setL3ByKey({});
      setExpandedL2Key(null);
      setExpandedL1(null);
      timelineLoadKeyRef.current = loadKey;
      await refreshActiveNow();
    } catch (e: any) {
      setError(e?.message || "Could not load releasing timeline");
    } finally {
      timelineLoadingRef.current = false;
      setLoading(false);
    }
  }, [natalPayload, natalCacheKey, releaseLotId, birthMs, refreshActiveNow]);

  useEffect(() => {
    if (natalCacheKey) loadTimeline();
  }, [natalCacheKey, releaseLotId, loadTimeline]);

  useEffect(() => {
    if (!activeNow) return;
    setCountdownNowMs(Date.now());
    const id = setInterval(() => setCountdownNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, [activeNow]);

  const loadL2 = async (l1Index: number, l1: ZrPeriod) => {
    if (!natalPayload || l2ByL1[l1Index]) return;
    const res = await apiService.getZodiacalReleasingPeriods(natalPayload, {
      level: 2,
      lotId: releaseLotId,
      parent: { startMs: l1.startMs, endMs: l1.endMs, sign: l1.sign },
      fromMs: l1.startMs,
      toMs: l1.endMs,
    });
    setL2ByL1((prev) => ({ ...prev, [l1Index]: res.data.periods }));
  };

  const loadL3 = async (l1Index: number, l2: ZrPeriod, l2Index: number) => {
    if (!natalPayload) return;
    const key = `${l1Index}-${l2Index}`;
    if (l3ByKey[key]) return;
    const res = await apiService.getZodiacalReleasingPeriods(natalPayload, {
      level: 3,
      lotId: releaseLotId,
      parent: { startMs: l2.startMs, endMs: l2.endMs, sign: l2.sign },
      fromMs: l2.startMs,
      toMs: l2.endMs,
    });
    setL3ByKey((prev) => ({ ...prev, [key]: res.data.periods }));
  };

  if (natalLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#e6e6fa" />
      </View>
    );
  }

  if (!hasNatal || !natalPayload) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.pad}>
        <Text style={sharedUI.pageTitle}>Zodiacal Releasing</Text>
        <Text style={sharedUI.sectionText}>
          Save birth date, time, and place in Astrology Settings to view lots and
          releasing periods.
        </Text>
        <TouchableOpacity style={sharedUI.primaryButton} onPress={openNatalSettings}>
          <Text style={sharedUI.primaryButtonText}>Open Natal Settings</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.pad}>
      <Text style={sharedUI.pageTitle}>Zodiacal Releasing</Text>
      {sect?.nearSectBoundary && (
        <Text style={styles.warning}>
          Sun is within about 1° of the horizon — sect (and lots) may be
          sensitive.
        </Text>
      )}

      {activeNow && (
        <View style={styles.nowGrid}>
          {NOW_LEVELS.map(({ key, label, level }) => {
            const period = activeNow[key];
            const showCountdown =
              period != null &&
              isWithinSwitchCountdownWindow(period.endMs, countdownNowMs);
            return (
              <View
                key={key}
                style={[styles.nowCard, { width: nowCardWidth }]}
              >
                {showCountdown && (
                  <Text style={styles.nowCountdown} numberOfLines={1}>
                    {formatSwitchCountdown(period.endMs, countdownNowMs)}
                  </Text>
                )}
                <Text style={styles.nowLevelLabel}>{label}</Text>
                {period ? (
                  <>
                    <Text style={styles.nowSignText} numberOfLines={2}>
                      {zodiacSignToUnicodeEmoji(period.sign)} {period.sign}
                    </Text>
                    <Text style={styles.nowSwitchText} numberOfLines={3}>
                      Until{" "}
                      {formatReleasingDate(
                        period.endMs,
                        displayTimeZone,
                        level >= 3,
                      )}
                    </Text>
                  </>
                ) : (
                  <Text style={styles.nowEmpty}>—</Text>
                )}
              </View>
            );
          })}
        </View>
      )}

      <Text style={[sharedUI.sectionTitle, { marginTop: 8 }]}>
        Release from
      </Text>
      <View style={styles.chipRow}>
        {LOT_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.id}
            style={[
              styles.chip,
              releaseLotId === opt.id && styles.chipActive,
            ]}
            onPress={() => setReleaseLotId(opt.id)}
          >
            <Text
              style={[
                styles.chipText,
                releaseLotId === opt.id && styles.chipTextActive,
              ]}
            >
              {opt.label.replace("Lot of ", "")}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && <ActivityIndicator color="#e6e6fa" style={{ marginVertical: 12 }} />}
      {error && <Text style={styles.error}>{error}</Text>}

      <Text style={[sharedUI.sectionTitle, { marginTop: 16 }]}>Timeline</Text>
      <Text style={styles.tzNote}>
        Sub-period times shown in {displayTimeZone}
      </Text>

      {birthMs != null &&
        l1Periods.map((l1, l1Index) => {
          const isOpen = expandedL1 === l1Index;
          const l1Current = isSamePeriod(activeNow?.l1, l1);
          const l1Years = SIGN_MINOR_YEARS[l1.sign] ?? 0;
          const l1Range = `${formatReleasingDate(l1.startMs, displayTimeZone)} - ${formatReleasingDate(l1.endMs, displayTimeZone)}`;
          return (
            <View
              key={`l1-${l1.startMs}`}
              style={[styles.tableBlock, l1Current && styles.tableBlockCurrent]}
            >
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={async () => {
                  const next = isOpen ? null : l1Index;
                  setExpandedL1(next);
                  if (next != null) await loadL2(l1Index, l1);
                }}
              >
                <View
                  style={[
                    styles.tableRow,
                    styles.l1HeaderRow,
                    l1Current && styles.rowCurrent,
                  ]}
                >
                  <View style={styles.colPeriod}>
                    <Text style={styles.l1Label}>
                      L1 {zodiacSignToUnicodeEmoji(l1.sign)}{" "}
                      {signAbbrev(l1.sign)}
                      {l1Current ? (
                        <Text style={styles.currentBadge}> · Now</Text>
                      ) : null}
                    </Text>
                  </View>
                  <View style={styles.colAge}>
                    <Text style={styles.ageHeader}>Age</Text>
                  </View>
                  <View style={styles.colDate}>
                    <Text style={styles.l1DateRange}>{l1Range}</Text>
                    <Text style={styles.l1Meta}>
                      ({l1Years}-year period, Ruler:{" "}
                      {formatRulerLabel(l1.ruler)})
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
              {isOpen &&
                (l2ByL1[l1Index] || []).map((l2, l2Index) => {
                  const l2Key = `${l1Index}-${l2Index}`;
                  const l2Open = expandedL2Key === l2Key;
                  const l2Current = isSamePeriod(activeNow?.l2, l2);
                  const age = releasingAgeAtMs(birthMs, l2.startMs);
                  const zebra = l2Index % 2 === 1;
                  return (
                    <View key={l2Key}>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={async () => {
                          const next = l2Open ? null : l2Key;
                          setExpandedL2Key(next);
                          if (next) {
                            await loadL3(l1Index, l2, l2Index);
                          } else {
                            setL3ByKey((prev) => {
                              const copy = { ...prev };
                              delete copy[l2Key];
                              return copy;
                            });
                          }
                        }}
                      >
                        <View
                          style={[
                            styles.tableRow,
                            l2Current
                              ? styles.rowCurrent
                              : zebra
                                ? styles.rowZebra
                                : styles.rowBase,
                          ]}
                        >
                          <View style={styles.colPeriod}>
                            <Text style={styles.l2Label}>
                              L2 {zodiacSignToUnicodeEmoji(l2.sign)}{" "}
                              {signAbbrev(l2.sign)}
                              {l2Current ? (
                                <Text style={styles.currentBadge}> · Now</Text>
                              ) : null}
                            </Text>
                          </View>
                          <View style={styles.colAge}>
                            <Text style={styles.ageValue}>{age}</Text>
                          </View>
                          <View style={styles.colDate}>
                            <Text style={styles.l2Date}>
                              {formatReleasingDate(l2.startMs, displayTimeZone)}
                              <Text style={styles.statusText}>
                                {periodStatusSuffix(l2)}
                              </Text>
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                      {l2Open &&
                        (l3ByKey[l2Key] || []).map((l3) => {
                          const l3Age = releasingAgeAtMs(birthMs, l3.startMs);
                          const l3Current = isSamePeriod(activeNow?.l3, l3);
                          return (
                            <View
                              key={`${l2Key}-${l3.startMs}`}
                              style={[
                                styles.tableRow,
                                styles.l3Row,
                                l3Current && styles.rowCurrent,
                              ]}
                            >
                              <View style={styles.colPeriod}>
                                <Text style={styles.l3Label}>
                                  L3 {zodiacSignToUnicodeEmoji(l3.sign)}{" "}
                                  {signAbbrev(l3.sign)}
                                  {l3Current ? (
                                    <Text style={styles.currentBadge}>
                                      {" "}
                                      · Now
                                    </Text>
                                  ) : null}
                                </Text>
                              </View>
                              <View style={styles.colAge}>
                                <Text style={styles.l3Age}>{l3Age}</Text>
                              </View>
                              <View style={styles.colDate}>
                                <Text style={styles.l3Date}>
                                  {formatReleasingDate(
                                    l3.startMs,
                                    displayTimeZone,
                                    true,
                                  )}
                                  <Text style={styles.statusText}>
                                    {periodStatusSuffix(l3)}
                                  </Text>
                                </Text>
                              </View>
                            </View>
                          );
                        })}
                    </View>
                  );
                })}
            </View>
          );
        })}

      <Text style={[sharedUI.sectionTitle, { marginTop: 28 }]}>
        Hermetic Lots
      </Text>
      {lots && (
        <View style={styles.lotGrid}>
          {LOT_OPTIONS.map((opt) => {
            const lot = lots[opt.id];
            if (!lot) return null;
            return (
              <View
                key={lot.id}
                style={[styles.lotTile, { width: lotTileWidth }]}
              >
                <Text style={styles.lotEmoji}>
                  {zodiacSignToUnicodeEmoji(lot.sign)}
                </Text>
                <Text style={styles.lotName} numberOfLines={2}>
                  {lot.name.replace("Lot of ", "")}
                </Text>
                <Text style={styles.lotPlacement}>
                  {lot.sign} · H{lot.wholeSignHouse} ·{" "}
                  {Number(lot.degreeWithinSign).toFixed(1)}°
                </Text>
                <Text style={styles.formula} numberOfLines={2}>
                  {lot.formulaUsed}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  pad: { padding: 16, paddingBottom: 40 },
  centered: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  warning: {
    color: "#f9c74f",
    marginBottom: 12,
    fontSize: 14,
  },
  lotGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: LOT_GRID_GAP,
    marginBottom: 4,
  },
  lotTile: {
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 6,
    padding: 10,
    backgroundColor: "#0d0d0d",
  },
  lotEmoji: { fontSize: 26, marginBottom: 4 },
  lotName: {
    color: "#e6e6fa",
    fontWeight: "600",
    fontSize: 14,
    marginBottom: 4,
  },
  lotPlacement: {
    color: "#b19cd9",
    fontSize: 12,
    marginBottom: 4,
  },
  formula: {
    color: "#8a8a8a",
    fontSize: 11,
    lineHeight: 14,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: "#444",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipActive: {
    borderColor: "#6b4c9a",
    backgroundColor: "#2a1a4a",
  },
  chipText: { color: "#8a8a8a", fontSize: 13 },
  chipTextActive: { color: "#e6e6fa" },
  tzNote: { color: "#666", fontSize: 12, marginBottom: 8 },
  nowGrid: {
    flexDirection: "row",
    gap: NOW_CARD_GAP,
    marginBottom: 16,
  },
  nowCard: {
    position: "relative",
    borderWidth: 1,
    borderColor: "#4a2c7a",
    borderRadius: 6,
    backgroundColor: "#14101f",
    paddingVertical: 10,
    paddingHorizontal: 8,
    paddingTop: 12,
    minHeight: 88,
  },
  nowCountdown: {
    position: "absolute",
    top: 4,
    right: 5,
    maxWidth: "55%",
    textAlign: "right",
    color: "#f9c74f",
    fontSize: 10,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  nowLevelLabel: {
    color: "#b19cd9",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 6,
  },
  nowSignText: {
    color: "#e6e6fa",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 18,
    marginBottom: 6,
  },
  nowSwitchText: {
    color: "#888",
    fontSize: 11,
    lineHeight: 14,
  },
  nowEmpty: {
    color: "#666",
    fontSize: 14,
  },
  tableBlock: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 4,
    overflow: "hidden",
  },
  tableBlockCurrent: {
    borderColor: "#6b4c9a",
    borderWidth: 2,
  },
  rowCurrent: {
    backgroundColor: "#251a3d",
    borderLeftWidth: 4,
    borderLeftColor: "#b19cd9",
  },
  currentBadge: {
    color: "#d4b8ff",
    fontWeight: "700",
    fontSize: 12,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    minHeight: 44,
  },
  l1HeaderRow: {
    backgroundColor: "#1a2433",
  },
  rowBase: {
    backgroundColor: "#0a0a0a",
  },
  rowZebra: {
    backgroundColor: "#141414",
  },
  colPeriod: {
    flex: 2,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRightWidth: 1,
    borderRightColor: "#333",
  },
  colAge: {
    width: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRightWidth: 1,
    borderRightColor: "#333",
  },
  colDate: {
    flex: 3,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  l1Label: {
    color: "#e6e6fa",
    fontSize: 15,
    fontWeight: "700",
  },
  ageHeader: {
    color: "#e6e6fa",
    fontSize: 13,
    fontWeight: "700",
  },
  ageValue: {
    color: "#e6e6fa",
    fontSize: 14,
    fontWeight: "600",
  },
  l1DateRange: {
    color: "#e6e6fa",
    fontSize: 14,
    fontWeight: "700",
  },
  l1Meta: {
    color: "#888",
    fontSize: 12,
    marginTop: 2,
  },
  l2Label: {
    color: "#c9c9e8",
    fontSize: 14,
    fontWeight: "500",
  },
  l2Date: {
    color: "#c9c9e8",
    fontSize: 14,
  },
  l3Row: {
    backgroundColor: "#0d0d12",
    paddingLeft: 8,
  },
  l3Label: {
    color: "#9090b0",
    fontSize: 13,
  },
  l3Age: {
    color: "#9090b0",
    fontSize: 13,
  },
  l3Date: {
    color: "#9090b0",
    fontSize: 13,
  },
  statusText: {
    color: "#777",
    fontSize: 13,
  },
  error: { color: "#e72929", marginVertical: 8 },
});
