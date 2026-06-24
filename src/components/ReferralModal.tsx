import React, { useState } from 'react';
import { X, Gift, Copy, Check, Send } from 'lucide-react';
import { User, Setting } from '../types';

interface ReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  settings: Setting | null;
}

export default function ReferralModal({ isOpen, onClose, user, settings }: ReferralModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !user) return null;

  const referralCode = user.referralCode || 'BP-REFER';
  const referralLink = `${window.location.origin}?ref=${referralCode}`;
  
  const refRewardReferrer = settings?.referralRewardReferrer ?? 10;
  const refRewardReferred = settings?.referralRewardReferred ?? 5;

  const shareText = `Invite your friends to Beauty Point and earn rewards. You get ${refRewardReferrer} Coins for every successful referral, and your friend gets ${refRewardReferred} welcome Coins. Join using my link: ${referralLink}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const shareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`, '_blank');
  };

  const shareTelegram = () => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(shareText)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div 
        className="relative w-full max-w-md overflow-hidden bg-white/95 rounded-3xl shadow-2xl transition-all border border-neutral-100/50 backdrop-blur-md animate-scale-up"
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.6)'
        }}
      >
        {/* Aesthetic top gold/pink decorative bar */}
        <div className="h-2.5 bg-gradient-to-r from-amber-200 via-rose-300 to-amber-200" />

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute p-2.5 transition-all rounded-full top-5 right-5 hover:bg-neutral-100/80 text-neutral-400 hover:text-neutral-700"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 flex flex-col items-center">
          
          {/* Header Gift Icon */}
          <div className="relative flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-gradient-to-tr from-amber-100 via-rose-100 to-rose-200 text-rose-500 shadow-md animate-bounce">
            <Gift className="w-8 h-8" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500"></span>
            </span>
          </div>

          <h2 className="font-serif text-2xl font-bold tracking-wide text-neutral-900 text-center">
            🎁 Refer & Earn Rewards
          </h2>
          <p className="mt-1.5 text-sm text-neutral-500 text-center max-w-xs leading-relaxed">
            Invite your friends and earn reward coins automatically added to your wallet.
          </p>

          {/* Referral Reward Rules cards */}
          <div className="grid grid-cols-2 gap-3 w-full my-6">
            <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-100/50 text-center">
              <p className="text-[10px] uppercase font-bold text-amber-700 tracking-wider">You get</p>
              <p className="font-serif text-2xl font-bold text-neutral-800 mt-1">{refRewardReferrer}</p>
              <p className="text-[10px] text-neutral-400 font-medium">Coins on friend signup</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-rose-50/50 border border-rose-100/50 text-center">
              <p className="text-[10px] uppercase font-bold text-rose-700 tracking-wider">Your friend gets</p>
              <p className="font-serif text-2xl font-bold text-neutral-800 mt-1">{refRewardReferred}</p>
              <p className="text-[10px] text-neutral-400 font-medium">Welcome Coins</p>
            </div>
          </div>

          {/* Referral Code display */}
          <div className="w-full bg-neutral-50/60 border border-neutral-200/50 rounded-2xl p-4 text-center mb-4">
            <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-widest block mb-1">Your Referral Code</span>
            <span className="font-mono text-lg font-bold tracking-widest text-neutral-900 bg-white border border-neutral-200 py-1 px-4 rounded-xl shadow-xs inline-block">
              {referralCode}
            </span>
          </div>

          {/* Referral Link & Copy */}
          <div className="w-full space-y-1 mb-6">
            <label className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Shareable Referral Link</label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={referralLink}
                className="flex-1 py-2.5 px-3.5 bg-neutral-55 border border-neutral-200 rounded-xl text-xs text-neutral-600 font-mono font-medium focus:outline-none"
              />
              <button
                onClick={handleCopy}
                className="px-4 py-2.5 bg-neutral-900 text-white rounded-xl text-xs font-semibold hover:bg-neutral-800 transition-all flex items-center gap-1.5 active:scale-[0.97]"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Social share icons */}
          <div className="w-full border-t border-neutral-100 pt-5 text-center">
            <p className="text-[10px] uppercase font-bold text-neutral-400 tracking-widest mb-3.5">Or share directly via</p>
            <div className="flex justify-center items-center gap-3.5">
              {/* WhatsApp */}
              <button
                onClick={shareWhatsApp}
                className="flex flex-col items-center justify-center p-3 rounded-2xl border border-neutral-200 hover:border-emerald-200 hover:bg-emerald-50/30 text-neutral-600 hover:text-emerald-600 transition-all active:scale-95"
              >
                <Send className="w-5 h-5 text-emerald-500" />
                <span className="text-[9px] font-semibold mt-1">WhatsApp</span>
              </button>
              
              {/* Facebook */}
              <button
                onClick={shareFacebook}
                className="flex flex-col items-center justify-center p-3 rounded-2xl border border-neutral-200 hover:border-indigo-200 hover:bg-indigo-50/30 text-neutral-600 hover:text-indigo-600 transition-all active:scale-95"
              >
                <svg className="w-5 h-5 text-indigo-600 fill-current" viewBox="0 0 24 24">
                  <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
                </svg>
                <span className="text-[9px] font-semibold mt-1">Facebook</span>
              </button>

              {/* Telegram */}
              <button
                onClick={shareTelegram}
                className="flex flex-col items-center justify-center p-3 rounded-2xl border border-neutral-200 hover:border-sky-200 hover:bg-sky-50/30 text-neutral-600 hover:text-sky-600 transition-all active:scale-95"
              >
                <svg className="w-5 h-5 text-sky-500 fill-current" viewBox="0 0 24 24" style={{ transform: 'scale(1.2)' }}>
                  <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm4.726 15.657c-.183.195-.494.348-.828.326-1.52-.099-4.838-1.517-5.914-1.921-.634-.239-1.07-.638-1.07-1.127 0-.528.514-.959 1.189-1.18 1.109-.364 4.39-1.547 5.76-1.986.326-.104.646-.076.812.106.186.204.225.596.173.968-.335 2.378-1.045 7.42-1.122 7.814z" />
                </svg>
                <span className="text-[9px] font-semibold mt-1">Telegram</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
