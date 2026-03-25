import { Share2, Copy, Users, Wallet, Instagram, MessageCircle, MessageSquare } from "lucide-react";

export function ReferralHub({ storeSettings, userPhone, friendsJoined, earnedCredits }: { storeSettings: any, userPhone: string, friendsJoined: number, earnedCredits: number }) {
  const handleCopy = () => {
    navigator.clipboard.writeText(userPhone || "BOWLITVIP");
    alert('Code copied to clipboard!');
  };

  const handleShare = (platform: string) => {
    const code = userPhone || "BOWLITVIP";
    const text = `Hey! Use my VIP code *${code}* on BowlIt.in to get ₹${storeSettings.referral_reward_receiver} off your first freshly prepared meal plan! 🍛`;
    if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
    } else if (platform === 'sms') {
      window.open(`sms:?body=${encodeURIComponent(text)}`);
    } else {
      if (navigator.share) {
        navigator.share({ title: 'BowlIt Referral', text: text });
      } else {
        handleCopy();
      }
    }
  };

  return (
    <div className="-mx-5 -mt-5 pb-6">
      {/* 1. GREEN HEADER */}
      <div className="bg-[#0f9d58] pt-12 pb-24 px-6 text-white text-center relative rounded-b-[2.5rem]">
        <div className="inline-block bg-black/10 text-[10px] font-black uppercase tracking-[0.2em] px-5 py-2 rounded-full mb-6 backdrop-blur-sm border border-white/10 shadow-sm">Growth Program</div>
        <h1 className="text-4xl md:text-5xl font-black leading-tight mb-4 tracking-tight drop-shadow-md">
          Give ₹{storeSettings.referral_reward_receiver},<br />Get ₹{storeSettings.referral_reward_sender}
        </h1>
        <p className="text-[13px] font-semibold text-green-50 max-w-[240px] mx-auto leading-relaxed opacity-90">
          Healthy eating is better with friends. Share the bowlit lifestyle.
        </p>
      </div>

      {/* 2. REFERRAL CODE CARD */}
      <div className="px-5 -mt-14 relative z-10">
        <div className="bg-white rounded-[2rem] p-7 shadow-xl shadow-green-900/10 border border-gray-100 flex flex-col items-center text-center">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-3">Your Referral Code</h3>
          <div className="w-full bg-gray-50 border border-dashed border-gray-300 rounded-2xl py-5 mb-5 overflow-hidden">
            <span className="text-2xl md:text-3xl font-black tracking-[0.2em] text-gray-900">{userPhone || 'NO_PHONE'}</span>
          </div>
          <button onClick={handleCopy} className="w-full bg-[#0f9d58] text-white font-black uppercase tracking-widest text-sm py-4 rounded-xl flex justify-center items-center gap-2 hover:bg-[#0b8043] transition-all shadow-lg shadow-green-600/20 active:scale-95">
            <Copy size={18} /> Copy Code
          </button>
        </div>
      </div>

      <div className="px-6 mt-10 space-y-12">

        {/* 3. SHARE THE LINK */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-5">Share the link</h3>
          <div className="flex justify-between max-w-sm mx-auto">
            <button onClick={() => handleShare('whatsapp')} className="flex flex-col items-center gap-2.5 group">
              <div className="w-14 h-14 bg-green-50 text-green-600 rounded-full flex items-center justify-center group-hover:bg-green-100 group-hover:scale-105 transition-all">
                <MessageCircle size={22} className="stroke-[2.5]" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-[0.15em] text-gray-500">Whatsapp</span>
            </button>
            <button onClick={() => handleShare('instagram')} className="flex flex-col items-center gap-2.5 group">
              <div className="w-14 h-14 bg-pink-50 text-pink-600 rounded-full flex items-center justify-center group-hover:bg-pink-100 group-hover:scale-105 transition-all">
                <Instagram size={22} className="stroke-[2.5]" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-[0.15em] text-gray-500">Instagram</span>
            </button>
            <button onClick={() => handleShare('sms')} className="flex flex-col items-center gap-2.5 group">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center group-hover:bg-blue-100 group-hover:scale-105 transition-all">
                <MessageSquare size={22} className="stroke-[2.5]" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-[0.15em] text-gray-500">SMS</span>
            </button>
            <button onClick={() => handleShare('more')} className="flex flex-col items-center gap-2.5 group">
              <div className="w-14 h-14 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center group-hover:bg-gray-200 group-hover:scale-105 transition-all">
                <Share2 size={22} className="stroke-[2.5]" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-[0.15em] text-gray-500">More</span>
            </button>
          </div>
        </div>

        {/* 4. HOW IT WORKS */}
        <div className="bg-gray-50 p-7 md:p-8 rounded-[2rem] border border-gray-100/80">
          <h3 className="text-xl font-bold text-gray-900 mb-8 text-center text-balance">How it works</h3>
          <div className="space-y-8 relative">
            <div className="absolute left-[20px] top-6 bottom-6 w-0.5 bg-green-200/50 z-0"></div>

            <div className="flex gap-5 relative z-10">
              <div className="w-10 h-10 shrink-0 bg-[#86efac] text-green-900 font-black rounded-full flex items-center justify-center shadow-lg shadow-green-200/50 outline outline-4 outline-gray-50">1</div>
              <div className="pt-2">
                <h4 className="font-bold text-gray-900 text-[15px] mb-1">Share code</h4>
                <p className="text-xs font-semibold text-gray-500 leading-relaxed md:pr-4">Send your unique invite code to friends who haven't tried bowlit yet.</p>
              </div>
            </div>

            <div className="flex gap-5 relative z-10">
              <div className="w-10 h-10 shrink-0 bg-[#86efac] text-green-900 font-black rounded-full flex items-center justify-center shadow-lg shadow-green-200/50 outline outline-4 outline-gray-50">2</div>
              <div className="pt-2">
                <h4 className="font-bold text-gray-900 text-[15px] mb-1">Friend joins</h4>
                <p className="text-xs font-semibold text-gray-500 leading-relaxed md:pr-4">They get ₹{storeSettings.referral_reward_receiver} off on their first curated meal plan subscription.</p>
              </div>
            </div>

            <div className="flex gap-5 relative z-10">
              <div className="w-10 h-10 shrink-0 bg-[#86efac] text-green-900 font-black rounded-full flex items-center justify-center shadow-lg shadow-green-200/50 outline outline-4 outline-gray-50">3</div>
              <div className="pt-2">
                <h4 className="font-bold text-gray-900 text-[15px] mb-1">Both get ₹{storeSettings.referral_reward_sender}</h4>
                <p className="text-xs font-semibold text-gray-500 leading-relaxed md:pr-4">Once their first order is delivered, you automatically receive ₹{storeSettings.referral_reward_sender} credits.</p>
              </div>
            </div>
          </div>
        </div>

        {/* 5. YOUR IMPACT & MILESTONE */}
        <div className="space-y-4">
          <div className="flex justify-between items-end mb-4 px-2">
            <h3 className="text-xl font-bold text-gray-900 tracking-tight">Your Impact</h3>
            <button className="text-[10px] font-black uppercase text-[#0f9d58] tracking-widest hover:bg-green-50 px-3 py-1.5 rounded-full transition-colors">View all</button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 flex flex-col justify-between h-44">
              <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center mb-6">
                <Users size={22} className="stroke-[2.5]" />
              </div>
              <div>
                <div className="text-4xl font-black text-gray-900 tracking-tighter drop-shadow-sm">{friendsJoined}</div>
                <div className="text-[9px] font-black uppercase tracking-[0.15em] text-gray-400 mt-1">Friends Joined</div>
              </div>
            </div>

            <div className="bg-[#0f9d58] rounded-[2rem] p-6 shadow-md shadow-green-700/20 flex flex-col justify-between h-44 text-white">
              <div className="w-12 h-12 bg-white/20 text-white rounded-full flex items-center justify-center mb-6 border border-white/10">
                <Wallet size={22} className="stroke-[2.5]" />
              </div>
              <div>
                <div className="text-4xl font-black tracking-tighter drop-shadow-md">₹{earnedCredits}</div>
                <div className="text-[9px] font-black uppercase tracking-[0.15em] text-green-100 mt-1">Earned Credits</div>
              </div>
            </div>
          </div>

          {/* 6. NEXT MILESTONE */}
          <div className="bg-gray-100/80 rounded-[2rem] p-6 border border-gray-200/60 mt-2 hover:border-gray-300 transition-colors">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-bold text-gray-900 text-sm">Next Milestone</h4>
              <span className="text-[10px] uppercase font-black tracking-widest text-[#0f9d58]">{Math.max(0, 5 - friendsJoined)} MORE TO GO</span>
            </div>
            <div className="h-3.5 w-full bg-gray-200 rounded-full overflow-hidden mb-5 border border-gray-300/50 shadow-inner">
              <div className="h-full bg-[#0f9d58] rounded-full shadow-sm transition-all duration-1000" style={{ width: `${Math.min(100, (friendsJoined / 5) * 100)}%` }}></div>
            </div>
            <p className="text-xs font-semibold text-gray-500 leading-relaxed pr-2">
              Refer <span className="font-bold text-gray-900">5 friends</span> to unlock <span className="text-orange-600 font-bold bg-orange-50 px-1 rounded mx-0.5">VIP Early Access</span> to seasonal menus.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
