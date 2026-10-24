import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Loan } from '../types';

interface LoanItemProps {
  loan: Loan;
  onMarkRepaid: (loanId: string) => void;
  onDeleteLoan?: (loanId: string) => void;
  onViewReceipt?: (url: string) => void;
  currencySymbol?: string;
}

export const LoanItem: React.FC<LoanItemProps> = ({
  loan,
  onMarkRepaid,
  onDeleteLoan,
  onViewReceipt,
  currencySymbol = '₹',
}) => {
  const isOverdue = loan.isOverdue;
  const isRepaid = loan.isRepaid;

  // Format dates
  const formatFriendlyDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = () => {
    if (isRepaid) {
      return (
        <View style={[styles.badge, styles.repaidBadge]}>
          <Ionicons name="checkmark-done" size={13} color="#059669" />
          <Text style={styles.repaidBadgeText}>Repaid</Text>
        </View>
      );
    }

    if (isOverdue) {
      return (
        <View style={[styles.badge, styles.overdueBadge]}>
          <Ionicons name="alert" size={13} color="#dc2626" />
          <Text style={styles.overdueBadgeText}>
            Overdue ({loan.daysOverdue || 1}d)
          </Text>
        </View>
      );
    }

    return (
      <View style={[styles.badge, styles.pendingBadge]}>
        <Ionicons name="time-outline" size={13} color="#2563eb" />
        <Text style={styles.pendingBadgeText}>
          Due in {loan.daysRemaining || 0}d
        </Text>
      </View>
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <View
      style={[
        styles.card,
        isOverdue && styles.overdueCard,
        isRepaid && styles.repaidCard,
      ]}
    >
      {/* Top Row: Avatar, Name, Status, Amount */}
      <View style={styles.topRow}>
        <View style={styles.avatarWrap}>
          <View
            style={[
              styles.avatar,
              isOverdue
                ? styles.avatarOverdue
                : isRepaid
                ? styles.avatarRepaid
                : styles.avatarDefault,
            ]}
          >
            <Text
              style={[
                styles.avatarText,
                isOverdue
                  ? styles.avatarTextOverdue
                  : isRepaid
                  ? styles.avatarTextRepaid
                  : styles.avatarTextDefault,
              ]}
            >
              {getInitials(loan.friendName)}
            </Text>
          </View>

          <View style={styles.nameContainer}>
            <Text style={styles.friendName}>{loan.friendName}</Text>
            <View style={styles.statusRow}>{getStatusBadge()}</View>
          </View>
        </View>

        <View style={styles.amountContainer}>
          <Text
            style={[
              styles.amountText,
              isRepaid
                ? styles.amountRepaid
                : isOverdue
                ? styles.amountOverdue
                : styles.amountActive,
            ]}
          >
            {currencySymbol}
            {Number(loan.amount).toLocaleString('en-IN')}
          </Text>
          <Text style={styles.lentDateText}>
            Due: {formatFriendlyDate(loan.dueDate)}
          </Text>
        </View>
      </View>

      {/* Optional Note */}
      {Boolean(loan.notes) && (
        <View style={styles.notesBox}>
          <Ionicons name="chatbubble-ellipses-outline" size={13} color="#64748b" />
          <Text style={styles.notesText} numberOfLines={2}>
            {loan.notes}
          </Text>
        </View>
      )}

      {/* Bottom Action & Receipt Row */}
      <View style={styles.bottomRow}>
        {/* Receipt Thumbnail / View Button */}
        {Boolean(loan.receiptUrl) ? (
          <TouchableOpacity
            style={styles.receiptButton}
            onPress={() => onViewReceipt && onViewReceipt(loan.receiptUrl!)}
            activeOpacity={0.7}
          >
            <Ionicons name="receipt-outline" size={15} color="#4f46e5" />
            <Text style={styles.receiptButtonText}>Receipt Attached</Text>
          </TouchableOpacity>
        ) : (
          <View />
        )}

        {/* Action Buttons */}
        <View style={styles.actionsRight}>
          {onDeleteLoan && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => onDeleteLoan(loan.id)}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={16} color="#94a3b8" />
            </TouchableOpacity>
          )}

          {!isRepaid ? (
            <TouchableOpacity
              style={styles.repayButton}
              onPress={() => onMarkRepaid(loan.id)}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-circle-outline" size={16} color="#ffffff" />
              <Text style={styles.repayButtonText}>Mark as Repaid</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.settledInfo}>
              <Ionicons name="shield-checkmark" size={14} color="#10b981" />
              <Text style={styles.settledText}>
                Settled {loan.repaidAt ? formatFriendlyDate(loan.repaidAt) : ''}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  // Overdue Highlighting (Prominent red border & badge)
  overdueCard: {
    borderColor: '#fca5a5',
    borderLeftWidth: 5,
    borderLeftColor: '#ef4444',
    backgroundColor: '#fffdfd',
  },
  repaidCard: {
    borderColor: '#e2e8f0',
    opacity: 0.85,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarDefault: {
    backgroundColor: '#eef2ff',
  },
  avatarOverdue: {
    backgroundColor: '#fee2e2',
  },
  avatarRepaid: {
    backgroundColor: '#ecfdf5',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
  },
  avatarTextDefault: {
    color: '#4f46e5',
  },
  avatarTextOverdue: {
    color: '#dc2626',
  },
  avatarTextRepaid: {
    color: '#059669',
  },
  nameContainer: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  overdueBadge: {
    backgroundColor: '#fee2e2',
  },
  overdueBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#dc2626',
  },
  pendingBadge: {
    backgroundColor: '#eff6ff',
  },
  pendingBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563eb',
  },
  repaidBadge: {
    backgroundColor: '#dcfce7',
  },
  repaidBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  amountActive: {
    color: '#0f172a',
  },
  amountOverdue: {
    color: '#dc2626',
  },
  amountRepaid: {
    color: '#64748b',
    textDecorationLine: 'line-through',
  },
  lentDateText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  notesBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 10,
  },
  notesText: {
    fontSize: 12,
    color: '#475569',
    flex: 1,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  receiptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#eef2ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  receiptButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4f46e5',
  },
  actionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 'auto',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },
  repayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#10b981',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  repayButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  settledInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  settledText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
  },
});
