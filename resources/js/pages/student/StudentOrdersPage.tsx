import React, { useEffect, useState } from 'react';
import { apiClient, formatBDT } from '../../api/client';
import { Order } from '../../types';
import { ShoppingCart, Clock, CheckCircle2, XCircle, FileText, Receipt } from 'lucide-react';

export const StudentOrdersPage: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const { data } = await apiClient.get('/orders/my-orders');
            setOrders(data.data || []);
        } catch {}
        finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="py-24 text-center text-slate-400 dark:text-slate-500 text-xs font-semibold">
                Loading order records...
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
                        <Receipt className="w-6 h-6 text-[#A60201]" />
                        <span>My Order History</span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        All your course enrollments, payments, and invoice transactions
                    </p>
                </div>
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-50 dark:bg-[#A60201]/10 border border-red-200/80 dark:border-[#A60201]/30 text-[#A60201] dark:text-red-300 text-xs font-bold self-start sm:self-auto">
                    <span>Total Invoices: {orders.length}</span>
                </div>
            </div>

            <div className="bg-white dark:bg-[#0A0404] rounded-3xl border border-slate-200/80 dark:border-white/[0.08] shadow-xs dark:shadow-[0_4px_30px_rgba(0,0,0,0.5)] overflow-hidden transition-colors">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-white/[0.03] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100 dark:border-white/[0.08]">
                            <tr>
                                <th className="py-4 px-6">Order #</th>
                                <th className="py-4 px-4">Course Name</th>
                                <th className="py-4 px-4">Amount Paid</th>
                                <th className="py-4 px-4">Payment Method</th>
                                <th className="py-4 px-4">Status</th>
                                <th className="py-4 px-6 text-right">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06] text-slate-700 dark:text-slate-300 font-medium">
                            {orders.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-16 text-center text-slate-400 dark:text-slate-500">
                                        <div className="max-w-xs mx-auto space-y-2">
                                            <ShoppingCart className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                                            <p className="font-semibold text-slate-600 dark:text-slate-400">No order history found</p>
                                            <p className="text-[11px] text-slate-400 dark:text-slate-500">When you enroll in courses, your billing invoices will appear here.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors">
                                        <td className="py-4 px-6 font-mono font-bold text-slate-900 dark:text-white">
                                            {order.order_number}
                                        </td>
                                        <td className="py-4 px-4 font-bold text-slate-900 dark:text-white max-w-xs truncate">
                                            {order.course?.title}
                                        </td>
                                        <td className="py-4 px-4 font-bold text-[#A60201] dark:text-red-400">
                                            {formatBDT(order.final_amount)}
                                        </td>
                                        <td className="py-4 px-4 uppercase text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                                            {order.payment_method.replace('manual_', '')}
                                        </td>
                                        <td className="py-4 px-4">
                                            {order.payment_status === 'paid' ? (
                                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                                                    Paid
                                                </span>
                                            ) : order.payment_status === 'pending' ? (
                                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30">
                                                    Pending
                                                </span>
                                            ) : (
                                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30">
                                                    Cancelled
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-right text-slate-400 dark:text-slate-500">
                                            {new Date(order.created_at).toLocaleDateString('en-US')}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
