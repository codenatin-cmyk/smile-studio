import { ClockScheduleType } from "./types"


export const parseClinicSchedule = (time : ClockScheduleType) => {
    const date = new Date()
    date.setHours(time.hour > 12 && time.atm === "PM" ? time.hour + 12 : time.hour)
    date.setMinutes(time.minute)
    date.setMilliseconds(0)
    date.setSeconds(0)
    
    return date.toLocaleTimeString()

}