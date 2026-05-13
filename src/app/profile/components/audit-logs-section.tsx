"use client";

import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Search, Filter, History, Calendar as CalendarIcon, User as UserIcon, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { PaginationControls } from "@/components/pagination-controls";
import type { AuditLog } from '@/lib/types';
import { cn } from "@/lib/utils";

interface AuditLogsSectionProps {
    logs: AuditLog[];
    loading: boolean;
}

export function AuditLogsSection({ logs, loading }: AuditLogsSectionProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterUser, setFilterUser] = useState('all');
    const [filterResourceType, setFilterResourceType] = useState('all');
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const getActionBadgeColor = (actionName: string) => {
        switch (actionName) {
            case 'created':
            case 'restored':
                return "bg-green-500/10 text-green-500 border-green-500/20";
            case 'updated':
            case 'status_changed':
                return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
            case 'deleted':
            case 'archived':
                return "bg-rose-500/10 text-rose-500 border-rose-500/20";
            case 'auth_update':
                return "bg-cyan-500/10 text-cyan-500 border-cyan-500/20";
            default:
                return "bg-slate-500/10 text-slate-400 border-slate-500/20";
        }
    };

    const uniqueUsers = useMemo(() => {
        const users = new Set(logs.map(log => log.actorName));
        return Array.from(users);
    }, [logs]);

    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            // Search query matches resource name or details
            const matchesSearch = !searchQuery || 
                log.resourceName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                log.details?.toLowerCase().includes(searchQuery.toLowerCase());
            
            // User filter
            const matchesUser = filterUser === 'all' || log.actorName === filterUser;
            
            // Resource Type filter
            const matchesType = filterResourceType === 'all' || log.resourceType === filterResourceType;
            
            // Date Range Filter
            let matchesDate = true;
            if (dateRange?.from) {
                const logDate = log.createdAt?.toDate?.() || log.createdAt;
                if (logDate) {
                    const date = new Date(logDate);
                    if (dateRange.to) {
                        matchesDate = date >= dateRange.from && date <= dateRange.to;
                    } else {
                        matchesDate = date >= dateRange.from;
                    }
                }
            }

            return matchesSearch && matchesUser && matchesType && matchesDate;
        });
    }, [logs, searchQuery, filterUser, filterResourceType, dateRange]);

    const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
    const currentLogs = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredLogs.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredLogs, currentPage, itemsPerPage]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 space-y-4 border rounded-xl bg-card/50">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading audit logs...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-end justify-between px-1">
                <div className="space-y-1">
                    <h2 className="text-2xl font-headline font-bold flex items-center gap-3">
                        <History className="h-6 w-6 text-primary" /> Audit Logs
                    </h2>
                    <p className="text-sm text-muted-foreground">Review system activity, authentication updates, and inventory changes. Logs are retained for 90 days.</p>
                </div>
                <Badge variant="secondary" className="mb-1">
                    {filteredLogs.length} logs
                </Badge>
            </div>

            <div className="bg-card/50 backdrop-blur-xl border border-white/5 rounded-xl p-4">
                <div className="flex flex-col md:flex-row gap-4 items-center flex-wrap">
                    <div className="relative flex-grow md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search resource name or details..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="pl-10 h-10 bg-background/50 border-white/10"
                        />
                    </div>
                    
                    <Select value={filterUser} onValueChange={(val) => { setFilterUser(val); setCurrentPage(1); }}>
                        <SelectTrigger className="h-10 w-[180px] bg-background/50 border-white/10">
                            <SelectValue placeholder="All Users" />
                        </SelectTrigger>
                        <SelectContent className="bg-background/95 backdrop-blur-xl border-white/10">
                            <SelectItem value="all">All Users</SelectItem>
                            {uniqueUsers.map(user => (
                                <SelectItem key={user} value={user}>{user}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={filterResourceType} onValueChange={(val) => { setFilterResourceType(val); setCurrentPage(1); }}>
                        <SelectTrigger className="h-10 w-[180px] bg-background/50 border-white/10">
                            <SelectValue placeholder="All Resources" />
                        </SelectTrigger>
                        <SelectContent className="bg-background/95 backdrop-blur-xl border-white/10">
                            <SelectItem value="all">All Resources</SelectItem>
                            <SelectItem value="Part">Parts</SelectItem>
                            <SelectItem value="Prebuilt">Prebuilts</SelectItem>
                            <SelectItem value="Order">Orders</SelectItem>
                            <SelectItem value="User">Users</SelectItem>
                            <SelectItem value="System">System</SelectItem>
                        </SelectContent>
                    </Select>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                id="date"
                                variant={"outline"}
                                className={cn(
                                    "h-10 w-[260px] justify-start text-left font-normal bg-background/50 border-white/10",
                                    !dateRange && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateRange?.from ? (
                                    dateRange.to ? (
                                        <>
                                            {format(dateRange.from, "LLL dd, y")} -{" "}
                                            {format(dateRange.to, "LLL dd, y")}
                                        </>
                                    ) : (
                                        format(dateRange.from, "LLL dd, y")
                                    )
                                ) : (
                                    <span>Pick a date range</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-background border-white/10" align="end">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={dateRange?.from}
                                selected={dateRange}
                                onSelect={(range) => {
                                    setDateRange(range);
                                    setCurrentPage(1);
                                }}
                                numberOfMonths={2}
                                classNames={{
                                    months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                                    head_row: "flex w-full justify-between",
                                    head_cell: "text-muted-foreground rounded-md w-8 font-normal text-[0.7rem] uppercase",
                                }}
                            />
                        </PopoverContent>
                    </Popover>
                    
                    {(searchQuery || filterUser !== 'all' || filterResourceType !== 'all' || dateRange) && (
                        <Button 
                            variant="ghost" 
                            onClick={() => {
                                setSearchQuery('');
                                setFilterUser('all');
                                setFilterResourceType('all');
                                setDateRange(undefined);
                                setCurrentPage(1);
                            }}
                            className="text-xs h-10 hover:bg-destructive/10 hover:text-destructive"
                        >
                            Reset Filters
                        </Button>
                    )}
                </div>

                <div className="mt-6 border border-white/5 rounded-lg overflow-hidden bg-background/50">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-b border-white/5 hover:bg-transparent">
                                <TableHead className="w-[180px]">Date & Time</TableHead>
                                <TableHead className="w-[120px]">Action</TableHead>
                                <TableHead className="w-[180px]">User</TableHead>
                                <TableHead className="w-[120px]">Resource Type</TableHead>
                                <TableHead>Resource Details</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {currentLogs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                        No audit logs found matching your criteria.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                currentLogs.map((log) => (
                                    <TableRow key={log.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                            {log.createdAt?.toDate ? format(log.createdAt.toDate(), "PP p") : 'Unknown'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge 
                                                variant="outline" 
                                                className={cn(
                                                    "capitalize font-medium text-[10px] px-2 py-0.5 h-auto rounded-md border whitespace-nowrap", 
                                                    getActionBadgeColor(log.actionName)
                                                )}
                                            >
                                                {log.actionName.replace('_', ' ')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            <div className="flex items-center gap-2">
                                                <UserIcon className="h-3 w-3 text-muted-foreground" />
                                                <span className="truncate max-w-[140px]" title={log.actorEmail || log.actorName}>{log.actorName}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="bg-white/5 font-normal">
                                                {log.resourceType}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-sm font-medium text-slate-200">{log.resourceName}</span>
                                                {log.details && (
                                                    <span className="text-xs text-muted-foreground italic">{log.details}</span>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
                
                <div className="mt-4">
                    <PaginationControls
                        currentPage={currentPage}
                        totalPages={totalPages}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                        onItemsPerPageChange={(val) => {
                            setItemsPerPage(val);
                            setCurrentPage(1);
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
