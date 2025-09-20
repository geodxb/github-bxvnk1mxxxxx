import { FirestoreService } from './firestoreService';
import { Investor, Transaction, WithdrawalRequest } from '../types/user';

interface ChatContext {
  investor?: any;
  transactions?: any[];
  selectedOption?: string | null;
  conversationHistory?: any[];
  userRole?: string;
  hasSystemAccess?: boolean;
}

export class SupportService {
  static async getChatResponse(message: string, context: ChatContext): Promise<string> {
    try {
      // First check if asking about a specific investor
      const investorNameMatch = this.extractInvestorName(message);
      if (investorNameMatch) {
        return await this.getInvestorInformation(investorNameMatch, message.toLowerCase());
      }
      
      // Handle policy and account questions
      if (this.isPolicyOrAccountQuery(message)) {
        return this.handlePolicyQuery(message, context);
      }
      
      // Handle withdrawal questions
      if (this.isWithdrawalQuery(message)) {
        return this.handleWithdrawalQuery(message, context);
      }
      
      // Handle transaction or balance questions
      if (this.isTransactionOrBalanceQuery(message)) {
        return this.handleTransactionQuery(message, context);
      }
      
      // Handle general questions or fallback
      return this.generateConversationalResponse(message, context);
    } catch (error) {
      console.error('Support Service Error:', error);
      return "I'm having trouble accessing that information right now. Could you try asking in a different way, or perhaps ask about a specific investor by name?";
    }
  }

