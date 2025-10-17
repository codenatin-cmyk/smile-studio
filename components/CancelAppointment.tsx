import { supabase } from '@/lib/supabase';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

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
  profiles: { first_name: string; last_name: string, email: string; };
  isAccepted: boolean | null;
  rejection_note: string;
  request: string;
};

interface Data {
  data: Appointment
  sender_email: string
  receiver_email: string
}

type ResultType = 'success' | 'error' | null;

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
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#EF4444',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: '#333',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
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
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  triggerButton: {
    backgroundColor: 'gray',
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
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default function CancelAppointment({ data, sender_email, receiver_email }: Data) {
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resultType, setResultType] = useState<ResultType>(null);
  const [resultMessage, setResultMessage] = useState('');

  const handleCancel = async () => {
    setIsLoading(true);
    try {
      console.log('Attempting to delete appointment with id:', data.id)
      const { data: existingData, error: fetchError } = await supabase
        .from('appointments')
        .select()
        .eq('id', parseInt(data.id))

      console.log('Existing record:', existingData, fetchError)
      console.log('Sender: ', sender_email, 'Receiver: ', receiver_email, 'Accepted: ', data.isAccepted)

      console.log('Starting fetch to edge function...')
      const response = await fetch("https://xnzoxtidzexqeymiisis.supabase.co/functions/v1/cancellation-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhuem94dGlkemV4cWV5bWlpc2lzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3Nzk0MDYsImV4cCI6MjA2OTM1NTQwNn0.27zW_CmxYp1npvWlzArMGkn-j0PI8OvCk7Q-t8N7JTs`,
        },
        body: JSON.stringify({
          to: receiver_email,
          subject: "Appointment Cancelled",
          message: `<!DOCTYPE html><html><head><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333}.container{max-width:600px;margin:0 auto;padding:20px}.header{background:#EF4444;color:#fff;padding:20px;text-align:center;border-radius:8px 8px 0 0}.content{background:#f9fafb;padding:30px;border:1px solid #e5e7eb}.details{background:#fff;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #EF4444}.detail-row{margin:10px 0}.footer{text-align:center;padding:20px;color:#6b7280;font-size:14px}.alert{background:#FEE2E2;padding:15px;border-radius:8px;margin:15px 0;border:1px solid #FECACA}</style></head><body><div class="container"><div class="header"><h1 style="margin:0">❌ Appointment Cancelled</h1></div><div class="content"><p>Hello,</p><p>We regret to inform you that your appointment has been <strong>cancelled</strong>.</p><div class="alert"><strong>⚠️ Important:</strong> Your appointment is no longer scheduled.</div><div class="details"><h2 style="margin-top:0;color:#EF4444">📋 Cancelled Appointment Details</h2><div class="detail-row">📍 <strong>Clinic:</strong> ${data.clinic_profiles.clinic_name}</div><div class="detail-row">❌ <strong>Cancelled By:</strong> ${sender_email}</div></div><p><strong>If you need to reschedule or have questions, please contact the clinic us.</strong></p></div><div class="footer"><p>Thank you,<br><strong>${data.clinic_profiles.clinic_name}</strong></p></div></div></body></html>`,
        }),
      });
      
      console.log('Fetch completed. Status:', response.status, 'StatusText:', response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('Email result:', result);

      const { data: deleteData, error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', parseInt(data.id))
        .select()

      console.log('Delete response:', { deleteData, error })

      if (error) {
        console.error('Delete error:', error)
        setResultType('error');
        setResultMessage(error.message);
      } else {
        setResultType('success');
        setResultMessage('Appointment cancelled successfully');
      }

      setModalVisible(false);
    } catch (err) {
      console.error('Exception:', err)
      setResultType('error');
      setResultMessage(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }

  const closeResultModal = () => {
    setResultType(null);
    setResultMessage('');
  };

  return (
    <>
      <TouchableOpacity 
        style={styles.triggerButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.triggerButtonText}>Cancel Appointment</Text>
      </TouchableOpacity>

      <Modal
        transparent
        visible={modalVisible}
        animationType="fade"
        onRequestClose={() => !isLoading && setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cancel Appointment</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to cancel this appointment?
            </Text>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
                disabled={isLoading}
              >
                <Text style={styles.cancelButtonText}>No</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmButton, isLoading && { opacity: 0.7 }]}
                onPress={handleCancel}
                disabled={isLoading}
              >
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="white" />
                    <Text style={styles.loadingText}>Cancelling...</Text>
                  </View>
                ) : (
                  <Text style={styles.confirmButtonText}>Yes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        transparent
        visible={resultType !== null}
        animationType="fade"
        onRequestClose={closeResultModal}
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
              onPress={closeResultModal}
            >
              <Text style={styles.resultButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  )
}