import React, { useState } from 'react';
import { Transaction } from '@/types/dashboard.types';
import { acceptTransaction, rejectTransaction } from '@/services/dashboard.service';
import { toast } from 'sonner';
import { HiCheckCircle, HiXCircle, HiEye } from 'react-icons/hi2';

interface Props {
  transactions: Transaction[];
  onUpdate: (transactions: Transaction[]) => void;
}

export default function TransactionList({ transactions, onUpdate }: Props) {
  const [viewProof, setViewProof] = useState<string | null>(null);

  const handleAccept = async (id: string) => {
    try {
      await acceptTransaction(id);
      const updated = transactions.map(t =>
        t.id === id ? { ...t, status: 'done' as const } : t
      );
      onUpdate(updated);
      toast.success('Transaction accepted!');
    } catch (error) {
      toast.error('Failed to accept transaction');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectTransaction(id);
      const updated = transactions.map(t =>
        t.id === id ? { ...t, status: 'rejected' as const } : t
      );
      onUpdate(updated);
      toast.success('Transaction rejected!');
    } catch (error) {
      toast.error('Failed to reject transaction');
    }
  };

  return (
    <div className="space-y-4">
      {transactions.map(tx => (
        <div key={tx.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-600">Status</p>
              <p className="font-semibold text-gray-900 capitalize">{tx.status}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Amount</p>
              <p className="font-semibold text-gray-900">Rp {(tx.totalPrice || 0).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">User</p>
              <p className="font-semibold text-gray-900">{tx.user?.name || tx.userId?.slice(0, 8)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Date</p>
              <p className="font-semibold text-gray-900">{new Date(tx.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Payment Proof */}
          {tx.paymentProof && (
            <button
              onClick={() => setViewProof(tx.paymentProof)}
              className="text-blue-600 hover:text-blue-900 flex items-center space-x-2 mb-4"
            >
              <HiEye className="w-4 h-4" />
              <span>View proof</span>
            </button>
          )}

          {/* Actions */}
          {tx.status === 'waiting_confirmation' && (
            <div className="flex space-x-2">
              <button
                onClick={() => handleAccept(tx.id)}
                className="flex items-center space-x-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <HiCheckCircle className="w-4 h-4" />
                <span>Accept</span>
              </button>
              <button
                onClick={() => handleReject(tx.id)}
                className="flex items-center space-x-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <HiXCircle className="w-4 h-4" />
                <span>Reject</span>
              </button>
            </div>
          )}
        </div>
      ))}

      {/* Image Modal */}
      {viewProof && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <img src={viewProof} alt="Payment proof" className="w-full rounded-lg" />
            <button
              onClick={() => setViewProof(null)}
              className="mt-4 w-full px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}