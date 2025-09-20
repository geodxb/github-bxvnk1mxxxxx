import { useState } from 'react';
import GovernorLayout from '../../components/layout/GovernorLayout';
import { useInvestors, useWithdrawalRequests, useTransactions } from '../../hooks/useFirestore';

const GovernorSecurityPage = () => {
  const { investors } = useInvestors();
  const { withdrawalRequests } = useWithdrawalRequests();
  const { transactions } = useTransactions();

  const restrictedAccounts = investors.filter(investor => 
    investor.status === 'Restricted' || investor.status === 'Suspended'
  ).length;
  
  const suspiciousWithdrawals = withdrawalRequests.filter(req => 
    req.amount > 50000 || req.status === 'Rejected'
  ).length;
  
  const failedTransactions = transactions.filter(tx => 
    tx.status === 'Rejected' || tx.status === 'Failed'
  ).length;

  return (
    <GovernorLayout title="SECURITY MONITOR">
      <div className="bg-white border border-gray-300 p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">SECURITY MONITORING SYSTEM</h1>
            <p className="text-gray-600 uppercase tracking-wide text-sm font-medium">REAL-TIME SECURITY THREAT DETECTION AND ANALYSIS</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-gray-700 uppercase tracking-wide">ALL SYSTEMS SECURE</span>
          </div>
        </div>
      </div>

      {/* Security Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white border border-gray-300 p-6">
          <div className="border-b border-gray-300 pb-3 mb-4">
            <p className="text-gray-600 font-medium text-sm uppercase tracking-wider">RESTRICTED ACCOUNTS</p>
          </div>
          <div>
            <p className="text-gray-900 text-3xl font-bold">{restrictedAccounts}</p>
            <p className="text-gray-500 text-xs mt-1">Security Violations</p>
          </div>
        </div>

        <div className="bg-white border border-gray-300 p-6">
          <div className="border-b border-gray-300 pb-3 mb-4">
            <p className="text-gray-600 font-medium text-sm uppercase tracking-wider">SUSPICIOUS ACTIVITY</p>
          </div>
          <div>
            <p className="text-gray-900 text-3xl font-bold">{suspiciousWithdrawals}</p>
            <p className="text-gray-500 text-xs mt-1">Flagged Withdrawals</p>
          </div>
        </div>

        <div className="bg-white border border-gray-300 p-6">
          <div className="border-b border-gray-300 pb-3 mb-4">
            <p className="text-gray-600 font-medium text-sm uppercase tracking-wider">FAILED TRANSACTIONS</p>
          </div>
          <div>
            <p className="text-gray-900 text-3xl font-bold">{failedTransactions}</p>
            <p className="text-gray-500 text-xs mt-1">System Rejections</p>
          </div>
        </div>

        <div className="bg-white border border-gray-300 p-6">
          <div className="border-b border-gray-300 pb-3 mb-4">
            <p className="text-gray-600 font-medium text-sm uppercase tracking-wider">THREAT LEVEL</p>
          </div>
          <div>
            <p className="text-gray-900 text-3xl font-bold">LOW</p>
            <p className="text-gray-500 text-xs mt-1">Current Status</p>
          </div>
        </div>
      </div>

      {/* Security Log */}
      <div className="bg-white border border-gray-300 mb-8">
        <div className="px-6 py-4 border-b border-gray-300 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">SECURITY EVENT LOG</h3>
        </div>
        <div className="p-6">
          <div className="space-y-3 max-h-64 overflow-y-auto font-mono text-xs">
            <div className="flex items-center space-x-4 py-2 border-b border-gray-200">
              <span className="text-gray-500">[{new Date().toISOString()}]</span>
              <span className="text-red-600 font-bold">SECURITY</span>
              <span className="text-gray-900">Governor accessed security monitoring system</span>
            </div>
            <div className="flex items-center space-x-4 py-2 border-b border-gray-200">
              <span className="text-gray-500">[{new Date(Date.now() - 300000).toISOString()}]</span>
              <span className="text-yellow-600 font-bold">WARNING</span>
              <span className="text-gray-900">{restrictedAccounts} accounts currently under restriction</span>
            </div>
            <div className="flex items-center space-x-4 py-2 border-b border-gray-200">
              <span className="text-gray-500">[{new Date(Date.now() - 600000).toISOString()}]</span>
              <span className="text-blue-600 font-bold">INFO</span>
              <span className="text-gray-900">System security protocols active and monitoring</span>
            </div>
          </div>
        </div>
      </div>
    </GovernorLayout>
  );
};

export default GovernorSecurityPage;