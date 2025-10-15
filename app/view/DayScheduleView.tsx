import { StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { DayScheduleType } from '@/lib/types'

interface Props {
    label : string,
    time? : DayScheduleType
}

const DayScheduleView = (props : Props) => {
    const [fromTime, setFromTime] = useState<string>();
    const [toTime, setToTime] = useState<string>();

    console.log(props.time)
    if(!props?.time || !props.time.hasSchedule) return;
    
    //const DAYS_IN_WEEK = ["SUN","MON","TUE","WED","THU","FRI","SAT"]
    useEffect(()=>{
        if(!props.time) return;

        setFromTime(`${props.time.from.hour}:${props.time.from.minute} ${props.time.from.atm}`)
        setToTime(`${props.time.to.hour}:${props.time.to.minute} ${props.time.to.atm}`)
    },[props.time])
  return (
    <View style={{

        flexDirection : "row",
        alignItems : "center",
        gap : 5
    }}>
      <Text>{props.label}</Text>
      <View
      style={{
        flexDirection : "row",
        alignItems : "center",
        }}>
        <Text>{`${fromTime} - ${toTime}`}</Text>
      </View>
    </View>
  )
}

export default DayScheduleView

const styles = StyleSheet.create({})