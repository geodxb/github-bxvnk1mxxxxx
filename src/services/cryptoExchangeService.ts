export interface CryptoExchange {
  id: string;
  name: string;
  supportedCryptos: ('BTC' | 'ETH' | 'USDT' | 'SOL')[];
  processingTime: string;
  fees: {
    BTC?: number;
    ETH?: number;
    USDT?: number;
    SOL?: number;
  };
}

const exchanges: CryptoExchange[] = [
  {
    id: 'binance',
    name: 'Binance',
    supportedCryptos: ['BTC', 'ETH', 'USDT', 'SOL'],
    processingTime: '1-2 hours',
    fees: { BTC: 0.0005, ETH: 0.005, USDT: 1, SOL: 0.000005 },
  },
  {
    id: 'coinbase',
    name: 'Coinbase',
    supportedCryptos: ['BTC', 'ETH', 'USDT'],
    processingTime: '2-4 hours',
    fees: { BTC: 0.0002, ETH: 0.003, USDT: 2 },
  },
  {
    id: 'kraken',
    name: 'Kraken',
    supportedCryptos: ['BTC', 'ETH', 'USDT'],
    processingTime: '1-3 hours',
    fees: { BTC: 0.0001, ETH: 0.002, USDT: 0.5 },
  },
  {
    id: 'bybit',
    name: 'Bybit',
    supportedCryptos: ['BTC', 'ETH', 'USDT', 'SOL'],
    processingTime: '30-60 minutes',
    fees: { BTC: 0.0003, ETH: 0.004, USDT: 0.8, SOL: 0.000002 },
  },
  {
    id: 'bitso',
    name: 'Bitso',
    supportedCryptos: ['BTC', 'ETH', 'USDT'],
    processingTime: '1-2 hours',
    fees: { BTC: 0.0005, ETH: 0.005, USDT: 1 },
  },
  {
    id: 'bitget',
    name: 'Bitget',
    supportedCryptos: ['BTC', 'ETH', 'USDT', 'SOL'],
    processingTime: '30-90 minutes',
    fees: { BTC: 0.0004, ETH: 0.0045, USDT: 0.9, SOL: 0.000003 },
  },
];

const countryExchangeMap: Record<string, string[]> = {
  'Mexico': ['bitso', 'binance', 'bybit', 'bitget'],
  'France': ['binance', 'kraken', 'coinbase', 'bybit'],
  'Switzerland': ['kraken', 'binance', 'coinbase'],
  'Saudi Arabia': ['binance', 'bybit', 'bitget'],
  'United Arab Emirates': ['binance', 'bybit', 'bitget'],
  'United States': ['coinbase', 'kraken'], // Limited options for US
};

const cryptoPrices: Record<string, number> = {
  BTC: 60000, // Example price
  ETH: 3000,  // Example price
  USDT: 1,    // Stablecoin
  SOL: 150,   // Example price
};

export class CryptoExchangeService {
  static getExchangesForCountry(country: string): CryptoExchange[] {
    const normalizedCountry = this.normalizeCountry(country);
    const exchangeIds = countryExchangeMap[normalizedCountry] || [];
    return exchanges.filter((exchange) => exchangeIds.includes(exchange.id));
  }

  static getNetworksForCrypto(crypto: 'BTC' | 'ETH' | 'USDT' | 'SOL'): string[] {
    switch (crypto) {
      case 'BTC':
        return ['Bitcoin'];
      case 'ETH':
        return ['ERC20'];
      case 'USDT':
        return ['ERC20', 'TRC20', 'BEP20'];
      case 'SOL':
        return ['Solana'];
      default:
        return [];
    }
  }

  static async getCryptoPrices(): Promise<Record<string, number>> {
    // In a real application, you would fetch this from a crypto price API
    // For now, we return mock data
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(cryptoPrices);
      }, 500);
    });
  }

  static async calculateCryptoAmount(
    usdAmount: number,
    crypto: 'BTC' | 'ETH' | 'USDT' | 'SOL'
  ): Promise<number> {
    const prices = await this.getCryptoPrices();
    const price = prices[crypto];
    if (!price) {
      throw new Error(`Price not available for ${crypto}`);
    }
    return usdAmount / price;
  }

  static validateWalletAddress(
    address: string,
    crypto: 'BTC' | 'ETH' | 'USDT' | 'SOL',
    network?: string
  ): boolean {
    // Basic validation, in a real app this would be more robust
    if (!address || address.length < 26 || address.length > 62) {
      return false;
    }

    switch (crypto) {
      case 'BTC':
        return /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$/.test(address);
      case 'ETH':
        return /^0x[a-fA-F0-9]{40}$/.test(address);
      case 'USDT':
        if (network === 'ERC20') return /^0x[a-fA-F0-9]{40}$/.test(address);
        if (network === 'TRC20') return /^T[A-Za-z1-9]{33}$/.test(address);
        if (network === 'BEP20') return /^0x[a-fA-F0-9]{40}$/.test(address);
        return false; // Network must be specified for USDT
      case 'SOL':
        return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
      default:
        return false;
    }
  }

  static generateVerificationHash(): string {
    // Generates a random alphanumeric hash for blockchain verification
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0987654321';
    let result = '0x';
    for (let i = 0; i < 64; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }

  private static normalizeCountry(country: string): string {
    const countryMap: { [key: string]: string } = {
      'mexico': 'Mexico',
      'france': 'France',
      'switzerland': 'Switzerland',
      'saudi arabia': 'Saudi Arabia',
      'united arab emirates': 'United Arab Emirates',
      'usa': 'United States',
      'us': 'United States',
    };
    return countryMap[country.toLowerCase()] || country;
  }
}
