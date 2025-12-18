
import React, { useEffect } from 'react';

interface GoogleAdProps {
    config?: {
        client?: string;
        slot?: string;
        status?: string;
    } | null;
}

const GoogleAd: React.FC<GoogleAdProps> = ({ config }) => {
    useEffect(() => {
        if (!config || config.status !== 'active') return;

        try {
            // @ts-ignore
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {
            console.error("AdSense error", e);
        }
    }, [config]);

    if (!config) return null; // Or skeleton? Default to hidden until loaded.
    if (config.status === 'disabled') return null;

    if (config.status === 'test') {
        return (
            <div className="w-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden my-6 p-4 flex flex-col justify-center items-center min-h-[250px] relative">
                <div className="text-slate-500 font-bold mb-2">Google Ad Placeholder</div>
                <div className="text-xs text-slate-600">Client: {config.client || 'Not set'}</div>
                <div className="text-xs text-slate-600">Slot: {config.slot || 'Not set'}</div>
                <span className="text-[10px] text-slate-600 uppercase tracking-widest absolute top-2 right-2 border border-slate-700 px-1 rounded">Test Mode</span>
            </div>
        );
    }

    // Active Mode
    return (
        <div className="w-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden my-6 p-4 flex justify-center items-center min-h-[250px] relative">
            <ins className="adsbygoogle"
                style={{ display: 'block', width: '100%' }}
                data-ad-client={config.client}
                data-ad-slot={config.slot}
                data-ad-format="auto"
                data-full-width-responsive="true"></ins>

            {/* Label regarding the ad */}
            <span className="text-[10px] text-slate-600 uppercase tracking-widest absolute top-2 right-2 border border-slate-700 px-1 rounded">Sponsored</span>
        </div>
    );
};

export default GoogleAd;
