
'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

interface AdminPageLayoutProps {
    title: string;
    children: React.ReactNode;
    actions?: React.ReactNode;
}

// Helper to capitalize strings
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function AdminPageLayout({ title, children, actions }: AdminPageLayoutProps) {
    const pathname = usePathname();
    const pathSegments = pathname.split('/').filter(Boolean); // Filter out empty strings

    // Build breadcrumbs dynamically from the path
    const breadcrumbs = pathSegments.slice(1, -1).map((segment, index) => {
        const href = `/${pathSegments.slice(0, index + 2).join('/')}`;
        return { label: capitalize(segment), href };
    });

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
                                <BreadcrumbLink href="/admin">Dashboard</BreadcrumbLink>
                            </BreadcrumbItem>
                            {breadcrumbs.map((crumb, index) => (
                                <React.Fragment key={crumb.href}>
                                    <BreadcrumbSeparator />
                                    <BreadcrumbItem>
                                        <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
                                    </BreadcrumbItem>
                                </React.Fragment>
                            ))}
                             <BreadcrumbSeparator />
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
