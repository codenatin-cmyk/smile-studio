import { activityLogger } from '@/hooks/useActivityLogs';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import CalendarPicker from './CalendarPicker';

type Appointment = {
  id: string;
  created_at: string;
  clinic_id: string;
  patient_id: string;
  date_time: string;
  message: string;
  clinic_profiles: {
    clinic_name: string;
    email: string;
    dentists?: { first_name: string; last_name: string }[];
  };
  profiles: { first_name: string; last_name: string; email: string };
  isAccepted: boolean | null;
  rejection_note: string;
  request: string;
};

interface Data {
  data: Appointment;
  sender_email: string;
  receiver_email: string;
}

type ResultType = 'success' | 'error' | null;

interface ClinicSchedule {
  sunday: { from: { hour: number; minute: number }; to: { hour: number; minute: number } } | null;
  monday: { from: { hour: number; minute: number }; to: { hour: number; minute: number } } | null;
  tuesday: { from: { hour: number; minute: number }; to: { hour: number; minute: number } } | null;
  wednesday: { from: { hour: number; minute: number }; to: { hour: number; minute: number } } | null;
  thursday: { from: { hour: number; minute: number }; to: { hour: number; minute: number } } | null;
  friday: { from: { hour: number; minute: number }; to: { hour: number; minute: number } } | null;
  saturday: { from: { hour: number; minute: number }; to: { hour: number; minute: number } } | null;
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF8C00',
    marginBottom: 16,
    textAlign: 'center',
  },
  scrollContent: {
    flexGrow: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  scheduleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  scheduleCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
    minWidth: 90,
  },
  scheduleDayText: {
    fontWeight: '600',
    fontSize: 12,
    color: '#1f2937',
  },
  scheduleTimeText: {
    color: '#2563eb',
    fontWeight: '500',
    fontSize: 11,
  },
  noScheduleText: {
    color: '#999',
    fontSize: 13,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  calendarContainer: {
    marginBottom: 16,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  calendarNavButton: {
    padding: 8,
  },
  calendarNavText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  calendarMonthText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  calendarGrid: {
    gap: 4,
  },
  calendarWeekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 4,
  },
  calendarDayHeader: {
    width: 40,
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 12,
    color: '#666',
  },
  calendarDay: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  calendarDayAvailable: {
    backgroundColor: '#e0f2fe',
  },
  calendarDaySelected: {
    backgroundColor: '#2563eb',
  },
  calendarDayDisabled: {
    opacity: 0.3,
  },
  calendarDayText: {
    fontSize: 14,
    color: '#333',
  },
  calendarDayTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  timePickerContainer: {
    marginBottom: 16,
  },
  timePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  periodButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  periodButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  periodButtonTextActive: {
    color: '#fff',
  },
  timeSeparator: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  messageInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#FF8C00',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  triggerButton: {
    backgroundColor: 'orange',
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  triggerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginLeft: 10,
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  warningText: {
    color: '#dc2626',
    fontSize: 12,
    marginTop: 4,
  },
  resultModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  successTitle: {
    color: '#10b981',
  },
  errorTitle: {
    color: '#ef4444',
  },
  resultMessage: {
    fontSize: 16,
    color: '#333',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  resultButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#FF8C00',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingMessage: {
    marginTop: 12,
    fontSize: 16,
    color: '#fff',
  },
  manualTimePickerContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  timePickerGroup: {
    flex: 1,
  },
  timePickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  timePickerScroll: {
    maxHeight: 150,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  timePickerItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    alignItems: 'center',
  },
  timePickerItemSelected: {
    backgroundColor: '#FF8C00',
  },
  timePickerItemText: {
    fontSize: 16,
    color: '#1f2937',
  },
  timePickerItemTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  periodContainer: {
    flexDirection: 'column',
    gap: 8,
  },

  periodButtonSelected: {
    backgroundColor: '#FF8C00',
    borderColor: '#FF8C00',
  },

  periodButtonTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  selectedTimeDisplay: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#86efac',
    alignItems: 'center',
  },
  selectedTimeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#15803d',
  },
});


