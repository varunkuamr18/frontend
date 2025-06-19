import React, { useState, useEffect } from 'react';
import { X, Mail, Copy, Trash2, Plus, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const InvitePage = ({ workspaceId }) => {
  const url = import.meta.env.VITE_BACKEND_URL;
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('create');
  const [email, setEmail] = useState('');
  const [sendViaEmail, setSendViaEmail] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [invitations, setInvitations] = useState([]);

  // Email validation regex
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Fetch invitations from backend
  useEffect(() => {
    const fetchInvites = async () => {
      try {
        const response = await fetch(`${url}/invite`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Failed to fetch invites: ${errText}`);
        }

        const { data } = await response.json();
        console.log('✅ Invites:', data);
        const newData = data.filter((item) => item.workspaceId === workspaceId.toString());
        setInvitations(
          newData.map((invite) => ({
            _id: invite._id,
            invitationCode: invite.invitationCode,
            workspaceId: invite.workspaceId,
            createdAt: new Date(invite.createdAt),
          }))
        );
      } catch (error) {
        console.error('❌ Error fetching invites:', error.message);
        setError('Failed to fetch invitations. Please try again.');
        setTimeout(() => setError(''), 3000);
      }
    };
    fetchInvites();
  }, [url, workspaceId]);

  // Generate new invite code
  const generateInviteCode = async () => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    const code = `INV-2025-${timestamp}${random}`.toUpperCase();

    console.log('Workspace ID:', workspaceId);
    console.log('Generated Code:', code);

    const data = {
      invitationCode: code,
      workspaceId: workspaceId.toString(),
    };

    try {
      const res = await fetch(`${url}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Invite creation failed: ${err}`);
      }

      const response = await res.json();
      const newInvite = response.data || response;
      console.log('Invite created successfully:', newInvite);
      setInvitations((prev) => [
        {
          _id: newInvite._id,
          invitationCode: newInvite.invitationCode,
          workspaceId: newInvite.workspaceId,
          createdAt: new Date(newInvite.createdAt),
          updatedAt: newInvite.updatedAt ? new Date(newInvite.updatedAt) : new Date(newInvite.createdAt),
        },
        ...prev,
      ]);
      return newInvite.invitationCode;
    } catch (error) {
      console.error('Error generating invite code:', error);
      setError('Failed to create invitation. Please try again.');
      setTimeout(() => setError(''), 3000);
      return null;
    }
  };

  // Delete invitation
  const deleteInvitation = async (invitationCode) => {
    try {
      const res = await fetch(`${url}/invite/${invitationCode}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Failed to delete invitation: ${err}`);
      }

      setInvitations((prev) => prev.filter((inv) => inv.invitationCode !== invitationCode));
      setMessage('Invitation deleted successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting invitation:', error);
      setError('Failed to delete invitation. Please try again.');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Handle create invitation (without email)
  const handleCreateInvitation = async () => {
    const code = await generateInviteCode();
    if (code) {
      setMessage('✅ New invitation code has been created for this workspace!');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  // Handle create invitation with email
  const handleCreateInvitationViaEmail = async () => {
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      const code = await generateInviteCode();
      if (!code) {
        throw new Error('Failed to generate invite code.');
      }
      console.log('Sending invite:', { code, email, workspaceId });

      const res = await fetch(`${url}/send-invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, email, workspaceId: workspaceId.toString() }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || 'Failed to send email.');
      }

      setMessage('✅ Invitation sent successfully!');
      setEmail('');
      setSendViaEmail(false);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('❌ Error:', error.message);
      setError(error.message || 'Something went wrong.');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Handle delete invitation
  const handleDeleteInvitation = (invitationCode) => {
    deleteInvitation(invitationCode);
  };

  // Copy to clipboard
  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    setMessage('📋 Invitation code copied to clipboard!');
    setTimeout(() => setMessage(''), 2000);
  };

  return (
    <div>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          .font-inter {
            font-family: 'Inter', 'Roboto', sans-serif;
          }
          .glossy-card {
            background: rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(15px);
            border: 1px solid rgba(255, 255, 255, 0.3);
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.25), inset 0 1px 2px rgba(255, 255, 255, 0.4);
            border-radius: 20px;
            position: relative;
            overflow: hidden;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          }
          .glossy-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 12px 48px rgba(0, 0, 0, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.5);
          }
          .glossy-card::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: linear-gradient(
              45deg,
              rgba(255, 255, 255, 0.3),
              rgba(255, 255, 255, 0.1),
              rgba(255, 255, 255, 0.3)
            );
            transform: rotate(45deg);
            animation: glossy 6s linear infinite;
          }
          @keyframes glossy {
            0% { transform: translateX(-50%) rotate(45deg); }
            100% { transform: translateX(50%) rotate(45deg); }
          }
          .glossy-button {
            background: linear-gradient(135deg, #ec4899, #8b5cf6);
            border: none;
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.5);
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
            border-radius: 12px;
          }
          .glossy-button:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5), inset 0 1px 2px rgba(255, 255, 255, 0.6);
          }
          .glossy-button::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 200%;
            height: 100%;
            background: linear-gradient(
              90deg,
              transparent,
              rgba(255, 255, 255, 0.4),
              transparent
            );
            transition: all 0.5s ease;
          }
          .glossy-button:hover::before {
            left: 100%;
          }
        `}
      </style>

      {/* Trigger Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="glossy-button text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium"
      >
        <Mail size={16} />
        Invite
      </motion.button>

      {/* Popup Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-inter"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glossy-card rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex"
            >
              {/* Sidebar (Tabs) */}
              <div className="w-40 bg-gray-900/50 p-4 flex flex-col gap-2 border-r border-white/10">
                <motion.button
                  onClick={() => setActiveTab('create')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`glossy-button text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 ${
                    activeTab === 'create' ? 'bg-purple-600/50' : ''
                  }`}
                >
                  <Plus size={16} />
                  Create
                </motion.button>
                <motion.button
                  onClick={() => setActiveTab('view')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`glossy-button text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 ${
                    activeTab === 'view' ? 'bg-purple-600/50' : ''
                  }`}
                >
                  <Eye size={16} />
                  View ({invitations.length})
                </motion.button>
              </div>

              {/* Content Area */}
              <div className="flex-1 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                  <h2 className="text-xl font-semibold text-white">Invitation Management</h2>
                  <motion.button
                    onClick={() => setIsOpen(false)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    <X size={24} />
                  </motion.button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                  {/* Messages */}
                  {message && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mb-4 p-3 glossy-card border border-green-300/50 text-green-300 rounded-xl"
                    >
                      {message}
                    </motion.div>
                  )}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mb-4 p-3 glossy-card border border-red-300/50 text-red-300 rounded-xl"
                    >
                      {error}
                    </motion.div>
                  )}

                  {/* Create Tab */}
                  {activeTab === 'create' && (
                    <div className="relative space-y-6">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glossy-card p-6 rounded-xl max-w-sm mx-auto"
                      >
                        <div className="space-y-4">
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              id="sendEmail"
                              checked={sendViaEmail}
                              onChange={(e) => setSendViaEmail(e.target.checked)}
                              className="w-4 h-4 text-purple-600 bg-gray-800/50 border-gray-600 rounded focus:ring-purple-500"
                            />
                            <label htmlFor="sendEmail" className="text-gray-300 font-medium">
                              Send via email
                            </label>
                          </div>

                          {sendViaEmail && (
                            <div className="space-y-2">
                              <label className="block text-sm font-medium text-gray-300">
                                Email Address
                              </label>
                              <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter email address"
                                className="w-full glossy-card px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-xl"
                              />
                            </div>
                          )}
                        </div>
                      </motion.div>

                      <motion.button
                        onClick={sendViaEmail ? handleCreateInvitationViaEmail : handleCreateInvitation}
                        disabled={sendViaEmail && !isValidEmail(email)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="absolute top-0 right-0 glossy-button text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus size={16} />
                        Create Invitation
                      </motion.button>
                    </div>
                  )}

                  {/* View All Tab */}
                  {activeTab === 'view' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                      <h3 className="text-lg font-semibold text-white mb-4">All Invitation Codes</h3>

                      {invitations.length === 0 ? (
                        <div className="text-center py-8 text-gray-300">
                          <Mail size={48} className="mx-auto mb-4 text-gray-400" />
                          <p>No invitation codes created yet</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {invitations.map((invite) => (
                            <motion.div
                              key={invite._id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="glossy-card rounded-xl p-4 flex items-center justify-between"
                            >
                              <div className="flex-1">
                                <code className="bg-gray-800/50 px-2 py-1 rounded text-sm font-mono text-white">
                                  {invite.invitationCode}
                                </code>
                                <div className="text-sm text-gray-300 mt-2">
                                  Created: {invite.createdAt.toLocaleDateString()}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <motion.button
                                  onClick={() => copyToClipboard(invite.invitationCode)}
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  className="glossy-button text-white p-2 rounded-xl"
                                  title="Copy to clipboard"
                                >
                                  <Copy size={16} />
                                </motion.button>
                                <motion.button
                                  onClick={() => handleDeleteInvitation(invite.invitationCode)}
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  className="glossy-button bg-red-600/50 text-white p-2 rounded-xl"
                                  title="Delete invitation"
                                >
                                  <Trash2 size={16} />
                                </motion.button>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InvitePage;