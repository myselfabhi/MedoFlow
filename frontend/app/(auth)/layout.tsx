import Link from 'next/link';
import { AppLogo } from '@/components/common/AppLogo';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      {/* Left side: Hero/Branding (Hidden on mobile) */}
      <div className="hidden md:flex md:w-1/2 bg-[#fafafa] relative overflow-hidden items-center justify-center p-12">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-accent blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary-400 blur-[100px]" />
        </div>

        <div className="relative z-10 max-w-md space-y-8 text-center lg:text-left">
          <Link href="/" className="inline-block">
            <AppLogo size="lg" animated />
          </Link>
          <div className="space-y-4">
            <h1 className="text-4xl lg:text-5xl font-bold font-display text-slate-900 leading-tight tracking-tight">
              Clinical precision. <br />
              <span className="text-slate-400">Operational excellence.</span>
            </h1>
            <p className="text-lg text-slate-500 leading-relaxed">
              The modern operating system for premium self-pay clinics. Join hundreds of providers delivering better outcomes.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 pt-8">
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-2">
              <p className="text-2xl font-bold font-display text-slate-900">100%</p>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">HIPAA Compliant</p>
            </div>
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-2">
              <p className="text-2xl font-bold font-display text-slate-900">24/7</p>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Patient Access</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-[#fafafa] md:bg-white">
        <div className="w-full max-w-[400px] space-y-8">
          <div className="md:hidden text-center mb-8">
            <Link href="/">
              <AppLogo size="md" />
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

