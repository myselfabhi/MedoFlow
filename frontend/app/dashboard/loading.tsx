import { JumpingClinicalLoader } from '@/components/common/JumpingClinicalLoader';

export default function DashboardLoading() {
  return (
    <div className="flex h-[calc(100vh-2rem)] w-full flex-col items-center justify-center">
      <div className="space-y-6 text-center">
        <JumpingClinicalLoader />
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-500 tracking-wider">
            Medoflow
          </p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
            Accessing Clinic Module
          </p>
        </div>
      </div>
    </div>
  );
}
