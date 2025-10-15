import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
  ScrollView,
  Modal,
} from "react-native";
import React, { useEffect, useState } from "react";
import TimePicker from "@/components/TimePicker";
import Checkbox from "expo-checkbox";
import { supabase } from "@/lib/supabase";

type WeekScheduleEditorProps = {
  clinicId: string | undefined;
  onSave: () => void;
};

type ClockScheduleType = {
  hour: number;
  minute: number;
  atm: "AM" | "PM";
};

type DayScheduleType = {
  hasSchedule: boolean;
  from: ClockScheduleType;
  to: ClockScheduleType;
};

type DayScheduleViewProps = {
  title: string;
  hasSchedule: boolean;
  from: ClockScheduleType | undefined;
  to: ClockScheduleType | undefined;
  onValuesChange: (
    from: ClockScheduleType,
    to: ClockScheduleType,
    hasSchedule: boolean
  ) => void;
};

type WeekScheduleType = {
  clinic_id?: string;
  sunday?: DayScheduleType | null;
  monday?: DayScheduleType | null;
  tuesday?: DayScheduleType | null;
  wednesday?: DayScheduleType | null;
  thursday?: DayScheduleType | null;
  friday?: DayScheduleType | null;
  saturday?: DayScheduleType | null;
};

const WeekScheduleEditor = (props: WeekScheduleEditorProps) => {
  const { width } = useWindowDimensions();
  const [sun, setSun] = useState<DayScheduleType>();
  const [mon, setMon] = useState<DayScheduleType>();
  const [tue, setTue] = useState<DayScheduleType>();
  const [wed, setWed] = useState<DayScheduleType>();
  const [thu, setThu] = useState<DayScheduleType>();
  const [fri, setFri] = useState<DayScheduleType>();
  const [sat, setSat] = useState<DayScheduleType>();
  const [successModalVisible, setSuccessModalVisible] = useState(false);

  const getClinicSchedule = async () => {
    const { data, error } = await supabase
      .from("clinic_schedule")
      .select(`*`)
      .limit(1)
      .eq("clinic_id", props.clinicId);

    if (error) {
      console.log(`ERR mod getClinicSchedule : ${error}`);
      return;
    }

    setSun(data[0]?.sunday ?? undefined);
    setMon(data[0]?.monday ?? undefined);
    setTue(data[0]?.tuesday ?? undefined);
    setWed(data[0]?.wednesday ?? undefined);
    setThu(data[0]?.thursday ?? undefined);
    setFri(data[0]?.friday ?? undefined);
    setSat(data[0]?.saturday ?? undefined);
  };

  useEffect(() => {
    getClinicSchedule();
  }, []);

  function getMinutesSinceMidnight(
    hour: number,
    minute: number,
    atm: "AM" | "PM"
  ): number {
    const isPM = atm === "PM";
    const adjustedHour = hour % 12 + (isPM ? 12 : 0); // 12 AM => 0, 12 PM => 12
    return adjustedHour * 60 + minute;
  }

  function isValidSchedule(from: ClockScheduleType, to: ClockScheduleType) {
    const fromMinutes = getMinutesSinceMidnight(from.hour, from.minute, from.atm);
    const toMinutes = getMinutesSinceMidnight(to.hour, to.minute, to.atm);
    return toMinutes - fromMinutes >= 30;
  }

  const validateDay = (
    day: DayScheduleType | undefined,
    name: string
  ): DayScheduleType | null => {
    if (!day?.hasSchedule) return null;

    if (!isValidSchedule(day.from, day.to)) {
      alert(`${name} schedule must be at least 30 minutes.`);
      throw new Error(`${name} schedule invalid`);
    }

    return day;
  };

  const updateSchedule = async () => {
    const { data, error } = await supabase
      .from("clinic_schedule")
      .select("*")
      .eq("clinic_id", props.clinicId);

    if (error) {
      console.log(`ERR clinic record schedule : ${error}`);
      return;
    }

    let queryBody: WeekScheduleType;

    try {
      queryBody = {
        clinic_id: props.clinicId,
        sunday: validateDay(sun, "Sunday"),
        monday: validateDay(mon, "Monday"),
        tuesday: validateDay(tue, "Tuesday"),
        wednesday: validateDay(wed, "Wednesday"),
        thursday: validateDay(thu, "Thursday"),
        friday: validateDay(fri, "Friday"),
        saturday: validateDay(sat, "Saturday"),
      };
    } catch (err) {
      console.log(err);
      return; // Stop update if invalid schedule
    }

    if (data?.length !== 0) {
      const { error } = await supabase
        .from("clinic_schedule")
        .update(queryBody)
        .eq("clinic_id", props.clinicId);

      if (error) {
        console.log(`ERR mod updateSchedule : ${error}`);
        return;
      }
    } else {
      const { error } = await supabase.from("clinic_schedule").insert(queryBody);

      if (error) {
        console.log(`ERR mod updateSchedule : ${error}`);
        return;
      }
    }

    setSuccessModalVisible(true);
    props.onSave();
  };

  return (
    <>
<View
  style={{
    flex: 1,
    width: "100%",
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 12,
  }}
>
        <Text
          style={{
            fontSize: 20,
            fontWeight: "bold",
            marginBottom: 16,
            color: '#00505cff',
            textAlign: "left",
          }}
        >
          Clinic's Open/Close Schedule
        </Text>

        <ScrollView
          style={{
            width: "100%",
            height: 250,
            marginTop: 12,
            gap: 12,
            paddingHorizontal: 4,
          }}
        >
          <DayScheduleView
            hasSchedule={sun?.hasSchedule || false}
            title="Sunday"
            from={sun?.from}
            to={sun?.to}
            onValuesChange={(from, to, hasSchedule) => setSun({ from, to, hasSchedule })}
          />
          <DayScheduleView
            hasSchedule={mon?.hasSchedule || false}
            title="Monday"
            from={mon?.from}
            to={mon?.to}
            onValuesChange={(from, to, hasSchedule) => setMon({ from, to, hasSchedule })}
          />
          <DayScheduleView
            hasSchedule={tue?.hasSchedule || false}
            title="Tuesday"
            from={tue?.from}
            to={tue?.to}
            onValuesChange={(from, to, hasSchedule) => setTue({ from, to, hasSchedule })}
          />
          <DayScheduleView
            hasSchedule={wed?.hasSchedule || false}
            title="Wednesday"
            from={wed?.from}
            to={wed?.to}
            onValuesChange={(from, to, hasSchedule) => setWed({ from, to, hasSchedule })}
          />
          <DayScheduleView
            hasSchedule={thu?.hasSchedule || false}
            title="Thursday"
            from={thu?.from}
            to={thu?.to}
            onValuesChange={(from, to, hasSchedule) => setThu({ from, to, hasSchedule })}
          />
          <DayScheduleView
            hasSchedule={fri?.hasSchedule || false}
            title="Friday"
            from={fri?.from}
            to={fri?.to}
            onValuesChange={(from, to, hasSchedule) => setFri({ from, to, hasSchedule })}
          />
          <DayScheduleView
            hasSchedule={sat?.hasSchedule || false}
            title="Saturday"
            from={sat?.from}
            to={sat?.to}
            onValuesChange={(from, to, hasSchedule) => setSat({ from, to, hasSchedule })}
          />
        </ScrollView>
        
        <View style={{backgroundColor: 'white', padding: 8}}>
          <TouchableOpacity
            style={{
              ...(width > 720
                ? {
                    paddingVertical: 20,
                    height: 30,
                  }
                : {
                    width: 500,
                    height: 40,
                  }),
              width: "100%",
              alignSelf: "center",
              backgroundColor: '#00505cff',
              borderRadius: 10,
              shadowColor: "#000",
            }}
            onPress={() => {
              updateSchedule();
            }}
          >
            <Text
              style={{
                color: "white",
                fontWeight: "700",
                textAlign: "center",
                fontSize: 16,
                ...(width > 720 ? { bottom: 10 } : { top: 10 }),
              }}
            >
              Save
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Success Modal */}
      <Modal
        transparent={true}
        visible={successModalVisible}
        animationType="fade"
        onRequestClose={() => setSuccessModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <View
            style={{
              width: "100%",
              maxWidth: 320,
              backgroundColor: '#f1f5f9',
              borderRadius: 12,
              padding: 25,
              alignItems: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 4,
              elevation: 5,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 20, color: '#1f5474ff' }}>
              Schedule Saved Successfully!
            </Text>

            <TouchableOpacity
              onPress={() => setSuccessModalVisible(false)}
              style={{
                backgroundColor: '#4CAF50',
                paddingVertical: 12,
                paddingHorizontal: 30,
                borderRadius: 8,
              }}
              activeOpacity={0.7}
            >
              <Text style={{ color: "white", fontWeight: "600", fontSize: 16 }}>
                OK
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default WeekScheduleEditor;

// DayScheduleView component
const DayScheduleView = (props: DayScheduleViewProps) => {
  const [fromHour, setFromHour] = useState<number>(props.from?.hour || 12);
  const [fromMinute, setFromMinute] = useState<number>(props.from?.minute || 0);
  const [fromAtm, setFromAtm] = useState<"AM" | "PM">(props.from?.atm || "AM");

  const [toHour, setToHour] = useState<number>(props.to?.hour || 1);
  const [toMinute, setToMinute] = useState<number>(props.to?.minute || 0);
  const [toAtm, setToAtm] = useState<"AM" | "PM">(props.to?.atm || "AM");

  const [hasSchedule, setHasSchedule] = useState(props.hasSchedule);
  const [is24Hours, setIs24Hours] = useState(false);
  const isExact24Hours =
  fromHour === 12 &&
  fromMinute === 0 &&
  fromAtm === "AM" &&
  toHour === 11 &&
  toMinute === 59 &&
  toAtm === "PM";

  // Update local states if props change
  useEffect(() => {
    setFromHour(props.from?.hour || 12);
    setFromMinute(props.from?.minute || 0);
    setFromAtm(props.from?.atm || "AM");

    setToHour(props.to?.hour || 1);
    setToMinute(props.to?.minute || 0);
    setToAtm(props.to?.atm || "AM");

    setHasSchedule(props.hasSchedule);
    setIs24Hours(false);
  }, [props.hasSchedule, props.from, props.to]);

  useEffect(() => {
    if (hasSchedule) {
      if (is24Hours) {
        props.onValuesChange(
          { hour: 12, minute: 0, atm: "AM" },
          { hour: 11, minute: 59, atm: "PM" },
          hasSchedule
        );
      } else {
        props.onValuesChange(
          { hour: fromHour, minute: fromMinute, atm: fromAtm },
          { hour: toHour, minute: toMinute, atm: toAtm },
          hasSchedule
        );
      }
    } else {
      props.onValuesChange(
        { hour: 12, minute: 0, atm: "AM" },
        { hour: 12, minute: 0, atm: "AM" },
        hasSchedule
      );
    }
  }, [fromHour, fromMinute, fromAtm, toHour, toMinute, toAtm, hasSchedule, is24Hours]);

  return (
    <View
      style={{
        backgroundColor: "#f1f5f9",
        borderRadius: 10,
        padding: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
        marginBottom: 10,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <Text
          style={{
            fontWeight: "700",
            fontSize: 16,
            color: '#00505cff',
          }}
        >
          {props.title}
        </Text>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text>Open</Text>
          <Checkbox
            value={hasSchedule}
            onValueChange={(val) => {
              setHasSchedule(val);
              if (!val) setIs24Hours(false);
            }}
          />
        </View>
      </View>

      <View style={{ position: "relative" }}>
        {/* Pale overlay when disabled */}
        {!hasSchedule && (
          <View
            style={{
              ...StyleSheet.absoluteFillObject,
              backgroundColor: "rgba(240,240,240,0.7)",
              borderRadius: 10,
              zIndex: 10,
            }}
            pointerEvents="none"
          />
        )}

        {/* 24 Hours Button */}
        <TouchableOpacity
          disabled={!hasSchedule}
          onPress={() => {
            if (hasSchedule) {
              // Toggle 24 hours only if not already exact 24 hours or deactivate if it is
              if (isExact24Hours) {
                // If currently exact 24h, turn off 24h mode and reset times (optional)
                setIs24Hours(false);
              } else {
                setIs24Hours(true);
                // Also set times to exact 24h for syncing
                setFromHour(12);
                setFromMinute(0);
                setFromAtm("AM");
                setToHour(11);
                setToMinute(59);
                setToAtm("PM");
              }
            }
          }}
          activeOpacity={0.7}
          style={{
            backgroundColor: hasSchedule && isExact24Hours
              ? "green"
              : hasSchedule
              ? is24Hours
                ? "green"
                : "#e0e0e0"
              : "#f0f0f0",
            paddingVertical: 10,
            paddingHorizontal: 20,
            borderRadius: 8,
            alignSelf: "flex-start",
            marginBottom: 12,
          }}
        >
          <Text
            style={{
              color: hasSchedule && (isExact24Hours || is24Hours) ? "white" : "#333",
              fontWeight: "600",
            }}
          >
            24 Hours
          </Text>
        </TouchableOpacity>

        <View style={{ flexDirection: "column", gap: 12 }}>
          <View>
            <Text style={{ fontSize: 14, fontWeight: "500", color: "#333", marginBottom: 4 }}>
              From
            </Text>
            <TimePicker
              hour={fromHour.toString().padStart(2, "0")}
              minute={fromMinute.toString().padStart(2, "0")}
              atomicTime={fromAtm}
              trigger={undefined}
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
            <Text style={{ fontSize: 14, fontWeight: "500", color: "#333", marginBottom: 4 }}>
              To
            </Text>
            <TimePicker
              hour={toHour.toString().padStart(2, "0")}
              minute={toMinute.toString().padStart(2, "0")}
              atomicTime={toAtm}
              trigger={undefined}
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
      </View>
    </View>
  );
};

