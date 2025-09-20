import React from 'react';
import Modal from '../common/Modal';
import ProWithdrawalMethods from '../investor/ProWithdrawalMethods';
import { Investor } from '../../types/user';

interface TestProWithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TestProWithdrawalModal: React.FC<TestProWithdrawalModalProps> = ({ isOpen, onClose }) => {
  // Dummy investor data for testing purposes
  const dummyInvestor: Investor = {
    id: 'test-pro-investor-123',
    name: 'Test Pro User',
    email: 'test@prouser.com',
    phone: '123-456-7890',
    country: 'United States', // Or any country with bank data defined in ProWithdrawalMethods
    location: 'Test City',
    joinDate: '2023-01-01',
    initialDeposit: 10000,
    currentBalance: 50000, // Set a balance for testing withdrawals
    role: 'investor',
    isActive: true,
    accountType: 'Pro', // Crucial for testing Pro methods
    createdAt: new Date(),
    updatedAt: new Date(),
    // Add dummy bank accounts if needed for bank transfer testing
    bankAccounts: [
      {
        id: 'dummy-bank-1',
        bankName: 'Test Bank USA',
        accountHolderName: 'Test Pro User',
        accountNumber: '1234567890',
        iban: 'US12345678901234567890',
        swiftCode: 'TESTUS33',
        currency: 'USD',
        country: 'United States',
        isVerified: true,
        isPrimary: true,
        createdAt: new Date(),
        verificationStatus: 'approved',
      },
    ],
  };

  const handleSuccess = () => {
    alert('Test Withdrawal Submitted Successfully!');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="TEST PRO WITHDRAWAL MODAL"
      size="lg"
    >
      <div className="bg-red-100 border border-red-400 text-red-800 p-3 mb-4 text-center font-bold uppercase">
        THIS IS A TEST MODAL - FOR DEBUGGING ONLY
      </div>
      <ProWithdrawalMethods
        investor={dummyInvestor}
        currentBalance={dummyInvestor.currentBalance}
        onSuccess={handleSuccess}
        onCancel={onClose}
      />
    </Modal>
  );
};

export default TestProWithdrawalModal;
