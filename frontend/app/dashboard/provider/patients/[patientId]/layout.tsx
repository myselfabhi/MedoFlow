'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';

export default function ProviderPatientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const params = useParams();
    const pathname = usePathname();
    const patientId = params.patientId as string;

    const base = `/dashboard/provider/patients/${patientId}`;
    const tabs = [
        { href: `${base}/plans`, label: 'Treatment Plans' },
        { href: `${base}/timeline`, label: 'Timeline' },
    ];

    return (
        <div>
            <nav className="mb-6 flex gap-1 border-b border-border">
                {tabs.map(({ href, label }) => (
                    <Link
                        key={href}
                        href={href}
                        className={`border-b-2 px-4 py-2 text-sm font-medium transition ${
                            pathname === href
                                ? 'border-accent text-accent'
                                : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
                        }`}
                    >
                        {label}
                    </Link>
                ))}
            </nav>
            {children}
        </div>
    );
}
