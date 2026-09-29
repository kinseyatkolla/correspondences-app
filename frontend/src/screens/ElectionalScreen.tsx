import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Platform,
  useWindowDimensions,
} from "react-native";
import { useAstrology } from "../contexts/AstrologyContext";
import { sharedUI } from "../styles/sharedUI";
import { apiService, PlanetPosition } from "../services/api";
import { API_BASE_URL } from "../services/apiConfig";
import AstrologyChart from "../components/AstrologyChart";

type MonthOption = { year: number; month: number; label: string };

export type MonthlyElectionTime = {
  score: number;
  isoTime: string;
  dateLabel: string;
  timeLabel: string;
  risingSign: string;
  isDayChart: boolean;
  chartSect: "day" | "night";
  ascRulerPlanet: string | null;
  ascRulerSign: string | null;
  ascRulerHouse: number | null;
  ascRulerDignity: string | null;
  moonSign: string | null;
  moonHouse: number | null;
  moonDignity: string | null;
  inSectBeneficPlanet: string;
  inSectBeneficSign: string | null;
  inSectBeneficHouse: number | null;
  inSectBeneficDignity?: string | null;
  outOfSectMaleficPlanet: string;
  outOfSectMaleficSign: string | null;
  outOfSectMaleficHouse: number | null;
  outOfSectMaleficDignity?: string | null;
  chart?: {
    planets: Record<string, PlanetPosition>;
    houses?: {
      cusps: number[];
      ascendant: number;
      ascendantSign: string;
      ascendantDegree: string;
      mc: number;
      mcSign: string;
      mcDegree: string;
      houseSystem: string;
    };
  };
  breakdown?: Array<{ id: string; delta: number; label: string }>;
};

const SCORE_FILTER_OPTIONS: { label: string; min: number | null }[] = [
  { label: "All scores", min: null },
  { label: "0+", min: 0 },
  { label: "25+", min: 25 },
  { label: "50+", min: 50 },
  { label: "75+", min: 75 },
  { label: "100+", min: 100 },
];

