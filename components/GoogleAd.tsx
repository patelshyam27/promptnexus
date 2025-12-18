
import React, { useEffect } from 'react';

const GoogleAd = () => {
    useEffect(() => {
        try {
            // @ts-ignore
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {
            console.error("AdSense error", e);
        }
    }, []);

    return (
        <div className="w-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden my-6 p-4 flex justify-center items-center min-h-[250px] relative">
            {/* 
          IMPORTANT: Replace these data- attributes with your actual AdSense values
          from your AdSense Dashboard -> Ads -> Overview -> Get Code 
      */}
            <ins className="adsbygoogle"
                style={{ display: 'block', width: '100%' }}
                data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
                data-ad-slot="1234567890"
                data-ad-format="auto"
                data-full-width-responsive="true"></ins>

            {/* Label regarding the ad */}
            <span className="text-[10px] text-slate-600 uppercase tracking-widest absolute top-2 right-2 border border-slate-700 px-1 rounded">Sponsored</span>
        </div>
    );
};

export default GoogleAd;
