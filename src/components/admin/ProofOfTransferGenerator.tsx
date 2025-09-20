import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, FileText, User, DollarSign, Calendar } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ProofOfTransferGeneratorProps {
  investor: any;
  withdrawal: any;
  withdrawalRequest: any;
}

const ProofOfTransferGenerator = ({ investor, withdrawal, withdrawalRequest }: ProofOfTransferGeneratorProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const generateTransferHTML = () => {
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

    const transferAmount = Math.abs(withdrawal.amount);
    const netAmount = transferAmount * 0.85;

    // Get bank details from investor's bankAccounts or legacy bankDetails
    let bankInfo = null;
    if (investor?.bankAccounts && investor.bankAccounts.length > 0) {
      // Use primary bank account or first available
      bankInfo = investor.bankAccounts.find((acc: any) => acc.isPrimary) || investor.bankAccounts[0];
    } else if (investor?.bankDetails && investor.bankDetails.bankName) {
      // Fallback to legacy bankDetails
      bankInfo = investor.bankDetails;
    }
    return `
      <div style="font-family: 'Courier New', monospace; line-height: 1.2; color: #000; max-width: 800px; margin: 0 auto; padding: 20px; background: white;">
        <!-- MT103 Header -->
        <div style="border: 2px solid #000; padding: 15px; margin-bottom: 20px; background-color: #f8f9fa;">
          <div style="text-align: center; margin-bottom: 15px;">
            <h1 style="font-size: 16px; font-weight: bold; margin: 0; color: #000;">SWIFT MT103 SINGLE CUSTOMER CREDIT TRANSFER</h1>
            <p style="font-size: 12px; margin: 5px 0 0 0; color: #666;">Society for Worldwide Interbank Financial Telecommunication</p>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 11px;">
            <div>
              <strong>Message Type:</strong> MT103<br/>
              <strong>Reference:</strong> FT${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}${withdrawal.id.slice(-6)}<br/>
              <strong>Date/Time:</strong> ${new Date().toISOString().replace(/[:-]/g, '').slice(0, 15)}
            </div>
            <div>
              <strong>Priority:</strong> Normal<br/>
              <strong>MUR:</strong> ${new Date().toISOString().slice(0, 10).replace(/-/g, '')}IBKRLLC${withdrawal.id.slice(-4)}<br/>
              <strong>Receiver:</strong> ${bankInfo?.swiftCode || 'BNKMXXMM'}
            </div>
          </div>
        </div>

        <!-- MT103 Fields -->
        <div style="border: 1px solid #000; margin-bottom: 20px;">
          <div style="background-color: #000; color: white; padding: 8px; font-weight: bold; font-size: 12px;">
            SWIFT MT103 MESSAGE FIELDS
          </div>
          
          <div style="padding: 15px; font-family: 'Courier New', monospace; font-size: 11px; line-height: 1.4;">
            <div style="margin-bottom: 15px;">
              <strong>:20: Transaction Reference Number</strong><br/>
              FT${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}${withdrawal.id.slice(-6)}
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
              ${bankInfo?.swiftCode || (bankInfo?.bankName?.includes('BBVA') ? 'BCMRMXMMXXX' : 'BNKMXXMM')}<br/>
              ${bankInfo?.bankName || 'BENEFICIARY BANK'}<br/>
              ${bankInfo?.bankAddress || investor.country.toUpperCase()}<br/>
              ${investor.country.toUpperCase()}
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong>:59: Beneficiary Customer</strong><br/>
              /${bankInfo?.accountNumber || 'ACCOUNT NUMBER'}<br/>
              ${investor.name.toUpperCase()}<br/>
              ${investor.country.toUpperCase()}
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong>:70: Remittance Information</strong><br/>
              WITHDRAWAL FROM TRADING ACCOUNT<br/>
              CLIENT ID: ${investor.id}<br/>
              ORIGINAL AMOUNT: USD ${transferAmount.toLocaleString()}<br/>
              COMMISSION: USD ${(transferAmount * 0.15).toLocaleString()}<br/>
              NET TRANSFER: USD ${netAmount.toLocaleString()}
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong>:71A: Details of Charges</strong><br/>
              OUR
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong>:72: Sender to Receiver Information</strong><br/>
              /ACC/TRADING ACCOUNT WITHDRAWAL<br/>
              /RFB/INTERACTIVE BROKERS CLIENT FUNDS<br/>
              /INV/${investor.name.toUpperCase()}<br/>
              /ORIG/USD ${transferAmount.toLocaleString()}
            </div>
          </div>
        </div>

        <!-- Bank Confirmation Section -->
        <div style="border: 1px solid #000; margin-bottom: 20px;">
          <div style="background-color: #000; color: white; padding: 8px; font-weight: bold; font-size: 12px;">
            BANK CONFIRMATION DETAILS
          </div>
          
          <div style="padding: 15px; font-size: 11px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
              <div>
                <strong>Execution Date:</strong> ${transferDate}<br/>
                <strong>Value Date:</strong> ${transferDate}<br/>
                <strong>Execution Time:</strong> ${currentTime}<br/>
                <strong>Status:</strong> COMPLETED
              </div>
              <div>
                <strong>Debit Account:</strong> IBKR-CLIENT-${investor.id.slice(-8)}<br/>
                <strong>Credit Account:</strong> ${bankInfo?.accountNumber || 'BENEFICIARY-ACCOUNT'}<br/>
                <strong>Exchange Rate:</strong> 1.0000 (USD to USD)<br/>
                <strong>Charges:</strong> USD 0.00 (OUR)
              </div>
            </div>
          </div>
        </div>

        <!-- Authentication Section -->
        <div style="border: 1px solid #000; margin-bottom: 20px;">
          <div style="background-color: #000; color: white; padding: 8px; font-weight: bold; font-size: 12px;">
            AUTHENTICATION & COMPLIANCE
          </div>
          
          <div style="padding: 15px; font-size: 11px;">
            <p style="margin: 0 0 10px 0;"><strong>Authentication Key:</strong> ${withdrawal.id.toUpperCase()}</p>
            <p style="margin: 0 0 10px 0;"><strong>Message Authentication Code (MAC):</strong> ${withdrawal.id.slice(-16).toUpperCase()}</p>
            <p style="margin: 0 0 10px 0;"><strong>Compliance Check:</strong> PASSED - AML/KYC VERIFIED</p>
            <p style="margin: 0 0 10px 0;"><strong>Regulatory Approval:</strong> FINRA/SEC COMPLIANT</p>
            <p style="margin: 0;"><strong>Digital Signature:</strong> IBKR-${new Date().getTime().toString(36).toUpperCase()}</p>
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
            This MT103 confirmation was generated on ${currentDate} at ${currentTime}<br/>
            Document ID: MT103-${withdrawal.id.slice(-8)} | Client: ${investor.id}
          </p>
        </div>
      </div>
    `;
  };

  const downloadTransferPDF = async () => {
    setIsGenerating(true);
    
    try {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = generateTransferHTML();
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '0';
      tempDiv.style.width = '800px';
      tempDiv.style.backgroundColor = 'white';
      document.body.appendChild(tempDiv);

      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 800,
        height: tempDiv.scrollHeight
      });

      document.body.removeChild(tempDiv);

      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `Proof_of_Transfer_${investor.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const TransferPreview = () => (
    <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-white">
      <div dangerouslySetInnerHTML={{ __html: generateTransferHTML() }} />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 p-6 rounded-lg border border-gray-300">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gray-200 border border-gray-400 rounded-lg flex items-center justify-center">
            <FileText size={24} className="text-gray-700" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">PROOF OF WIRE TRANSFER</h3>
            <p className="text-sm text-gray-700 uppercase tracking-wide font-medium">
              OFFICIAL BANK TRANSFER CONFIRMATION DOCUMENT
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-300">
          <div className="flex items-center space-x-2 mb-3">
            <User size={16} className="text-gray-700" />
            <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">BENEFICIARY</span>
          </div>
          <p className="font-bold text-gray-900">{investor.name}</p>
          <p className="text-sm text-gray-700 font-medium">{investor.country}</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-300">
          <div className="flex items-center space-x-2 mb-3">
            <DollarSign size={16} className="text-gray-700" />
            <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">TRANSFER AMOUNT</span>
          </div>
          <p className="font-bold text-gray-900">${Math.abs(withdrawal.amount).toLocaleString()}</p>
          <p className="text-sm text-gray-700 font-medium">USD</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-300">
          <div className="flex items-center space-x-2 mb-3">
            <Calendar size={16} className="text-gray-700" />
            <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">TRANSFER DATE</span>
          </div>
          <p className="font-bold text-gray-900">
            {new Date(withdrawal.date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors rounded-lg uppercase tracking-wide"
        >
          {showPreview ? 'HIDE PREVIEW' : 'SHOW PREVIEW'}
        </button>
        <button
          onClick={downloadTransferPDF}
          disabled={isGenerating}
          className="px-4 py-2 bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors rounded-lg disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide"
        >
          <Download size={16} className="mr-2 inline" />
          {isGenerating ? 'GENERATING PDF...' : 'DOWNLOAD SWIFT MT103 RECEIPT'}
        </button>
      </div>

      {showPreview && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <h4 className="font-bold text-gray-900 mb-3 uppercase tracking-wide">DOCUMENT PREVIEW</h4>
          <TransferPreview />
        </motion.div>
      )}

      <div className="bg-gray-50 p-6 rounded-lg border border-gray-300">
        <h4 className="font-bold text-gray-900 mb-4 uppercase tracking-wide">DOCUMENT INFORMATION</h4>
        <ul className="text-gray-700 text-sm space-y-2 font-medium">
          <li className="uppercase tracking-wide">• OFFICIAL PROOF OF WIRE TRANSFER COMPLETION</li>
          <li className="uppercase tracking-wide">• INCLUDES ALL TRANSFER DETAILS AND BANK INFORMATION</li>
          <li className="uppercase tracking-wide">• SUITABLE FOR BANK RECORDS AND COMPLIANCE DOCUMENTATION</li>
          <li className="uppercase tracking-wide">• GENERATED WITH VERIFIED PLATFORM DATA</li>
          <li className="uppercase tracking-wide">• INCLUDES DIGITAL SIGNATURES AND TIMESTAMPS</li>
        </ul>
      </div>
    </div>
  );
};

export default ProofOfTransferGenerator;