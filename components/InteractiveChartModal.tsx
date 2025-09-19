import React, { useEffect, useRef } from 'react';
// FIX: Switched to a namespace import for 'lightweight-charts' to resolve module type conflicts.
import * as LightweightCharts from 'lightweight-charts';
import { MarketDataCandle } from '../types.ts';

interface InteractiveChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  chartData: MarketDataCandle[];
  title: string;
}

// Determines the correct price formatting based on the asset symbol.
const getPriceFormat = (symbol: string): LightweightCharts.PriceFormat => {
    const upperSymbol = symbol.toUpperCase();
    
    if (upperSymbol.includes('.FOREX')) {
        return {
            type: 'price',
            precision: 5,
            minMove: 0.00001,
        };
    }
    if (upperSymbol.includes('.CC') || upperSymbol.includes('-USD')) {
        if (upperSymbol.startsWith('BTC') || upperSymbol.startsWith('ETH')) {
             return {
                type: 'price',
                precision: 2,
                minMove: 0.01,
            };
        }
        return {
            type: 'price',
            precision: 4,
            minMove: 0.0001
        };
    }

    // Default for Stocks, Indices, etc.
    return {
        type: 'price',
        precision: 2,
        minMove: 0.01,
    };
};


const InteractiveChartModal: React.FC<InteractiveChartModalProps> = ({
  isOpen,
  onClose,
  chartData,
  title,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<LightweightCharts.IChartApi | null>(null);

  useEffect(() => {
    if (!isOpen || !chartContainerRef.current || chartData.length === 0) {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
      return;
    }

    const chartOptions: LightweightCharts.DeepPartial<LightweightCharts.ChartOptions> = {
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      layout: {
        background: {
            type: LightweightCharts.ColorType.Solid,
            color: '#1f2937', // gray-800
        },
        textColor: '#d1d5db', // gray-300
      },
      grid: {
        vertLines: { color: '#374151' }, // gray-700
        horzLines: { color: '#374151' }, // gray-700
      },
      timeScale: {
        timeVisible: true,
        borderColor: '#4b5563', // gray-600
      },
      rightPriceScale: {
        borderColor: '#4b5563', // gray-600
      },
      // FIX: The 'watermark' property is now correctly recognized with the namespace import.
      watermark: {
        color: 'rgba(250, 204, 21, 0.08)',
        visible: true,
        text: title,
        fontSize: 48,
        horzAlign: 'center',
        vertAlign: 'center',
      },
    };

    const chart = LightweightCharts.createChart(chartContainerRef.current, chartOptions);

    chartRef.current = chart;

    // FIX: The 'addCandlestickSeries' method is now correctly recognized on the IChartApi type.
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#2dd4bf', // teal-400
      downColor: '#f87171', // red-400
      borderDownColor: '#f87171',
      borderUpColor: '#2dd4bf',
      wickDownColor: '#f87171',
      wickUpColor: '#2dd4bf',
      priceFormat: getPriceFormat(title),
    });

    const formattedData = chartData.map(candle => ({
      time: (new Date(candle.date).getTime() / 1000) as LightweightCharts.UTCTimestamp,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
    })).sort((a, b) => a.time - b.time);

    candlestickSeries.setData(formattedData);
    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.resize(chartContainerRef.current.clientWidth, chartContainerRef.current.clientHeight);
      }
    };
    
    const resizeObserver = new ResizeObserver(handleResize);
    if (chartContainerRef.current) {
        resizeObserver.observe(chartContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      if(chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [isOpen, chartData, title]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-gray-900/80 flex items-center justify-center z-[100] p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 p-4 md:p-6 rounded-lg shadow-xl w-full max-w-6xl h-[80vh] border border-yellow-500/50 flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center pb-4 border-b border-gray-700 flex-shrink-0">
          <h2 className="text-xl font-bold text-yellow-400">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
            aria-label="Close chart viewer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div ref={chartContainerRef} className="flex-grow mt-4 w-full h-full"></div>
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
      `}</style>
    </div>
  );
};

export default InteractiveChartModal;
