
'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbEllipsis } from '@/components/ui/breadcrumb';
import Link from 'next/link';

interface AdminPageLayoutProps {
    title: string;
    children: React.ReactNode;
    actions?: React.ReactNode;
}

// Helper to capitalize strings
const capitalize = (s: string) => {
    if (s === 'id') return 'ID';
    return s.charAt(0).toUpperCase() + s.slice(1);
}

export function AdminPageLayout({ title, children, actions }: AdminPageLayoutProps) {
    const pathname = usePathname();
    const pathSegments = pathname.split('/').filter(Boolean);

    const breadcrumbs = pathSegments.slice(1);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
        >
            <div className="flex items-start justify-between space-x-4 flex-col sm:flex-row sm:items-center">
                <div>
                     <Breadcrumb className="mb-2 hidden sm:flex">
                        <BreadcrumbList>
                             <BreadcrumbItem>
                                <BreadcrumbLink asChild>
                                    <Link href="/admin">Dashboard</Link>
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            {breadcrumbs.length > 1 && <BreadcrumbSeparator />}
                            {breadcrumbs.slice(0, -1).map((segment, index) => (
                                <React.Fragment key={segment}>
                                    <BreadcrumbItem>
                                        <BreadcrumbLink asChild>
                                            <Link href={`/${pathSegments.slice(0, index + 2).join('/')}`}>{capitalize(segment)}</Link>
                                        </BreadcrumbLink>
                                    </BreadcrumbItem>
                                    <BreadcrumbSeparator />
                                </React.Fragment>
                            ))}
                             <BreadcrumbItem>
                                <BreadcrumbPage>{title}</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">{title}</h1>
                </div>
                {actions && <div className="mt-4 sm:mt-0">{actions}</div>}
            </div>
            <div>
                {children}
            </div>
        </motion.div>
    );
}
