// ============================================================================
// IMPORTS
// ============================================================================
import React, { useState, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Platform,
  ScrollView,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================
interface DateTimePickerDrawerProps {
  visible: boolean;
  onClose: () => void;
  onApply: (date: Date) => void;
  onFollowCurrentTime: () => void;
  initialDate: Date;
  title?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================
export default function DateTimePickerDrawer({
  visible,
  onClose,
  onApply,
  onFollowCurrentTime,
  initialDate,
  title = "Select Date & Time",
}: DateTimePickerDrawerProps) {
  // State for the temporary date being edited
  const [tempDate, setTempDate] = useState(initialDate);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const drawerAnimation = useState(new Animated.Value(0))[0];
  const prevVisibleRef = useRef(visible);
  const initialDateRef = useRef(initialDate);
  const timePickerKeyRef = useRef(0);

  // Update initialDateRef when initialDate changes (but don't reset tempDate)
  React.useEffect(() => {
    initialDateRef.current = initialDate;
  }, [initialDate]);

  // Update tempDate only when drawer opens (when visible changes from false to true)
  // This ensures we start with the current displayDate when opening the drawer
  // but don't reset it while the drawer is open and user is making changes
  React.useEffect(() => {
    const wasVisible = prevVisibleRef.current;
    prevVisibleRef.current = visible;

    // Only reset tempDate when drawer opens (transitions from closed to open)
    if (visible && !wasVisible) {
      // Use a fresh copy of the initialDate to avoid reference issues
      const freshDate = new Date(initialDateRef.current);
      setTempDate(freshDate);
      // Reset picker visibility when drawer opens
      setShowDatePicker(false);
      setShowTimePicker(false);
    }
  }, [visible]);

  // Animate drawer when visibility changes
  React.useEffect(() => {
    if (visible) {
      Animated.timing(drawerAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(drawerAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.timing(drawerAnimation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  const handleApply = () => {
    onApply(tempDate);
    handleClose();
  };

  const handleFollowCurrentTime = () => {
    onFollowCurrentTime();
    handleClose();
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
      // On Android, only update if user confirmed (not cancelled)
      if (event.type === "set" && selectedDate) {
        // Preserve the time from tempDate when changing date
        const newDate = new Date(selectedDate);
        newDate.setHours(tempDate.getHours());
        newDate.setMinutes(tempDate.getMinutes());
        newDate.setSeconds(tempDate.getSeconds());
        setTempDate(newDate);
      }
    } else {
      // On iOS, preserve the time from tempDate when changing date
      if (selectedDate) {
        const newDate = new Date(selectedDate);
        newDate.setHours(tempDate.getHours());
        newDate.setMinutes(tempDate.getMinutes());
        newDate.setSeconds(tempDate.getSeconds());
        setTempDate(newDate);
      }
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === "android") {
      setShowTimePicker(false);
      // On Android, only update if user confirmed (not cancelled)
      if (event.type === "set" && selectedTime) {
        const newDate = new Date(tempDate);
        newDate.setHours(selectedTime.getHours());
        newDate.setMinutes(selectedTime.getMinutes());
        newDate.setSeconds(selectedTime.getSeconds());
        setTempDate(newDate);
      }
    } else {
      // On iOS spinner mode, onChange fires continuously as user scrolls
      // We need to update tempDate immediately with the selected time
      if (selectedTime) {
        // Create a completely new Date object to avoid reference issues
        // Preserve the date portion from tempDate and update only the time
        const newDate = new Date(tempDate);
        newDate.setHours(selectedTime.getHours());
        newDate.setMinutes(selectedTime.getMinutes());
        newDate.setSeconds(selectedTime.getSeconds());
        newDate.setMilliseconds(0);
        setTempDate(newDate);
      }
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={handleClose}
    >
      <TouchableOpacity
        style={styles.drawerOverlay}
        activeOpacity={1}
        onPress={handleClose}
      >
        <Animated.View
          style={[
            styles.drawerContainer,
            {
              transform: [
                {
                  translateY: drawerAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [400, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View>
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>{title}</Text>
              <TouchableOpacity onPress={handleClose}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.drawerContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Date Picker */}
              <View style={styles.pickerSection}>
                <Text style={styles.pickerLabel}>Date</Text>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => {
                    setShowDatePicker(true);
                    setShowTimePicker(false);
                  }}
                >
                  <Text style={styles.pickerButtonText}>
                    {tempDate.toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </Text>
                  <Text style={styles.pickerArrow}>▼</Text>
                </TouchableOpacity>

                {/* Inline Date Picker */}
                {showDatePicker && (
                  <View style={styles.inlinePickerContainer}>
                    <DateTimePicker
                      value={tempDate}
                      mode="date"
                      display={Platform.OS === "ios" ? "spinner" : "default"}
                      onChange={onDateChange}
                      maximumDate={
                        new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
                      } // 1 year from now
                      minimumDate={
                        new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
                      } // 1 year ago
                      style={styles.inlineDateTimePicker}
                      textColor="#e6e6fa"
                      themeVariant="dark"
                    />
                  </View>
                )}
              </View>

              {/* Time Picker */}
              <View style={styles.pickerSection}>
                <Text style={styles.pickerLabel}>Time</Text>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => {
                    // Increment key when opening time picker to ensure fresh render
                    timePickerKeyRef.current += 1;
                    setShowTimePicker(true);
                    setShowDatePicker(false);
                  }}
                >
                  <Text style={styles.pickerButtonText}>
                    {tempDate.toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </Text>
                  <Text style={styles.pickerArrow}>▼</Text>
                </TouchableOpacity>

                {/* Inline Time Picker */}
                {showTimePicker && (
                  <View style={styles.inlinePickerContainer}>
                    <DateTimePicker
                      key={`time-picker-${timePickerKeyRef.current}`}
                      value={tempDate}
                      mode="time"
                      display={Platform.OS === "ios" ? "spinner" : "default"}
                      onChange={onTimeChange}
                      style={styles.inlineDateTimePicker}
                      textColor="#e6e6fa"
                      themeVariant="dark"
                    />
                  </View>
                )}
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.currentTimeButton}
                  onPress={handleFollowCurrentTime}
                >
                  <Text style={styles.currentTimeButtonText}>
                    Follow Current Time
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.applyButton}
                  onPress={handleApply}
                >
                  <Text style={styles.applyButtonText}>Apply</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
  drawerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  drawerContainer: {
    backgroundColor: "#2a2a2a",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    maxHeight: 500,
  },
  drawerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#444",
  },
  drawerTitle: {
    color: "#e6e6fa",
    fontSize: 18,
    fontWeight: "bold",
  },
  closeButton: {
    color: "#e6e6fa",
    fontSize: 20,
    fontWeight: "bold",
  },
  drawerContent: {
    padding: 20,
  },
  pickerSection: {
    marginBottom: 20,
  },
  pickerLabel: {
    color: "#e6e6fa",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  pickerButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#3a3a3a",
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#555",
  },
  pickerButtonText: {
    color: "#e6e6fa",
    fontSize: 16,
  },
  pickerArrow: {
    color: "#e6e6fa",
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    gap: 10,
  },
  currentTimeButton: {
    flex: 1,
    backgroundColor: "#4a4a4a",
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#666",
  },
  currentTimeButtonText: {
    color: "#e6e6fa",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  applyButton: {
    flex: 1,
    backgroundColor: "#6f7782",
    padding: 15,
    borderRadius: 10,
  },
  applyButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  inlinePickerContainer: {
    backgroundColor: "#1a1a1a",
    marginTop: 8,
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: "#444",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 1,
    maxHeight: 120,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  inlineDateTimePicker: {
    backgroundColor: "transparent",
    height: 100,
    width: "100%",
    alignSelf: "center",
  },
});