export default function RescheduleAppointment({ data, sender_email, receiver_email }: Data) {
  const date = new Date();
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingSchedule, setIsFetchingSchedule] = useState(false);
  const [resultType, setResultType] = useState<ResultType>(null);
  const [resultMessage, setResultMessage] = useState('');
  
  // Clinic schedule state
  const [clinicSchedule, setClinicSchedule] = useState<ClinicSchedule | null>(null);
  
  // Calendar state
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedHour, setSelectedHour] = useState('09');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>('AM');
  const [rescheduleMessage, setRescheduleMessage] = useState('');

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];

  // Fetch clinic schedule when modal opens
  useEffect(() => {
    if (modalVisible && !clinicSchedule) {
      fetchClinicSchedule();
    }
  }, [modalVisible]);

  const fetchClinicSchedule = async () => {
    setIsFetchingSchedule(true);
    try {
      console.log('Fetching clinic schedule for clinic_id:', data.clinic_id);
      
      const { data: scheduleData, error } = await supabase
        .from('clinic_schedule')
        .select('*')
        .eq('clinic_id', data.clinic_id)
        .single();

      if (error) {
        console.error('Error fetching clinic schedule:', error);
        setResultType('error');
        setResultMessage('Failed to load clinic schedule');
        setModalVisible(false);
        return;
      }

      console.log('Fetched clinic schedule:', scheduleData);
      
      // Parse the schedule data
      const schedule: ClinicSchedule = {
        sunday: scheduleData.sunday,
        monday: scheduleData.monday,
        tuesday: scheduleData.tuesday,
        wednesday: scheduleData.wednesday,
        thursday: scheduleData.thursday,
        friday: scheduleData.friday,
        saturday: scheduleData.saturday,
      };

      setClinicSchedule(schedule);
    } catch (err) {
      console.error('Exception fetching schedule:', err);
      setResultType('error');
      setResultMessage('An error occurred while loading the schedule');
      setModalVisible(false);
    } finally {
      setIsFetchingSchedule(false);
    }
  };

  // Get available days based on clinic schedule
  const getAvailableDays = () => {
    if (!clinicSchedule) return [];
    
    const schedule = clinicSchedule;
    const days = [
      schedule.sunday,
      schedule.monday,
      schedule.tuesday,
      schedule.wednesday,
      schedule.thursday,
      schedule.friday,
      schedule.saturday,
    ];
    return days.map((day, index) => day && day.from && day.to ? index : -1).filter(d => d !== -1);
  };

  const availableDays = getAvailableDays();

  // Generate calendar days
  const getCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const isDayAvailable = (day: number | null) => {
    if (!day) return false;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dayOfWeek = date.getDay();
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return availableDays.includes(dayOfWeek) && date >= now;
  };

  const handleDaySelect = (day: number | null) => {
    if (!day || !isDayAvailable(day)) return;
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    setSelectedDate(newDate);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const validateTime = () => {
    if (!clinicSchedule) return false;
    
    const dayOfWeek = selectedDate.getDay();
    const dayNames: (keyof ClinicSchedule)[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const daySchedule = clinicSchedule[dayNames[dayOfWeek]];

    if (!daySchedule) return false;

    let hour = parseInt(selectedHour);
    if (selectedPeriod === 'PM' && hour !== 12) hour += 12;
    if (selectedPeriod === 'AM' && hour === 12) hour = 0;

    const selectedMinutes = hour * 60 + parseInt(selectedMinute);
    const openMinutes = daySchedule.from.hour * 60 + daySchedule.from.minute;
    const closeMinutes = daySchedule.to.hour * 60 + daySchedule.to.minute;

    return selectedMinutes >= openMinutes && selectedMinutes <= closeMinutes - 30;
  };

  const handleReschedule = async () => {

    setIsLoading(true);
    try {
      let hour = parseInt(selectedHour);
      if (selectedPeriod === 'PM' && hour !== 12) hour += 12;
      if (selectedPeriod === 'AM' && hour === 12) hour = 0;

      if (rescheduleMessage === ''){
        setResultType('error');
        setResultMessage('Reschedule message is required.');
        setIsLoading(false);
        return;
      }

      const newDateTime = new Date(selectedDate);
      newDateTime.setHours(hour, parseInt(selectedMinute), 0);

      // Check if the new date/time is at least 30 minutes from now
      const now = new Date();
      const diffMs = newDateTime.getTime() - now.getTime();
      if (diffMs < 30 * 60 * 1000) {
        setResultType('error');
        setResultMessage('Appointment must be scheduled at least 30 minutes from now');
        setIsLoading(false);
        return;
      }

      console.log('Updating appointment with id:', data.id);
      console.log('New date/time:', newDateTime.toISOString());

      // Update appointment in database
      const { data: updateData, error: updateError } = await supabase
        .from('appointments')
        .update({
          date_time: newDateTime.toISOString(),
          message: rescheduleMessage || data.message,
        })
        .eq('id', parseInt(data.id))
        .select();

      console.log('Update response:', { updateData, updateError });

      if (updateError) {
        console.error('Update error:', updateError);
        setResultType('error');
        setResultMessage(updateError.message);
      } else {
        // Send email notification
        console.log('Sending email notification...');
        
        const emailResponse = await fetch("https://xnzoxtidzexqeymiisis.supabase.co/functions/v1/cancellation-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhuem94dGlkemV4cWV5bWlpc2lzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3Nzk0MDYsImV4cCI6MjA2OTM1NTQwNn0.27zW_CmxYp1npvWlzArMGkn-j0PI8OvCk7Q-t8N7JTs`,
          },
          body: JSON.stringify({
            to: receiver_email,
            subject: "Appointment Rescheduled",
            message: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #FF8C00; color: #fff; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
    .details { background: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FF8C00; }
    .detail-row { margin: 10px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
    .alert { background: #FEF3C7; padding: 15px; border-radius: 8px; margin: 15px 0; border: 1px solid #FDE047; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin:0">🔄 Appointment Rescheduled</h1>
    </div>
    <div class="content">
      <p>Hello ${data.profiles.first_name} ${data.profiles.last_name},</p>
      <p>Your appointment has been <strong>rescheduled</strong>.</p>
      <div class="alert">
        <strong>⚠️ Important:</strong> Please note the new date and time below.
      </div>
      <div class="details">
        <h2 style="margin-top:0; color:#FF8C00">📋 New Appointment Details</h2>
        <div class="detail-row">📍 <strong>Clinic:</strong> ${data.clinic_profiles.clinic_name}</div>
        <div class="detail-row">📅 <strong>New Date:</strong> ${newDateTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        <div class="detail-row">🕐 <strong>New Time:</strong> ${newDateTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
        <div class="detail-row">🔄 <strong>Rescheduled By:</strong> ${sender_email}</div>
        <div class="detail-row">💬 <strong>Reason:</strong> ${rescheduleMessage}</div>
      </div>
      <p><strong>If you need to make changes or have questions, please contact the clinic.</strong></p>
    </div>
    <div class="footer">
      <p>Thank you,<br><strong>${data.clinic_profiles.clinic_name}</strong></p>
    </div>
  </div>
</body>
</html>`,
          }),
        });

        console.log('Email response status:', emailResponse.status);

        if (!emailResponse.ok) {
          const errorText = await emailResponse.text();
          console.error('Email error:', errorText);
          // Don't fail the entire operation if email fails
        } else {
          const emailResult = await emailResponse.json();
          console.log('Email sent successfully:', emailResult);
        }

        setResultType('success');
        setResultMessage('Appointment rescheduled successfully! Email notification has been sent.');
      }

      try {
        await activityLogger.log(
          data.clinic_id, 
          'clinic', 
          'Rescheduled appointment'
        );
      } catch (error) {
        console.error("❌ Error calling activity logger:", error);
      }

      setModalVisible(false);
    } catch (err) {
      console.error('Exception during reschedule:', err);
      setResultType('error');
      setResultMessage(err instanceof Error ? err.message : 'An error occurred while rescheduling');
    } finally {
      setIsLoading(false);
    }
  };

  const calendarDays = getCalendarDays();
  const isTimeValid = validateTime();

  const handleOpenModal = () => {
    setModalVisible(true);
    // Reset form
    setSelectedDate(new Date());
    setCurrentMonth(new Date());
    setSelectedHour('09');
    setSelectedMinute('00');
    setSelectedPeriod('AM');
    setRescheduleMessage('');
  };

  const handleCloseModal = () => {
    if (!isLoading) {
      setModalVisible(false);
      setClinicSchedule(null); // Reset schedule so it fetches fresh next time
    }
  };

  return (
    <>
      <TouchableOpacity 
        style={styles.triggerButton}
        onPress={handleOpenModal}
      >
        <Text style={styles.triggerButtonText}>Reschedule</Text>
      </TouchableOpacity>

      <Modal
        transparent
        visible={modalVisible}
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          {isFetchingSchedule ? (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.loadingMessage}>Loading clinic schedule...</Text>
            </View>
          ) : (
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Reschedule Appointment</Text>
              
              <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Clinic Schedule Display */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Clinic Schedule:</Text>
                  {clinicSchedule ? (
                    <View style={styles.scheduleContainer}>
                      {Object.entries(clinicSchedule).map(([day, schedule]) => {
                        if (!schedule || !schedule.from || !schedule.to) return null;
                        return (
                          <View key={day} style={styles.scheduleCard}>
                            <Text style={styles.scheduleDayText}>
                              {day.charAt(0).toUpperCase() + day.slice(1, 3)}
                            </Text>
                            <Text style={styles.scheduleTimeText}>
                              {`${schedule.from.hour}:${schedule.from.minute.toString().padStart(2, '0')} - ${schedule.to.hour}:${schedule.to.minute.toString().padStart(2, '0')}`}
                            </Text>
                          </View>
                        );
                      })}
                      {availableDays.length === 0 && (
                        <Text style={styles.noScheduleText}>No schedule available</Text>
                      )}
                    </View>
                  ) : (
                    <Text style={styles.noScheduleText}>Loading schedule...</Text>
                  )}
                </View>

                {availableDays.length > 0 && (
                  <>
                    {/* Calendar */}
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Select Date:</Text>
                      <CalendarPicker
                        day={selectedDate.getDate()}
                        month={selectedDate.getMonth() + 1}
                        year={selectedDate.getFullYear()}
                        availableDays={availableDays}
                        onDaySelect={(day, month, year) => {
                          setSelectedDate((prev) => {
                            const newDate = new Date(prev);
                            newDate.setDate(day);
                            newDate.setMonth(month - 1);
                            newDate.setFullYear(year);
                            return newDate;
                          });
                        }}
/>
                    </View>

                  {/* Time - Manual Picker */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Select Time:</Text>
                    
                    <View style={styles.manualTimePickerContainer}>
                      {/* Hour Picker */}
                      <View style={styles.timePickerGroup}>
                        <Text style={styles.timePickerLabel}>Hour</Text>
                        <ScrollView style={styles.timePickerScroll} nestedScrollEnabled>
                          {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map((hour) => (
                            <TouchableOpacity
                              key={hour}
                              style={[
                                styles.timePickerItem,
                                selectedHour === hour && styles.timePickerItemSelected
                              ]}
                              onPress={() => setSelectedHour(hour)}
                            >
                              <Text style={[
                                styles.timePickerItemText,
                                selectedHour === hour && styles.timePickerItemTextSelected
                              ]}>
                                {hour}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>

                      {/* Minute Picker */}
                      <View style={styles.timePickerGroup}>
                        <Text style={styles.timePickerLabel}>Minute</Text>
                        <ScrollView style={styles.timePickerScroll} nestedScrollEnabled>
                          {Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0')).map((minute) => (
                            <TouchableOpacity
                              key={minute}
                              style={[
                                styles.timePickerItem,
                                selectedMinute === minute && styles.timePickerItemSelected
                              ]}
                              onPress={() => setSelectedMinute(minute)}
                            >
                              <Text style={[
                                styles.timePickerItemText,
                                selectedMinute === minute && styles.timePickerItemTextSelected
                              ]}>
                                {minute}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>

                      {/* Period Picker */}
                      <View style={styles.timePickerGroup}>
                        <Text style={styles.timePickerLabel}>Period</Text>
                        <View style={styles.periodContainer}>
                          <TouchableOpacity
                            style={[
                              styles.periodButton,
                              selectedPeriod === 'AM' && styles.periodButtonSelected
                            ]}
                            onPress={() => setSelectedPeriod('AM')}
                          >
                            <Text style={[
                              styles.periodButtonText,
                              selectedPeriod === 'AM' && styles.periodButtonTextSelected
                            ]}>
                              AM
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[
                              styles.periodButton,
                              selectedPeriod === 'PM' && styles.periodButtonSelected
                            ]}
                            onPress={() => setSelectedPeriod('PM')}
                          >
                            <Text style={[
                              styles.periodButtonText,
                              selectedPeriod === 'PM' && styles.periodButtonTextSelected
                            ]}>
                              PM
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>

                    {/* Selected Time Display */}
                    <View style={styles.selectedTimeDisplay}>
                      <Text style={styles.selectedTimeText}>
                        Selected: {selectedHour}:{selectedMinute} {selectedPeriod}
                      </Text>
                    </View>
                  </View>

                    {/* Message */}
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Reason for Reschedule:</Text>
                      <TextInput
                        style={styles.messageInput}
                        value={rescheduleMessage}
                        onChangeText={setRescheduleMessage}
                        placeholder="Enter reason for rescheduling..."
                        multiline
                        maxLength={350}
                      />
                    </View>
                  </>
                )}
                
              </ScrollView>

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCloseModal}
                  disabled={isLoading}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                {availableDays.length > 0 && (
                  <TouchableOpacity
                    style={[
                      styles.confirmButton,
                     
                    ]}
                    onPress={handleReschedule}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color="white" />
                        <Text style={styles.loadingText}>Rescheduling...</Text>
                      </View>
                    ) : (
                      <Text style={styles.confirmButtonText}>Confirm Reschedule</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* Result Modal */}
      <Modal
        transparent
        visible={resultType !== null}
        animationType="fade"
        onRequestClose={() => setResultType(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={[
              styles.resultModalTitle,
              resultType === 'success' ? styles.successTitle : styles.errorTitle
            ]}>
              {resultType === 'success' ? '✓ Success' : '✗ Error'}
            </Text>
            <Text style={styles.resultMessage}>
              {resultMessage}
            </Text>
            <TouchableOpacity
              style={styles.resultButton}
              onPress={() => {
                setResultType(null);
                setResultMessage('');
              }}
            >
              <Text style={styles.resultButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}