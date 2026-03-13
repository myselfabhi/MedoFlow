import { JumpingClinicalLoader } from '@/components/common/JumpingClinicalLoader';

export default function DashboardLoading() {
  return (
    <div className="flex h-[calc(100vh-2rem)] w-full flex-col items-center justify-center">
      <div className="space-y-12 text-center">
        <JumpingClinicalLoader />
        <div className="space-y-2">
          <p className="text-lg font-black text-slate-900 tracking-tight uppercase italic animate-pulse">
            Accessing Clinic Module
          </p>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em]">
            Medoflow Clinical OS
          </p>
        </div>
      </div>
    </div>
  );
}
