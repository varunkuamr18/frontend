import React, { useState, useEffect } from 'react';
import {
  Settings,
  Users,
  Trash2,
  Save,
  X,
  AlertTriangle,
  Calendar,
  Shield,
  Edit3,
  UserPlus,
  UserMinus,
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import Sidebar from '../../components/Sidebar';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const ProjectSettings = () => {
  const { id, work_id } = useParams();
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const url = import.meta.env.VITE_BACKEND_URL;
  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [workspaceInfo, setWorkspaceInfo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [editedStartDate, setEditedStartDate] = useState('');
  const [editedEndDate, setEditedEndDate] = useState('');
  const [editedColorCode, setEditedColorCode] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [selectedNewMember, setSelectedNewMember] = useState('');
  const [selectedNewMemberRole, setSelectedNewMemberRole] = useState('Viewer');
  const [availableUsers, setAvailableUsers] = useState([]);

  useEffect(() => {
    if (!isLoaded || !user) return;
    fetchProjectData();
    fetchWorkspace();
  }, [isLoaded, user, url, id, work_id]);

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      const projectDataResp = await fetch(`${url}/project/${id}`);
      const projectData = await projectDataResp.json();
      if (!projectData.success) throw new Error('Failed to fetch project');
      const project = projectData.project;
      setProject(project);

      const membersPromises = project.members.map(async (member) => {
        const userResp = await fetch(`${url}/user/${member.id}`);
        const userData = await userResp.json();
        return { ...userData.user, role: member.role };
      });
      const membersData = await Promise.all(membersPromises);
      setMembers(membersData);

      const currentMember = project.members.find((m) => m.id === user.id);
      setIsAdmin(currentMember?.role === 'Admin');

      setEditedName(project.projectName);
      setEditedDescription(project.projectDescription);
      setEditedStartDate(project.startDate.split('T')[0]);
      setEditedEndDate(project.endDate.split('T')[0]);
      setEditedColorCode(project.colorCode);
    } catch (err) {
      setError(err.message || 'Failed to load project data');
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkspace = async () => {
    try {
      setLoading(true);
      const data = await fetch(`${url}/workspace/${work_id}`);
      const newData = await data.json();
      if (!newData.workspace) throw new Error('Failed to fetch workspace');
      setWorkspaceInfo(newData.workspace);
      const userData = [];
      for (let i = 0; i < newData.workspace.members.length; i++) {
        const userDatas = await fetch(`${url}/user/${newData.workspace.members[i]}`);
        const data = await userDatas.json();
        userData.push(data.user);
      }
      setAvailableUsers(userData);
    } catch (error) {
      setError(error.message || 'Failed to load workspace data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!isAdmin) {
      toast.error('Only Admins can edit project settings');
      return;
    }

    if (new Date(editedStartDate) >= new Date(editedEndDate)) {
      toast.error('Start date must be before end date');
      return;
    }

    try {
      const updatedProject = {
        projectName: editedName,
        projectDescription: editedDescription,
        startDate: new Date(editedStartDate).toISOString(),
        endDate: new Date(editedEndDate).toISOString(),
        colorCode: editedColorCode,
      };

      const response = await fetch(`${url}/project/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProject),
      });

      if (!response.ok) throw new Error('Failed to update project');

      const data = await response.json();
      if (!data.project) throw new Error('Invalid response: project data missing');
      setProject(data.project);
      setIsEditing(false);
      toast.success('Project updated successfully!');
    } catch (err) {
      console.error('Error updating project:', err);
      toast.error('Failed to update project: ' + (err.message || 'Unknown error'));
      fetchProjectData();
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!isAdmin) {
      toast.error('Only Admins can remove members');
      return;
    }

    if (memberId === user.id) {
      toast.error('You cannot remove yourself');
      return;
    }

    try {
      const updatedMembers = project.members.filter((m) => m.id !== memberId);
      const response = await fetch(`${url}/project/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ members: updatedMembers }),
      });

      if (!response.ok) throw new Error('Failed to remove member');

      const data = await response.json();
      if (!data.project) throw new Error('Invalid response: project data missing');
      setProject(data.project);
      setMembers(members.filter((m) => m.id !== memberId));
      toast.success('Member removed successfully!');
    } catch (err) {
      toast.error('Failed to remove member: ' + (err.message || 'Unknown error'));
    }
  };

  const handleChangeRole = async (memberId, newRole) => {
    if (!isAdmin) {
      toast.error('Only Admins can change roles');
      return;
    }

    try {
      const updatedMembers = project.members.map((m) =>
        m.id === memberId ? { ...m, role: newRole } : m
      );
      const response = await fetch(`${url}/project/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ members: updatedMembers }),
      });

      if (!response.ok) throw new Error('Failed to update role');

      const data = await response.json();
      if (!data.project) throw new Error('Invalid response: project data missing');
      setProject(data.project);
      setMembers(members.map((m) => (m.id === memberId ? { ...m, role: newRole } : m)));
      toast.success('Role updated successfully!');
    } catch (err) {
      toast.error('Failed to update role: ' + (err.message || 'Unknown error'));
    }
  };

  const handleAddMember = async () => {
    if (!isAdmin) {
      toast.error('Only Admins can add members');
      return;
    }

    if (new Date(project.startDate) >= new Date(project.endDate)) {
      toast.error('Cannot add members: Start date must be before end date');
      return;
    }

    if (!selectedNewMember) {
      toast.error('Please select a user to add');
      return;
    }

    if (project.members.some((m) => m.id === selectedNewMember)) {
      toast.error('User is already a member of the project');
      return;
    }

    try {
      const updatedMembers = [
        ...project.members,
        { id: selectedNewMember, role: selectedNewMemberRole },
      ];
      const response = await fetch(`${url}/project/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ members: updatedMembers }),
      });

      if (!response.ok) throw new Error('Failed to add member');

      const data = await response.json();
      if (!data.project) throw new Error('Invalid response: project data missing');
      setProject(data.project);

      const userResp = await fetch(`${url}/user/${selectedNewMember}`);
      const userData = await userResp.json();
      setMembers([...members, { ...userData.user, role: selectedNewMemberRole }]);

      setShowAddMemberDialog(false);
      setSelectedNewMember('');
      setSelectedNewMemberRole('Viewer');
      toast.success('Member added successfully!');
    } catch (err) {
      toast.error('Failed to add member: ' + (err.message || 'Unknown error'));
    }
  };

  const handleDeleteProject = async () => {
    if (!isAdmin) {
      toast.error('Only Admins can delete the project');
      return;
    }

    if (deleteConfirmation !== project.projectName) {
      toast.error('Please type the project name exactly to confirm deletion');
      return;
    }

    try {
      for (let i = 0; i < project.taskIds.length; i++) {
        const response = await fetch(`${url}/task/${project.taskIds[i]}`, {
          method: 'DELETE',
        });
        if (!response.ok) throw new Error(`Failed to delete task with id ${project.taskIds[i]}`);
      }

      const fetchWorkspaceData = await fetch(`${url}/workspace/${work_id}`);
      const workspaceData = await fetchWorkspaceData.json();
      const updatedProjectIds = workspaceData.workspace.projectIds.filter(
        (projId) => projId !== id
      );

      const updateWorkspaceResponse = await fetch(`${url}/workspace/${work_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectIds: updatedProjectIds }),
      });

      if (!updateWorkspaceResponse.ok) throw new Error('Failed to update workspace projectIds');

      const deleteProjectResponse = await fetch(`${url}/project/${id}`, {
        method: 'DELETE',
      });

      if (!deleteProjectResponse.ok) throw new Error('Failed to delete project');

      toast.success('Project deleted successfully!');
      navigate('/workspaces');
    } catch (err) {
      toast.error('Failed to delete project: ' + (err.message || 'Unknown error'));
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }) || 'Invalid Date';
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
          <p className="text-pink-500 text-lg">Please sign in to access project settings</p>
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
          <p className="text-gray-300">Loading project settings...</p>
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

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-teal-900 flex items-center justify-center font-inter">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <AlertTriangle className="w-12 h-12 text-pink-500 mx-auto mb-4" />
          <p className="text-pink-500 text-lg">Project data not found</p>
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
          .role-badge {
            background: rgba(236, 72, 153, 0.2);
            color: #ec4899;
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
          className="flex items-center justify-center mb-8 border-b-2 border-pink-500/30 pb-5 w-full max-w-5xl"
        >
          <h1 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
            Project Settings
          </h1>
        </motion.div>

        {/* Project Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glossy-card p-6 w-full max-w-2xl mb-6"
        >
          <h2 className="text-lg font-semibold mb-4 text-white">Project Information</h2>
          <div className="flex gap-6">
            <div
              className="w-20 h-20 rounded-lg flex items-center justify-center text-white text-xl font-bold"
              style={{ backgroundColor: project.colorCode }}
            >
              {project.projectName[0]?.toUpperCase()}
            </div>
            <div className="flex-1 space-y-4">
              {isEditing ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="glossy-input"
                      placeholder="Project Name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                    <textarea
                      value={editedDescription}
                      onChange={(e) => setEditedDescription(e.target.value)}
                      rows={3}
                      className="glossy-input"
                      placeholder="Project Description"
                    />
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-300 mb-1">Start Date</label>
                      <input
                        type="date"
                        value={editedStartDate}
                        onChange={(e) => setEditedStartDate(e.target.value)}
                        className="glossy-input"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-300 mb-1">End Date</label>
                      <input
                        type="date"
                        value={editedEndDate}
                        onChange={(e) => setEditedEndDate(e.target.value)}
                        className="glossy-input"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Color</label>
                    <input
                      type="color"
                      value={editedColorCode}
                      onChange={(e) => setEditedColorCode(e.target.value)}
                      className="glossy-input h-10"
                    />
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-medium text-white">{project.projectName}</h3>
                  <p className="text-sm text-gray-300">{project.projectDescription}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-300 mt-2">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(project.startDate)} - {formatDate(project.endDate)}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="glossy-card p-6 w-full max-w-2xl mb-6"
        >
          <h2 className="text-lg font-semibold mb-4 text-white">Statistics</h2>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-300">Members</p>
              <p className="font-medium text-white">{project.members.length}</p>
            </div>
            <div>
              <p className="text-gray-300">Tasks</p>
              <p className="font-medium text-white">{project.taskIds.length}</p>
            </div>
            <div>
              <p className="text-gray-300">Created</p>
              <p className="font-medium text-white">{formatDate(project.createdAt)}</p>
            </div>
          </div>
        </motion.div>

        {/* Members */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="glossy-card p-6 w-full max-w-2xl mb-20"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Members ({members.length})</h3>
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
                <div className="flex items-center gap-3">
                  <img
                    src={member.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random`}
                    alt={member.name}
                    className="w-10 h-10 rounded-full object-cover border border-pink-500/50"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-white">{member.name}</span>
                      <span className="role-badge">{member.role}</span>
                    </div>
                    <p className="text-xs text-gray-300">{member.email}</p>
                  </div>
                </div>
                {isAdmin && member.id !== user.id && (
                  <div className="flex items-center gap-2">
                    <select
                      value={member.role}
                      onChange={(e) => handleChangeRole(member.id, e.target.value)}
                      className="glossy-input text-sm py-1 px-2 text-white"
                    >
                      <option value="Admin" className="bg-gray-900 text-white">Admin</option>
                      <option value="Contributor" className="bg-gray-900 text-white">Contributor</option>
                      <option value="Viewer" className="bg-gray-900 text-white">Viewer</option>
                    </select>
                    <motion.button
                      onClick={() => handleRemoveMember(member.id)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2 text-pink-500 hover:bg-gray-100/20 rounded-lg"
                    >
                      <UserMinus className="w-4 h-4" />
                    </motion.button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Non-Admin Message */}
        {!isAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="glossy-card p-6 text-center w-full max-w-2xl mb-20"
          >
            <Shield className="w-8 h-8 text-pink-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-pink-400 mb-1">View Only Access</h3>
            <p className="text-sm text-gray-300">Only admins can modify project settings.</p>
          </motion.div>
        )}

        {/* Floating Action Bar */}
        {isAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="fixed bottom-6 right-6 flex flex-row gap-3 z-20"
          >
            <motion.button
              onClick={() => setShowAddMemberDialog(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="glossy-button glossy-button-success flex items-center gap-2"
            >
              <UserPlus className="w-5 h-5" />
              <span>Add Member</span>
            </motion.button>
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
              onClick={() => setShowDeleteDialog(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="glossy-button glossy-button-danger flex items-center gap-2"
            >
              <Trash2 className="w-5 h-5" />
              <span>Delete Project</span>
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
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-pink-600/20 rounded-full">
                      <AlertTriangle className="w-5 h-5 text-pink-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Delete Project</h3>
                  </div>
                  <motion.button
                    onClick={() => {
                      setShowDeleteDialog(false);
                      setDeleteConfirmation('');
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-1 text-gray-300 hover:bg-gray-200/20 rounded-full"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>
                <p className="text-sm text-gray-300 mb-4">
                  This action cannot be undone. Type <strong>{project.projectName}</strong> to confirm deletion.
                </p>
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  className="glossy-input mb-6"
                  placeholder="Enter project name"
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
                    onClick={handleDeleteProject}
                    disabled={deleteConfirmation !== project.projectName}
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

        {/* Add Member Dialog */}
        <AnimatePresence>
          {showAddMemberDialog && (
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
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-600/20 rounded-full">
                      <UserPlus className="w-5 h-5 text-green-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Add Member</h3>
                  </div>
                  <motion.button
                    onClick={() => {
                      setShowAddMemberDialog(false);
                      setSelectedNewMember('');
                      setSelectedNewMemberRole('Viewer');
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-1 text-gray-300 hover:bg-gray-200/20 rounded-full"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>
                <p className="text-sm text-gray-300 mb-4">Select a user to add to the project.</p>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-1">User</label>
                  <select
                    value={selectedNewMember}
                    onChange={(e) => setSelectedNewMember(e.target.value)}
                    className="glossy-input"
                  >
                    <option value="" className="bg-gray-900 text-white">Select a user</option>
                    {availableUsers
                      .filter((u) => !project.members.some((m) => m.id === u.id))
                      .map((user) => (
                        <option key={user.id} value={user.id} className="bg-gray-900 text-white">
                          {user.name} ({user.email})
                        </option>
                      ))}
                  </select>
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Role</label>
                  <select
                    value={selectedNewMemberRole}
                    onChange={(e) => setSelectedNewMemberRole(e.target.value)}
                    className="glossy-input"
                  >
                    <option value="Admin" className="bg-gray-900 text-white">Admin</option>
                    <option value="Contributor" className="bg-gray-900 text-white">Contributor</option>
                    <option value="Viewer" className="bg-gray-900 text-white">Viewer</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3">
                  <motion.button
                    onClick={() => {
                      setShowAddMemberDialog(false);
                      setSelectedNewMember('');
                      setSelectedNewMemberRole('Viewer');
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="glossy-button glossy-button-secondary flex items-center gap-2"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    onClick={handleAddMember}
                    disabled={!selectedNewMember}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="glossy-button glossy-button-success flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add
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

export default ProjectSettings;