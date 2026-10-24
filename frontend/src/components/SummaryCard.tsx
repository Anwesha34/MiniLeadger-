import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LoanSummary } from '../types';

interface SummaryCardProps {
  summary: LoanSummary | null;
  currencySymbol?: string;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  summary,
  currencySymbol = '₹',
}) => {
  const totalLent = summary?.totalLent || 0;
  const totalRepaid = summary?.totalRepaid || 0;
  const overdueAmount = summary?.overdueAmount || 0;

  const repaymentPercentage =
    totalLent > 0 ? Math.round((totalRepaid / totalLent) * 100) : 0;

  const formatAmount = (num: number) => {
    return `${currencySymbol}${num.toLocaleString('en-IN')}`;
  };

  return (
    <View style={styles.card}>
      {/* Top Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Ionicons name="stats-chart" size={16} color="#4f46e5" />
          <Text style={styles.headerTitle}>Financial Summary</Text>
        </View>
        <View style={styles.recoveryBadge}>
          <Text style={styles.recoveryText}>{repaymentPercentage}% Recovered</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressBar, { width: `${repaymentPercentage}%` }]} />
      </View>

      {/* Primary Figures Grid */}
      <View style={styles.grid}>
        {/* Total Lent */}
        <View style={styles.metricBox}>
          <View style={styles.metricIconWrap}>
            <Ionicons name="arrow-up-circle" size={16} color="#6366f1" />
            <Text style={styles.metricLabel}>Total Lent</Text>
          </View>
          <Text style={styles.metricValuePrimary}>{formatAmount(totalLent)}</Text>
          <Text style={styles.metricSubtext}>
            {summary?.totalLoansCount || 0} loan entries
          </Text>
        </View>

        {/* Total Repaid */}
        <View style={styles.metricBox}>
          <View style={styles.metricIconWrap}>
            <Ionicons name="checkmark-circle" size={16} color="#10b981" />
            <Text style={styles.metricLabel}>Total Repaid</Text>
          </View>
          <Text style={styles.metricValueSuccess}>{formatAmount(totalRepaid)}</Text>
          <Text style={styles.metricSubtext}>
            {summary?.repaidLoansCount || 0} settled
          </Text>
        </View>
      </View>

      {/* Highlighted Overdue Card */}
      <View
        style={[
          styles.overdueAlertBox,
          overdueAmount > 0 ? styles.overdueAlertActive : styles.overdueAlertNone,
        ]}
      >
        <View style={styles.overdueLeft}>
          <View
            style={[
              styles.alertIconCircle,
              { backgroundColor: overdueAmount > 0 ? '#fee2e2' : '#f0fdf4' },
            ]}
          >
            <Ionicons
              name={overdueAmount > 0 ? 'alert-circle' : 'shield-checkmark'}
              size={18}
              color={overdueAmount > 0 ? '#ef4444' : '#10b981'}
            />
          </View>
          <View>
            <Text style={styles.overdueLabel}>
              {overdueAmount > 0 ? 'Overdue Amount' : 'No Overdue Loans'}
            </Text>
            <Text style={styles.overdueSubtext}>
              {overdueAmount > 0
                ? `${summary?.overdueLoansCount || 0} loan(s) past due date`
                : 'All payments on track'}
            </Text>
          </View>
        </View>

        <Text
          style={[
            styles.overdueAmountValue,
            { color: overdueAmount > 0 ? '#dc2626' : '#10b981' },
          ]}
        >
          {formatAmount(overdueAmount)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recoveryBadge: {
    backgroundColor: '#eef2ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recoveryText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4f46e5',
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 3,
  },
  grid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  metricBox: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#edf2f7',
  },
  metricIconWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  metricValuePrimary: {
    fontSize: 19,
    fontWeight: '800',
    color: '#1e293b',
    letterSpacing: -0.5,
  },
  metricValueSuccess: {
    fontSize: 19,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: -0.5,
  },
  metricSubtext: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  overdueAlertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  overdueAlertActive: {
    backgroundColor: '#fff1f2',
    borderColor: '#fca5a5',
  },
  overdueAlertNone: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  overdueLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  alertIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overdueLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
  },
  overdueSubtext: {
    fontSize: 11,
    color: '#64748b',
  },
  overdueAmountValue: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
});
