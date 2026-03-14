import { JumpingClinicalLoader } from '@/components/common/JumpingClinicalLoader';

export default function RootLoading() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white">
      <div className="space-y-6 text-center">
        <JumpingClinicalLoader />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-600 tracking-wider">
            Medoflow
          </p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
            Loading Clinical OS
          </p>
        </div>
      </div>
    </div>
  );
}
