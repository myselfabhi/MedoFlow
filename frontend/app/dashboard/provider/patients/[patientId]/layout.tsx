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
            <nav className="mb-6 flex gap-1 border-b border-gray-200">
                {tabs.map(({ href, label }) => (
                    <Link
                        key={href}
                        href={href}
                        className={`border-b-2 px-4 py-2 text-sm font-medium transition ${
                            pathname === href
                                ? 'border-primary-600 text-primary-600'
                                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
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
