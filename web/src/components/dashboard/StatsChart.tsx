import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DashboardStats } from '@/types/dashboard.types';

interface Props {
  stats: DashboardStats | null;
}

export default function StatsChart({ stats }: Props) {
  if (!stats) return <div className="text-gray-500 text-center py-8">No data available</div>;

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
          <p className="text-gray-600 text-sm">Total Events</p>
          <p className="text-3xl font-bold text-blue-600">{stats.totalEvents}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
          <p className="text-gray-600 text-sm">Total Transactions</p>
          <p className="text-3xl font-bold text-green-600">{stats.totalTransactions}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
          <p className="text-gray-600 text-sm">Revenue</p>
          <p className="text-3xl font-bold text-purple-600">Rp {stats.revenueByMonth.reduce((sum, m) => sum + m.revenue, 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Month</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stats.revenueByMonth}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
            <Legend />
            <Bar dataKey="revenue" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Events by Day Chart */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Events by Day</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stats.eventsByDay}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="day" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
            <Legend />
            <Bar dataKey="count" fill="#06b6d4" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}