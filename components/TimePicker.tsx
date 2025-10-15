import 'react-native-gesture-handler';
import { Modal, StyleProp, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View, ViewStyle } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { FlatList, TouchableWithoutFeedback } from 'react-native';

interface Props {
  trigger: React.ReactNode;
  label? : string,
  minuteSkipBy: 1 | 5 | 10,
  hour?: string,
  minute?: string,
  atomicTime?: "AM" | "PM",
  onTimeSelected: (hour: string, minute: string, time: "AM" | "PM") => void,
  onClose?: () => void,
}

const TimePicker = (props: Props) => {
  const { width } = useWindowDimensions()
  const [hours, setHours] = useState<string[]>([])
  const [minutes, setMinutes] = useState<string[]>([])

  const date = new Date()
  const [hour, setHour] = useState<string>((date.getHours() > 12 ? date.getHours() - 12 : date.getHours()).toString())
  const [minute, setMinute] = useState<string>(date.getMinutes().toString())
  const [atomicTime, setAtomicTime] = useState<"AM" | "PM">(date.getHours() > 12 ? "PM" : "AM")

  useEffect(() => {
    var h = [];
    var m = [];

    //Hours
    for (var i = 1; i <= 12; i++) {
      h.push(`${i}`)
    }

    //Minute
    for (var i = 0; i < 60; i += (props.minuteSkipBy)) {
      m.push(i < 10 ? `0${i}` : `${i}`)
    }

    setHours(h)
    setMinutes(m)
  }, [])

  useEffect(()=>{
    if(!props.hour || !props.minute || !props.atomicTime) return;

    setHour(props.hour)
    setMinute(props.minute)
    setAtomicTime(props.atomicTime);
  },[props.hour,props.minute,props.atomicTime])

  return (
    <View style={{
      width: "100%",
      zIndex: 99999,
    }}>
      <View style={{
        flexDirection: "row",
        gap: 5,
        zIndex: 999
      }}>
        <Dropdown
          style={{
            ...(width > 720
            ? {
                width: 80,
            }
            : {
                width: 60,
            }),
          }}
          label='Hour' 
          selected={hour} 
          items={hours} 
          onSelect={(value)=>{
            setHour(value)
            props.onTimeSelected(value, minute, atomicTime)
          }} />
        <Dropdown
          style={{
            ...(width > 720
            ? {
                width: 80,
            }
            : {
                width: 60,
            }),
          }}
          label='Minute' selected={minute} items={minutes} 
          onSelect={(value) => {
            setMinute(value);
            props.onTimeSelected(hour, value, atomicTime);
          }} />
        <Dropdown
          style={{
            ...(width > 720
            ? {
                width: 80,
            }
            : {
                width: 65,
            }),
          }}
          selected={atomicTime} items={["AM", "PM"]} onSelect={(value) => {
            setAtomicTime(value)
            props.onTimeSelected(hour, minute, value)
          }} />
      </View>
    </View>
  )
}


type DropDownProps = {
  style?: StyleProp<ViewStyle>,
  selected?: string,
  onPress?: () => void,
  onSelect: (item: string) => void,
  onValueChange?: (value: string | undefined) => void,
  items: string[],
  disabled?: boolean
}

const Dropdown = ({ label, selected, onSelect, items, disabled, style }: DropDownProps) => {
  const [visible, setVisible] = useState(false);
  const triggerRef = useRef<View>(null);
  const [position, setPosition] = useState({ x: 0, y: 0, width: 0 });
  const { width } = useWindowDimensions();

  useEffect(() => {
    if (visible && triggerRef.current) {
      triggerRef.current.measure((fx, fy, w, h, px, py) => {
        setPosition({ x: px, y: py + h, width: w });
      });
    }
  }, [visible, width]);

  return (
    <View style={[{ minWidth: 50 }, style]}>
      <TouchableOpacity
        ref={triggerRef}
        disabled={disabled}
        onPress={() => setVisible(!visible)}
        style={{
          height: 48,
          backgroundColor: '#fff', // changed to white background
          borderRadius: 5,
          paddingHorizontal: 10,
          flexDirection: 'row', 
          alignItems: 'center',
          borderWidth: 1,
          borderColor: '#ccc', // optional: border for clarity
        }}
      >
        <Text style={{ flex: 1, fontSize: 14, color: disabled ? '#888' : 'black' }}>
          {selected}
        </Text>
        <MaterialIcons name="arrow-drop-down" size={24} />
      </TouchableOpacity>

      {visible && (
        <Modal transparent visible onRequestClose={() => setVisible(false)}>
          <TouchableWithoutFeedback onPress={() => setVisible(false)}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' }} />
          </TouchableWithoutFeedback>

          <View
            style={{
              position: 'absolute',
              top: position.y,
              left: position.x,
              width: position.width,
              backgroundColor: '#FFF', // dropdown list background stays white
              borderRadius: 5,
              maxHeight: 200,
              borderWidth: 1,
              borderColor: '#ccc',
            }}
          >
            <FlatList
              data={items}
              keyExtractor={(item, idx) => `${idx}-${item}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => { onSelect(item); setVisible(false); }}
                  style={{ padding: 12 }}
                >
                  <Text style={{ ...gstyles.t_base_dark, fontSize: 14 }}>{item}</Text>
                </TouchableOpacity>
              )}
              keyboardShouldPersistTaps="handled"
            />
          </View>
        </Modal>
      )}
    </View>
  );
};


const gstyles = StyleSheet.create({
    t_header: {
        fontSize: 20,
        color: "#565353",
        fontFamily: "poppins-bold"
    },
    t_base: {
        fontSize: 12,
        color: "#565353",
        fontFamily: "poppins"
    },
    t_subtitle: {
        fontSize: 12,
        color: "#565353",
        fontFamily: "poppins"
    },
    t_base_dark: {
        fontSize: 12,
        color: "#000000",
        fontFamily: "poppins"
    },
    t_semibold: {
        fontSize: 12,
        color: "#565353",
        fontFamily: "poppins-semibold"
    },
    t_semibold_dark: {
        fontSize: 12,
        color: "#000000",
        fontFamily: "poppins-semibold"
    },
    t_bold: {
        fontSize: 12,
        color: "#565353",
        fontFamily: "poppins-bold"
    },
    t_bold_dark: {
        fontSize: 12,
        color: "#000000",
        fontFamily: "poppins-bold"
    },
})

export default TimePicker
