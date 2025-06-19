import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useUser, UserProfile } from '@clerk/clerk-react';
import Sidebar from "../../components/Sidebar";
import MembersModal from "../../components/MembersWS";
import { Calendar, Eye, EyeOff, X } from "lucide-react";
import InvitePage from "../InvitePage";
import NewProjectButton from "../../components/NewProjectButton";
import RenderProjects from "../../components/RenderProjects";
import { motion, AnimatePresence } from 'framer-motion';

export default function WorkspaceDetail() {
  const { id } = useParams();
  const { user, isLoaded } = useUser();
  const url = import.meta.env.VITE_BACKEND_URL;

  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [members, setMembers] = useState([]);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);
  const [refreshFlag, setRefreshFlag] = useState(false);

  const reFreshFunc = () => {
    setRefreshFlag(!refreshFlag);
  };

  const getUserInitials = (name) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  useEffect(() => {
    const fetchWorkspaceDetails = async () => {
      if (!id || !isLoaded || !user) return;

      setLoading(true);
      try {
        const workspaceResponse = await fetch(`${url}/workspace/${id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!workspaceResponse.ok) {
          throw new Error('Failed to fetch workspace details');
        }

        const workspaceData = await workspaceResponse.json();
        setWorkspace(workspaceData.workspace);

        if (workspaceData.workspace.members && workspaceData.workspace.members.length > 0) {
          if (!workspaceData.workspace.members.some(memberId => memberId === user?.id) && workspaceData.workspace.visibility === 'private') {
            setError("This is a private Workspace");
            return;
          }

          const memberPromises = workspaceData.workspace.members.map(async (memberId) => {
            try {
              const memberResponse = await fetch(`${url}/user/${memberId}`, {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                },
              });

              if (!memberResponse.ok) {
                throw new Error(`Failed to fetch member ${memberId}`);
              }

              const data = await memberResponse.json();
              return data.user;
            } catch (err) {
              console.error(`Error fetching member ${memberId}:`, err);
              return { id: memberId, name: 'Unknown User', email: memberId, image: null };
            }
          });

          const memberDetails = await Promise.all(memberPromises);
          setMembers(memberDetails);
        } else {
          setMembers([]);
        }
      } catch (err) {
        console.error('Error fetching workspace:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkspaceDetails();
  }, [id, url, refreshFlag, isLoaded, user]);

  const handleMembersClick = () => {
    setIsMembersModalOpen(true);
  };

  const handleCloseMembersModal = () => {
    setIsMembersModalOpen(false);
  };

  const renderMemberAvatars = () => {
    if (!members || members.length === 0) {
      return (
        <div className="flex items-center text-gray-300">
          <span className="text-xs">No members</span>
        </div>
      );
    }

    const displayMembers = members.slice(0, 4);
    const remainingCount = members.length - 4;

    return (
      <div className="flex items-center space-x-1">
        <div className="flex -space-x-2">
          {displayMembers.map((member, index) => (
            <motion.div
              key={member.id || index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="relative w-8 h-8 rounded-full border-2 border-pink-500/50 shadow-sm overflow-hidden hover:scale-110 transition-transform duration-200"
              title={member.name || member.email || `Member ${index + 1}`}
            >
              {member.image ? (
                <img
                  src={member.image}
                  alt={member.name || 'Member'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    if (e.target.nextSibling) {
                      e.target.nextSibling.style.display = 'flex';
                    }
                  }}
                />
              ) : null}
              <div
                className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-600 to-pink-600 text-white text-xs font-medium"
                style={{ display: member.image ? 'none' : 'flex' }}
              >
                {getUserInitials(member.name || member.email)}
              </div>
            </motion.div>
          ))}
          {remainingCount > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: displayMembers.length * 0.1 }}
              className="relative w-8 h-8 rounded-full border-2 border-pink-500/50 shadow-sm bg-indigo-900/50 flex items-center justify-center hover:scale-110 transition-transform duration-200"
            >
              <span className="text-xs font-medium text-gray-300">
                +{remainingCount}
              </span>
            </motion.div>
          )}
        </div>
        <span className="ml-2 text-gray-300 text-xs">
          {members.length}
        </span>
      </div>
    );
  };

  if (!isLoaded || !user) {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-teal-900 flex items-center justify-center font-inter">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading workspace...</p>
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
          className="text-center glossy-card p-8 max-w-md w-full"
        >
          <div className="w-16 h-16 bg-pink-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-pink-500 text-2xl">⚠️</span>
          </div>
          <h2 className="text-lg font-semibold text-pink-400 mb-2">Unable to Load Workspace</h2>
          <p className="text-gray-300 text-sm">{error}</p>
        </motion.div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-teal-900 flex items-center justify-center font-inter">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center glossy-card p-8 max-w-md w-full"
        >
          <div className="w-20 h-20 bg-indigo-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-pink-400 text-3xl">🔍</span>
          </div>
          <h2 className="text-lg font-semibold text-pink-400 mb-2">Workspace Not Found</h2>
          <p className="text-gray-300 text-sm">This workspace doesn't exist or you don't have access to it.</p>
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
          .modern-button {
            background: linear-gradient(135deg, #0891b2, #0284c7, #2563eb);
            border: none;
            box-shadow: 0 8px 32px rgba(8, 145, 178, 0.4), 0 4px 16px rgba(0, 0, 0, 0.3);
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
            border-radius: 16px;
            color: white;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            backdrop-filter: blur(10px);
          }
          .modern-button:hover {
            transform: translateY(-4px) scale(1.02);
            box-shadow: 0 12px 40px rgba(8, 145, 178, 0.6), 0 8px 24px rgba(0, 0, 0, 0.4);
            background: linear-gradient(135deg, #0ea5e9, #3b82f6, #6366f1);
          }
          .modern-button:active {
            transform: translateY(-2px) scale(0.98);
          }
          .modern-button::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 200%;
            height: 100%;
            background: linear-gradient(
              90deg,
              transparent,
              rgba(255, 255, 255, 0.3),
              transparent
            );
            transition: all 0.6s ease;
          }
          .modern-button:hover::before {
            left: 100%;
          }
          .modern-button-primary {
            background: linear-gradient(135deg, #0891b2, #0284c7, #2563eb);
          }
          .modern-button-secondary {
            background: linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7);
            box-shadow: 0 8px 32px rgba(99, 102, 241, 0.4), 0 4px 16px rgba(0, 0, 0, 0.3);
          }
          .modern-button-secondary:hover {
            background: linear-gradient(135deg, #7c3aed, #a855f7, #c084fc);
            box-shadow: 0 12px 40px rgba(99, 102, 241, 0.6), 0 8px 24px rgba(0, 0, 0, 0.4);
          }
          .project-card {
            background: linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(59, 130, 246, 0.1));
            border: 1px solid rgba(6, 182, 212, 0.3);
            border-radius: 16px;
            padding: 1.5rem;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
          }
          .project-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 40px rgba(6, 182, 212, 0.3);
            border-color: rgba(6, 182, 212, 0.5);
          }
          .project-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(90deg, #06b6d4, #3b82f6, #6366f1);
          }
          .project-folder-icon {
            background: linear-gradient(135deg, #06b6d4, #3b82f6);
            width: 48px;
            height: 48px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 16px rgba(6, 182, 212, 0.3);
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
          .divider {
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
            margin: 2rem 0;
          }
        `}
      </style>
      <Sidebar currentActive={2} />
      <div className="flex-1 p-6 flex flex-col items-center">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="glossy-card p-8 w-full max-w-4xl mb-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative w-16 h-16 flex-shrink-0">
                {workspace.avatar ? (
                  <img
                    src={workspace.avatar}
                    alt={`${workspace.name} avatar`}
                    className="w-full h-full rounded-lg object-cover border border-pink-500/50 shadow-sm"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div
                  className="absolute inset-0 flex items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 text-white text-xl font-bold shadow-sm"
                  style={{ display: workspace.avatar ? 'none' : 'flex' }}
                >
                  {workspace.name ? workspace.name.charAt(0).toUpperCase() : 'W'}
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white truncate">
                  {workspace.name || 'Untitled Workspace'}
                </h1>
                <div className="flex items-center space-x-3 text-sm text-gray-300 mt-2">
                  <div className="flex items-center space-x-1">
                    {workspace.visibility === 'private' ? (
                      <EyeOff className="w-4 h-4 text-gray-300" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-300" />
                    )}
                    <span className="capitalize">{workspace.visibility || 'Private'}</span>
                  </div>
                  <span className='text-gray-400'>•</span>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4 text-gray-300" />
                    <span>{formatDate(workspace.createdAt)}</span>
                  </div>
                  <span className='text-gray-400'>•</span>
                  <div
                    className="flex items-center cursor-pointer hover:text-pink-400 transition-colors"
                    onClick={handleMembersClick}
                  >
                    {renderMemberAvatars()}
                  </div>
                </div>
              </div>
            </div>
            <motion.button
              onClick={() => setIsUserProfileOpen(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 text-gray-300 hover:text-pink-400 hover:bg-gray-100/20 rounded-full"
              title="User Profile"
            >
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-pink-500/50">
                {user?.imageUrl ? (
                  <img
                    src={user.imageUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white text-sm font-medium">
                    {getUserInitials(user?.firstName + ' ' + user?.lastName)}
                  </div>
                )}
              </div>
            </motion.button>
          </div>
          {workspace.description && (
            <>
              <div className="divider"></div>
              <p className="text-sm text-gray-300 leading-relaxed">
                {workspace.description}
              </p>
            </>
          )}
        </motion.div>

        {/* Projects Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="glossy-card p-8 w-full max-w-4xl mb-20"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white">Projects</h2>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-400 bg-gradient-to-r from-cyan-900/30 to-blue-900/30 px-3 py-1.5 rounded-full border border-cyan-500/20">
                  {workspace.projectIds?.length || 0} projects
                </span>
              </div>
            </div>
          </div>
          <div className="divider bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent"></div>
          <RenderProjects workspace={workspace} refreshFlag={refreshFlag} />
        </motion.div>

        {/* Floating Action Bar */}
        {isLoaded && workspace.members && workspace.members.some(memberId => memberId === user?.id) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="fixed bottom-8 right-8 flex flex-col gap-4 z-20"
          >
            <NewProjectButton
              reFresh={reFreshFunc}
              workspaceId={id}
              members={members}
              workspace={workspace}
              className="modern-button modern-button-primary flex items-center gap-3 px-6 py-4 shadow-2xl"
            />
            {user.id === workspace.userId && (
              <div className="flex justify-end">
                <InvitePage workspaceId={workspace._id} />
              </div>
            )}
          </motion.div>
        )}

        {/* User Profile Modal */}
        <AnimatePresence>
          {isUserProfileOpen && (
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
                className="glossy-dialog p-6 max-w-2xl w-full"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">User Profile</h3>
                  <motion.button
                    onClick={() => setIsUserProfileOpen(false)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 text-gray-300 hover:text-pink-400 hover:bg-gray-100/20 rounded-full"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>
                <UserProfile />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Members Modal */}
        <MembersModal
          isOpen={isMembersModalOpen}
          onClose={handleCloseMembersModal}
          members={members}
          workspace={workspace}
        />
      </div>
    </div>
  );
}