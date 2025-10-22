import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';


export const Locale_US_EN_MONTHS_SHORT = [
  "Jan",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];

export type IFilterData = {
  id: string | number;
  title: string;
  image?: string | NodeJS.Require;
};

interface Props {
  style?: StyleProp<ViewStyle>
  day: number,
  month: number,
  year: number,
  fromMonth?: number,
  toMonth?: number,
  fromYear?: number,
  toYear?: number,
  fromDay?: number,
  toDay?: number,
  availableDays?: number[],
  onMonthSelect?: (month: number) => void,
  onYearSelect?: (year: number) => void,
  onDaySelect: (day: number, month: number, year: number) => void,
  onClose?: () => void,
}

const formatMonthOrDate = (num: number) => (num < 10 ? `0${num}` : `${num}`);

const getDisabledDates = (
  year: number,
  month: number,
  availableDays: number[] // 👈 array of day indexes you’re open
) => {
  const today = new Date();
  const disabled: Record<string, any> = {};
  const daysInMonth = new Date(year, month, 0).getDate();

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month - 1, d);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    // ❌ Disable if not in availableDays
    if (!availableDays.includes(dayOfWeek)) {
      disabled[`${year}-${formatMonthOrDate(month)}-${formatMonthOrDate(d)}`] = {
        disabled: true,
        disableTouchEvent: true,
      };
      continue;
    }

    // ⏳ Disable past days in current month
    if (
      year === today.getFullYear() &&
      month === today.getMonth() + 1 &&
      d < today.getDate()
    ) {
      disabled[`${year}-${formatMonthOrDate(month)}-${formatMonthOrDate(d)}`] = {
        disabled: true,
        disableTouchEvent: true,
      };
    }

    // 📅 Disable all days if month/year is past
    if (
      year < today.getFullYear() ||
      (year === today.getFullYear() && month < today.getMonth() + 1)
    ) {
      disabled[`${year}-${formatMonthOrDate(month)}-${formatMonthOrDate(d)}`] = {
        disabled: true,
        disableTouchEvent: true,
      };
    }
  }

  return disabled;
};




