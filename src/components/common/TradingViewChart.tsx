import { useEffect, useRef } from 'react';

interface TradingViewChartProps {
  symbol?: string;
  interval?: string;
  theme?: 'light' | 'dark';
  height?: string;
  width?: string;
}

const TradingViewChart = ({ 
  symbol = 'NASDAQ:AAPL',
  interval = 'D',
  theme = 'dark',
  height = '100%',
  width = '100%'
}: TradingViewChartProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    try {
      // Generate a unique ID for this widget instance
      const widgetId = `tradingview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Clear any existing content
      containerRef.current.innerHTML = '';
      
      // Set up the container directly
      containerRef.current.id = widgetId;
      containerRef.current.className = 'tradingview-widget-container';
      containerRef.current.style.height = height;
      containerRef.current.style.width = width;

      // Widget configuration
      const config = {
        "autosize": true,
        "symbol": symbol,
        "interval": interval,
        "timezone": "Etc/UTC",
        "theme": theme,
        "style": "1",
        "locale": "en",
        "allow_symbol_change": true,
        "support_host": "https://www.tradingview.com",
        "container_id": widgetId,
        "hide_top_toolbar": false,
        "hide_legend": false,
        "save_image": false
      };

      // Create the script element with error handling
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
      script.async = true;
      
      // Add error handling for script loading
      script.onerror = () => {
        console.warn('TradingView widget failed to load');
        if (containerRef.current) {
          containerRef.current.innerHTML = `
            <div class="flex items-center justify-center h-full text-gray-400">
              <div class="text-center">
                <p class="text-lg mb-2">Chart temporarily unavailable</p>
                <p class="text-sm">Please refresh the page to try again</p>
              </div>
            </div>
          `;
        }
      };

      // Set the script content
      script.innerHTML = JSON.stringify(config);

      // Add script directly to container
      containerRef.current.appendChild(script);

      // Hide copyright text with CSS after widget loads
      setTimeout(() => {
        try {
          const copyrightElements = document.querySelectorAll('.tradingview-widget-copyright');
          copyrightElements.forEach(el => {
            (el as HTMLElement).style.display = 'none';
          });
        } catch (error) {
          console.warn('Could not hide TradingView copyright:', error);
        }
      }, 2000);
    } catch (error) {
      console.error('Error initializing TradingView widget:', error);
      if (containerRef.current) {
        containerRef.current.innerHTML = `
          <div class="flex items-center justify-center h-full text-gray-400">
            <div class="text-center">
              <p class="text-lg mb-2">Chart temporarily unavailable</p>
              <p class="text-sm">Please refresh the page to try again</p>
            </div>
          </div>
        `;
      }
    }

    // Cleanup function
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [symbol, interval, theme, height, width]);

  return (
    <div 
      ref={containerRef}
      className="w-full h-full bg-gray-900 rounded-lg overflow-hidden"
      style={{ minHeight: '400px' }}
    />
  );
};

export default TradingViewChart;