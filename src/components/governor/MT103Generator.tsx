import { useState } from 'react';
import { motion } from 'framer-motion';
import Button from '../common/Button';
import { GovernorService } from '../../services/governorService';
import { useAuth } from '../../contexts/AuthContext';
import { useWithdrawalRequests, useInvestors } from '../../hooks/useFirestore';
import { Download, FileText, Building, DollarSign, Calendar } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const MT103Generator = () => {
  const { user } = useAuth();
  const { withdrawalRequests } = useWithdrawalRequests();
  const { investors } = useInvestors();
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Filter approved/credited withdrawals
  const eligibleWithdrawals = withdrawalRequests.filter(req => 
    req.status === 'Approved' || req.status === 'Credited'
  );

  const getInvestorDetails = (investorId: string) => {
    return investors.find(inv => inv.id === investorId);
  };

  const generateMT103HTML = (withdrawal: any, investor: any) => {
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const currentTime = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const transferDate = new Date(withdrawal.date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const transferAmount = withdrawal.amount;
    const transactionRef = `MT103${Date.now()}${withdrawal.id.slice(-6)}`;

    // Get bank details
    const bankInfo = investor?.bankDetails || investor?.bankAccounts?.[0] || {};

    return `
      <div style="font-family: 'Courier New', monospace; line-height: 1.2; color: #000; max-width: 800px; margin: 0 auto; padding: 20px; background: white;">
        <!-- SWIFT MT103 Header -->
        <div style="border: 2px solid #000; padding: 15px; margin-bottom: 20px; background-color: #f8f9fa;">
          <div style="text-align: center; margin-bottom: 15px;">
            <img src="/Screenshot 2025-06-07 024813.png" alt="Interactive Brokers" style="height: 40px; width: auto; object-fit: contain; margin-bottom: 10px;" />
            <h1 style="font-size: 16px; font-weight: bold; margin: 0; color: #000;">SWIFT MT103 SINGLE CUSTOMER CREDIT TRANSFER</h1>
            <p style="font-size: 12px; margin: 5px 0 0 0; color: #666;">GOVERNOR AUTHORIZED WIRE TRANSFER</p>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 11px;">
            <div>
              <strong>Message Type:</strong> MT103<br/>
              <strong>Reference:</strong> ${transactionRef}<br/>
              <strong>Date/Time:</strong> ${new Date().toISOString().replace(/[:-]/g, '').slice(0, 15)}
            </div>
            <div>
              <strong>Priority:</strong> GOVERNOR OVERRIDE<br/>
              <strong>MUR:</strong> ${new Date().toISOString().slice(0, 10).replace(/-/g, '')}IBKRLLC${withdrawal.id.slice(-4)}<br/>
              <strong>Receiver:</strong> ${bankInfo.swiftCode || 'BNKMXXMM'}
            </div>
          </div>
        </div>

        <!-- MT103 Fields -->
        <div style="border: 1px solid #000; margin-bottom: 20px;">
          <div style="background-color: #000; color: white; padding: 8px; font-weight: bold; font-size: 12px;">
            SWIFT MT103 MESSAGE FIELDS - GOVERNOR AUTHORIZED
          </div>
          
          <div style="padding: 15px; font-family: 'Courier New', monospace; font-size: 11px; line-height: 1.4;">
            <div style="margin-bottom: 15px;">
              <strong>:20: Transaction Reference Number</strong><br/>
              ${transactionRef}
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong>:23B: Bank Operation Code</strong><br/>
              CRED
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong>:32A: Value Date/Currency/Amount</strong><br/>
              ${new Date(withdrawal.date).toISOString().slice(2, 10).replace(/-/g, '')}USD${transferAmount.toFixed(2).replace('.', ',')}
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong>:50K: Ordering Customer</strong><br/>
              INTERACTIVE BROKERS LLC<br/>
              ONE PICKWICK PLAZA<br/>
              GREENWICH, CT 06830<br/>
              UNITED STATES
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong>:52A: Ordering Institution</strong><br/>
              IBKRLLC<br/>
              INTERACTIVE BROKERS LLC<br/>
              GREENWICH, CT, US
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong>:57A: Account With Institution</strong><br/>
              ${bankInfo.swiftCode || 'BNKMXXMM'}<br/>
              ${bankInfo.bankName || 'BENEFICIARY BANK'}<br/>
              ${bankInfo.bankAddress || investor.country}<br/>
              ${investor.country.toUpperCase()}
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong>:59: Beneficiary Customer</strong><br/>
              /${bankInfo.accountNumber || 'ACCOUNT NUMBER'}<br/>
              ${investor.name.toUpperCase()}<br/>
              ${investor.country.toUpperCase()}
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong>:70: Remittance Information</strong><br/>
              GOVERNOR AUTHORIZED WITHDRAWAL<br/>
              CLIENT ID: ${investor.id}<br/>
              ORIGINAL AMOUNT: USD ${transferAmount.toLocaleString()}<br/>
              COMMISSION: USD ${(transferAmount * 0.15).toLocaleString()}<br/>
              NET TRANSFER: USD ${(transferAmount * 0.85).toLocaleString()}<br/>
              AUTHORIZATION: GOVERNOR OVERRIDE
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong>:71A: Details of Charges</strong><br/>
              OUR
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong>:72: Sender to Receiver Information</strong><br/>
              /GOV/GOVERNOR AUTHORIZED TRANSFER<br/>
              /ACC/TRADING ACCOUNT WITHDRAWAL<br/>
              /RFB/INTERACTIVE BROKERS CLIENT FUNDS<br/>
              /INV/${investor.name.toUpperCase()}<br/>
              /AUTH/GOVERNOR OVERRIDE APPROVAL
            </div>
          </div>
        </div>

        <!-- Governor Authorization Section -->
        <div style="border: 1px solid #000; margin-bottom: 20px;">
          <div style="background-color: #000; color: white; padding: 8px; font-weight: bold; font-size: 12px;">
            GOVERNOR AUTHORIZATION & COMPLIANCE
          </div>
          
          <div style="padding: 15px; font-size: 11px;">
            <p style="margin: 0 0 10px 0;"><strong>Authorization Level:</strong> GOVERNOR SUPREME CONTROL</p>
            <p style="margin: 0 0 10px 0;"><strong>Authorized By:</strong> ${user?.name?.toUpperCase() || 'GOVERNOR'}</p>
            <p style="margin: 0 0 10px 0;"><strong>Authorization Date:</strong> ${currentDate.toUpperCase()}</p>
            <p style="margin: 0 0 10px 0;"><strong>Authorization Time:</strong> ${currentTime}</p>
            <p style="margin: 0 0 10px 0;"><strong>Override Reason:</strong> GOVERNOR DISCRETIONARY APPROVAL</p>
            <p style="margin: 0 0 10px 0;"><strong>Compliance Status:</strong> GOVERNOR OVERRIDE - BYPASSED STANDARD PROCEDURES</p>
            <p style="margin: 0;"><strong>Digital Signature:</strong> GOV-${new Date().getTime().toString(36).toUpperCase()}</p>
          </div>
        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 30px; padding-top: 15px; border-top: 2px solid #000; font-size: 10px; color: #666;">
          <img src="/Screenshot 2025-06-07 024813.png" alt="Interactive Brokers" style="height: 30px; width: auto; object-fit: contain; margin-bottom: 10px;" />
          <p style="margin: 0;">
            <strong>INTERACTIVE BROKERS LLC</strong><br/>
            One Pickwick Plaza, Greenwich, CT 06830, United States<br/>
            Regulated by SEC, FINRA, CFTC | Member SIPC<br/>
            <br/>
            This MT103 was generated under Governor authorization on ${currentDate} at ${currentTime}<br/>
            Document ID: GOV-MT103-${withdrawal.id.slice(-8)} | Authorization: SUPREME CONTROL
          </p>
        </div>
      </div>
    `;
  };

  const downloadMT103PDF = async () => {
    if (!selectedWithdrawal) return;

    setIsGenerating(true);
    
    try {
      const investor = getInvestorDetails(selectedWithdrawal.investorId);
      if (!investor) {
        throw new Error('Investor details not found');
      }

      // Generate MT103 record in database
      await GovernorService.generateMT103(
        selectedWithdrawal.id,
        user?.id || '',
        user?.name || 'Governor'
      );

      // Create temporary div with MT103 content
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = generateMT103HTML(selectedWithdrawal, investor);
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '0';
      tempDiv.style.width = '800px';
      tempDiv.style.backgroundColor = 'white';
      document.body.appendChild(tempDiv);

      // Generate canvas from HTML
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 800,
        height: tempDiv.scrollHeight
      });

      // Remove temporary div
      document.body.removeChild(tempDiv);

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      // Add first page
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Download the PDF
      const fileName = `MT103_Governor_${investor.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error('Error generating MT103:', error);
      alert('Failed to generate MT103 document. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-300 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">MT103 WIRE TRANSFER GENERATOR</h1>
            <p className="text-gray-600 uppercase tracking-wide text-sm font-medium">GOVERNOR AUTHORIZED SWIFT TRANSFER DOCUMENTATION</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-gray-700 uppercase tracking-wide">SWIFT SYSTEM ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Withdrawal Selection */}
      <div className="bg-white border border-gray-300">
        <div className="px-6 py-4 border-b border-gray-300 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">
            ELIGIBLE WITHDRAWALS ({eligibleWithdrawals.length} AVAILABLE)
          </h3>
        </div>
        
        <div className="p-6">
          {eligibleWithdrawals.length > 0 ? (
            <div className="space-y-4">
              {eligibleWithdrawals.map((withdrawal) => {
                const investor = getInvestorDetails(withdrawal.investorId);
                const bankInfo = investor?.bankDetails || investor?.bankAccounts?.[0];

                return (
                  <div key={withdrawal.id} className="bg-gray-50 p-4 border border-gray-300">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-gray-600 text-xs font-bold uppercase tracking-wide">INVESTOR</p>
                            <p className="font-bold text-gray-900 uppercase tracking-wide">{withdrawal.investorName}</p>
                            <p className="text-xs text-gray-500 uppercase tracking-wide">{investor?.country}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 text-xs font-bold uppercase tracking-wide">AMOUNT</p>
                            <p className="font-bold text-gray-900">${withdrawal.amount.toLocaleString()}</p>
                            <p className="text-xs text-gray-500 uppercase tracking-wide">NET: ${(withdrawal.amount * 0.85).toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 text-xs font-bold uppercase tracking-wide">BANK</p>
                            <p className="font-bold text-gray-900">{bankInfo?.bankName || 'BANK INFO MISSING'}</p>
                            <p className="text-xs text-gray-500 uppercase tracking-wide">SWIFT: {bankInfo?.swiftCode || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 text-xs font-bold uppercase tracking-wide">STATUS</p>
                            <span className={`px-2 py-1 text-xs font-bold border uppercase tracking-wide ${
                              withdrawal.status === 'Approved' ? 'bg-green-100 text-green-800 border-green-200' :
                              'bg-blue-100 text-blue-800 border-blue-200'
                            }`}>
                              {withdrawal.status}
                            </span>
                            <p className="text-xs text-gray-500 uppercase tracking-wide">{withdrawal.date}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col space-y-2 ml-4">
                        <button
                          onClick={() => setSelectedWithdrawal(withdrawal)}
                          className="px-4 py-2 bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors uppercase tracking-wide border border-blue-700"
                        >
                          <FileText size={14} className="mr-1 inline" />
                          SELECT
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 border border-gray-300 flex items-center justify-center mx-auto mb-4">
                <FileText size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 uppercase tracking-wide">NO ELIGIBLE WITHDRAWALS</h3>
              <p className="text-gray-500 uppercase tracking-wide text-sm">Only approved or credited withdrawals can generate MT103 documents</p>
            </div>
          )}
        </div>
      </div>

      {/* Selected Withdrawal MT103 Generation */}
      {selectedWithdrawal && (
        <div className="bg-white border border-gray-300">
          <div className="px-6 py-4 border-b border-gray-300 bg-blue-50">
            <h3 className="text-lg font-bold text-blue-900 uppercase tracking-wide">
              MT103 GENERATION - REQUEST #{selectedWithdrawal.id.slice(-8)}
            </h3>
          </div>
          
          <div className="p-6">
            <div className="space-y-6">
              {/* Transfer Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 border border-gray-300">
                  <div className="flex items-center space-x-2 mb-3">
                    <Building size={16} className="text-gray-700" />
                    <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">BENEFICIARY</span>
                  </div>
                  <p className="font-bold text-gray-900">{selectedWithdrawal.investorName}</p>
                  <p className="text-sm text-gray-700 font-medium">{getInvestorDetails(selectedWithdrawal.investorId)?.country}</p>
                </div>
                
                <div className="bg-gray-50 p-4 border border-gray-300">
                  <div className="flex items-center space-x-2 mb-3">
                    <DollarSign size={16} className="text-gray-700" />
                    <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">TRANSFER AMOUNT</span>
                  </div>
                  <p className="font-bold text-gray-900">${selectedWithdrawal.amount.toLocaleString()}</p>
                  <p className="text-sm text-gray-700 font-medium">NET: ${(selectedWithdrawal.amount * 0.85).toLocaleString()}</p>
                </div>
                
                <div className="bg-gray-50 p-4 border border-gray-300">
                  <div className="flex items-center space-x-2 mb-3">
                    <Calendar size={16} className="text-gray-700" />
                    <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">VALUE DATE</span>
                  </div>
                  <p className="font-bold text-gray-900">
                    {new Date(selectedWithdrawal.date).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-700 font-medium">SAME DAY VALUE</p>
                </div>
              </div>

              {/* Preview Toggle */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors uppercase tracking-wide"
                >
                  {showPreview ? 'HIDE PREVIEW' : 'SHOW PREVIEW'}
                </button>
                <button
                  onClick={downloadMT103PDF}
                  disabled={isGenerating}
                  className="px-4 py-2 bg-red-600 text-white font-bold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide border border-red-700"
                >
                  <Download size={16} className="mr-2 inline" />
                  {isGenerating ? 'GENERATING MT103...' : 'GENERATE & DOWNLOAD MT103'}
                </button>
              </div>

              {/* Document Preview */}
              {showPreview && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border border-gray-300"
                >
                  <div className="max-h-96 overflow-y-auto p-4 bg-white">
                    <div dangerouslySetInnerHTML={{ 
                      __html: generateMT103HTML(selectedWithdrawal, getInvestorDetails(selectedWithdrawal.investorId)) 
                    }} />
                  </div>
                </motion.div>
              )}

              {/* Governor Authorization Notice */}
              <div className="bg-red-50 border border-red-300 p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-red-600 mt-0.5"></div>
                  <div>
                    <h4 className="font-bold text-red-800 uppercase tracking-wide">GOVERNOR AUTHORIZATION</h4>
                    <p className="text-red-700 text-sm mt-1 uppercase tracking-wide">
                      This MT103 document will be generated with Governor supreme authorization, 
                      bypassing standard approval procedures. This action will be permanently logged 
                      in the audit trail.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MT103Generator;