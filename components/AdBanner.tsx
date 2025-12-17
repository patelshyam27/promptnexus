import React from 'react';

const AdBanner: React.FC = () => {
  return (
    <div className="w-full bg-slate-900/50 border border-slate-800 rounded-xl p-1 overflow-hidden my-8 group cursor-pointer">
      <div className="relative bg-gradient-to-r from-[#4285F4] to-[#34A853] rounded-lg p-6 md:p-10 flex flex-col md:flex-row items-center justify-between overflow-hidden shadow-inner transition-transform duration-500">
        
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none"></div>
        
        {/* Pattern overlay */}
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>

        <div className="z-10 text-center md:text-left mb-6 md:mb-0 relative">
          <div className="inline-block bg-white/90 text-black text-[10px] font-bold px-1.5 py-0.5 rounded mb-3 uppercase tracking-wide shadow-sm">
            Ad
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 tracking-tight drop-shadow-md">
            Google Cloud Next '24
          </h2>
          <p className="text-white/90 max-w-md text-sm md:text-base font-medium drop-shadow-sm">
            Discover the new way to cloud. Watch the keynotes and learn about the latest in AI.
          </p>
        </div>

        <div className="z-10 relative">
          <button className="bg-white text-[#4285F4] hover:bg-slate-100 font-bold py-3 px-8 rounded-full transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0">
            Register Now
          </button>
        </div>
        
        {/* Google Ads label */}
        <div className="absolute bottom-2 right-3 flex flex-col items-end pointer-events-none">
           <div className="flex items-center space-x-1 bg-black/20 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] text-white/80">
              <span>Ads by Google</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AdBanner;