  private static extractInvestorName(message: string): string | null {
    // Common patterns for asking about investors
    const patterns = [
      /(?:about|information|info|details|data|tell me about).*?(?:on|for|about)?\s+([A-Za-z]+(?:\s+[A-Za-z]+)*)/i,
      /([A-Za-z]+\s+[A-Za-z]+)(?:\s+account|\s+profile|\s+information)/i,
      /(?:investor|client|user)\s+([A-Za-z]+(?:\s+[A-Za-z]+)*)/i,
      /^([A-Za-z]+\s+[A-Za-z]+)$/i,
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    // Check for specific investor names we know about
    const knownInvestors = [
      "Pamela Medina", "Omar Ehab", "Rodrigo Alfonso", 
      "Pablo Canales", "Javier Francisco", "Patricia Perea",
      "Haas Raphael", "Herreman"
    ];
    
    const lowerMessage = message.toLowerCase();
    for (const name of knownInvestors) {
      if (lowerMessage.includes(name.toLowerCase())) {
        return name;
      }
    }

    return null;
  }

  private static isPolicyOrAccountQuery(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    const policyTerms = [
      'policy', 'restriction', 'restricted', 'violation', 'compliance', 
      'rule', 'regulation', 'terms', 'condition', 'kyc', 'verification',
      'account status', 'why is my account', 'account closed'
    ];
    
    return policyTerms.some(term => lowerMessage.includes(term));
  }

  private static isWithdrawalQuery(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    const withdrawalTerms = [
      'withdraw', 'withdrawal', 'take out money', 'get my money', 
      'cash out', 'transfer funds', 'commission', 'fee', 'charge'
    ];
    
    return withdrawalTerms.some(term => lowerMessage.includes(term));
  }

  private static isTransactionOrBalanceQuery(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    const transactionTerms = [
      'transaction', 'history', 'balance', 'deposit', 'earning', 
      'performance', 'profit', 'loss', 'roi', 'return'
    ];
    
    return transactionTerms.some(term => lowerMessage.includes(term));
  }

  private static async getInvestorInformation(investorName: string, query: string): Promise<string> {
    try {
      // Get all investors from Firebase
      const allInvestors = await FirestoreService.getInvestors();
      
      // Find investor by name (case-insensitive, partial match)
      const investor = allInvestors.find(inv => 
        inv.name.toLowerCase().includes(investorName.toLowerCase()) ||
        investorName.toLowerCase().includes(inv.name.toLowerCase())
      );

      if (!investor) {
        return `I couldn't find an investor named "${investorName}" in our system. Could you check the spelling or provide their full name?`;
      }

      // Get investor's transactions
      const transactions = await FirestoreService.getTransactions(investor.id);
      
      // Get withdrawal requests for this investor
      const allWithdrawals = await FirestoreService.getWithdrawalRequests();
      const investorWithdrawals = allWithdrawals.filter(w => w.investorId === investor.id);

      // Generate response based on query focus
      if (query.includes('withdrawal') || query.includes('withdraw')) {
        return this.generateWithdrawalInfo(investor, transactions, investorWithdrawals);
      } else if (query.includes('transaction') || query.includes('history')) {
        return this.generateTransactionInfo(investor, transactions);
      } else if (query.includes('restriction') || query.includes('policy')) {
        return this.generateRestrictionInfo(investor);
      } else {
        // Comprehensive profile
        return this.generateInvestorProfile(investor, transactions, investorWithdrawals);
      }
    } catch (error) {
      console.error('Error fetching investor information:', error);
      return `I'm having trouble retrieving information for "${investorName}" right now. Could you try again in a moment?`;
    }
  }

  private static generateInvestorProfile(investor: Investor, transactions: Transaction[], withdrawals: WithdrawalRequest[]): string {
    // Calculate key metrics
    const totalDeposits = transactions.filter(tx => tx.type === 'Deposit').reduce((sum, tx) => sum + tx.amount, 0);
    const totalEarnings = transactions.filter(tx => tx.type === 'Earnings').reduce((sum, tx) => sum + tx.amount, 0);
    const totalWithdrawals = Math.abs(transactions.filter(tx => tx.type === 'Withdrawal').reduce((sum, tx) => sum + tx.amount, 0));
    const pendingWithdrawals = withdrawals.filter(w => w.status === 'Pending').length;
    
    const performance = investor.currentBalance - investor.initialDeposit;
    const performancePercent = investor.initialDeposit > 0 ? (performance / investor.initialDeposit * 100) : 0;

    // Generate status explanation based on account status
    let statusExplanation = '';
    if (investor.accountStatus?.toLowerCase().includes('restricted')) {
      statusExplanation = `\n\nThis account has restrictions due to policy violations. The system detected unusual withdrawal patterns that triggered our security protocols. While under review, withdrawals require manual approval and take 5-10 business days to process.`;
    } else if (investor.accountStatus?.toLowerCase().includes('closed')) {
      statusExplanation = `\n\nThis account is in the process of being closed. All trading functionality is suspended, and the remaining balance will be transferred to the investor's registered bank account within 60-90 days.`;
    }

    // Create a conversational response
    return `I've found ${investor.name}'s profile for you.

${investor.name} joined on ${investor.joinDate} from ${investor.country}. Their account is currently ${investor.accountStatus || 'Active'}.${statusExplanation}

Their financial overview shows a current balance of $${investor.currentBalance.toLocaleString()} from an initial deposit of $${investor.initialDeposit.toLocaleString()}. Overall performance is ${performance >= 0 ? '+' : ''}$${performance.toLocaleString()} (${performancePercent.toFixed(2)}%).

They've had ${transactions.length} transactions in total, including $${totalDeposits.toLocaleString()} in deposits and $${totalWithdrawals.toLocaleString()} in withdrawals. There are currently ${pendingWithdrawals} pending withdrawal requests.

${investor.bankDetails ? `Their bank information shows they use ${investor.bankDetails.bankName || 'an unspecified bank'} with account holder name ${investor.bankDetails.accountHolderName || 'not provided'}.` : 'No bank details are on file for this investor.'}

Would you like more specific information about their transactions, withdrawal history, or account status?`;
  }

  private static generateTransactionInfo(investor: Investor, transactions: Transaction[]): string {
    const recentTransactions = transactions.slice(0, 5);
    const deposits = transactions.filter(tx => tx.type === 'Deposit');
    const earnings = transactions.filter(tx => tx.type === 'Earnings');
    const withdrawals = transactions.filter(tx => tx.type === 'Withdrawal');

    let response = `Here's ${investor.name}'s transaction history:

They've had ${transactions.length} total transactions: ${deposits.length} deposits totaling $${deposits.reduce((sum, tx) => sum + tx.amount, 0).toLocaleString()}, ${earnings.length} earnings entries totaling $${earnings.reduce((sum, tx) => sum + tx.amount, 0).toLocaleString()}, and ${withdrawals.length} withdrawals totaling $${Math.abs(withdrawals.reduce((sum, tx) => sum + tx.amount, 0)).toLocaleString()}.

`;

    if (recentTransactions.length > 0) {
      response += `Their most recent transactions include:\n`;
      recentTransactions.forEach((tx, index) => {
        const amount = Math.abs(tx.amount).toLocaleString();
        const date = new Date(tx.date).toLocaleDateString();
        response += `• ${date}: ${tx.type} - $${amount} (${tx.status})\n`;
      });
    } else {
      response += `They don't have any transactions recorded yet.\n`;
    }

    if (investor.accountStatus?.toLowerCase().includes('restricted')) {
      response += `\nNote that this account has restrictions that may affect future transactions. All withdrawals require manual review by our compliance team.`;
    }

    response += `\nWould you like to know more about a specific transaction type or their account status?`;

    return response;
  }

  private static generateWithdrawalInfo(investor: Investor, transactions: Transaction[], withdrawals: WithdrawalRequest[]): string {
    const withdrawalTransactions = transactions.filter(tx => tx.type === 'Withdrawal');
    const totalWithdrawn = Math.abs(withdrawalTransactions.reduce((sum, tx) => sum + tx.amount, 0));
    const pendingWithdrawals = withdrawals.filter(w => w.status === 'Pending');
    const approvedWithdrawals = withdrawals.filter(w => w.status === 'Approved');
    const rejectedWithdrawals = withdrawals.filter(w => w.status === 'Rejected');

    let withdrawalRestrictionInfo = '';
    if (investor.accountStatus?.toLowerCase().includes('restricted')) {
      withdrawalRestrictionInfo = `\nThis account has withdrawal restrictions due to policy violations. Our system detected unusual patterns that triggered a security review. While under review, all withdrawals require manual approval by our compliance team, with processing times extended to 5-10 business days.`;
    } else if (investor.accountStatus?.toLowerCase().includes('closed')) {
      withdrawalRestrictionInfo = `\nThis account is in the closure process. No new withdrawals can be initiated. The remaining balance of $${investor.currentBalance.toLocaleString()} will be transferred to the investor's registered bank account within 60-90 days.`;
    }

    let response = `Regarding ${investor.name}'s withdrawals:

They have a current balance of $${investor.currentBalance.toLocaleString()} and their account status is ${investor.accountStatus || 'Active'}.${withdrawalRestrictionInfo}

In total, they've made ${withdrawals.length} withdrawal requests, with ${pendingWithdrawals.length} pending, ${approvedWithdrawals.length} approved, and ${rejectedWithdrawals.length} rejected. The total amount withdrawn so far is $${totalWithdrawn.toLocaleString()}.

`;

    if (pendingWithdrawals.length > 0) {
      response += `Their pending withdrawals include:\n`;
      pendingWithdrawals.forEach((w, index) => {
        response += `• $${w.amount.toLocaleString()} requested on ${w.date}\n`;
      });
    }

    response += `\nIs there anything specific about their withdrawal history you'd like to know?`;

    return response;
  }

  private static generateRestrictionInfo(investor: Investor): string {
    if (!investor.accountStatus?.toLowerCase().includes('restricted') && 
        !investor.accountStatus?.toLowerCase().includes('policy violation')) {
      return `${investor.name}'s account doesn't have any restrictions. Their account status is ${investor.accountStatus || 'Active'} with a current balance of $${investor.currentBalance.toLocaleString()}.

They have full access to all platform features including deposits, trading, and standard withdrawals (processed within 1-3 business days).

Is there something specific about their account you're concerned about?`;
    }

    // For restricted accounts
    return `${investor.name}'s account has restrictions due to policy violations. Our compliance system flagged this account for the following reasons:

• Multiple withdrawal requests made in a short timeframe
• Unusual trading patterns that don't match typical investor behavior
• Potential verification issues with submitted documents

Their current status is "${investor.accountStatus}" with a balance of $${investor.currentBalance.toLocaleString()}.

While under review, their account has these limitations:
• Withdrawals require manual approval by our compliance team
• Processing time is extended to 5-10 business days
• Additional verification may be requested for large transactions
• Trading functionality remains available but is monitored

These restrictions are temporary while our compliance team completes their review. The investor has been notified and asked to provide additional documentation.

Would you like me to check if there's been any recent update on this review process?`;
  }

  private static handlePolicyQuery(message: string, context: ChatContext): string {
    const lowerMessage = message.toLowerCase();
    const { investor } = context;
    
    // Handle account restriction questions
    if ((lowerMessage.includes('why') || lowerMessage.includes('what')) && 
        (lowerMessage.includes('restricted') || lowerMessage.includes('restriction'))) {
      
      if (investor?.accountStatus?.toLowerCase().includes('restricted')) {
        return `Your account currently has restrictions because our security system detected unusual activity patterns. 

Specifically, we noticed:
• Multiple withdrawal requests made in a short timeframe
• Trading patterns that differ from your established history
• Possible login attempts from unfamiliar locations

These restrictions are a protective measure to ensure your account security. While your account is under review:
• You can still access your dashboard and view your balance
• You can continue trading normally
• You can make deposits without any issues
• Withdrawal requests require manual approval and take 5-10 business days

This is temporary and should be resolved once our compliance team completes their review, which typically takes 7-14 days. If you need to make an urgent withdrawal, I recommend contacting our support team directly with any additional verification documents that might help expedite the process.

Is there a specific concern you have about these restrictions?`;
      } else {
        return `Your account doesn't currently have any restrictions. You have full access to all platform features including deposits, trading, and standard withdrawals.

Account restrictions typically happen when our security system detects:
• Unusual trading patterns or suspicious activity
• Multiple withdrawal requests in quick succession
• Identity verification issues
• Login attempts from suspicious locations

Your account is in good standing with a current balance of $${investor?.currentBalance?.toLocaleString() || '0'}.

Is there something specific about our policies you'd like to understand better?`;
      }
    }
    
    // Handle policy violation questions
    if (lowerMessage.includes('policy violation') || 
        (lowerMessage.includes('policy') && lowerMessage.includes('violation'))) {
      
      if (investor?.accountStatus?.toLowerCase().includes('policy violation') || 
          investor?.accountStatus?.toLowerCase().includes('restricted')) {
        return `I can see that your account has been flagged for a policy violation review. This happens when our security systems detect patterns that don't match your typical account behavior.

In your case, our system identified:
• Several withdrawal requests made within a short period
• Trading patterns that differ from your established history
• Possible access from unfamiliar locations

While your account is under review:
• You still have full access to your funds and trading capabilities
• Deposits work normally without any restrictions
• Withdrawal requests require additional verification and take 5-10 business days instead of the usual 1-3 days

This is a temporary security measure to protect your account. The review typically takes 7-14 days to complete. If you need to make an urgent withdrawal, you can expedite the process by providing additional verification documents.

Would you like me to explain what documentation might help resolve this faster?`;
      } else {
        return `Good news! Your account doesn't have any policy violations. You have full access to all platform features with standard processing times.

Our policy violation detection system monitors accounts for:
• Unusual trading patterns
• Suspicious withdrawal behavior
• Identity verification issues
• Unauthorized access attempts

Your account is in good standing with a current balance of $${investor?.currentBalance?.toLocaleString() || '0'}.

Is there a specific policy you'd like me to explain?`;
      }
    }
    
    // Handle account closure questions
    if (lowerMessage.includes('closed') || lowerMessage.includes('closure') || 
        lowerMessage.includes('delete') || lowerMessage.includes('deletion')) {
      
      if (investor?.accountStatus?.toLowerCase().includes('closed') || 
          investor?.accountStatus?.toLowerCase().includes('deletion')) {
        return `I can confirm that your account is currently in the closure process. Here's what this means:

• Your account status is: ${investor?.accountStatus}
• Current balance: $${investor?.currentBalance?.toLocaleString() || '0'}
• Trading functionality: Disabled
• Withdrawal functionality: Disabled

During the closure process:
• You can still log in to view your account information
• No new deposits or trades can be made
• No manual withdrawal requests can be initiated
• Your remaining balance will be automatically transferred to your registered bank account

The fund transfer typically takes 60-90 days to complete due to compliance requirements and security checks. You don't need to take any additional action - the transfer will happen automatically.

Is there anything specific about the closure process you'd like to know?`;
      } else {
        return `Your account is currently active and in good standing. It's not scheduled for closure or deletion.

If you're interested in closing your account:
• All funds must be withdrawn or transferred before closure
• Account closure has a 90-day cooling-off period before you can open a new account
• Any remaining balance will be transferred to your registered bank account
• All account data will be retained according to regulatory requirements

Your current balance is $${investor?.currentBalance?.toLocaleString() || '0'}.

Are you considering closing your account? I'd be happy to explain the process in more detail.`;
      }
    }
    
    // Default policy response
    return `Our platform policies are designed to ensure security and compliance. Here are the key policies you should be aware of:

• KYC Requirements: All users must complete identity verification
• Withdrawal Policy: 15% commission on all withdrawals, $100 minimum, 1-3 day standard processing
• Security Measures: Accounts showing unusual patterns may be temporarily restricted for review
• Account Closure: 90-day restriction on new account creation after closure
• Fund Protection: All client funds are held in segregated accounts

${investor?.accountStatus?.toLowerCase().includes('restricted') ? 
'Your account currently has restrictions due to a policy review. This is typically resolved within 7-14 days, during which withdrawals require manual approval.' : 
'Your account is currently in good standing with no policy violations.'}

Is there a specific policy you'd like me to explain in more detail?`;
  }

  private static handleWithdrawalQuery(message: string, context: ChatContext): string {
    const lowerMessage = message.toLowerCase();
    const { investor, transactions } = context;
    
    // Handle withdrawal restriction questions
    if ((lowerMessage.includes('why') || lowerMessage.includes('what')) && 
        (lowerMessage.includes('withdrawal') || lowerMessage.includes('withdraw')) && 
        (lowerMessage.includes('disabled') || lowerMessage.includes('restricted') || lowerMessage.includes('can\'t'))) {
      
      if (investor?.accountStatus?.toLowerCase().includes('restricted') || 
          investor?.accountStatus?.toLowerCase().includes('policy violation')) {
        return `Your withdrawals are currently taking longer to process because your account has been flagged for a security review.

This happened because our system detected some unusual patterns in your account activity. Specifically:
• You made several withdrawal requests in a short period
• There were some unusual trading patterns compared to your history
• There may have been login activity from unfamiliar locations

While your account is under review, you can still request withdrawals, but they'll need manual approval from our compliance team, which takes 5-10 business days instead of the usual 1-3 days.

This is a temporary measure to protect your account security. The review typically takes 7-14 days to complete. If you need to make an urgent withdrawal, providing additional verification documents might help expedite the process.

Is there a specific withdrawal you're concerned about?`;
      } else if (investor?.accountStatus?.toLowerCase().includes('closed')) {
        return `Your withdrawals are currently disabled because your account is in the closure process.

During account closure:
• All trading functionality is suspended
• New deposits are not accepted
• Manual withdrawal requests cannot be initiated

Instead, our system will automatically process the transfer of your remaining balance ($${investor?.currentBalance?.toLocaleString() || '0'}) to your registered bank account. This transfer typically takes 60-90 days to complete due to compliance requirements and security checks.

You don't need to do anything - the transfer will happen automatically. If you need to update your bank information before the transfer is completed, please let me know and I can help with that process.

Is there anything else about the account closure process you'd like to understand?`;
      } else {
        return `I don't see any withdrawal restrictions on your account. You should be able to withdraw funds normally, subject to our standard policies:

• Minimum withdrawal amount: $100
• Platform commission: 15% of withdrawal amount
• Processing time: 1-3 business days
• Available balance: $${investor?.currentBalance?.toLocaleString() || '0'}

If you're experiencing issues with withdrawals, it could be due to:
1. Temporary system maintenance
2. Incomplete bank information in your profile
3. A recent large deposit that's still in the clearing period

Are you having trouble with a specific withdrawal request? I'd be happy to look into it for you.`;
      }
    }
    
    // Handle commission questions
    if (lowerMessage.includes('commission') || lowerMessage.includes('fee') || 
        lowerMessage.includes('15%') || lowerMessage.includes('15 percent')) {
      return `Our platform charges a 15% commission on all withdrawals. Here's how it works:

When you request a withdrawal:
• You specify the total amount you want to withdraw
• The system deducts 15% as the platform commission
• You receive the remaining 85% in your bank account

For example, if you request a $1,000 withdrawal:
• Commission: $150 (15% of $1,000)
• Amount you receive: $850 (85% of $1,000)

This commission helps support our trading infrastructure, security systems, and customer service. It only applies to withdrawals - there are no fees on deposits or earnings.

With your current balance of $${investor?.currentBalance?.toLocaleString() || '0'}, if you were to withdraw the full amount:
• Commission would be: $${((investor?.currentBalance || 0) * 0.15).toLocaleString()}
• You would receive: $${((investor?.currentBalance || 0) * 0.85).toLocaleString()}

Would you like me to help you calculate the commission for a specific withdrawal amount?`;
    }
    
    // Handle withdrawal process questions
    if (lowerMessage.includes('how') && 
        (lowerMessage.includes('withdrawal') || lowerMessage.includes('withdraw'))) {
      return `Here's how the withdrawal process works:

1. Request: You submit a withdrawal request specifying the amount (minimum $100)
2. Processing: Our team reviews your request (takes ${investor?.accountStatus?.toLowerCase().includes('restricted') ? '5-10' : '1-3'} business days)
3. Commission: A 15% platform commission is deducted from the withdrawal amount
4. Transfer: The remaining 85% is transferred to your registered bank account

Your current available balance is $${investor?.currentBalance?.toLocaleString() || '0'}.

${investor?.accountStatus?.toLowerCase().includes('restricted') ? 
'Note: Your account is currently under review, so withdrawals require manual approval from our compliance team. This is why processing takes longer than usual.' : 
'Your account is in good standing with standard withdrawal processing times.'}

Would you like me to help you initiate a withdrawal or explain any part of this process in more detail?`;
    }
    
    // Default withdrawal response
    return `Here's everything you need to know about withdrawals from your account:

• Your available balance: $${investor?.currentBalance?.toLocaleString() || '0'}
• Minimum withdrawal amount: $100
• Platform commission: 15% of the withdrawal amount
• Processing time: ${investor?.accountStatus?.toLowerCase().includes('restricted') ? '5-10 business days (due to account review)' : '1-3 business days'}

${investor?.accountStatus?.toLowerCase().includes('restricted') ? 
'Note: Your account is currently under review, so withdrawals require manual approval from our compliance team. This is why processing takes longer than usual.' : 
'Your account is in good standing with no withdrawal restrictions.'}

When you request a withdrawal:
1. The amount is immediately deducted from your available balance
2. Our team reviews the request
3. Once approved, funds are transferred to your registered bank account
4. The 15% commission is deducted from the withdrawal amount

Would you like me to help you initiate a withdrawal or explain the commission structure in more detail?`;
  }

  private static handleTransactionQuery(message: string, context: ChatContext): string {
    const lowerMessage = message.toLowerCase();
    const { investor, transactions } = context;
    
    // Handle balance questions
    if (lowerMessage.includes('balance') || lowerMessage.includes('how much') || 
        lowerMessage.includes('my money') || lowerMessage.includes('available')) {
      const performance = (investor?.currentBalance || 0) - (investor?.initialDeposit || 0);
      const performancePercent = (investor?.initialDeposit || 0) > 0 ? (performance / (investor?.initialDeposit || 1) * 100) : 0;
      
      return `Your current account balance is $${investor?.currentBalance?.toLocaleString() || '0'}.

Here's a quick overview of your account:
• Initial investment: $${investor?.initialDeposit?.toLocaleString() || '0'}
• Current balance: $${investor?.currentBalance?.toLocaleString() || '0'}
• Total gain/loss: ${performance >= 0 ? '+' : ''}$${performance.toLocaleString()} (${performancePercent.toFixed(2)}%)

Your account has had ${transactions?.length || 0} transactions in total, including:
• ${transactions?.filter(tx => tx.type === 'Deposit').length || 0} deposits
• ${transactions?.filter(tx => tx.type === 'Earnings').length || 0} earnings entries
• ${transactions?.filter(tx => tx.type === 'Withdrawal').length || 0} withdrawals

Is there anything specific about your balance or transaction history you'd like to know?`;
    }
    
    // Handle transaction history questions
    if (lowerMessage.includes('transaction') || lowerMessage.includes('history')) {
      const recentTransactions = transactions?.slice(0, 5) || [];
      
      let response = `You have ${transactions?.length || 0} transactions on your account. `;
      
      if (recentTransactions.length > 0) {
        response += `Here are your most recent transactions:\n`;
        recentTransactions.forEach((tx, index) => {
          const date = new Date(tx.date).toLocaleDateString();
          response += `• ${date}: ${tx.type} - $${Math.abs(tx.amount).toLocaleString()} (${tx.status})\n`;
        });
      } else {
        response += `You don't have any transactions recorded yet.`;
      }

      response += `\nWould you like to see more details about a specific transaction type?`;
      return response;
    }
    
    // Handle performance questions
    if (lowerMessage.includes('performance') || lowerMessage.includes('profit') || 
        lowerMessage.includes('earning') || lowerMessage.includes('return')) {
      const performance = (investor?.currentBalance || 0) - (investor?.initialDeposit || 0);
      const performancePercent = (investor?.initialDeposit || 0) > 0 ? (performance / (investor?.initialDeposit || 1) * 100) : 0;
      const earningsTransactions = transactions?.filter(tx => tx.type === 'Earnings') || [];
      
      return `Here's your account performance summary:

• Initial investment: $${investor?.initialDeposit?.toLocaleString() || '0'}
• Current balance: $${investor?.currentBalance?.toLocaleString() || '0'}
• Total gain/loss: ${performance >= 0 ? '+' : ''}$${performance.toLocaleString()} (${performancePercent.toFixed(2)}%)
• Earnings transactions: ${earningsTransactions.length}
• Total earnings: $${earningsTransactions.reduce((sum, tx) => sum + tx.amount, 0).toLocaleString() || '0'}

${performance >= 0 ? 
  `Your account is performing well with a positive return of ${performancePercent.toFixed(2)}%.` : 
  `Your account is currently showing a loss of ${Math.abs(performancePercent).toFixed(2)}%.`}

Would you like to see your detailed transaction history or discuss strategies to improve your performance?`;
    }
    
    // Default transaction response
    return `Here's a summary of your account activity:

• Current balance: $${investor?.currentBalance?.toLocaleString() || '0'}
• Total transactions: ${transactions?.length || 0}
• Account status: ${investor?.accountStatus || 'Active'}

${transactions && transactions.length > 0 ? 
  `Your most recent transaction was a ${transactions[0].type} of $${Math.abs(transactions[0].amount).toLocaleString()} on ${transactions[0].date}.` : 
  `You don't have any transactions recorded yet.`}

What specific information would you like to know about your account activity?`;
  }

  private static generateConversationalResponse(message: string, context: ChatContext): string {
    const lowerMessage = message.toLowerCase();
    const { investor, transactions } = context;
    
    // Handle greetings
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || 
        lowerMessage.includes('hey') || lowerMessage === 'hi' || lowerMessage === 'hello') {
      return `Hi there! I'm your Interactive Brokers support assistant. I can help with account information, transaction history, withdrawal requests, and more. I can also provide detailed information about any investor in our system.

What can I help you with today? You can ask about your account status, balance, or even inquire about specific investors by name.`;
    }
    
    // Handle "how are you" type questions
    if (lowerMessage.includes('how are you') || lowerMessage.includes('how\'s it going')) {
      return `I'm doing well, thanks for asking! I'm here to help with any questions about your Interactive Brokers account or provide information about investors in our system.

Your current balance is $${investor?.currentBalance?.toLocaleString() || '0'} and your account status is ${investor?.accountStatus || 'Active'}. How can I assist you today?`;
    }
    
    // Handle "what can you do" questions
    if (lowerMessage.includes('what can you do') || lowerMessage.includes('help me with')) {
      return `I can help you with a wide range of tasks and information:

• Account Information: Check your status, balance, and performance metrics
• Transaction History: View your deposits, earnings, and withdrawals
• Withdrawal Support: Help with withdrawal requests and explain processing times
• Policy Questions: Explain any restrictions or account limitations
• Investor Information: Provide details about any investor by name

You can ask me specific questions like "Why is my withdrawal taking longer?" or "What's my current balance?" or even "Tell me about Pamela Medina's account."

What would you like help with today?`;
    }
    
    // Handle "thank you" messages
    if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
      return `You're welcome! I'm glad I could help. If you have any other questions about your account or need information about any investor, feel free to ask anytime.

Is there anything else you'd like to know about your account or our platform?`;
    }
    
    // Default response
    return `I'm here to help with any questions about your Interactive Brokers account or provide information about investors in our system.

You can ask me about:
• Your account status and balance
• Transaction history and performance
• Withdrawal processes and restrictions
• Policy explanations and compliance issues
• Information about specific investors by name

What would you like to know more about?`;
  }
}