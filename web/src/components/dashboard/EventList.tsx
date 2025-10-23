import React, { useState } from 'react';
import { Event } from '@/types/dashboard.types';
import { updateEvent } from '@/services/dashboard.service';
import { toast } from 'sonner';
import { HiPencil, HiTrash } from 'react-icons/hi2';

interface Props {
  events: Event[];
  onUpdate: (events: Event[]) => void;
}

export default function EventList({ events, onUpdate }: Props) {
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Event>>({});

  const handleEdit = async () => {
    if (!editId) return;
    try {
      await updateEvent(editId, editData);
      const updated = events.map(e => (e.id === editId ? { ...e, ...editData } : e));
      onUpdate(updated);
      toast.success('Event updated!');
      setEditId(null);
    } catch (error) {
      toast.error('Failed to update event');
    }
  };

  return (
    <div className="space-y-4">
      {events.map(event => (
        <div key={event.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
          {editId === event.id ? (
            <div className="space-y-3">
              <input
                type="text"
                value={editData.name || ''}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black"
                placeholder="Event name"
              />
              <input
                type="number"
                value={editData.availableSeats || ''}
                onChange={(e) => setEditData({ ...editData, availableSeats: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black"
                placeholder="Available seats"
              />
              <div className="flex space-x-2">
                <button onClick={handleEdit} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                  Save
                </button>
                <button onClick={() => setEditId(null)} className="px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{event.name}</h3>
                <p className="text-gray-600">{event.startDate ? new Date(event.startDate).toLocaleDateString() : 'N/A'}</p>
                <p className="text-sm text-gray-500">Location: {event.location}</p>
                <p className="text-sm text-gray-500">Available seats: {event.availableSeats}</p>
              </div>
              <button
                onClick={() => {
                  setEditId(event.id);
                  setEditData(event);
                }}
                className="text-blue-600 hover:text-blue-900 p-2"
              >
                <HiPencil className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}