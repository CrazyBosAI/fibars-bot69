import React, { useState, useEffect } from 'react';
import { Gift, Users, DollarSign, Copy, Share2, Trophy, TrendingUp } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  totalCommission: number;
  monthlyCommission: number;
}

export const ReferralPage: React.FC = () => {
  const { userProfile } = useAuth();
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    activeReferrals: 0,
    totalCommission: 0,
    monthlyCommission: 0,
  });
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (userProfile) {
      fetchReferralData();
    }
  }, [userProfile]);

  const fetchReferralData = async () => {
    try {
      // Fetch referral statistics
      const { data: referralData } = await supabase
        .from('referrals')
        .select(`
          *,
          referred:users!referrals_referred_id_fkey(
            email,
            full_name,
            subscription_tier,
            created_at
          )
        `)
        .eq('referrer_id', userProfile?.id);

      const totalReferrals = referralData?.length || 0;
      const activeReferrals = referralData?.filter(r => r.status === 'active').length || 0;
      const totalCommission = referralData?.reduce((sum, r) => sum + (r.total_commission || 0), 0) || 0;
      
      // Calculate monthly commission (this month)
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyCommission = referralData?.filter(r => {
        const createdDate = new Date(r.created_at);
        return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear;
      }).reduce((sum, r) => sum + (r.total_commission || 0), 0) || 0;

      setStats({
        totalReferrals,
        activeReferrals,
        totalCommission,
        monthlyCommission,
      });

      setReferrals(referralData || []);
    } catch (error) {
      console.error('Error fetching referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = () => {
    const referralLink = `${window.location.origin}/register?ref=${userProfile?.referral_code}`;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareReferralLink = () => {
    const referralLink = `${window.location.origin}/register?ref=${userProfile?.referral_code}`;
    const text = `Join me on CryptoTrader Pro and start automated crypto trading! Use my referral link to get started: ${referralLink}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'CryptoTrader Pro Referral',
        text: text,
        url: referralLink,
      });
    } else {
      // Fallback to copying to clipboard
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center">
          <Gift className="w-8 h-8 mr-3 text-blue-400" />
          Referral Program
        </h1>
        <div className="text-sm text-gray-400">
          Earn 10% commission on all referral subscriptions
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
      </div>

      {/* Referral Link Section */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-semibold mb-4">Your Referral Link</h2>
        <div className="flex items-center space-x-4">
          <div className="flex-1 bg-gray-700 rounded-lg p-4 font-mono text-sm">
            {window.location.origin}/register?ref={userProfile?.referral_code}
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
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold">Referral History</h2>
        </div>
        <div className="overflow-x-auto">
          {referrals.length > 0 ? (
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
                        <div className="font-medium">
                          {referral.referred?.full_name || 'Anonymous User'}
                        </div>
                        <div className="text-sm text-gray-400">
                          {referral.referred?.email}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        referral.referred?.subscription_tier === 'pro' ? 'bg-purple-600 text-purple-100' :
                        referral.referred?.subscription_tier === 'basic' ? 'bg-blue-600 text-blue-100' :
                        'bg-gray-600 text-gray-100'
                      }`}>
                        {referral.referred?.subscription_tier?.toUpperCase() || 'FREE'}
                      </span>
                    </td>
                    <td className="p-4 text-right font-semibold text-green-400">
                      ${referral.total_commission?.toFixed(2) || '0.00'}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        referral.status === 'active' ? 'bg-green-600 text-green-100' : 'bg-gray-600 text-gray-100'
                      }`}>
                        {referral.status?.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-400">
                      {new Date(referral.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No referrals yet. Start sharing your link to earn commissions!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};