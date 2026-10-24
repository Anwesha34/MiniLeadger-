import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../components/Header';
import { SummaryCard } from '../components/SummaryCard';
import { LoanItem } from '../components/LoanItem';
import { AddLoanModal } from '../components/AddLoanModal';
import { ReceiptModal } from '../components/ReceiptModal';
import {
  getSummary,
  getLoans,
  markAsRepaid,
  deleteLoan,
  getDefaultBaseUrl,
  setApiBaseUrl,
} from '../services/api';
import { Loan, LoanFilter, LoanSummary } from '../types';

export const DashboardScreen: React.FC = () => {
  const [summary, setSummary] = useState<LoanSummary | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [filter, setFilter] = useState<LoanFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedReceiptUrl, setSelectedReceiptUrl] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [customApiUrl, setCustomApiUrl] = useState(getDefaultBaseUrl());

  const fetchData = useCallback(
    async (showLoadingSpinner: boolean = true) => {
      if (showLoadingSpinner) setIsLoading(true);
      try {
        const [summaryData, loansData] = await Promise.all([
          getSummary(),
          getLoans(filter, searchQuery),
        ]);
        setSummary(summaryData);
        setLoans(loansData);
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setIsLoading(false);
        setRefreshing(false);
      }
    },
    [filter, searchQuery]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData(false);
  };

  const handleMarkRepaid = async (loanId: string) => {
    try {
      await markAsRepaid(loanId);
      // Refresh list & summary
      fetchData(false);
    } catch (err: any) {
      Alert.alert(
        'Action Failed',
        err.response?.data?.message || err.message || 'Could not mark loan as repaid'
      );
    }
  };

  const handleDeleteLoan = (loanId: string) => {
    Alert.alert(
      'Delete Loan Entry',
      'Are you sure you want to remove this loan record?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteLoan(loanId);
              fetchData(false);
            } catch (err: any) {
              Alert.alert('Error', 'Failed to delete loan entry');
            }
          },
        },
      ]
    );
  };

  const handleSaveApiUrl = async () => {
    try {
      await setApiBaseUrl(customApiUrl.trim());
      setIsSettingsOpen(false);
      fetchData();
      Alert.alert('Success', 'Backend API URL updated successfully.');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const filterOptions: { key: LoanFilter; label: string; count?: number }[] = [
    { key: 'all', label: 'All', count: summary?.totalLoansCount },
    { key: 'pending', label: 'Pending', count: summary?.pendingLoansCount },
    { key: 'overdue', label: 'Overdue', count: summary?.overdueLoansCount },
    { key: 'repaid', label: 'Repaid', count: summary?.repaidLoansCount },
  ];

  return (
    <View style={styles.container}>
      <Header onOpenSettings={() => setIsSettingsOpen(true)} />

      {/* Main Content List */}
      <FlatList
        data={loans}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4f46e5']} />
        }
        ListHeaderComponent={
          <>
            {/* Top Summary Card */}
            <SummaryCard summary={summary} />

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <View style={styles.searchBar}>
                <Ionicons name="search-outline" size={18} color="#94a3b8" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search friend name or notes..."
                  placeholderTextColor="#94a3b8"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {Boolean(searchQuery) && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={18} color="#94a3b8" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Filter Tabs */}
            <View style={styles.filtersRow}>
              {filterOptions.map((item) => {
                const isActive = filter === item.key;
                const isOverdueTab = item.key === 'overdue' && (item.count || 0) > 0;

                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      styles.filterTab,
                      isActive && styles.filterTabActive,
                      isOverdueTab && styles.filterTabOverdueAlert,
                    ]}
                    onPress={() => setFilter(item.key)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.filterTabText,
                        isActive && styles.filterTabTextActive,
                        isOverdueTab && styles.filterTextOverdue,
                      ]}
                    >
                      {item.label}
                      {item.count !== undefined ? ` (${item.count})` : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Loan Records</Text>
              <Text style={styles.sectionSubtitle}>
                {loans.length} {loans.length === 1 ? 'entry' : 'entries'}
              </Text>
            </View>
          </>
        }
        renderItem={({ item }) => (
          <LoanItem
            loan={item}
            onMarkRepaid={handleMarkRepaid}
            onDeleteLoan={handleDeleteLoan}
            onViewReceipt={(url) => setSelectedReceiptUrl(url)}
          />
        )}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="receipt-outline" size={36} color="#94a3b8" />
              </View>
              <Text style={styles.emptyTitle}>No loan entries found</Text>
              <Text style={styles.emptySubtitle}>
                {filter !== 'all'
                  ? `No ${filter} loans match your search or filter.`
                  : 'Start tracking money lent to friends by adding your first entry.'}
              </Text>
              {filter === 'all' && (
                <TouchableOpacity
                  style={styles.emptyAddBtn}
                  onPress={() => setIsAddModalOpen(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add" size={18} color="#ffffff" />
                  <Text style={styles.emptyAddBtnText}>Add First Loan</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4f46e5" />
            </View>
          )
        }
        contentContainerStyle={styles.listContent}
      />

      {/* Floating Add Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setIsAddModalOpen(true)}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={26} color="#ffffff" />
        <Text style={styles.fabText}>Add Loan</Text>
      </TouchableOpacity>

      {/* Add Loan Modal Form */}
      <AddLoanModal
        visible={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onLoanCreated={() => {
          fetchData(false);
        }}
      />

      {/* Receipt Photo Modal Viewer */}
      <ReceiptModal
        visible={Boolean(selectedReceiptUrl)}
        receiptUrl={selectedReceiptUrl}
        onClose={() => setSelectedReceiptUrl(null)}
      />

      {/* API Endpoint Config Modal */}
      <Modal visible={isSettingsOpen} transparent animationType="fade">
        <View style={styles.settingsOverlay}>
          <View style={styles.settingsCard}>
            <View style={styles.settingsHeader}>
              <Text style={styles.settingsTitle}>Backend Server Config</Text>
              <TouchableOpacity onPress={() => setIsSettingsOpen(false)}>
                <Ionicons name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>
            <Text style={styles.settingsDesc}>
              Configure the MiniLedger backend URL. If running Expo on a physical phone, set
              this to your computer's LAN IP (e.g. http://192.168.1.5:5000/api).
            </Text>
            <TextInput
              style={styles.settingsInput}
              value={customApiUrl}
              onChangeText={setCustomApiUrl}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.settingsActions}>
              <TouchableOpacity
                style={styles.settingsCancel}
                onPress={() => setIsSettingsOpen(false)}
              >
                <Text style={styles.settingsCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.settingsSave} onPress={handleSaveApiUrl}>
                <Text style={styles.settingsSaveText}>Save & Connect</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  listContent: {
    paddingBottom: 90,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginTop: 6,
    marginBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
  },
  filtersRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterTabActive: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
  },
  filterTabOverdueAlert: {
    borderColor: '#fca5a5',
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  filterTabTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  filterTextOverdue: {
    color: '#dc2626',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#4f46e5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 18,
  },
  emptyAddBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  loadingContainer: {
    paddingVertical: 50,
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#4f46e5',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 30,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  fabText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  settingsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  settingsCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
  },
  settingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  settingsTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
  },
  settingsDesc: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 14,
  },
  settingsInput: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
    marginBottom: 16,
  },
  settingsActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  settingsCancel: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  settingsCancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  settingsSave: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  settingsSaveText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
});
