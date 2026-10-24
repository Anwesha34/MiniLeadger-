import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

export const LoginScreen: React.FC = () => {
  const { requestOtp, login } = useAuth();

  const [phone, setPhone] = useState('9876543210');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [detectedDevOtp, setDetectedDevOtp] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSendOtp = async () => {
    if (!phone.trim() || phone.trim().length < 10) {
      setErrorMessage('Please enter a valid 10-digit phone number');
      return;
    }

    setErrorMessage('');
    setIsLoading(true);

    try {
      const res = await requestOtp(phone.trim());
      if (res.devMockOtp) {
        setDetectedDevOtp(res.devMockOtp);
      }
      setStep('otp');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to send OTP';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim() || otp.trim().length !== 6) {
      setErrorMessage('Please enter the 6-digit OTP from your terminal');
      return;
    }

    setErrorMessage('');
    setIsLoading(true);

    try {
      await login(phone.trim(), otp.trim(), name.trim() || undefined);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Invalid or expired OTP. Please check server logs.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoFillDevOtp = () => {
    if (detectedDevOtp) {
      setOtp(detectedDevOtp);
      setErrorMessage('');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Brand Header */}
        <View style={styles.brandContainer}>
          <View style={styles.logoWrap}>
            <Ionicons name="wallet-outline" size={38} color="#ffffff" />
          </View>
          <Text style={styles.appTitle}>MiniLedger</Text>
          <Text style={styles.appTagline}>
            Track money lent to friends with zero friction
          </Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {step === 'phone' ? 'Welcome Back' : 'Enter Verification Code'}
          </Text>
          <Text style={styles.cardSubtitle}>
            {step === 'phone'
              ? 'Enter your mobile number to get a mock OTP'
              : `Code sent for ${phone}`}
          </Text>

          {Boolean(errorMessage) && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color="#ef4444" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {step === 'phone' ? (
            <>
              {/* Optional Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Your Name (Optional)</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name="person-outline" size={18} color="#94a3b8" />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Harsh or Alex"
                    placeholderTextColor="#94a3b8"
                    value={name}
                    onChangeText={setName}
                  />
                </View>
              </View>

              {/* Phone Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Mobile Number</Text>
                <View style={styles.inputWrap}>
                  <View style={styles.countryCodeBadge}>
                    <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="9876543210"
                    placeholderTextColor="#94a3b8"
                    value={phone}
                    onChangeText={(val) => {
                      setPhone(val);
                      if (errorMessage) setErrorMessage('');
                    }}
                    keyboardType="phone-pad"
                    maxLength={13}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleSendOtp}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <Text style={styles.primaryBtnText}>Send Mock OTP</Text>
                    <Ionicons name="arrow-forward" size={18} color="#ffffff" />
                  </>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* Terminal Log Callout */}
              <View style={styles.terminalCallout}>
                <View style={styles.terminalHeader}>
                  <Ionicons name="terminal-outline" size={15} color="#4338ca" />
                  <Text style={styles.terminalTitle}>Server Console Output</Text>
                </View>
                <Text style={styles.terminalBody}>
                  Mock OTP was printed in your backend server terminal log.
                </Text>

                {detectedDevOtp && (
                  <TouchableOpacity
                    style={styles.autoFillBtn}
                    onPress={handleAutoFillDevOtp}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="flash" size={14} color="#4f46e5" />
                    <Text style={styles.autoFillText}>
                      Auto-fill Mock OTP: <Text style={styles.bold}>{detectedDevOtp}</Text>
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* OTP Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>6-Digit OTP</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name="key-outline" size={18} color="#94a3b8" />
                  <TextInput
                    style={[styles.input, styles.otpInput]}
                    placeholder="• • • • • •"
                    placeholderTextColor="#94a3b8"
                    value={otp}
                    onChangeText={(val) => {
                      setOtp(val);
                      if (errorMessage) setErrorMessage('');
                    }}
                    keyboardType="number-pad"
                    maxLength={6}
                    autoFocus
                  />
                </View>
              </View>

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleVerifyOtp}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <Text style={styles.primaryBtnText}>Verify & Enter App</Text>
                    <Ionicons name="checkmark" size={18} color="#ffffff" />
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => {
                  setStep('phone');
                  setOtp('');
                  setErrorMessage('');
                }}
              >
                <Ionicons name="chevron-back" size={16} color="#64748b" />
                <Text style={styles.backBtnText}>Change Mobile Number</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Footer info */}
        <View style={styles.footerNote}>
          <Text style={styles.footerNoteText}>
            Full Stack Assignment • MiniLedger App
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 40,
    justifyContent: 'center',
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  appTagline: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
    marginBottom: 20,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    padding: 10,
    borderRadius: 10,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    color: '#ef4444',
    flex: 1,
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
  countryCodeBadge: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  countryCodeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0f172a',
  },
  otpInput: {
    fontSize: 20,
    letterSpacing: 6,
    fontWeight: '700',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4f46e5',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  terminalCallout: {
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  terminalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  terminalTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3730a3',
    textTransform: 'uppercase',
  },
  terminalBody: {
    fontSize: 12,
    color: '#4338ca',
    lineHeight: 16,
  },
  autoFillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    backgroundColor: '#ffffff',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  autoFillText: {
    fontSize: 12,
    color: '#4f46e5',
  },
  bold: {
    fontWeight: '800',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 14,
    paddingVertical: 6,
  },
  backBtnText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  footerNote: {
    alignItems: 'center',
    marginTop: 32,
  },
  footerNoteText: {
    fontSize: 12,
    color: '#94a3b8',
  },
});
