import React, { useState, useEffect } from 'react';
import {
  Settings,
  Users,
  Eye,
  EyeOff,
  Trash2,
  Save,
  X,
  Crown,
  UserMinus,
  AlertTriangle,
  Camera,
  Globe,
  Lock,
  Calendar,
  FolderOpen,
  Shield,
  Edit3,
  UserCheck
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import Sidebar from '../../components/Sidebar';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const WorkspaceSettings = () => {
  const { id } = useParams();
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const url = import.meta.env.VITE_BACKEND_URL;
  const [workspace, setWorkspace] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreator, setIsCreator] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [editedAvatar, setEditedAvatar] = useState('');
  const [editedVisibility, setEditedVisibility] = useState('private');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [selectedTransferUser, setSelectedTransferUser] = useState('');

  useEffect(() => {
    if (!isLoaded || !user) return;
    fetchWorkspaceData();
  }, [isLoaded, user, url, id]);

  const fetchWorkspaceData = async () => {
    try {
      setLoading(true);
      const workspaceDataResp = await fetch(`${url}/workspace/${id}`);
      const workspaceData = await workspaceDataResp.json();
      if (!workspaceData.success) throw new Error('Failed to fetch workspace');
      const workspace = workspaceData.workspace;
      setWorkspace(workspace);

      const membersPromises = workspace.members.map(async (memberId) => {
        const userResp = await fetch(`${url}/user/${memberId}`);
        const userData = await userResp.json();
        return userData.user;
      });
      const membersData = await Promise.all(membersPromises);
      setMembers(membersData);

      setIsCreator(user.id === workspace.userId);
      setEditedName(workspace.name);
      setEditedDescription(workspace.description);
      setEditedAvatar(workspace.avatar);
      setEditedVisibility(workspace.visibility);
    } catch (err) {
      setError('Failed to load workspace data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!isCreator) {
      toast.error('Only the workspace owner can edit settings');
      return;
    }
    try {
      const updatedWorkspace = {
        name: editedName,
        description: editedDescription,
        avatar: editedAvatar,
        visibility: editedVisibility
      };
      const response = await fetch(`${url}/workspace/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedWorkspace)
      });
      if (!response.ok) throw new Error('Failed to update workspace');
      const data = await response.json();
      setWorkspace(data.data);
      setIsEditing(false);
      toast.success('Workspace updated successfully!');
    } catch (err) {
      toast.error('Failed to update workspace: ' + err.message);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!isCreator) {
      toast.error('Only the workspace owner can remove members');
      return;
    }
    if (memberId === workspace.userId) {
      toast.error('Cannot remove workspace owner');
      return;
    }
    if (workspace.projectIds.length > 0) {
      toast.error('Cannot remove members while projects exist');
      return;
    }
    try {
      const updatedMembers = workspace.members.filter(id => id !== memberId);
      const response = await fetch(`${url}/workspace/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ members: updatedMembers })
      });
      if (!response.ok) throw new Error('Failed to remove member');
      const data = await response.json();
      setWorkspace(data.workspace);
      setMembers(members.filter(member => member.id !== memberId));
      toast.success('Member removed successfully!');
    } catch (err) {
      toast.error('Failed to remove member: ' + err.message);
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!isCreator) {
      toast.error('Only the workspace owner can delete the workspace');
      return;
    }
    if (deleteConfirmation !== workspace.name) {
      toast.error('Please type the workspace name exactly to confirm deletion');
      return;
    }
    try {
      const response = await fetch(`${url}/workspace/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete workspace');
      toast.success('Workspace deleted successfully!');
      navigate('/dashboard');
    } catch (err) {
      toast.error('Failed to delete workspace: ' + err.message);
    }
  };

  const handleTransferOwnership = async () => {
    if (!isCreator) {
      toast.error('Only the workspace owner can transfer ownership');
      return;
    }
    if (!selectedTransferUser) {
      toast.error('Please select a user to transfer ownership to');
      return;
    }
    try {
      const response = await fetch(`${url}/workspace/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedTransferUser })
      });
      if (!response.ok) throw new Error('Failed to transfer ownership');
      const data = await response.json();
      setWorkspace(data.data);
      setIsCreator(user.id === data.data.userId);
      setShowTransferDialog(false);
      setSelectedTransferUser('');
      toast.success('Ownership transferred successfully!');
    } catch (err) {
      toast.error('Failed to transfer ownership: ' + err.message);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-teal-900 flex items-center justify-center font-inter">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading user data...</p>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-teal-900 flex items-center justify-center font-inter">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <AlertTriangle className="w-12 h-12 text-pink-500 mx-auto mb-4" />
          <p className="text-pink-500 text-lg">Please sign in to access workspace settings</p>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-teal-900 flex items-center justify-center font-inter">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading workspace settings...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-teal-900 flex items-center justify-center font-inter">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <AlertTriangle className="w-12 h-12 text-pink-500 mx-auto mb-4" />
          <p className="text-pink-500 text-lg">{error}</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-teal-900 text-white font-inter">
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
            color: white;
            padding: 0.75rem 1.5rem;
            font-weight: 500;
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
          .glossy-button-danger {
            background: linear-gradient(135deg, #ef4444, #b91c1c);
          }
          .glossy-button-success {
            background: linear-gradient(135deg, #10b981, #059669);
          }
          .glossy-button-secondary {
            background: linear-gradient(135deg, #6b7280, #4b5563);
          }
          .glossy-button-warning {
            background: linear-gradient(135deg, #eab308, #ca8a04);
          }
          .glossy-input {
            background: rgba(255, 255, 255, 0.15);
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 12px;
            color: white;
            transition: all 0.3s ease;
            padding: 0.75rem 1rem;
            width: 100%;
            font-size: 0.875rem;
          }
          .glossy-input:focus {
            outline: none;
            border-color: #ec4899;
            box-shadow: 0 0 6px rgba(236, 72, 153, 0.4);
          }
          .glossy-dialog {
            background: rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(15px);
            border: 1px solid rgba(255, 255, 255, 0.3);
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.25), inset 0 1px 2px rgba(255, 255, 255, 0.4);
            border-radius: 20px;
            max-width: 28rem;
            width: 100%;
          }
          .member-card {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 12px;
            transition: all 0.3s ease;
          }
          .member-card:hover {
            background: rgba(255, 255, 255, 0.2);
            border-color: rgba(255, 255, 255, 0.3);
          }
          .owner-badge {
            background: rgba(234, 179, 8, 0.2);
            color: #fef3c7;
            border-radius: 9999px;
            padding: 0.25rem 0.75rem;
            font-size: 0.75rem;
            font-weight: 500;
          }
          .divider {
            height: 1px;
            background: rgba(255, 255, 255, 0.2);
            margin: 1.5rem 0;
          }
        `}
      </style>
      <Sidebar currentActive={4} />
      <div className="p-6 w-full flex flex-col items-center">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-center mb-8 border-b-2 border-pink-500/30 pb-5 w-full max-w-2xl"
        >
          <h1 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
            Workspace Settings
          </h1>
        </motion.div>

        {/* Workspace Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glossy-card p-6 w-full max-w-2xl mb-6"
        >
          <h2 className="text-lg font-semibold mb-4 text-white">Workspace Information</h2>
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="relative flex-shrink-0">
              <img
                src={isEditing ? editedAvatar : workspace.avatar}
                alt={workspace.name}
                className="w-32 h-32 rounded-2xl object-cover border border-pink-500/50 shadow-lg"
              />
              {isEditing && (
                <button className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center hover:bg-black/70 transition-all">
                  <Camera className="w-8 h-8 text-pink-400" />
                </button>
              )}
            </div>
            <div className="flex-1 space-y-4">
              {isEditing ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Workspace Name</label>
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="glossy-input"
                      placeholder="Workspace Name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                    <textarea
                      value={editedDescription}
                      onChange={(e) => setEditedDescription(e.target.value)}
                      rows={4}
                      className="glossy-input"
                      placeholder="Workspace Description"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Avatar URL</label>
                    <input
                      type="url"
                      value={editedAvatar}
                      onChange={(e) => setEditedAvatar(e.target.value)}
                      className="glossy-input"
                      placeholder="Avatar URL"
                    />
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-white">{workspace.name}</h2>
                  <p className="text-gray-300">{workspace.description}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-300">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>Created {formatDate(workspace.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FolderOpen className="w-4 h-4" />
                      <span>{workspace.projectIds.length} projects</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* Visibility */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="glossy-card p-6 w-full max-w-2xl mb-6"
        >
          <h3 className="text-lg font-semibold mb-4 text-white">Visibility</h3>
          {isEditing ? (
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  value="private"
                  checked={editedVisibility === 'private'}
                  onChange={(e) => setEditedVisibility(e.target.value)}
                  className="w-4 h-4 text-pink-600 bg-gray-900 border-pink-500/50 focus:ring-pink-600"
                />
                <Lock className="w-5 h-5 text-gray-300" />
                <div>
                  <div className="font-medium text-white">Private</div>
                  <div className="text-sm text-gray-300">Only invited members can access</div>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  value="public"
                  checked={editedVisibility === 'public'}
                  onChange={(e) => setEditedVisibility(e.target.value)}
                  className="w-4 h-4 text-pink-600 bg-gray-900 border-pink-500/50 focus:ring-pink-600"
                />
                <Globe className="w-5 h-5 text-gray-300" />
                <div>
                  <div className="font-medium text-white">Public</div>
                  <div className="text-sm text-gray-300">Anyone can view and join</div>
                </div>
              </label>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {workspace.visibility === 'private' ? (
                <>
                  <Lock className="w-5 h-5 text-gray-300" />
                  <div>
                    <div className="font-medium text-white">Private Workspace</div>
                    <div className="text-sm text-gray-300">Only invited members can access</div>
                  </div>
                </>
              ) : (
                <>
                  <Globe className="w-5 h-5 text-gray-300" />
                  <div>
                    <div className="font-medium text-white">Public Workspace</div>
                    <div className="text-sm text-gray-300">Anyone can view and join</div>
                  </div>
                </>
              )}
            </div>
          )}
        </motion.div>

        {/* Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="glossy-card p-6 w-full max-w-2xl mb-6"
        >
          <h3 className="text-lg font-semibold mb-4 text-white">Statistics</h3>
          <div className="space-y-3 text-gray-300">
            <div className="flex justify-between">
              <span>Total Members</span>
              <span className="font-semibold text-white">{workspace.members.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Active Projects</span>
              <span className="font-semibold text-white">{workspace.projectIds.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Created</span>
              <span className="font-semibold text-white">{formatDate(workspace.createdAt)}</span>
            </div>
          </div>
        </motion.div>

        {/* Members */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="glossy-card p-6 w-full max-w-2xl mb-20"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Members ({members.length})</h3>
            <Users className="w-5 h-5 text-gray-300" />
          </div>
          <div className="divider"></div>
          <div className="space-y-3">
            {members.map((member, index) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="member-card p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img
                      src={member.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random`}
                      alt={member.name}
                      className="w-12 h-12 rounded-full object-cover border border-pink-500/50"
                    />
                    {member.id === workspace.userId && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                        <Crown className="w-3 h-3 text-gray-900" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{member.name}</span>
                      {member.id === workspace.userId && (
                        <span className="owner-badge">Owner</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-300">{member.email}</div>
                  </div>
                </div>
                {isCreator && member.id !== workspace.userId && (
                  <div className="flex gap-2">
                    <motion.button
                      onClick={() => {
                        setSelectedTransferUser(member.id);
                        setShowTransferDialog(true);
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2 text-yellow-400 hover:bg-gray-100/20 rounded-lg"
                      title="Transfer ownership"
                    >
                      <UserCheck className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      onClick={() => handleRemoveMember(member.id)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2 text-pink-500 hover:bg-gray-100/20 rounded-lg"
                      title="Remove member"
                    >
                      <UserMinus className="w-4 h-4" />
                    </motion.button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Non-Creator Message */}
        {!isCreator && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="glossy-card p-6 text-center w-full max-w-2xl mb-20"
          >
            <Shield className="w-8 h-8 text-pink-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-pink-400 mb-1">View Only Access</h3>
            <p className="text-sm text-gray-300">Only the owner can modify workspace settings.</p>
          </motion.div>
        )}

        {/* Floating Action Bar */}
        {isCreator && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="fixed bottom-6 right-6 flex flex-row gap-3 z-20"
          >
            {isEditing ? (
              <>
                <motion.button
                  onClick={handleSaveChanges}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="glossy-button glossy-button-success flex items-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  <span>Save Changes</span>
                </motion.button>
                <motion.button
                  onClick={() => setIsEditing(false)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="glossy-button glossy-button-secondary flex items-center gap-2"
                >
                  <X className="w-5 h-5" />
                  <span>Cancel</span>
                </motion.button>
              </>
            ) : (
              <motion.button
                onClick={() => setIsEditing(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="glossy-button flex items-center gap-2"
              >
                <Edit3 className="w-5 h-5" />
                <span>Edit</span>
              </motion.button>
            )}
            <motion.button
              onClick={() => {
                if (workspace.projectIds.length === 0) {
                  setShowDeleteDialog(true);
                } else {
                  toast.error(`Delete the ${workspace.projectIds.length} project(s) to proceed`);
                }
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="glossy-button glossy-button-danger flex items-center gap-2"
            >
              <Trash2 className="w-5 h-5" />
              <span>Delete Workspace</span>
            </motion.button>
          </motion.div>
        )}

        {/* Delete Confirmation Dialog */}
        <AnimatePresence>
          {showDeleteDialog && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/60"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="glossy-dialog p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-pink-600/20 rounded-full">
                    <AlertTriangle className="w-5 h-5 text-pink-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Delete Workspace</h3>
                </div>
                <p className="text-sm text-gray-300 mb-4">
                  This action is irreversible. Type <strong>{workspace.name}</strong> to confirm deletion.
                </p>
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  className="glossy-input mb-6"
                  placeholder="Enter workspace name"
                />
                <div className="flex justify-end gap-3">
                  <motion.button
                    onClick={() => {
                      setShowDeleteDialog(false);
                      setDeleteConfirmation('');
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="glossy-button glossy-button-secondary flex items-center gap-2"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    onClick={handleDeleteWorkspace}
                    disabled={deleteConfirmation !== workspace.name}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="glossy-button glossy-button-danger flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Delete
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Transfer Ownership Dialog */}
        <AnimatePresence>
          {showTransferDialog && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/60"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="glossy-dialog p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-yellow-600/20 rounded-full">
                    <UserCheck className="w-5 h-5 text-yellow-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Transfer Ownership</h3>
                </div>
                <p className="text-sm text-gray-300 mb-4">
                  Transferring ownership will revoke your owner privileges.
                </p>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Select new owner</label>
                  <select
                    value={selectedTransferUser}
                    onChange={(e) => setSelectedTransferUser(e.target.value)}
                    className="glossy-input"
                  >
                    <option value="" className="bg-gray-900 text-white">Select a member</option>
                    {members
                      .filter(member => member.id !== workspace.userId)
                      .map(member => (
                        <option key={member.id} value={member.id} className="bg-gray-900 text-white">
                          {member.name} ({member.email})
                        </option>
                      ))}
                  </select>
                </div>
                <div className="flex justify-end gap-3">
                  <motion.button
                    onClick={() => {
                      setShowTransferDialog(false);
                      setSelectedTransferUser('');
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="glossy-button glossy-button-secondary flex items-center gap-2"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    onClick={handleTransferOwnership}
                    disabled={!selectedTransferUser}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="glossy-button glossy-button-warning flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Transfer
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default WorkspaceSettings;