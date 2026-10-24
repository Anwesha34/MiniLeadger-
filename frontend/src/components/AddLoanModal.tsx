import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { createLoan, uploadReceiptPhoto } from '../services/api';
import { Loan } from '../types';

interface AddLoanModalProps {
  visible: boolean;
  onClose: () => void;
  onLoanCreated: (loan: Loan) => void;
  currencySymbol?: string;
}

export const AddLoanModal: React.FC<AddLoanModalProps> = ({
  visible,
  onClose,
  onLoanCreated,
  currencySymbol = '₹',
}) => {
  const [friendName, setFriendName] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [receiptImageUri, setReceiptImageUri] = useState<string | null>(null);

  // Date management: default to +7 days from now
  const getDefaultDueDate = (daysAhead: number = 7) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    return d.toISOString().split('T')[0];
  };

  const [dueDate, setDueDate] = useState(getDefaultDueDate(7));
  const [activeDatePreset, setActiveDatePreset] = useState<number | 'custom'>(7);

  // Form errors
  const [nameError, setNameError] = useState('');
  const [amountError, setAmountError] = useState('');
  const [dateError, setDateError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectPreset = (days: number) => {
    setActiveDatePreset(days);
    setDueDate(getDefaultDueDate(days));
    setDateError('');
  };

  const handlePickReceipt = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          'Permission Needed',
          'Please allow access to your photos to upload receipts.'
        );
        return;
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
        setReceiptImageUri(pickerResult.assets[0].uri);
      }
    } catch (err: any) {
      Alert.alert('Image Picker Error', err.message || 'Could not select photo');
    }
  };

  const handleRemoveReceipt = () => {
    setReceiptImageUri(null);
  };

  const validateForm = (): boolean => {
    let isValid = true;

    if (!friendName.trim() || friendName.trim().length < 2) {
      setNameError('Please enter a valid friend name (min 2 chars)');
      isValid = false;
    } else {
      setNameError('');
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setAmountError('Please enter an amount greater than 0');
      isValid = false;
    } else {
      setAmountError('');
    }

    if (!dueDate || isNaN(Date.parse(dueDate))) {
      setDateError('Please enter a valid date (YYYY-MM-DD)');
      isValid = false;
    } else {
      setDateError('');
    }

    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      let uploadedReceiptUrl: string | undefined = undefined;

      // Upload receipt photo if selected (Bonus feature)
      if (receiptImageUri) {
        try {
          uploadedReceiptUrl = await uploadReceiptPhoto(receiptImageUri);
        } catch (uploadErr) {
          console.warn('Receipt upload failed, saving loan without receipt', uploadErr);
        }
      }

      const newLoan = await createLoan({
        friendName: friendName.trim(),
        amount: parseFloat(amount),
        dueDate: new Date(dueDate).toISOString(),
        notes: notes.trim() || undefined,
        receiptUrl: uploadedReceiptUrl,
      });

      // Reset form
      setFriendName('');
      setAmount('');
      setNotes('');
      setReceiptImageUri(null);
      setDueDate(getDefaultDueDate(7));
      setActiveDatePreset(7);

      onLoanCreated(newLoan);
      onClose();
    } catch (err: any) {
      const errMsg =
        err.response?.data?.message || err.message || 'Failed to create loan entry';
      Alert.alert('Error', errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleRow}>
              <View style={styles.modalIconBadge}>
                <Ionicons name="add-circle" size={20} color="#4f46e5" />
              </View>
              <Text style={styles.modalTitle}>Record Lent Money</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={22} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            {/* Friend Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Friend's Name <Text style={styles.required}>*</Text>
              </Text>
              <View style={[styles.inputWrap, Boolean(nameError) && styles.inputError]}>
                <Ionicons name="person-outline" size={18} color="#94a3b8" />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Rahul Sharma"
                  placeholderTextColor="#94a3b8"
                  value={friendName}
                  onChangeText={(val) => {
                    setFriendName(val);
                    if (nameError) setNameError('');
                  }}
                  autoCapitalize="words"
                />
              </View>
              {Boolean(nameError) && <Text style={styles.errorText}>{nameError}</Text>}
            </View>

            {/* Amount */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Amount <Text style={styles.required}>*</Text>
              </Text>
              <View style={[styles.inputWrap, Boolean(amountError) && styles.inputError]}>
                <Text style={styles.currencyPrefix}>{currencySymbol}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  placeholderTextColor="#94a3b8"
                  value={amount}
                  onChangeText={(val) => {
                    setAmount(val);
                    if (amountError) setAmountError('');
                  }}
                  keyboardType="numeric"
                />
              </View>
              {Boolean(amountError) && <Text style={styles.errorText}>{amountError}</Text>}
            </View>

            {/* Due Date & Presets */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Repayment Due Date <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.presetsRow}>
                <TouchableOpacity
                  style={[
                    styles.presetChip,
                    activeDatePreset === 7 && styles.presetChipActive,
                  ]}
                  onPress={() => handleSelectPreset(7)}
                >
                  <Text
                    style={[
                      styles.presetChipText,
                      activeDatePreset === 7 && styles.presetChipTextActive,
                    ]}
                  >
                    +7 Days
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.presetChip,
                    activeDatePreset === 15 && styles.presetChipActive,
                  ]}
                  onPress={() => handleSelectPreset(15)}
                >
                  <Text
                    style={[
                      styles.presetChipText,
                      activeDatePreset === 15 && styles.presetChipTextActive,
                    ]}
                  >
                    +15 Days
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.presetChip,
                    activeDatePreset === 30 && styles.presetChipActive,
                  ]}
                  onPress={() => handleSelectPreset(30)}
                >
                  <Text
                    style={[
                      styles.presetChipText,
                      activeDatePreset === 30 && styles.presetChipTextActive,
                    ]}
                  >
                    +30 Days
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.presetChip,
                    activeDatePreset === 'custom' && styles.presetChipActive,
                  ]}
                  onPress={() => setActiveDatePreset('custom')}
                >
                  <Text
                    style={[
                      styles.presetChipText,
                      activeDatePreset === 'custom' && styles.presetChipTextActive,
                    ]}
                  >
                    Custom
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.inputWrap, Boolean(dateError) && styles.inputError]}>
                <Ionicons name="calendar-outline" size={18} color="#94a3b8" />
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#94a3b8"
                  value={dueDate}
                  onChangeText={(val) => {
                    setDueDate(val);
                    setActiveDatePreset('custom');
                    if (dateError) setDateError('');
                  }}
                />
              </View>
              {Boolean(dateError) && <Text style={styles.errorText}>{dateError}</Text>}
            </View>

            {/* Notes */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Notes / Purpose (Optional)</Text>
              <View style={[styles.inputWrap, styles.textAreaWrap]}>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="e.g. Dinner bill split, Uber fare"
                  placeholderTextColor="#94a3b8"
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={2}
                />
              </View>
            </View>

            {/* Receipt Photo Upload (Bonus Feature) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Receipt Photo (Bonus Option)</Text>

              {receiptImageUri ? (
                <View style={styles.receiptPreviewBox}>
                  <Image source={{ uri: receiptImageUri }} style={styles.receiptThumbnail} />
                  <View style={styles.receiptPreviewInfo}>
                    <Text style={styles.receiptFileName}>Receipt attached</Text>
                    <TouchableOpacity
                      onPress={handleRemoveReceipt}
                      style={styles.removeReceiptBtn}
                    >
                      <Ionicons name="trash-outline" size={14} color="#ef4444" />
                      <Text style={styles.removeReceiptText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.uploadBox}
                  onPress={handlePickReceipt}
                  activeOpacity={0.7}
                >
                  <Ionicons name="camera-outline" size={22} color="#4f46e5" />
                  <Text style={styles.uploadTitle}>Attach Receipt Photo</Text>
                  <Text style={styles.uploadSubtitle}>PNG, JPG up to 5MB</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>

          {/* Submit Button */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="checkmark-sharp" size={18} color="#ffffff" />
                  <Text style={styles.submitButtonText}>Save Loan Entry</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  closeButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  required: {
    color: '#ef4444',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: '#f8fafc',
    gap: 8,
  },
  inputError: {
    borderColor: '#ef4444',
    backgroundColor: '#fff5f5',
  },
  input: {
    flex: 1,
    paddingVertical: 11,
    fontSize: 15,
    color: '#0f172a',
  },
  currencyPrefix: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4f46e5',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  presetChip: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  presetChipActive: {
    backgroundColor: '#eef2ff',
    borderColor: '#6366f1',
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  presetChipTextActive: {
    color: '#4f46e5',
    fontWeight: '700',
  },
  textAreaWrap: {
    alignItems: 'flex-start',
    paddingVertical: 4,
  },
  textArea: {
    minHeight: 50,
    textAlignVertical: 'top',
  },
  uploadBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#cbd5e1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#faf5ff',
  },
  uploadTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4f46e5',
    marginTop: 6,
  },
  uploadSubtitle: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  receiptPreviewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    gap: 12,
  },
  receiptThumbnail: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
  },
  receiptPreviewInfo: {
    flex: 1,
  },
  receiptFileName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  removeReceiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  removeReceiptText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ef4444',
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4f46e5',
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
});
