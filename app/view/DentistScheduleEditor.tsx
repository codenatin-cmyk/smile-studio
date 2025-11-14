import { supabase } from "@/lib/supabase";
import { Picker } from "@react-native-picker/picker";
import { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

const daysOfWeek = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

// Custom Dropdown TimePicker with single border
function TimePicker({
  hour,
  minute,
  atomicTime,
  onTimeSelected,
  disabled = false,
  minuteSkipBy = 1,
}) {
  const hours = Array.from({ length: 12 }, (_, i) =>
    (i + 1).toString().padStart(2, "0")
  );

  const minutes = Array.from(
    { length: 60 / minuteSkipBy },
    (_, i) => (i * minuteSkipBy).toString().padStart(2, "0")
  );

  const ampm = ["AM", "PM"];

  return (
    <View style={styles.timePickerRow}>
      <View style={styles.timePickerCell}>
        <Picker
          enabled={!disabled}
          selectedValue={hour}
          style={styles.picker}
          dropdownIconColor="#000"
          onValueChange={(val) => onTimeSelected(val, minute, atomicTime)}
          mode="dropdown"
        >
          {hours.map((h) => (
            <Picker.Item key={h} label={h} value={h} />
          ))}
        </Picker>
      </View>

      <Text style={styles.colon}>:</Text>

      <View style={styles.timePickerCell}>
        <Picker
          enabled={!disabled}
          selectedValue={minute}
          style={styles.picker}
          dropdownIconColor="#000"
          onValueChange={(val) => onTimeSelected(hour, val, atomicTime)}
          mode="dropdown"
        >
          {minutes.map((m) => (
            <Picker.Item key={m} label={m} value={m} />
          ))}
        </Picker>
      </View>

      <View style={styles.timePickerCell}>
        <Picker
          enabled={!disabled}
          selectedValue={atomicTime}
          style={styles.picker}
          dropdownIconColor="#000"
          onValueChange={(val) => onTimeSelected(hour, minute, val)}
          mode="dropdown"
        >
          {ampm.map((a) => (
            <Picker.Item key={a} label={a} value={a} />
          ))}
        </Picker>
      </View>
    </View>
  );
}

function ScheduleTimeSelector({
  fromHour,
  fromMinute,
  fromAtm,
  setFromHour,
  setFromMinute,
  setFromAtm,
  toHour,
  toMinute,
  toAtm,
  setToHour,
  setToMinute,
  setToAtm,
  hasSchedule = true,
  is24Hours = false,
}) {
  return (
    <View style={{ flexDirection: "column", gap: 12 }}>
      <View>
        <Text style={styles.label}>From</Text>
        <TimePicker
          hour={fromHour.toString().padStart(2, "0")}
          minute={fromMinute.toString().padStart(2, "0")}
          atomicTime={fromAtm}
          minuteSkipBy={1}
          onTimeSelected={(hh, mm, atm) => {
            setFromHour(Number(hh));
            setFromMinute(Number(mm));
            setFromAtm(atm);
          }}
          disabled={!hasSchedule || is24Hours}
        />
      </View>

      <View>
        <Text style={styles.label}>To</Text>
        <TimePicker
          hour={toHour.toString().padStart(2, "0")}
          minute={toMinute.toString().padStart(2, "0")}
          atomicTime={toAtm}
          minuteSkipBy={1}
          onTimeSelected={(hh, mm, atm) => {
            setToHour(Number(hh));
            setToMinute(Number(mm));
            setToAtm(atm);
          }}
          disabled={!hasSchedule || is24Hours}
        />
      </View>
    </View>
  );
}

function DentistScheduleEditor({
  dentists,
  setDentists,
  saveDentists,
  initialSelectedDentistIndex,
  onBack,
  clinicId,
}) {
  const dentist = dentists[initialSelectedDentistIndex];

  const [schedule, setSchedule] = useState(
    dentist?.weeklySchedule || {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
      Sunday: [],
    }
  );

  const [clinicSchedule, setClinicSchedule] = useState(null);
  const [dentistName, setDentistName] = useState(dentist?.name || "");
  const [selectedDay, setSelectedDay] = useState(null);

  const [fromHour, setFromHour] = useState(9);
  const [fromMinute, setFromMinute] = useState(0);
  const [fromAtm, setFromAtm] = useState("AM");

  const [toHour, setToHour] = useState(5);
  const [toMinute, setToMinute] = useState(0);
  const [toAtm, setToAtm] = useState("PM");

  const [validationError, setValidationError] = useState({});

  const hasSchedule = true;
  const is24Hours = false;

  const { width } = useWindowDimensions();

  // Fetch clinic schedule on mount
  useEffect(() => {
    const fetchClinicSchedule = async () => {
      if (!clinicId) return;

      const { data, error } = await supabase
        .from("clinic_schedule")
        .select("*")
        .eq("clinic_id", clinicId)
        .limit(1);

      if (error) {
        console.error("Error fetching clinic schedule:", error);
        return;
      }

      if (data && data.length > 0) {
        setClinicSchedule(data[0]);
      }
    };

    fetchClinicSchedule();
  }, [clinicId]);

  const timeToMinutes = (h, m, ampm) => {
    let hour24 = h % 12;
    if (ampm === "PM") hour24 += 12;
    return hour24 * 60 + m;
  };

  const getClinicHoursForDay = (day) => {
    if (!clinicSchedule) return null;

    const dayKey = day.toLowerCase();
    const daySchedule = clinicSchedule[dayKey];

    if (!daySchedule || !daySchedule.hasSchedule) {
      return null; // Clinic is closed this day
    }

    const clinicFrom = timeToMinutes(
      daySchedule.from.hour,
      daySchedule.from.minute,
      daySchedule.from.atm
    );
    const clinicTo = timeToMinutes(
      daySchedule.to.hour,
      daySchedule.to.minute,
      daySchedule.to.atm
    );

    return { from: clinicFrom, to: clinicTo };
  };

  const validateAgainstClinicHours = (day, startMinutes, endMinutes) => {
    const clinicHours = getClinicHoursForDay(day);

    if (!clinicHours) {
      setValidationError({
        ...validationError,
        [day]: `The clinic is closed on ${day}.`
      });
      return false;
    }

    if (startMinutes < clinicHours.from || endMinutes > clinicHours.to) {
      const formatMinutesToTime = (minutes) => {
        let hour = Math.floor(minutes / 60);
        const min = minutes % 60;
        const ampm = hour >= 12 ? "PM" : "AM";
        hour = hour % 12 || 12;
        return `${hour.toString().padStart(2, "0")}:${min
          .toString()
          .padStart(2, "0")} ${ampm}`;
      };

      setValidationError({
        ...validationError,
        [day]: `Schedule must be within clinic hours: ${formatMinutesToTime(
          clinicHours.from
        )} - ${formatMinutesToTime(clinicHours.to)}`
      });
      return false;
    }

    // Clear error if validation passes
    setValidationError({
      ...validationError,
      [day]: null
    });
    return true;
  };

  const addTimeSlot = (day) => {
    if (!day) return;

    const startMinutes = timeToMinutes(fromHour, fromMinute, fromAtm);
    const endMinutes = timeToMinutes(toHour, toMinute, toAtm);

    if (endMinutes <= startMinutes) {
      Alert.alert("Invalid time", "End time must be after start time.");
      return;
    }

    // Validate against clinic hours
    if (!validateAgainstClinicHours(day, startMinutes, endMinutes)) {
      return;
    }

    const formatTime = (h, m, a) =>
      `${h.toString().padStart(2, "0")}:${m
        .toString()
        .padStart(2, "0")} ${a}`;

    const slotStr = `${formatTime(fromHour, fromMinute, fromAtm)} - ${formatTime(
      toHour,
      toMinute,
      toAtm
    )}`;

    setSchedule((prev) => ({
      ...prev,
      [day]: [...(prev[day] || []), slotStr],
    }));

    // Clear validation error on successful add
    setValidationError({
      ...validationError,
      [day]: null
    });

    setSelectedDay(null);
  };

  const removeTimeSlot = (day, index) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: (prev[day] || []).filter((_, i) => i !== index),
    }));
  };

  const [showConfirmModal, setShowConfirmModal] = useState(false);

  if (!dentist) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.errorText}>Invalid dentist</Text>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dentist Name</Text>
        <TextInput
          style={styles.textInput}
          value={dentistName}
          onChangeText={setDentistName}
          placeholder="Enter dentist name"
        />
      </View>

      {daysOfWeek.map((day) => {
        const clinicHours = getClinicHoursForDay(day);
        const isClinicClosed = !clinicHours;

        // Format clinic hours for display
        const formatMinutesToTime = (minutes) => {
          let hour = Math.floor(minutes / 60);
          const min = minutes % 60;
          const ampm = hour >= 12 ? "PM" : "AM";
          hour = hour % 12 || 12;
          return `${hour.toString().padStart(2, "0")}:${min
            .toString()
            .padStart(2, "0")} ${ampm}`;
        };

        return (
          <View key={day} style={styles.section}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={styles.sectionTitle}>{day}</Text>
              {isClinicClosed && (
                <Text style={styles.closedBadge}>Clinic Closed</Text>
              )}
            </View>

            {/* Clinic Hours Indicator */}
            {!isClinicClosed && clinicHours && (
              <View style={styles.clinicHoursIndicator}>
                <Text style={styles.clinicHoursText}>
                  📅 Clinic Hours: {formatMinutesToTime(clinicHours.from)} - {formatMinutesToTime(clinicHours.to)}
                </Text>
              </View>
            )}

            {(schedule[day] || []).map((slot, index) => (
              <View key={index} style={styles.slotItem}>
                <Text>{slot}</Text>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeTimeSlot(day, index)}
                >
                  <Text style={styles.removeText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))}

            {selectedDay === day ? (
              <>
                <ScheduleTimeSelector
                  fromHour={fromHour}
                  fromMinute={fromMinute}
                  fromAtm={fromAtm}
                  setFromHour={setFromHour}
                  setFromMinute={setFromMinute}
                  setFromAtm={setFromAtm}
                  toHour={toHour}
                  toMinute={toMinute}
                  toAtm={toAtm}
                  setToHour={setToHour}
                  setToMinute={setToMinute}
                  setToAtm={setToAtm}
                  hasSchedule={hasSchedule}
                  is24Hours={is24Hours}
                />

                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => addTimeSlot(day)}
                  >
                    <Text style={styles.buttonText}>Add Slot</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setSelectedDay(null);
                      setValidationError({
                        ...validationError,
                        [day]: null
                      });
                    }}
                  >
                    <Text style={styles.buttonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>

                {/* Validation Error Message */}
                {validationError[day] && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>⚠️ {validationError[day]}</Text>
                  </View>
                )}
              </>
            ) : (
              <TouchableOpacity
                style={[
                  styles.addSlotButton,
                  isClinicClosed && styles.disabledButton,
                ]}
                onPress={() => !isClinicClosed && setSelectedDay(day)}
                disabled={isClinicClosed}
              >
                <Text style={styles.buttonText}>
                  {isClinicClosed ? "Cannot Add (Clinic Closed)" : "Add Time Slot"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={() => setShowConfirmModal(true)}
        >
          <Text style={styles.buttonText}>Save</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>
      </View>

      {/* Confirm Save Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showConfirmModal}
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={{
              ...styles.modalContainer,
              ...(width > 720 ? { width: "40%" } : { width: "90%" }),
            }}
          >
            <Text style={{ ...styles.modalTitle, color: "#00505cff" }}>
              Confirm Save
            </Text>
            <Text style={styles.modalText}>
              Are you sure you want to save this schedule?
            </Text>

            <View style={[styles.buttonRow]}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirm}
                onPress={async () => {
                  setShowConfirmModal(false);

                  const updated = [...dentists];
                  updated[initialSelectedDentistIndex] = {
                    ...dentist,
                    name: dentistName.trim() || dentist.name,
                    weeklySchedule: schedule,
                  };

                  setDentists(updated);

                  try {
                    await saveDentists(updated);
                    Alert.alert("Success", "Schedule saved and synced to DB!");
                  } catch (error) {
                    Alert.alert("Error", "Failed to save schedule to DB.");
                    console.error("Save error:", error);
                  }

                  onBack();
                }}
              >
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

export default DentistScheduleEditor;

// =======================
// ✅ Stylesheet below
// =======================
const styles = StyleSheet.create({
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 16,
  },
  slotItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#e0e0e0",
    padding: 8,
    marginVertical: 3,
    borderRadius: 4,
  },
  removeButton: {
    backgroundColor: "#ff4444",
    paddingHorizontal: 8,
    borderRadius: 4,
    justifyContent: "center",
  },
  removeText: {
    color: "white",
  },
  addSlotButton: {
    marginTop: 6,
    backgroundColor: "#00505cff",
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#999",
    opacity: 0.6,
  },
  closedBadge: {
    fontSize: 12,
    color: "white",
    backgroundColor: "#ff4444",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: "600",
  },
  addButton: {
    flex: 1,
    backgroundColor: "#4CAF50",
    paddingVertical: 10,
    borderRadius: 4,
    alignItems: "center",
    marginRight: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#b32020ff",
    paddingVertical: 10,
    borderRadius: 4,
    alignItems: "center",
  },
  saveButton: {
    backgroundColor: "#006400",
    padding: 12,
    borderRadius: 6,
    flex: 1,
    marginRight: 10,
    alignItems: "center",
  },
  backButton: {
    backgroundColor: "#b32020ff",
    padding: 12,
    borderRadius: 6,
    flex: 1,
    marginLeft: 10,
    alignItems: "center",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },

  // TimePicker row and cells with single border
  timePickerRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  timePickerCell: {
    borderWidth: 1,
    borderColor: "#999",
    borderRadius: 6,
    marginHorizontal: 4,
    backgroundColor: "#fff",
    overflow: "hidden",
    height: 44,
    width: 70,
    justifyContent: "center",
  },
  picker: {
    height: 44,
    color: "#000",
    width: "100%",
  },
  colon: {
    fontSize: 18,
    fontWeight: "600",
    marginHorizontal: 2,
    color: "#333",
  },

  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: "red",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "85%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    elevation: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
  },
  modalCancel: {
    flex: 1,
    backgroundColor: "#a72828ff",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  modalConfirm: {
    flex: 1,
    backgroundColor: "#28a745",
    borderRadius: 6,
    marginLeft: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  clinicHoursIndicator: {
    backgroundColor: "#e3f2fd",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#2196F3",
  },
  clinicHoursText: {
    fontSize: 13,
    color: "#1565c0",
    fontWeight: "500",
  },
  errorContainer: {
    backgroundColor: "#ffebee",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginTop: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#f44336",
  },
  errorText: {
    fontSize: 13,
    color: "#c62828",
    fontWeight: "500",
  },
});