
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import Link from 'next/link';

interface AdminPageLayoutProps {
    title: string;
    children: React.ReactNode;
    actions?: React.ReactNode;
    breadcrumbs?: Array<{ label: string; href: string }>;
}

export function AdminPageLayout({ title, children, actions, breadcrumbs }: AdminPageLayoutProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
        >
            <div className="flex items-center justify-between space-x-4">
                <div>
                     {breadcrumbs && breadcrumbs.length > 0 && (
                        <Breadcrumb className="hidden md:flex mb-2">
                            <BreadcrumbList>
                                 <BreadcrumbItem>
                                    <BreadcrumbLink asChild>
                                        <Link href="/admin">Dashboard</Link>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                {breadcrumbs.map((crumb, index) => (
                                    <React.Fragment key={crumb.href}>
                                        <BreadcrumbSeparator />
                                        <BreadcrumbItem>
                                            <BreadcrumbLink asChild>
                                                <Link href={crumb.href}>{crumb.label}</Link>
                                            </BreadcrumbLink>
                                        </BreadcrumbItem>
                                    </React.Fragment>
                                ))}
                                <BreadcrumbSeparator />
                                 <BreadcrumbItem>
                                    <BreadcrumbPage>{title}</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                     )}
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">{title}</h1>
                </div>
                {actions && <div>{actions}</div>}
            </div>
            <div>
                {children}
            </div>
        </motion.div>
    );
}
