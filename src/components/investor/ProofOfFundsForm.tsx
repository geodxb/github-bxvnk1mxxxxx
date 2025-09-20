import { useState } from 'react';
import { motion } from 'framer-motion';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { Investor, Transaction } from '../../types/user';
import { Download, FileText, Calendar, User, Building, DollarSign } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ProofOfFundsFormProps {
  isOpen: boolean;
  onClose: () => void;
  investor: Investor;
  withdrawal: Transaction;
}

const ProofOfFundsForm = ({ isOpen, onClose, investor, withdrawal }: ProofOfFundsFormProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Early return if withdrawal is null or undefined
  if (!withdrawal) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="PROOF OF FUNDS CERTIFICATE"
        size="lg"
      >
        <div className="text-center py-8 bg-gray-50 border border-gray-300 rounded-lg">
          <p className="text-gray-700 font-medium uppercase tracking-wide">COULD NOT LOAD WITHDRAWAL INFORMATION.</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors rounded-lg uppercase tracking-wide"
          >
            CLOSE
          </button>
        </div>
      </Modal>
    );
  }

  const generateFormHTML = () => {
    const currentDate = new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const currentTime = new Date().toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const withdrawalDate = new Date(withdrawal.date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const joinDate = new Date(investor.joinDate).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

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
        <!-- SWIFT Header -->
        <div style="border: 2px solid #000; padding: 15px; margin-bottom: 20px; background-color: #f8f9fa;">
          <div style="text-align: center; margin-bottom: 15px;">
            <h1 style="font-size: 16px; font-weight: bold; margin: 0; color: #000;">CERTIFICADO DE ORIGEN DE FONDOS</h1>
            <p style="font-size: 12px; margin: 5px 0 0 0; color: #666;">Proof of Source of Funds Certificate</p>
            <p style="font-size: 10px; margin: 5px 0 0 0; color: #666;">Interactive Brokers LLC - Regulated Trading Platform</p>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 11px;">
            <div>
              <strong>Document Type:</strong> POF Certificate<br/>
              <strong>Reference:</strong> POF${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}${withdrawal.id.slice(-6)}<br/>
              <strong>Date/Time:</strong> ${new Date().toISOString().replace(/[:-]/g, '').slice(0, 15)}
            </div>
            <div>
              <strong>Priority:</strong> Official<br/>
              <strong>Document ID:</strong> POF-${withdrawal.id.slice(-8)}<br/>
              <strong>Client ID:</strong> ${investor.id}
            </div>
          </div>
        </div>

        <!-- Certificate Fields -->
        <div style="border: 1px solid #000; margin-bottom: 20px;">
          <div style="background-color: #000; color: white; padding: 8px; font-weight: bold; font-size: 12px;">
            CERTIFICADO DE ORIGEN DE FONDOS - CAMPOS OFICIALES
          </div>
          
          <div style="padding: 15px; font-family: 'Courier New', monospace; font-size: 11px; line-height: 1.4;">
            <div style="margin-bottom: 15px;">
              <strong>:20: Número de Referencia de Transacción</strong><br/>
              POF${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}${withdrawal.id.slice(-6)}
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong>:23B: Código de Operación</strong><br/>
              CERT
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong>:32A: Fecha/Moneda/Monto del Retiro</strong><br/>
              ${new Date(withdrawal.date).toISOString().slice(2, 10).replace(/-/g, '')}USD${Math.abs(withdrawal.amount).toFixed(2).replace('.', ',')}
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong>:50K: Cliente Inversionista</strong><br/>
              ${investor.name.toUpperCase()}<br/>
              ID CLIENTE: ${investor.id}<br/>
              ${investor.country.toUpperCase()}<br/>
              FECHA REGISTRO: ${new Date(investor.joinDate).toISOString().slice(2, 10).replace(/-/g, '')}
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong>:52A: Institución Ordenante</strong><br/>
              IBKRLLC<br/>
              INTERACTIVE BROKERS LLC<br/>
              ONE PICKWICK PLAZA<br/>
              GREENWICH, CT 06830, US
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong>:57A: Institución Beneficiaria</strong><br/>
              ${bankInfo?.swiftCode || (bankInfo?.bankName?.includes('BBVA') ? 'BCMRMXMMXXX' : 'BNKMXXMM')}<br/>
              ${bankInfo?.bankName || 'BANCO BENEFICIARIO'}<br/>
              ${bankInfo?.bankAddress || investor.country.toUpperCase()}<br/>
              ${investor.country.toUpperCase()}
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong>:59: Cliente Beneficiario</strong><br/>
              /${bankInfo?.accountNumber || 'NUMERO DE CUENTA'}<br/>
              ${investor.name.toUpperCase()}<br/>
              ${investor.country.toUpperCase()}
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong>:70: Información de Origen de Fondos</strong><br/>
              RETIRO DE CUENTA DE TRADING<br/>
              INVERSION INICIAL: USD ${investor.initialDeposit.toLocaleString()}<br/>
              SALDO ACTUAL: USD ${investor.currentBalance.toLocaleString()}<br/>
              GANANCIA/PERDIDA: USD ${(investor.currentBalance - investor.initialDeposit).toLocaleString()}<br/>
              RENDIMIENTO: ${investor.initialDeposit > 0 ? (((investor.currentBalance - investor.initialDeposit) / investor.initialDeposit) * 100).toFixed(2) : '0.00'}%<br/>
              ORIGEN: ACTIVIDADES DE TRADING LEGITIMAS
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong>:71A: Detalles de Comisiones</strong><br/>
              OUR
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong>:72: Información Adicional</strong><br/>
              /CERT/CERTIFICADO ORIGEN FONDOS<br/>
              /PLAT/INTERACTIVE BROKERS REGULADO<br/>
              /REG/SEC FINRA CFTC COMPLIANT<br/>
              /AML/VERIFICACION ANTI LAVADO COMPLETADA<br/>
              /KYC/CONOCE TU CLIENTE VERIFICADO
            </div>
          </div>
        </div>

        <!-- Declaración Oficial -->
        <div style="border: 1px solid #000; margin-bottom: 20px;">
          <div style="background-color: #000; color: white; padding: 8px; font-weight: bold; font-size: 12px;">
            DECLARACIÓN OFICIAL BAJO JURAMENTO
          </div>
          
          <div style="padding: 15px; font-size: 11px; line-height: 1.4;">
            <p style="margin: 0 0 15px 0; text-align: justify;">
              <strong>YO, ${investor.name.toUpperCase()},</strong> con residencia en <strong>${investor.country.toUpperCase()}</strong>, 
              declaro bajo juramento que los fondos retirados de mi cuenta de trading en Interactive Brokers por un monto de 
              <strong>USD ${Math.abs(withdrawal.amount).toLocaleString()}</strong> el día <strong>${withdrawalDate.toUpperCase()}</strong>, 
              provienen exclusivamente de actividades de trading legítimas realizadas en la plataforma regulada Interactive Brokers LLC.
            </p>
            
            <p style="margin: 0 0 15px 0; text-align: justify;">
              Certifico que mi inversión inicial de <strong>USD ${investor.initialDeposit.toLocaleString()}</strong> 
              depositada el <strong>${joinDate.toUpperCase()}</strong> fue obtenida a través de medios legales y legítimos. 
              Todas las ganancias generadas son resultado de operaciones de trading realizadas bajo mi autorización 
              y supervisión en la plataforma regulada por SEC, FINRA y CFTC.
            </p>
            
            <p style="margin: 0; text-align: justify;">
              Declaro que no he participado en actividades de lavado de dinero, financiamiento del terrorismo, 
              o cualquier otra actividad ilegal. Los fondos retirados son producto de mi actividad de inversión 
              legítima y cumplen con todas las regulaciones financieras aplicables en Estados Unidos y mi país de residencia.
            </p>
          </div>
        </div>

        <!-- Información de Verificación -->
        <div style="border: 1px solid #000; margin-bottom: 20px;">
          <div style="background-color: #000; color: white; padding: 8px; font-weight: bold; font-size: 12px;">
            VERIFICACIÓN Y CUMPLIMIENTO REGULATORIO
          </div>
          
          <div style="padding: 15px; font-size: 11px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
              <div>
                <strong>Verificación KYC:</strong> COMPLETADA<br/>
                <strong>Verificación AML:</strong> APROBADA<br/>
                <strong>Estado de Cuenta:</strong> ${investor.accountStatus || 'ACTIVA'}<br/>
                <strong>Tipo de Cuenta:</strong> ${investor.accountType || 'ESTANDAR'}
              </div>
              <div>
                <strong>Plataforma:</strong> INTERACTIVE BROKERS LLC<br/>
                <strong>Regulación:</strong> SEC/FINRA/CFTC<br/>
                <strong>Segregación:</strong> FONDOS PROTEGIDOS<br/>
                <strong>Monitoreo:</strong> TIEMPO REAL
              </div>
            </div>
          </div>
        </div>

        <!-- Firmas Oficiales -->
        <div style="border: 1px solid #000; margin-bottom: 20px;">
          <div style="background-color: #000; color: white; padding: 8px; font-weight: bold; font-size: 12px;">
            FIRMAS Y AUTENTICACIÓN OFICIAL
          </div>
          
          <div style="padding: 15px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
              <div style="text-align: center;">
                <div style="border-bottom: 2px solid #000; margin-bottom: 10px; height: 50px;"></div>
                <p style="margin: 0; font-weight: bold; font-size: 11px;">${investor.name.toUpperCase()}</p>
                <p style="margin: 2px 0 0 0; font-size: 9px;">INVERSIONISTA</p>
                <p style="margin: 2px 0 0 0; font-size: 9px;">FECHA: ${currentDate.toUpperCase()}</p>
              </div>
              
              <div style="text-align: center;">
                <div style="border-bottom: 2px solid #000; margin-bottom: 10px; height: 50px;"></div>
                <p style="margin: 0; font-weight: bold; font-size: 11px;">CRISTIAN ROLANDO DORAO</p>
                <p style="margin: 2px 0 0 0; font-size: 9px;">GESTOR DE CUENTA AUTORIZADO</p>
                <p style="margin: 2px 0 0 0; font-size: 9px;">FECHA: ${currentDate.toUpperCase()}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Autenticación -->
        <div style="border: 1px solid #000; margin-bottom: 20px;">
          <div style="background-color: #000; color: white; padding: 8px; font-weight: bold; font-size: 12px;">
            AUTENTICACIÓN Y CÓDIGOS DE SEGURIDAD
          </div>
          
          <div style="padding: 15px; font-size: 11px;">
            <p style="margin: 0 0 10px 0;"><strong>Clave de Autenticación:</strong> ${withdrawal.id.toUpperCase()}</p>
            <p style="margin: 0 0 10px 0;"><strong>Código de Autenticación de Mensaje (MAC):</strong> ${withdrawal.id.slice(-16).toUpperCase()}</p>
            <p style="margin: 0 0 10px 0;"><strong>Verificación de Cumplimiento:</strong> APROBADO - AML/KYC VERIFICADO</p>
            <p style="margin: 0 0 10px 0;"><strong>Aprobación Regulatoria:</strong> FINRA/SEC CUMPLIMIENTO</p>
            <p style="margin: 0;"><strong>Firma Digital:</strong> IBKR-${new Date().getTime().toString(36).toUpperCase()}</p>
          </div>
        </div>

        <!-- Footer Oficial -->
        <div style="text-align: center; margin-top: 30px; padding-top: 15px; border-top: 2px solid #000; font-size: 10px; color: #666;">
          <img src="/Screenshot 2025-06-07 024813.png" alt="Interactive Brokers" style="height: 30px; width: auto; object-fit: contain; margin-bottom: 10px;" />
          <p style="margin: 0;">
            <strong>INTERACTIVE BROKERS LLC</strong><br/>
            One Pickwick Plaza, Greenwich, CT 06830, United States<br/>
            Regulado por SEC, FINRA, CFTC | Miembro SIPC<br/>
            <br/>
            Este certificado fue generado el ${currentDate} a las ${currentTime}<br/>
            Documento ID: POF-${withdrawal.id.slice(-8)} | Cliente: ${investor.id}
          </p>
        </div>
      </div>
    `;
  };

  const downloadProofPDF = async () => {
    setIsGenerating(true);
    
    try {
      // Create a temporary div with the form content
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = generateFormHTML();
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
      const fileName = `Comprobante_Origen_Fondos_${investor.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error al generar el PDF. Por favor, inténtelo de nuevo.');
    } finally {
      setIsGenerating(false);
    }
  };

  const FormPreview = () => (
    <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-white">
      <div dangerouslySetInnerHTML={{ __html: generateFormHTML() }} />
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="PROOF OF FUNDS CERTIFICATE"
      size="lg"
    >
      <div className="space-y-6">
        {/* Header Information */}
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-300">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gray-200 border border-gray-400 rounded-lg flex items-center justify-center">
              <FileText size={24} className="text-gray-700" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">PROOF OF FUNDS CERTIFICATE</h3>
              <p className="text-sm text-gray-700 uppercase tracking-wide font-medium">
                OFFICIAL DOCUMENT TO VERIFY THE LEGITIMACY OF WITHDRAWN FUNDS
              </p>
            </div>
          </div>
        </div>

        {/* Withdrawal Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-300">
            <div className="flex items-center space-x-2 mb-3">
              <User size={16} className="text-gray-700" />
              <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">INVESTOR</span>
            </div>
            <p className="font-bold text-gray-900">{investor.name}</p>
            <p className="text-sm text-gray-700 font-medium">{investor.country}</p>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-300">
            <div className="flex items-center space-x-2 mb-3">
              <DollarSign size={16} className="text-gray-700" />
              <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">WITHDRAWAL AMOUNT</span>
            </div>
            <p className="font-bold text-gray-900">${Math.abs(withdrawal.amount).toLocaleString()}</p>
            <p className="text-sm text-gray-700 font-medium">USD</p>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-300">
            <div className="flex items-center space-x-2 mb-3">
              <Calendar size={16} className="text-gray-700" />
              <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">WITHDRAWAL DATE</span>
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

        {/* Preview Toggle */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors rounded-lg uppercase tracking-wide"
          >
            {showPreview ? 'HIDE PREVIEW' : 'SHOW PREVIEW'}
          </button>
          <button
            onClick={downloadProofPDF}
            disabled={isGenerating}
            className="px-4 py-2 bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors rounded-lg disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide"
          >
            <Download size={16} className="mr-2 inline" />
            {isGenerating ? 'GENERATING PDF...' : 'DOWNLOAD CERTIFICATE'}
          </button>
        </div>

        {/* Document Preview */}
        {showPreview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <h4 className="font-bold text-gray-900 mb-3 uppercase tracking-wide">DOCUMENT PREVIEW</h4>
            <FormPreview />
          </motion.div>
        )}

        {/* Information Notice */}
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-300">
          <h4 className="font-bold text-gray-900 mb-4 uppercase tracking-wide">DOCUMENT INFORMATION</h4>
          <ul className="text-gray-700 text-sm space-y-2 font-medium">
            <li className="uppercase tracking-wide">• PDF INCLUDES ALL INVESTOR AND TRANSACTION INFORMATION</li>
            <li className="uppercase tracking-wide">• DOCUMENT FORMATTED FOR OFFICIAL BANK PRESENTATION</li>
            <li className="uppercase tracking-wide">• INCLUDES SWORN DECLARATION OF LEGITIMATE FUND ORIGIN</li>
            <li className="uppercase tracking-wide">• VALID FOR REGULATORY AND BANKING COMPLIANCE</li>
            <li className="uppercase tracking-wide">• AUTOMATICALLY GENERATED WITH VERIFIED PLATFORM DATA</li>
          </ul>
        </div>
      </div>
    </Modal>
  );
};

export default ProofOfFundsForm;