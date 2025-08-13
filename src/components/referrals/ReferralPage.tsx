import React, { useState, useEffect } from 'react';
import { Gift, Users, DollarSign, Copy, Share2, Trophy, TrendingUp, Download, CreditCard } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  totalCommission: number;
  monthlyCommission: number;
  pendingWithdrawal: number;
}

interface ReferralData {
  id: string;
  referred_email: string;
  referred_name: string;
  subscription_tier: string;
  total_commission: number;
  status: string;
  created_at: string;
}

export const ReferralPage: React.FC = () => {
  const { userProfile } = useAuth();
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 12,
    activeReferrals: 8,
    totalCommission: 2847.50,
    monthlyCommission: 456.80,
    pendingWithdrawal: 1200.00,
  });
  const [referrals, setReferrals] = useState<ReferralData[]>([
    {
      id: '1',
      referred_email: 'john.doe@example.com',
      referred_name: 'John Doe',
      subscription_tier: 'pro',
      total_commission: 450.00,
      status: 'active',
      created_at: '2024-01-15T10:30:00Z'
    },
    {
      id: '2',
      referred_email: 'jane.smith@example.com',
      referred_name: 'Jane Smith',
      subscription_tier: 'basic',
      total_commission: 290.00,
      status: 'active',
      created_at: '2024-01-20T14:15:00Z'
    },
    {
      id: '3',
      referred_email: 'mike.wilson@example.com',
      referred_name: 'Mike Wilson',
      subscription_tier: 'pro',
      total_commission: 680.00,
      status: 'active',
      created_at: '2024-02-01T09:45:00Z'
    },
    {
      id: '4',
      referred_email: 'sarah.johnson@example.com',
      referred_name: 'Sarah Johnson',
      subscription_tier: 'enterprise',
      total_commission: 1200.00,
      status: 'active',
      created_at: '2024-02-10T16:20:00Z'
    },
    {
      id: '5',
      referred_email: 'alex.brown@example.com',
      referred_name: 'Alex Brown',
      subscription_tier: 'basic',
      total_commission: 145.00,
      status: 'inactive',
      created_at: '2024-02-15T11:30:00Z'
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);

  useEffect(() => {
    if (userProfile) {
      fetchReferralData();
    }
  }, [userProfile]);

  const fetchReferralData = async () => {
    try {
      setLoading(false);
      // In demo mode, we use mock data
      // In production, this would fetch from Supabase
    } catch (error) {
      console.error('Error fetching referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = () => {
    const referralLink = `${window.location.origin}/register?ref=${userProfile?.referral_code || 'DEMO123'}`;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareReferralLink = () => {
    const referralLink = `${window.location.origin}/register?ref=${userProfile?.referral_code || 'DEMO123'}`;
    const text = `Join me on FibarsBot and start automated crypto trading! Use my referral link to get started: ${referralLink}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'FibarsBot Referral',
        text: text,
        url: referralLink,
      });
    } else {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleWithdrawal = async () => {
    if (!withdrawalAmount || parseFloat(withdrawalAmount) <= 0) return;
    
    try {
      // In production, this would process the withdrawal
      console.log('Processing withdrawal:', withdrawalAmount);
      setShowWithdrawalModal(false);
      setWithdrawalAmount('');
      
      // Update stats to reflect withdrawal
      setStats(prev => ({
        ...prev,
        pendingWithdrawal: prev.pendingWithdrawal - parseFloat(withdrawalAmount)
      }));
    } catch (error) {
      console.error('Withdrawal error:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center">
          <Gift className="w-8 h-8 mr-3 text-blue-400" />
          Referral Program
        </h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowWithdrawalModal(true)}
            disabled={stats.pendingWithdrawal <= 0}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors flex items-center space-x-2"
          >
            <CreditCard className="w-4 h-4" />
            <span>Withdraw</span>
          </button>
          <div className="text-sm text-gray-400">
            Earn 10% commission on all referral subscriptions
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Referrals</p>
              <p className="text-2xl font-bold">{stats.totalReferrals}</p>
            </div>
            <Users className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Active Referrals</p>
              <p className="text-2xl font-bold text-green-400">{stats.activeReferrals}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-400" />
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Earned</p>
              <p className="text-2xl font-bold text-green-400">${stats.totalCommission.toFixed(2)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-400" />
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">This Month</p>
              <p className="text-2xl font-bold text-yellow-400">${stats.monthlyCommission.toFixed(2)}</p>
            </div>
            <Trophy className="w-8 h-8 text-yellow-400" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Available</p>
              <p className="text-2xl font-bold text-purple-400">${stats.pendingWithdrawal.toFixed(2)}</p>
            </div>
            <CreditCard className="w-8 h-8 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Referral Link Section */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-semibold mb-4">Your Referral Link</h2>
        <div className="flex items-center space-x-4">
          <div className="flex-1 bg-gray-700 rounded-lg p-4 font-mono text-sm">
            {window.location.origin}/register?ref={userProfile?.referral_code || 'DEMO123'}
          </div>
          <button
            onClick={copyReferralLink}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors flex items-center space-x-2"
          >
            <Copy className="w-4 h-4" />
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
          <button
            onClick={shareReferralLink}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-colors flex items-center space-x-2"
          >
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </button>
        </div>
        <p className="text-gray-400 text-sm mt-4">
          Share this link with friends and earn 10% commission on their subscription fees for life!
        </p>
      </div>

      {/* How It Works */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-semibold mb-6">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-600 bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Share2 className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="font-semibold mb-2">1. Share Your Link</h3>
            <p className="text-gray-400 text-sm">
              Share your unique referral link with friends, family, or on social media.
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-green-600 bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="font-semibold mb-2">2. They Sign Up</h3>
            <p className="text-gray-400 text-sm">
              When someone uses your link to register and subscribe to a paid plan.
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-yellow-600 bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign className="w-6 h-6 text-yellow-400" />
            </div>
            <h3 className="font-semibold mb-2">3. You Earn</h3>
            <p className="text-gray-400 text-sm">
              Receive 10% commission on their subscription fees for as long as they remain subscribed.
            </p>
          </div>
        </div>
      </div>

      {/* Referral History */}
      <div className="bg-gray-800 rounded-xl border border-gray-700">
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Referral History</h2>
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                <th className="text-left p-4 font-semibold">User</th>
                <th className="text-left p-4 font-semibold">Plan</th>
                <th className="text-right p-4 font-semibold">Commission</th>
                <th className="text-left p-4 font-semibold">Status</th>
                <th className="text-left p-4 font-semibold">Joined</th>
              </tr>
            </thead>
            <tbody>
              {referrals.map((referral) => (
                <tr key={referral.id} className="border-t border-gray-700 hover:bg-gray-700 transition-colors">
                  <td className="p-4">
                    <div>
                      <div className="font-medium">{referral.referred_name}</div>
                      <div className="text-sm text-gray-400">{referral.referred_email}</div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      referral.subscription_tier === 'enterprise' ? 'bg-yellow-600 text-yellow-100' :
                      referral.subscription_tier === 'pro' ? 'bg-purple-600 text-purple-100' :
                      referral.subscription_tier === 'basic' ? 'bg-blue-600 text-blue-100' :
                      'bg-gray-600 text-gray-100'
                    }`}>
                      {referral.subscription_tier.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4 text-right font-semibold text-green-400">
                    ${referral.total_commission.toFixed(2)}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      referral.status === 'active' ? 'bg-green-600 text-green-100' : 'bg-gray-600 text-gray-100'
                    }`}>
                      {referral.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-400">
                    {new Date(referral.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Withdrawal Modal */}
      {showWithdrawalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Withdraw Commission</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Available Balance: ${stats.pendingWithdrawal.toFixed(2)}
                </label>
                <input
                  type="number"
                  value={withdrawalAmount}
                  onChange={(e) => setWithdrawalAmount(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter amount to withdraw"
                  max={stats.pendingWithdrawal}
                  min="10"
                  step="0.01"
                />
              </div>
              <div className="text-sm text-gray-400">
                Minimum withdrawal: $10.00<br/>
                Processing time: 1-3 business days
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowWithdrawalModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleWithdrawal}
                  disabled={!withdrawalAmount || parseFloat(withdrawalAmount) < 10 || parseFloat(withdrawalAmount) > stats.pendingWithdrawal}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
                >
                  Withdraw
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};