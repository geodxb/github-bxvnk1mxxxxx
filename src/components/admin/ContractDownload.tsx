import { useState } from 'react';
import { motion } from 'framer-motion';
import Button from '../common/Button';
import { Investor } from '../../types/user';
import { Download, FileText, Calendar, User } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ContractDownloadProps {
  investor: Investor;
}

const ContractDownload = ({ investor }: ContractDownloadProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const generateContractHTML = () => {
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 40px;">
        <!-- Logo at top left -->
        <div style="margin-bottom: 20px;">
          <img src="/Screenshot 2025-06-07 024813.png" alt="Interactive Brokers" style="height: 40px; width: auto; object-fit: contain;" />
        </div>
        
        <!-- Title section -->
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 10px; color: #1a1a1a;">
            INVESTMENT AND OPERATION AGREEMENT
          </h1>
          <div style="width: 100px; height: 3px; background-color: #2563eb; margin: 20px auto;"></div>
        </div>

        <div style="margin-bottom: 30px;">
          <p style="margin-bottom: 15px;">
            This Investment and Operation Agreement ("Agreement") is entered into on the date of signature by and between:
          </p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
            <p style="margin-bottom: 10px;">
              <strong>Trader:</strong> Cristian Rolando Dorao, residing at Le Park II, Villa No. 9, Jumeirah Village Circle, Dubai, hereinafter referred to as the "Trader".
            </p>
            
            <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
              <h3 style="color: #2563eb; margin-bottom: 15px; font-size: 16px;">Investor Data:</h3>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div>
                  <p><strong>Name:</strong> ${investor.name}</p>
                  <p><strong>Email:</strong> ${investor.email || 'Not provided'}</p>
                  <p><strong>Phone:</strong> ${investor.phone || 'Not provided'}</p>
                </div>
                <div>
                  <p><strong>Country:</strong> ${investor.country}</p>
                  <p><strong>Location:</strong> ${investor.location || 'Not specified'}</p>
                  <p><strong>Account Type:</strong> ${investor.accountType || 'Standard'}</p>
                </div>
              </div>
              <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
                <p><strong>Initial Deposit:</strong> $${investor.initialDeposit.toLocaleString()} USD</p>
                <p><strong>Join Date:</strong> ${new Date(investor.joinDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p><strong>Current Balance:</strong> $${investor.currentBalance.toLocaleString()} USD</p>
              </div>
            </div>
          </div>
        </div>

        <h2 style="color: #1a1a1a; font-size: 18px; margin-top: 30px; margin-bottom: 15px;">Considerations</h2>
        <div style="margin-bottom: 20px;">
          <p>The Trader operates a portfolio using the capital provided by the Investor to trade in the Forex and cryptocurrency markets.</p>
          <p>The Trader uses InteractiveBrokers, a highly regulated trading platform, to execute trades.</p>
          <p>The Investor agrees to provide the funds and comply with the terms and conditions set forth in this document.</p>
          <p>By virtue of the following clauses and mutual agreements, the parties agree as follows:</p>
        </div>

        <h2 style="color: #1a1a1a; font-size: 18px; margin-top: 30px; margin-bottom: 15px;">1. Definitions</h2>
        <div style="margin-bottom: 20px;">
          <p><strong>1.1 Minimum Investment:</strong> USD 1,000 or its equivalent in Mexican Pesos.</p>
          <p><strong>1.2 Trading Instruments:</strong></p>
          <ul style="margin-left: 20px;">
            <li>Forex: Gold/USD (XAUUSD) and major currency pairs.</li>
            <li>Cryptocurrencies: Bitcoin (BTC), Ethereum (ETH), and other major cryptocurrencies.</li>
          </ul>
          <p><strong>1.3 Trading Strategy:</strong> The Trader employs fundamental analysis, trend analysis, and liquidity swaps to identify trading opportunities.</p>
        </div>

        <h2 style="color: #1a1a1a; font-size: 18px; margin-top: 30px; margin-bottom: 15px;">2. Investment Period</h2>
        <div style="margin-bottom: 20px;">
          <p><strong>2.1 Cryptocurrency Trading:</strong> Operated for 30 calendar days.</p>
          <p><strong>2.2 Forex Trading:</strong> Operated for 20 business days.</p>
          <p><strong>2.3</strong> The Investor may request withdrawals in accordance with Section 5.</p>
        </div>

        <h2 style="color: #1a1a1a; font-size: 18px; margin-top: 30px; margin-bottom: 15px;">3. Obligations of the Investor</h2>
        <div style="margin-bottom: 20px;">
          <p><strong>3.1</strong> The Investor must provide valid documentation and undergo thorough verification to comply with anti-fraud and anti-money laundering regulations.</p>
          <p><strong>3.2</strong> The Investor agrees to transfer a minimum of USD 1,000 or its equivalent in Mexican Pesos to the Trader's account for trading purposes.</p>
          <p><strong>3.3</strong> The Trader guarantees that the initial investment amount will remain safe during the term of the contract. If the Trader, by error or misconduct, executes orders without due caution or proper analysis resulting in losses, the Investor shall have the right to revoke the contract. In the event of revocation, the Trader must return the full initial investment amount to the Investor without deduction of losses.</p>
        </div>

        <h2 style="color: #1a1a1a; font-size: 18px; margin-top: 30px; margin-bottom: 15px;">4. Trader's Compensation</h2>
        <div style="margin-bottom: 20px;">
          <p><strong>4.1</strong> The Trader is entitled to 15% of the net profits generated through trading, as regulated by InteractiveBrokers.</p>
          <p><strong>4.2</strong> No additional fees or charges shall be applied to the Investor by the Trader.</p>
          <p><strong>4.3</strong> Any request by the Trader for an additional percentage must be documented and immediately reported to InteractiveBrokers support.</p>
        </div>

        <h2 style="color: #1a1a1a; font-size: 18px; margin-top: 30px; margin-bottom: 15px;">5. Withdrawals</h2>
        <div style="margin-bottom: 20px;">
          <p><strong>5.1 Monthly Withdrawals:</strong> The Investor may withdraw profits monthly while maintaining the minimum deposit of USD 1,000.</p>
          <p><strong>5.2 Full Balance Withdrawal:</strong></p>
          <ul style="margin-left: 20px;">
            <li>The Investor must follow the account closure process, which may take up to 60 calendar days.</li>
            <li>After account closure, the Investor may not open a new account for 90 days.</li>
          </ul>
          <p><strong>5.3</strong> Withdrawals must be made to a bank account matching the name and address provided at registration.</p>
          <p><strong>5.4</strong> Any change in citizenship or address of the Investor must be immediately reported to the Trader and to InteractiveBrokers.</p>
        </div>

        <h2 style="color: #1a1a1a; font-size: 18px; margin-top: 30px; margin-bottom: 15px;">6. Term and Termination</h2>
        <div style="margin-bottom: 20px;">
          <p><strong>6.1</strong> This Agreement has no fixed term and shall remain in effect until terminated by mutual agreement or as follows:</p>
          <ul style="margin-left: 20px;">
            <li><strong>By the Investor:</strong> Through written notice and completion of the withdrawal process.</li>
            <li><strong>By the Trader:</strong> Through written notice, subject to fulfilling his obligations under this Agreement.</li>
          </ul>
        </div>

        <h2 style="color: #1a1a1a; font-size: 18px; margin-top: 30px; margin-bottom: 15px;">7. Regulatory Compliance</h2>
        <div style="margin-bottom: 20px;">
          <p><strong>7.1</strong> This Agreement is governed by the laws of the UAE.</p>
          <p><strong>7.2</strong> Both parties agree to comply with applicable laws, including anti-money laundering and fraud regulations.</p>
        </div>

        <h2 style="color: #1a1a1a; font-size: 18px; margin-top: 30px; margin-bottom: 15px;">8. Representations and Warranties</h2>
        <div style="margin-bottom: 20px;">
          <p><strong>8.1 Investor's Representations:</strong></p>
          <ul style="margin-left: 20px;">
            <li>The Investor possesses the necessary funds and understands the risks associated with Forex and cryptocurrency trading.</li>
            <li>The Investor acknowledges that profits are not guaranteed.</li>
          </ul>
          <p><strong>8.2 Trader's Representations:</strong></p>
          <ul style="margin-left: 20px;">
            <li>The Trader will execute trades professionally and diligently.</li>
            <li>The Trader will not request compensation beyond the agreed profit percentage.</li>
          </ul>
        </div>

        <h2 style="color: #1a1a1a; font-size: 18px; margin-top: 30px; margin-bottom: 15px;">9. Indemnification and Liability</h2>
        <div style="margin-bottom: 20px;">
          <p><strong>9.1</strong> The Trader shall not be liable for losses arising from market fluctuations or unforeseen economic events.</p>
          <p><strong>9.2</strong> The Investor agrees to indemnify the Trader against any claim, liability, or damage arising from the Investor's breach of this Agreement.</p>
        </div>

        <h2 style="color: #1a1a1a; font-size: 18px; margin-top: 30px; margin-bottom: 15px;">10. Dispute Resolution</h2>
        <div style="margin-bottom: 20px;">
          <p><strong>10.1</strong> Any dispute arising from this Agreement shall be resolved amicably.</p>
          <p><strong>10.2</strong> If unresolved, the dispute shall be submitted to arbitration under UAE law.</p>
          <p><strong>10.3</strong> The parties expressly and irrevocably agree to submit to the jurisdiction of the competent courts of the United Arab Emirates, city of Dubai, UAE, expressly waiving any other jurisdiction that may correspond to them due to their present or future domicile or the location of their assets.</p>
        </div>

        <h2 style="color: #1a1a1a; font-size: 18px; margin-top: 30px; margin-bottom: 15px;">11. Execution and Validation</h2>
        <div style="margin-bottom: 20px;">
          <p><strong>11.1</strong> This Agreement enters into force once signed by both parties and validated by InteractiveBrokers.</p>
        </div>

        <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 30px 0;">
          <p style="margin: 0; font-weight: 500;">
            <strong>Notice:</strong> Withdrawal processing times are subject to various factors such as currency type, Investor's country, and banking institutions. Times are relative and subject to modification by the broker.
          </p>
        </div>

        <h2 style="color: #1a1a1a; font-size: 18px; margin-top: 40px; margin-bottom: 20px;">Signatures</h2>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 30px;">
          <div>
            <p><strong>Trader:</strong></p>
            <p>Name: Cristian Rolando Dorao</p>
            <p>Signature: ______________________</p>
            <p>Date: ${new Date(investor.joinDate).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</p>
          </div>
          <div>
            <p><strong>Investor:</strong></p>
            <p>Name: ${investor.name}</p>
            <p>Signature: ______________________</p>
            <p>Date: ${new Date(investor.joinDate).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</p>
          </div>
        </div>

        <!-- Logo at bottom center below signatures -->
        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <img src="/Screenshot 2025-06-07 024813.png" alt="Interactive Brokers" style="height: 40px; width: auto; object-fit: contain; margin-bottom: 20px;" />
        </div>

        <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center;">
          <p style="font-size: 12px; color: #6b7280;">
            This agreement was generated on ${currentDate} for ${investor.name} (ID: ${investor.id})<br/>
            Original agreement date: ${new Date(investor.joinDate).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
      </div>
    `;
  };

  const downloadContractPDF = async () => {
    setIsGenerating(true);
    
    try {
      // Create a temporary div with the contract content
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = generateContractHTML();
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
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
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
      const fileName = `Investment_Agreement_${investor.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const ContractPreview = () => (
    <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-white">
      <div dangerouslySetInnerHTML={{ __html: generateContractHTML() }} />
    </div>
  );

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText size={20} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Investment Agreement</h3>
              <p className="text-sm text-gray-600">Download the signed contract for this investor</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? 'Hide Preview' : 'Preview Contract'}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={downloadContractPDF}
              isLoading={isGenerating}
              disabled={isGenerating}
            >
              <Download size={16} className="mr-2" />
              {isGenerating ? 'Generating PDF...' : 'Download PDF'}
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Contract Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <div className="flex items-center space-x-2 mb-2">
              <User size={16} className="text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Investor</span>
            </div>
            <p className="font-semibold text-gray-900">{investor.name}</p>
            <p className="text-sm text-gray-600">{investor.country}</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <div className="flex items-center space-x-2 mb-2">
              <Calendar size={16} className="text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Agreement Date</span>
            </div>
            <p className="font-semibold text-gray-900">
              {new Date(investor.joinDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <div className="flex items-center space-x-2 mb-2">
              <FileText size={16} className="text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Contract Status</span>
            </div>
            {(() => {
              const accountStatus = investor.accountStatus || 'Active';
              
              if (accountStatus.toLowerCase().includes('closed') || 
                  accountStatus.toLowerCase().includes('deletion')) {
                return (
                  <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium">
                    Contract Ended
                  </span>
                );
              } else if (accountStatus.toLowerCase().includes('restricted') || 
                         accountStatus.toLowerCase().includes('policy violation')) {
                return (
                  <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full font-medium">
                    Contract Restricted
                  </span>
                );
              } else {
                return (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                    Active Agreement
                  </span>
                );
              }
            })()}
          </div>
        </div>

        {/* Contract Preview */}
        {showPreview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
          >
            <h4 className="font-medium text-gray-800 mb-3">Contract Preview</h4>
            <ContractPreview />
          </motion.div>
        )}

        {/* Download Information */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-800 mb-2">Download Information</h4>
          <ul className="text-blue-700 text-sm space-y-1">
            <li>• PDF includes all investor data auto-filled in the agreement</li>
            <li>• Contract is formatted for printing and legal documentation</li>
            <li>• File name includes investor name and current date</li>
            <li>• Generated document is suitable for record keeping and compliance</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ContractDownload;