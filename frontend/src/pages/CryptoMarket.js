import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import axios from 'axios';

export default function CryptoMarket() {
  const navigate = useNavigate();
  const [cryptoData, setCryptoData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    fetchCryptoData();
    // Otomatik güncelleme her 60 saniyede bir
    const interval = setInterval(() => {
      fetchCryptoData();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const fetchCryptoData = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_COINGECKO_API_URL}/coins/markets`,
        {
          params: {
            vs_currency: 'usd',
            order: 'market_cap_desc',
            per_page: 20,
            page: 1,
            sparkline: true,
            price_change_percentage: '24h,7d'
          }
        }
      );
      setCryptoData(response.data);
      setLastUpdate(new Date());
      setLoading(false);
    } catch (error) {
      console.error('Crypto data fetch error:', error);
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toFixed(2);
  };

  const formatPrice = (price) => {
    if (price >= 1) return '$' + price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return '$' + price.toFixed(6);
  };

  const renderSparkline = (sparklineData) => {
    if (!sparklineData || sparklineData.length === 0) return null;

    const width = 120;
    const height = 40;
    const padding = 2;

    const min = Math.min(...sparklineData);
    const max = Math.max(...sparklineData);
    const range = max - min;

    const points = sparklineData.map((value, index) => {
      const x = (index / (sparklineData.length - 1)) * (width - padding * 2) + padding;
      const y = height - padding - ((value - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    }).join(' ');

    const isPositive = sparklineData[sparklineData.length - 1] >= sparklineData[0];
    const color = isPositive ? '#10b981' : '#ef4444';

    return (
      <svg width={width} height={height} className="inline-block">
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
        />
      </svg>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-amber-400"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-24">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">Kripto Para Piyasası</h1>
          <p className="text-xl text-gray-300 mb-2">Güncel fiyatlar ve piyasa verileri</p>
          <p className="text-sm text-gray-400">
            Son güncelleme: {lastUpdate.toLocaleTimeString('tr-TR')}
          </p>
        </div>

        {/* Top 3 Coins Highlight */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {cryptoData.slice(0, 3).map((coin, idx) => (
            <Card key={coin.id} className="glass-card border-2 border-amber-500/30 hover:border-amber-500 transition-all">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img src={coin.image} alt={coin.name} className="w-10 h-10" />
                    <div>
                      <div className="text-white font-bold">{coin.name}</div>
                      <div className="text-gray-400 text-sm uppercase">{coin.symbol}</div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-amber-400">#{idx + 1}</div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white mb-2">
                  {formatPrice(coin.current_price)}
                </div>
                <div className={`text-lg font-semibold mb-3 ${
                  coin.price_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {coin.price_change_percentage_24h >= 0 ? '▲' : '▼'} {Math.abs(coin.price_change_percentage_24h).toFixed(2)}%
                </div>
                <div className="text-gray-400 text-sm">
                  Piyasa Değeri: ${formatNumber(coin.market_cap)}
                </div>
                <div className="text-gray-400 text-sm">
                  24s Hacim: ${formatNumber(coin.total_volume)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Full Market Table */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-white text-2xl">Tüm Kripto Paralar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-amber-500/20">
                    <th className="text-left py-4 px-4 text-gray-400 font-semibold">#</th>
                    <th className="text-left py-4 px-4 text-gray-400 font-semibold">Coin</th>
                    <th className="text-right py-4 px-4 text-gray-400 font-semibold">Fiyat</th>
                    <th className="text-right py-4 px-4 text-gray-400 font-semibold">24s</th>
                    <th className="text-right py-4 px-4 text-gray-400 font-semibold">7g</th>
                    <th className="text-right py-4 px-4 text-gray-400 font-semibold">Piyasa Değeri</th>
                    <th className="text-right py-4 px-4 text-gray-400 font-semibold">Hacim (24s)</th>
                    <th className="text-right py-4 px-4 text-gray-400 font-semibold">Son 7 Gün</th>
                  </tr>
                </thead>
                <tbody>
                  {cryptoData.map((coin, idx) => (
                    <tr 
                      key={coin.id} 
                      className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-4 px-4 text-gray-400">{coin.market_cap_rank}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          <img src={coin.image} alt={coin.name} className="w-8 h-8" />
                          <div>
                            <div className="text-white font-semibold">{coin.name}</div>
                            <div className="text-gray-400 text-sm uppercase">{coin.symbol}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right text-white font-semibold">
                        {formatPrice(coin.current_price)}
                      </td>
                      <td className={`py-4 px-4 text-right font-semibold ${
                        coin.price_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {coin.price_change_percentage_24h >= 0 ? '▲' : '▼'} {Math.abs(coin.price_change_percentage_24h).toFixed(2)}%
                      </td>
                      <td className={`py-4 px-4 text-right font-semibold ${
                        coin.price_change_percentage_7d_in_currency >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {coin.price_change_percentage_7d_in_currency >= 0 ? '▲' : '▼'} {Math.abs(coin.price_change_percentage_7d_in_currency || 0).toFixed(2)}%
                      </td>
                      <td className="py-4 px-4 text-right text-gray-300">
                        ${formatNumber(coin.market_cap)}
                      </td>
                      <td className="py-4 px-4 text-right text-gray-300">
                        ${formatNumber(coin.total_volume)}
                      </td>
                      <td className="py-4 px-4 text-right">
                        {renderSparkline(coin.sparkline_in_7d?.price || [])}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Info Section */}
        <div className="mt-8 bg-blue-500/20 border border-blue-500 rounded-lg p-6">
          <p className="text-blue-400 text-sm">
            <strong>Bilgi:</strong> Veriler CoinGecko API'den alınmaktadır ve her 60 saniyede bir otomatik güncellenir. 
            Fiyatlar USD bazındadır. Yatırım kararlarınızı vermeden önce detaylı araştırma yapmanızı öneririz.
          </p>
        </div>
      </div>
    </div>
  );
}