function currentYearMonth(): { year: number; month: number } {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

function formatMonthLabel(year: number, month: number): string {
  const d = new Date(Date.UTC(year, month - 1, 1));
  return d.toLocaleString(undefined, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function buildMonthOptions(): MonthOption[] {
  const { year: startY, month: startM } = currentYearMonth();
  const options: MonthOption[] = [];
  const from = new Date(startY - 2, startM - 1, 1);
  const to = new Date(startY + 3, startM - 1, 1);
  let y = from.getFullYear();
  let m = from.getMonth() + 1;
  while (y < to.getFullYear() || (y === to.getFullYear() && m <= to.getMonth() + 1)) {
    options.push({
      year: y,
      month: m,
      label: formatMonthLabel(y, m),
    });
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return options;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function ordinalHouse(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

function formatSignHouse(
  sign: string | null,
  house: number | null,
  dignity: string | null,
): string {
  if (!sign && house == null) return "—";
  if (house != null && sign) {
    const parts = [`in the ${ordinalHouse(house)} house`, sign];
    if (dignity) parts.push(dignity);
    return parts.join(" ");
  }
  if (sign) return dignity ? `${sign} ${dignity}` : sign;
  if (house != null) {
    const base = `in the ${ordinalHouse(house)} house`;
    return dignity ? `${base} ${dignity}` : base;
  }
  return "—";
}

/** Red (low) → blue (mid) → green (100). */
function scoreAccentColor(score: number): string {
  const t = Math.max(0, Math.min(1, score / 100));
  if (t <= 0.5) {
    const u = t / 0.5;
    const r = Math.round(239 + (59 - 239) * u);
    const g = Math.round(68 + (130 - 68) * u);
    const b = Math.round(68 + (246 - 68) * u);
    return `rgb(${r},${g},${b})`;
  }
  const u = (t - 0.5) / 0.5;
  const r = Math.round(59 + (74 - 59) * u);
  const g = Math.round(130 + (222 - 130) * u);
  const b = Math.round(246 + (128 - 246) * u);
  return `rgb(${r},${g},${b})`;
}

function ElectionTimeCard({
  item,
  chartSize,
}: {
  item: MonthlyElectionTime;
  chartSize: number;
}) {
  const [factorsOpen, setFactorsOpen] = useState(true);
  const accent = scoreAccentColor(item.score);
  const factors = item.breakdown ?? [];
  return (
    <View style={[styles.card, { borderLeftColor: accent }]}>
      <Text style={[styles.scoreBadge, { color: accent }]}>{item.score}</Text>
      <View style={styles.cardRow}>
        <View style={styles.colLeft}>
          <Text style={styles.datetime}>
            {item.dateLabel} · {item.timeLabel}
          </Text>
          <Text style={styles.line}>
            Rising: <Text style={styles.value}>{item.risingSign}</Text>
          </Text>
          <Text style={styles.line}>
            {item.ascRulerPlanet ? capitalize(item.ascRulerPlanet) : "Ruler"}:{" "}
            <Text style={styles.value}>
              {item.ascRulerPlanet
                ? formatSignHouse(
                    item.ascRulerSign,
                    item.ascRulerHouse,
                    item.ascRulerDignity,
                  )
                : "—"}
            </Text>
          </Text>
          <Text style={styles.line}>
            Moon:{" "}
            <Text style={styles.value}>
              {formatSignHouse(
                item.moonSign,
                item.moonHouse,
                item.moonDignity,
              )}
            </Text>
          </Text>
          <Text style={styles.line}>
            {capitalize(item.inSectBeneficPlanet)}:{" "}
            <Text style={styles.value}>
              {formatSignHouse(
                item.inSectBeneficSign,
                item.inSectBeneficHouse,
                item.inSectBeneficDignity ?? null,
              )}
            </Text>
          </Text>
          <Text style={styles.line}>
            {capitalize(item.outOfSectMaleficPlanet)}:{" "}
            <Text style={styles.value}>
              {formatSignHouse(
                item.outOfSectMaleficSign,
                item.outOfSectMaleficHouse,
                item.outOfSectMaleficDignity ?? null,
              )}
            </Text>
          </Text>
          <TouchableOpacity
            style={styles.factorsToggle}
            onPress={() => setFactorsOpen((o) => !o)}
            accessibilityRole="button"
            accessibilityState={{ expanded: factorsOpen }}
          >
            <Text style={styles.factorsChevron}>
              {factorsOpen ? "▼" : "▶"}
            </Text>
            <Text style={styles.factorsToggleText}>Score factors</Text>
          </TouchableOpacity>
          {factorsOpen ? (
            <View style={styles.factorsList}>
              {factors.length === 0 ? (
                <Text style={styles.factorEmpty}>No scoring factors recorded.</Text>
              ) : (
                factors.map((f) => (
                  <View key={f.id} style={styles.factorRow}>
                    <Text
                      style={[
                        styles.factorDelta,
                        f.delta > 0 ? styles.factorPos : styles.factorNeg,
                      ]}
                    >
                      {f.delta > 0 ? `+${f.delta}` : f.delta}
                    </Text>
                    <Text style={styles.factorLabel}>{f.label}</Text>
                  </View>
                ))
              )}
            </View>
          ) : null}
        </View>
        <View style={[styles.colRight, { width: chartSize }]}>
          {item.chart?.planets ? (
            <AstrologyChart
              planets={item.chart.planets}
              houses={item.chart.houses}
              size={chartSize}
            />
          ) : (
            <View style={[styles.chartPlaceholder, { width: chartSize, height: chartSize }]}>
              <Text style={styles.chartPlaceholderText}>Chart</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

export default function ElectionalScreen({ navigation }: { navigation: any }) {
  const { width: windowWidth } = useWindowDimensions();
  const { currentChart } = useAstrology();
  const location = currentChart?.location;

  const chartSize = useMemo(() => {
    const inner = windowWidth - 32 - 24;
    return Math.min(220, Math.max(160, Math.floor(inner * 0.48)));
  }, [windowWidth]);

  const monthOptions = useMemo(() => buildMonthOptions(), []);
  const defaultYm = currentYearMonth();
  const [selected, setSelected] = useState<{ year: number; month: number }>(defaultYm);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [times, setTimes] = useState<MonthlyElectionTime[]>([]);
  const [notes, setNotes] = useState<string[]>([]);
  const [listMeta, setListMeta] = useState<{
    returnedCount?: number;
    bucketCount?: number;
    passedFilterCount?: number;
    filteredOutCount?: number;
  }>({});
  const [minScoreFilter, setMinScoreFilter] = useState<number | null>(100);

  const selectedLabel = formatMonthLabel(selected.year, selected.month);

  const filteredTimes = useMemo(() => {
    if (minScoreFilter == null) return times;
    return times.filter((t) => t.score >= minScoreFilter);
  }, [times, minScoreFilter]);

  useEffect(() => {
    setMinScoreFilter(null);
  }, [selected.year, selected.month]);

  const loadMonth = useCallback(async () => {
    if (!location?.latitude || !location?.longitude) {
      setError("Set a location on the Astrology screen first.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.fetchMonthlyElectionList({
        latitude: location.latitude,
        longitude: location.longitude,
        year: selected.year,
        month: selected.month,
        utcOffsetMinutes: -new Date().getTimezoneOffset(),
      });
      if (res.success) {
        setTimes(res.data.times ?? []);
        setNotes(res.data.notes ?? []);
        setListMeta({
          returnedCount: res.data.returnedCount ?? res.data.times?.length,
          bucketCount: res.data.bucketCount ?? res.data.eligibleCount,
          passedFilterCount: res.data.passedFilterCount,
          filteredOutCount: res.data.filteredOutCount,
        });
      } else {
        setError("Could not load election times for this month.");
      }
    } catch (e: any) {
      const status = e?.status;
      if (status === 404) {
        setError(
          `Electional API not found (404). Restart the backend or set EXPO_PUBLIC_API_URL to ${API_BASE_URL}.`,
        );
      } else {
        setError(e?.message || "Network error");
      }
    } finally {
      setLoading(false);
    }
  }, [location, selected.year, selected.month]);

  useEffect(() => {
    loadMonth();
  }, [loadMonth]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backText}>← Astrology</Text>
        </TouchableOpacity>

        <Text style={sharedUI.pageTitle}>Electional</Text>
        <Text style={sharedUI.pageSubtitle}>
          Best chart times for your saved location
        </Text>

        <TouchableOpacity
          style={styles.monthSelect}
          onPress={() => setPickerOpen(true)}
          accessibilityRole="button"
        >
          <Text style={styles.monthSelectLabel}>Month</Text>
          <Text style={styles.monthSelectValue}>{selectedLabel}</Text>
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator size="large" color="#b19cd9" style={styles.loader} />
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {notes.map((note) => (
          <Text key={note} style={styles.note}>
            {note}
          </Text>
        ))}

        {!loading && !error && times.length > 0 ? (
          <View style={styles.listHeader}>
            <Text style={styles.listCount}>
              {minScoreFilter != null
                ? `Showing ${filteredTimes.length} of ${times.length} times`
                : `${times.length} election time${times.length === 1 ? "" : "s"}`}
            </Text>
            {listMeta.bucketCount != null && listMeta.filteredOutCount != null ? (
              <Text style={styles.listCountSub}>
                {listMeta.passedFilterCount ?? times.length} passed chart rules
                {" · "}
                {listMeta.filteredOutCount} removed by vetoes
                {" · "}
                {listMeta.bucketCount} sampled across the month
              </Text>
            ) : null}
            <Text style={styles.filterLabel}>Minimum score</Text>
            <View style={styles.filterRow}>
              {SCORE_FILTER_OPTIONS.map((opt) => {
                const active = minScoreFilter === opt.min;
                return (
                  <TouchableOpacity
                    key={opt.label}
                    style={[styles.filterChip, active && styles.filterChipActive]}
                    onPress={() => setMinScoreFilter(opt.min)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        active && styles.filterChipTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ) : null}

        {!loading && !error && times.length === 0 ? (
          <Text style={styles.empty}>No eligible times for this month.</Text>
        ) : null}

        {!loading &&
        !error &&
        minScoreFilter != null &&
        times.length > 0 &&
        filteredTimes.length === 0 ? (
          <Text style={styles.empty}>
            No times match this score filter. Try a lower minimum.
          </Text>
        ) : null}

        {filteredTimes.map((item) => (
          <ElectionTimeCard
            key={item.isoTime}
            item={item}
            chartSize={chartSize}
          />
        ))}
      </ScrollView>

      <Modal visible={pickerOpen} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setPickerOpen(false)}
        >
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Select month</Text>
            <ScrollView style={styles.modalList}>
              {monthOptions.map((opt) => {
                const active =
                  opt.year === selected.year && opt.month === selected.month;
                return (
                  <TouchableOpacity
                    key={`${opt.year}-${opt.month}`}
                    style={[styles.modalRow, active && styles.modalRowActive]}
                    onPress={() => {
                      setSelected({ year: opt.year, month: opt.month });
                      setPickerOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.modalRowText,
                        active && styles.modalRowTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0d0d12",
  },
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  back: {
    marginBottom: 8,
  },
  backText: {
    color: "#b19cd9",
    fontSize: 16,
  },
  monthSelect: {
    backgroundColor: "#1a1a24",
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#333",
  },
  monthSelectLabel: {
    color: "#888",
    fontSize: 12,
    marginBottom: 4,
  },
  monthSelectValue: {
    color: "#e6e6fa",
    fontSize: 18,
    fontWeight: "600",
  },
  loader: {
    marginVertical: 24,
  },
  error: {
    color: "#ff6b6b",
    textAlign: "center",
    marginBottom: 12,
  },
  note: {
    color: "#c9a227",
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  empty: {
    color: "#888",
    textAlign: "center",
    marginTop: 12,
  },
  listHeader: {
    marginBottom: 16,
  },
  listCount: {
    color: "#e6e6fa",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  listCountSub: {
    color: "#888",
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 10,
  },
  filterLabel: {
    color: "#888",
    fontSize: 12,
    marginBottom: 8,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "#1a1a24",
    borderWidth: 1,
    borderColor: "#444",
  },
  filterChipActive: {
    backgroundColor: "#2a2040",
    borderColor: "#b19cd9",
  },
  filterChipText: {
    color: "#aaa",
    fontSize: 13,
    fontWeight: "500",
  },
  filterChipTextActive: {
    color: "#e6e6fa",
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#1a1a24",
    borderRadius: 12,
    padding: 12,
    paddingTop: 22,
    paddingLeft: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#2a2a35",
    borderLeftWidth: 5,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  colLeft: {
    flex: 1,
    minWidth: 0,
    paddingRight: 4,
  },
  colRight: {
    alignItems: "center",
    justifyContent: "flex-start",
  },
  chartPlaceholder: {
    backgroundColor: "#12121a",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  chartPlaceholderText: {
    color: "#666",
    fontSize: 12,
  },
  scoreBadge: {
    position: "absolute",
    top: 6,
    left: 10,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  datetime: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
  },
  line: {
    color: "#aaa",
    fontSize: 13,
    marginBottom: 3,
    lineHeight: 18,
  },
  value: {
    color: "#e6e6fa",
  },
  factorsToggle: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    paddingVertical: 4,
    gap: 6,
  },
  factorsChevron: {
    color: "#b19cd9",
    fontSize: 11,
    width: 14,
  },
  factorsToggleText: {
    color: "#b19cd9",
    fontSize: 13,
    fontWeight: "600",
  },
  factorsList: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#333",
  },
  factorRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
    gap: 8,
  },
  factorDelta: {
    fontSize: 12,
    fontWeight: "700",
    minWidth: 36,
  },
  factorPos: {
    color: "#7dcea0",
  },
  factorNeg: {
    color: "#e88a8a",
  },
  factorLabel: {
    flex: 1,
    color: "#bbb",
    fontSize: 12,
    lineHeight: 17,
  },
  factorEmpty: {
    color: "#666",
    fontSize: 12,
    fontStyle: "italic",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: 24,
  },
  modalSheet: {
    backgroundColor: "#1a1a24",
    borderRadius: 12,
    maxHeight: "70%",
    padding: 16,
  },
  modalTitle: {
    color: "#e6e6fa",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  modalList: {
    maxHeight: 400,
  },
  modalRow: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#333",
  },
  modalRowActive: {
    backgroundColor: "#2a2040",
  },
  modalRowText: {
    color: "#ccc",
    fontSize: 16,
  },
  modalRowTextActive: {
    color: "#e6e6fa",
    fontWeight: "600",
  },
});
