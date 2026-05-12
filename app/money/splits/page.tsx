'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, Plus, Trash2, CheckCircle2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import { createSplitGroup, markSplitShareAsSettled, deleteSplitGroup, fetchSplitGroups } from './actions';

interface Participant {
  name: string;
  amount: string;
}

export default function SplitsPage() {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [participants, setParticipants] = useState<Participant[]>([
    { name: 'You', amount: '' },
  ]);
  const [totalAmount, setTotalAmount] = useState('');
  const [deletingGroupId, setDeletingGroupId] = useState<number | null>(null);

  // Load groups on mount
  useEffect(() => {
    const loadGroups = async () => {
      try {
        const data = await fetchSplitGroups();
        setGroups(data || []);
      } catch (error) {
        console.error('Failed to load split groups:', error);
      } finally {
        setLoading(false);
      }
    };
    loadGroups();
  }, []);

  const handleAddParticipant = () => {
    setParticipants([...participants, { name: '', amount: '' }]);
  };

  const handleRemoveParticipant = (index: number) => {
    setParticipants(participants.filter((_, i) => i !== index));
  };

  const handleParticipantChange = (index: number, field: string, value: string) => {
    const updated = [...participants];
    updated[index] = { ...updated[index], [field]: value };
    setParticipants(updated);
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || !totalAmount || participants.length === 0) {
      alert('Please fill in all fields');
      return;
    }

    const totalAmountNum = parseFloat(totalAmount);
    const validParticipants = participants.filter((p) => p.name.trim() && p.amount);

    if (validParticipants.length === 0) {
      alert('Please add at least one participant');
      return;
    }

    try {
      const newGroup = await createSplitGroup({
        name: groupName,
        totalAmount: totalAmountNum,
        shares: validParticipants.map((p) => ({
          personName: p.name,
          amount: parseFloat(p.amount),
        })),
      });

      setGroups([newGroup, ...groups]);
      setGroupName('');
      setParticipants([{ name: 'You', amount: '' }]);
      setTotalAmount('');
      setFormOpen(false);
    } catch (error) {
      console.error('Failed to create split group:', error);
      alert('Failed to create split group');
    }
  };

  const handleMarkSettled = async (shareId: number, groupId: number) => {
    try {
      await markSplitShareAsSettled(shareId);
      // Update local state
      setGroups(
        groups.map((g) =>
          g.id === groupId
            ? {
                ...g,
                shares: g.shares.map((s: any) =>
                  s.id === shareId ? { ...s, settled: true } : s
                ),
              }
            : g
        )
      );
    } catch (error) {
      console.error('Failed to mark as settled:', error);
    }
  };

  const handleDeleteGroup = async (groupId: number) => {
    try {
      await deleteSplitGroup(groupId);
      setGroups(groups.filter((g) => g.id !== groupId));
      setDeletingGroupId(null);
    } catch (error) {
      console.error('Failed to delete split group:', error);
      alert('Failed to delete split group');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading split groups...</p>
      </div>
    );
  }

  // Calculate summary
  const summary = groups.reduce(
    (acc, group) => {
      group.shares.forEach((share: any) => {
        if (!share.settled) {
          if (share.personName === 'You') {
            acc.owed -= share.amount;
          } else {
            if (share.amount > 0) {
              acc.owe += share.amount;
            } else {
              acc.owed -= share.amount;
            }
          }
        }
      });
      return acc;
    },
    { owe: 0, owed: 0 }
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link
              href="/money"
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Split Expenses</h1>
          </div>
          <button
            onClick={() => setFormOpen(!formOpen)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-5 h-5" />
            New Split
          </button>
        </div>

        {/* Summary Cards */}
        {groups.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {summary.owe > 0 && (
              <Card className="bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-rose-600 dark:text-rose-400">
                      You Owe Total
                    </p>
                    <p className="text-2xl font-bold text-rose-700 dark:text-rose-300 mt-2">
                      ₹{summary.owe.toFixed(2)}
                    </p>
                  </div>
                  <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                </div>
              </Card>
            )}
            {summary.owed > 0 && (
              <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">
                      You Are Owed Total
                    </p>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-300 mt-2">
                      ₹{summary.owed.toFixed(2)}
                    </p>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Create Form */}
        {formOpen && (
          <Card className="mb-6 p-4 sm:p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Create New Split
            </h2>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Group Name
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g., Goa Trip, Dinner with friends"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Total Amount
                </label>
                <input
                  type="number"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Participants
                </label>
                <div className="space-y-2">
                  {participants.map((participant, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={participant.name}
                        onChange={(e) =>
                          handleParticipantChange(index, 'name', e.target.value)
                        }
                        placeholder="Name"
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="number"
                        value={participant.amount}
                        onChange={(e) =>
                          handleParticipantChange(index, 'amount', e.target.value)
                        }
                        placeholder="Amount"
                        step="0.01"
                        className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {participants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveParticipant(index)}
                          className="px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleAddParticipant}
                  className="mt-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add Participant
                </button>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                  Create Split
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setFormOpen(false);
                    setGroupName('');
                    setParticipants([{ name: 'You', amount: '' }]);
                    setTotalAmount('');
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </Card>
        )}

        {/* Split Groups List */}
        {groups.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No split groups yet. Create one to get started!
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {groups.map((group) => (
              <Card key={group.id} className="p-4 sm:p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {group.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Total: ₹{group.totalAmount.toFixed(2)}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete "${group.name}" split group? This cannot be undone.`)) {
                        handleDeleteGroup(group.id);
                      }
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                {/* Delete Confirmation */}
                {deletingGroupId === group.id && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mb-4">
                    <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                      Are you sure you want to delete "{group.name}"? This cannot be undone.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDeleteGroup(group.id)}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setDeletingGroupId(null)}
                        className="px-3 py-1 text-sm bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Participants */}
                <div className="space-y-2">
                  {group.shares.map((share: any) => (
                    <div
                      key={share.id}
                      className={`p-3 rounded-lg flex items-center justify-between ${
                        share.settled
                          ? 'bg-green-50 dark:bg-green-900/20'
                          : 'bg-gray-100 dark:bg-gray-800'
                      }`}
                    >
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {share.personName}
                        </p>
                        <p
                          className={`text-sm ${
                            share.amount > 0
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-green-600 dark:text-green-400'
                          }`}
                        >
                          {share.amount > 0 ? 'Owes' : 'Is owed'} ₹{Math.abs(share.amount).toFixed(2)}
                        </p>
                      </div>
                      {!share.settled && share.personName !== 'You' && (
                        <button
                          onClick={() => handleMarkSettled(share.id, group.id)}
                          className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                        >
                          Mark Settled
                        </button>
                      )}
                      {share.settled && (
                        <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="text-sm font-medium">Settled</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
