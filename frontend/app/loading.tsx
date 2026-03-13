import { JumpingClinicalLoader } from '@/components/common/JumpingClinicalLoader';

export default function RootLoading() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-50">
      <div className="space-y-12 text-center">
        <JumpingClinicalLoader />
        <div className="space-y-2">
          <p className="text-xl font-black text-slate-900 tracking-tight uppercase italic animate-pulse">
            Loading Command Center
          </p>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.3em]">
            Establishing Secure Link
          </p>
        </div>
      </div>
    </div>
  );
}