export default function CalendarPicker(props: Props) {
  const dateNow = new Date();

  const [months, setMonths] = useState<IFilterData[]>([]);
  const [years, setYears] = useState<IFilterData[]>([])

  const fromMonth = props.fromMonth || 1
  const toMonth = props.toMonth || 12;
  const fromYear = props.fromYear || 1980;
  const toYear = props.toYear || dateNow.getUTCFullYear();

  const [showMonthsSelector, setShowMonthSelector] = useState(false);
  const [showYearSelector, setShowYearSelector] = useState(false);

  const getMonths = () => {
    let bin = [] as number[];
    for (let i = fromMonth; i <= toMonth; i++) {
      bin.push(i);
    }

    return { "items": bin, "max": toMonth }
  }

  const getYears = () => {
    let bin = [] as number[];
    for (let i = fromYear; i <= toYear; i++) {
      bin.push(i);
    }

    return { "items": bin, "max": toMonth }
  }

  const getMonthsAsFilterData = () => {
    let bin = [] as IFilterData[];

    getMonths().items.forEach((e, idx) => {
      const key = Locale_US_EN_MONTHS_SHORT as any
      bin.push({
        id: e,
        title: key[idx]
      })
    })

    return bin;
  }

  const getYearsAsFilterData = () => {
    let bin = [] as IFilterData[];

    getYears().items.forEach((e) => {
      bin.push({
        id: e,
        title: e.toString()
      })
    })

    return bin;
  }

  const parseMonth = (month: number) => {
    return getMonthsAsFilterData().find((e) => e.id == month) as IFilterData
  }
  const parseYear = (year: number) => {
    return getYearsAsFilterData().find((e) => e.id == year) as IFilterData
  }

  const formatMonthOrDate = (value: number) => {
    return value < 10 ? `0${value}` : `${value}`
  }

  const [selectedMonth, setSelectedMonth] = useState<IFilterData>(parseMonth(props.month) || dateNow.getUTCMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<IFilterData>(parseYear(props.year) || dateNow.getUTCFullYear());
  const [selectedDate, setSelectedDate] = useState(props.day || dateNow.getUTCDate());

  useEffect(() => {

    setMonths(getMonthsAsFilterData());
    setYears(getYearsAsFilterData());
  }, [selectedMonth, selectedYear, selectedDate])

  useEffect(() => {
    if (!props.onMonthSelect) return;
    props.onMonthSelect(Number(selectedMonth.id))
  }, [selectedMonth])

  useEffect(() => {
    if (!props.onYearSelect) return;
    props.onYearSelect(Number(selectedYear.id))
  }, [selectedYear])


  return (
    <View style={{
      width: "100%",
      maxWidth: 500,
      borderRadius: 12,
      ...StyleSheet.flatten(props.style)
    }}>
      <Modal
        visible={showMonthsSelector || showYearSelector}
        transparent
        onRequestClose={props.onClose}
      >
        <View style={{
          height: "100%",
          width: "100%",
          backgroundColor: 'rgba(0,0,0,0.3)',
          alignItems: "center",
          justifyContent: "center"
        }}>
          <View style={{
            width: "100%",
            maxWidth: 460,
            marginLeft: "auto",
            marginRight: "auto",
            padding: 18,
            backgroundColor: "#FFF",
            borderRadius: 12,
          }}>
            {
              showMonthsSelector
              &&
              <GridSelectView
                title='Select month'
                keyId='months'
                items={months}
                onSelectItem={(item) => {
                  console.log(item.id)
                  setSelectedMonth(item)
                  setShowMonthSelector((prev) => !prev)
                }}
                onClose={() => {
                  setShowMonthSelector((prev) => !prev)
                }}
              />
            }
            {
              showYearSelector
              &&
              <GridSelectView
                title='Select year'
                keyId='years'
                items={years}
                onSelectItem={(item) => {
                  setSelectedYear(item)
                  setShowYearSelector((prev) => !prev)
                }}
                onClose={() => {
                  setShowYearSelector((prev) => !prev)
                }}
              />
            }
          </View>
        </View>
      </Modal>
    <Calendar
      style={{ width: "100%" }}
      theme={{
        selectedDayBackgroundColor: '#3454D1',
        textDisabledColor: '#ccc', // ✅ correct property
      }}
      hideExtraDays={true}
      initialDate={`${selectedYear.id}-${formatMonthOrDate(Number(selectedMonth.id))}-${formatMonthOrDate(selectedDate)}`}
      current={new Date().toDateString()}
      hideArrows={true}
      enableSwipeMonths={true}
      onDayPress={(date: DateData) => {
        const today = new Date();
        const pressedDate = new Date(date.year, date.month - 1, date.day);

        // 🔒 Prevent selecting past dates
        if (pressedDate < new Date(today.getFullYear(), today.getMonth(), today.getDate())) return;

        setSelectedDate(date.day);
        props.onDaySelect(date.day, date.month, date.year);
      }}
      onMonthChange={(date: DateData) => {
        setSelectedMonth(parseMonth(date.month));
      }}
    markedDates={{
        [`${selectedYear.id}-${formatMonthOrDate(Number(selectedMonth.id))}-${formatMonthOrDate(selectedDate)}`]: { 
          selected: true, 
          disableTouchEvent: true, 
          selectedColor: '#3454D1' 
        },
        ...getDisabledDates(Number(selectedYear.id), Number(selectedMonth.id), props.availableDays || [])
      }}
      renderHeader={() => (
        <View
          style={{
            alignSelf: "flex-start",
            height: 50,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            zIndex: 10,
          }}
        >
          <TouchableOpacity
            style={{
              paddingHorizontal: 18,
              paddingVertical: 10,
              borderRadius: 24,
              backgroundColor: "#004F2D",
            }}
            onPress={() => setShowMonthSelector((prev) => !prev)}
          >
            <Text style={{ ...gstyles.t_semibold_dark, fontSize: 14, color: "white" }}>
              {selectedMonth.title}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              paddingHorizontal: 18,
              paddingVertical: 10,
              borderRadius: 24,
              backgroundColor: "#004F2D",
            }}
            onPress={() => setShowYearSelector((prev) => !prev)}
          >
            <Text style={{ ...gstyles.t_semibold_dark, fontSize: 14, color: "white" }}>
              {selectedYear.title}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    />


    </View>
  )
}

const GridSelectView = (props: {
  keyId: string,
  title: string,
  items: IFilterData[],
  onSelectItem: (item: IFilterData) => void,
  onClose: () => void,
}) => {
  return (
    <View style={{
      width: "100%",
      maxHeight: 500,
    }}>
      <View style={{
        width: "100%",
        alignSelf: "flex-start",
        height: 50,
        flexDirection: "row",
        alignItems: "center",
        gap: 5
      }}>
        <TouchableOpacity style={{
          padding: 5
        }}
          onPress={props.onClose}
        >
          <MaterialIcons name='arrow-back' size={28} />
        </TouchableOpacity>
        <Text style={{ ...gstyles.t_semibold_dark, fontSize: 14 }}>{props.title}</Text>
      </View>
      <ScrollView
        style={{
          width: "100%",
        }}
        contentContainerStyle={{
          paddingVertical: 20,
          gap: 5,
          flexWrap: "wrap",
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-evenly",
        }}>
        {
          props.items.map((e, idx) => (
            <TouchableOpacity
              key={`${props.keyId}_${idx}`}
              style={{
                height: 50,
                width: "100%",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 24,
                backgroundColor: "#6B7D2B33"
              }}
              onPress={() => {
                props.onSelectItem(e);
              }}
            >
              <Text style={{ ...gstyles.t_semibold_dark, fontSize: 12 }}>{e.title}</Text>
            </TouchableOpacity>
          ))
        }

      </ScrollView>
    </View>
  )
}


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
