import { useEffect, useState } from 'react';
import { UserButton, useUser, useAuth } from '@clerk/clerk-react';
import AddButton from '../components/AddButton';
import Sidebar from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';
import { Check, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Mock AddButton for debugging (replace with actual implementation)
const MockAddButton = () => (
  <button className="glossy-button px-4 py-2 text-white rounded-lg">Create Workspace</button>
);

// JoinButton Component
const JoinButton = ({ reFreshFunc }) => {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const url = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [code, setCode] = useState('');
  const [validationState, setValidationState] = useState('idle');
  const [workspaceName, setWorkspaceName] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [workspaceData, setWorkspaceData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const handleJoinWorkSpaceViaCode = () => {
    console.log('Join button clicked, isLoaded:', isLoaded, 'user:', !!user);
    if (!isLoaded || !user) {
      setErrorMessage('User data is not loaded. Please try again or sign in.');
      return;
    }
    setIsPopupOpen(true);
    setCode('');
    setValidationState('idle');
    setShowConfirmation(false);
    setWorkspaceName('');
    setErrorMessage('');
  };

  const handleClosePopup = () => {
    console.log('Closing popup');
    setIsPopupOpen(false);
    setCode('');
    setValidationState('idle');
    setShowConfirmation(false);
    setWorkspaceName('');
    setWorkspaceData(null);
    setErrorMessage('');
    setIsJoining(false);
  };

  const handleValidateCode = async () => {
    const trimmedCode = code.trim();
    if (!trimmedCode) {
      setErrorMessage('Please enter a valid invitation code.');
      setValidationState('invalid');
      return;
    }

    setValidationState('validating');
    setErrorMessage('');

    try {
      const token = await getToken();
      console.log('Validating code:', trimmedCode);
      const inviteResp = await fetch(`${url}/invite/${trimmedCode}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!inviteResp.ok) {
        const errorData = await inviteResp.json().catch(() => ({}));
        console.error('Invite fetch error:', errorData);
        setValidationState('invalid');
        setErrorMessage(errorData.message || 'Invalid invitation code. Please try again.');
        return;
      }

      const inviteData = await inviteResp.json();
      console.log('Invite data:', inviteData);
      const workspaceId = inviteData.data?.workspaceId || inviteData.workspaceId;

      if (!workspaceId) {
        throw new Error('No workspace ID found in invite data');
      }

      const workspaceResp = await fetch(`${url}/workspace/${workspaceId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!workspaceResp.ok) {
        const errorData = await workspaceResp.json().catch(() => ({}));
        console.error('Workspace fetch error:', errorData);
        setValidationState('invalid');
        setErrorMessage(errorData.message || 'Unable to fetch workspace details.');
        return;
      }

      const workspaceResponse = await workspaceResp.json();
      const workspace = workspaceResponse.workspace || workspaceResponse;
      console.log('Workspace data:', workspace);
      setWorkspaceData(workspace);

      if (workspace.members?.includes(user.id)) {
        setValidationState('invalid');
        setErrorMessage('You are already a member of this workspace.');
        return;
      }

      setValidationState('valid');
      setWorkspaceName(workspace.name || 'Unnamed Workspace');
      setShowConfirmation(true);
    } catch (error) {
      console.error('Validation error:', error.message);
      setValidationState('invalid');
      setErrorMessage('An error occurred while validating the code: ' + error.message);
    }
  };

  const handleJoinWorkspace = async () => {
    if (!workspaceData) {
      setErrorMessage('No workspace data available.');
      return;
    }

    if (!user?.id) {
      setErrorMessage('User data is not available. Please sign in again.');
      return;
    }

    setIsJoining(true);
    setErrorMessage('');

    try {
      const token = await getToken();
      console.log('Joining workspace:', workspaceData._id, 'with user:', user.id);
      const response = await fetch(`${url}/workspace/${workspaceData._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...workspaceData,
          members: [...(workspaceData.members || []), user.id],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Join workspace error:', errorData);
        throw new Error(errorData.message || 'Failed to join workspace');
      }

      const updatedWorkspace = await response.json();
      console.log('Successfully joined workspace:', updatedWorkspace);

      try {
        console.log('Deleting invitation:', code);
        const inviteDeleteResponse = await fetch(`${url}/invite/${code.trim()}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!inviteDeleteResponse.ok) {
          const errorData = await inviteDeleteResponse.json().catch(() => ({}));
          console.error('Invite deletion error:', errorData);
          console.warn('Failed to delete invite, continuing...');
        } else {
          const result = await inviteDeleteResponse.json();
          console.log('✅ Invitation deleted successfully:', result.message || result);
        }
      } catch (error) {
        console.error('❌ Error deleting the invitation:', error.message);
      }

      reFreshFunc();
      setIsPopupOpen(false);
    } catch (error) {
      console.error('Join workspace error:', error.message);
      setErrorMessage(error.message || 'Unable to join the workspace. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  const getValidationIcon = () => {
    switch (validationState) {
      case 'validating':
        return <Loader2 className="w-4 h-4 animate-spin text-pink-400" />;
      case 'valid':
        return <Check className="w-4 h-4 text-green-400" />;
      case 'invalid':
        return <X className="w-4 h-4 text-pink-400" />;
      default:
        return null;
    }
  };

  const getValidationText = () => {
    switch (validationState) {
      case 'validating':
        return <span className="text-pink-400 text-sm">Validating code...</span>;
      case 'valid':
        return <span className="text-green-400 text-sm">Code is valid!</span>;
      case 'invalid':
        return <span className="text-pink-400 text-sm">{errorMessage || 'Invalid code. Please try again.'}</span>;
      default:
        return null;
    }
  };

  if (!isLoaded) {
    return <div className="text-pink-400 text-sm font-inter">Loading user data...</div>;
  }

  if (!user) {
    return <div className="text-pink-400 text-sm font-inter">Please sign in to join a workspace.</div>;
  }

  console.log('Rendering JoinButton'); // Debug log

  return (
    <div>
      <motion.button
        onClick={handleJoinWorkSpaceViaCode}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="glossy-button flex items-center space-x-2 px-4 py-2 text-sm font-inter"
        aria-label="Join workspace"
      >
        <svg viewBox="0 0 16 16" fill="currentColor" height={16} width={16} xmlns="http://www.w3.org/2000/svg">
          <path d="M8 1a.5.5 0 0 1 .5.5V7.5H14a.5.5 0 0 1 0 1H8.5V14a.5.5 0 0 1-1 0V8.5H2a.5.5 0 0 1 0-1h5.5V1.5A.5.5 0 0 1 8 1z" />
        </svg>
        <span>Join Workspace</span>
      </motion.button>

      {errorMessage && !isPopupOpen && (
        <div className="mt-2 text-pink-400 text-sm">{errorMessage}</div>
      )}

      {isPopupOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-60 p-4 font-inter"
        >
          <div className="glossy-card rounded-2xl p-6 w-full max-w-sm mx-4" role="dialog" aria-label="Join workspace modal">
            <button
              onClick={handleClosePopup}
              className="absolute top-4 right-4 text-pink-400 hover:text-pink-300 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            {!showConfirmation ? (
              <>
                <h2 className="text-lg font-semibold text-white mb-3">Join Workspace</h2>
                <p className="text-gray-400 text-sm mb-4">Enter the invitation code to join a workspace.</p>

                <div className="mb-4">
                  <label htmlFor="workspaceCode" className="block text-xs font-medium text-white mb-1">
                    Invitation Code
                  </label>
                  <div className="relative">
                    <input
                      id="workspaceCode"
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value.trim())}
                      placeholder="Enter code"
                      className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-pink-400 focus:border-transparent text-sm"
                      disabled={validationState === 'validating'}
                      aria-describedby="validation-status"
                    />
                    {validationState !== 'idle' && (
                      <div className="absolute right-3 top-2.5">{getValidationIcon()}</div>
                    )}
                  </div>
                </div>

                {validationState !== 'idle' && (
                  <div id="validation-status" className="mb-3 flex items-center gap-2 text-sm">
                    {getValidationText()}
                  </div>
                )}

                {validationState === 'valid' && workspaceName && (
                  <div className="mb-3 p-2 bg-green-600/20 border border-green-600/50 rounded-lg text-sm text-green-400">
                    Workspace: {workspaceName}
                  </div>
                )}

                {errorMessage && (
                  <div className="mb-3 text-pink-400 text-sm">{errorMessage}</div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={handleClosePopup}
                    className="flex-1 px-3 py-2 text-sm text-pink-400 border border-pink-400/50 rounded-lg hover:bg-indigo-900/50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleValidateCode}
                    disabled={!code.trim() || validationState === 'validating'}
                    className="flex-1 px-3 py-2 text-sm glossy-button disabled:bg-indigo-900/30 disabled:cursor-not-allowed"
                  >
                    {validationState === 'validating' ? 'Validating...' : 'Validate'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Check className="w-6 h-6 text-green-400" />
                  </div>

                  <h2 className="text-lg font-semibold text-white mb-2">Join Workspace?</h2>
                  <p className="text-gray-400 text-sm mb-2">You're about to join:</p>
                  <p className="text-base font-medium text-white mb-4">{workspaceName}</p>

                  {errorMessage && (
                    <div className="mb-3 text-pink-400 text-sm">{errorMessage}</div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={handleClosePopup}
                      className="flex-1 px-3 py-2 text-sm text-pink-400 border border-pink-400/50 rounded-lg hover:bg-indigo-900/50 transition-colors"
                      disabled={isJoining}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleJoinWorkspace}
                      disabled={isJoining}
                      className="flex-1 px-3 py-2 text-sm glossy-button disabled:bg-indigo-900/30 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {isJoining ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-1" />
                          Joining...
                        </>
                      ) : (
                        'Join Workspace'
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

const WorkSpaces = () => {
  const url = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [workspaceData, setWorkspaceData] = useState({
    name: '',
    description: '',
    visibility: 'private',
    avatar: '',
  });
  const [isCreating, setIsCreating] = useState(false);
  const [refreshFlag, setRefreshFlag] = useState(false);

  const reFreshFunc = () => {
    console.log('Refreshing workspace list');
    setRefreshFlag(!refreshFlag);
  };

  // Fetch workspaces
  useEffect(() => {
    const fetchWorkspaces = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const token = await getToken();
        console.log('Fetching workspaces, userId:', user.id);
        const response = await fetch(`${url}/workspace`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          console.error('Failed to fetch workspaces, status:', response.status);
          return;
        }

        const data = await response.json();
        console.log('Workspace data:', data);
        const actualData = Array.isArray(data.workspaces) ? data.workspaces : Array.isArray(data) ? data : [];
        const filtered = actualData.filter(
          (ws) => Array.isArray(ws.members) && ws.members.includes(user.id)
        );

        setWorkspaces(filtered);
      } catch (error) {
        console.error('Error fetching workspaces:', error.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (user && isLoaded) {
      fetchWorkspaces();
    }
  }, [user, isLoaded, refreshFlag, url, getToken]);

  // Utility functions
  const getWorkspaceInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : 'W';
  };

  const getWorkspaceId = (workspace) => {
    return workspace._id || workspace.id || '';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return isNaN(date.getTime())
      ? 'Unknown'
      : date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return isNaN(date.getTime())
      ? ''
      : date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
  };

  const handleCreateWorkspace = async () => {
    if (!workspaceData.name.trim()) {
      alert('Please enter a workspace name');
      return;
    }

    setIsCreating(true);
    try {
      const token = await getToken();
      const sendData = {
        ...workspaceData,
        members: [user.id],
        userId: user.id,
      };

      console.log('Creating workspace:', sendData);
      const response = await fetch(`${url}/workspace`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(sendData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to create workspace:', errorData);
        alert('Failed to create workspace. Please try again.');
        return;
      }

      const newWorkspace = await response.json();
      console.log('Created workspace:', newWorkspace);
      setWorkspaces((prev) => [...prev, newWorkspace]);
      setShowModal(false);
      setWorkspaceData({
        name: '',
        description: '',
        visibility: 'private',
        avatar: '',
      });
      reFreshFunc();
    } catch (error) {
      console.error('Error creating workspace:', error.message);
      alert('An error occurred. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCardClick = (workspaceId) => {
    if (workspaceId) {
      console.log('Navigating to workspace:', workspaceId);
      navigate(`/workspace/${workspaceId}`);
    }
  };

  const handleViewMoreClick = (e, workspaceId) => {
    e.stopPropagation();
    if (workspaceId) {
      console.log('View more clicked, navigating to:', workspaceId);
      navigate(`/workspace/${workspaceId}`);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-900 to-teal-900 text-white font-inter">
        <span className="text-pink-400 text-lg">Loading user data...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-900 to-teal-900 text-white font-inter">
        <span className="text-pink-400 text-lg">Please sign in to view workspaces.</span>
      </div>
    );
  }

  console.log('Rendering WorkSpaces component'); // Debug log

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

      <Sidebar currentActive={2} />
      <div className="p-6 w-full flex flex-col items-center">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-between mb-8 border-b-2 border-pink-500/30 pb-5 w-full max-w-5xl"
        >
          <div className="flex items-center gap-4">
            <label className="block text-sm font-medium text-gray-300" htmlFor="workspace-select">
              Select Workspace
            </label>
            <select
              id="workspace-select"
              value={selected ? getWorkspaceId(selected) : ''}
              onChange={(e) => {
                const selectedId = e.target.value;
                const ws = workspaces.find((ws) => getWorkspaceId(ws) === selectedId);
                setSelected(ws || null);
                if (ws) handleCardClick(getWorkspaceId(ws));
              }}
              className="glossy-card px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 shadow-lg hover:bg-gray-800/50 transition-colors duration-200"
              aria-label="Select workspace"
            >
              <option value="" className="bg-gray-900 text-white">-- Select Workspace --</option>
              {workspaces.map((ws) => (
                <option key={getWorkspaceId(ws)} value={getWorkspaceId(ws)} className="bg-gray-900 text-white">
                  {ws.name || 'Untitled Workspace'}
                </option>
              ))}
            </select>
          </div>
          <h1 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
            Workspaces
          </h1>
          <UserButton />
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-pink-400 text-lg py-12">Loading workspaces...</div>
        )}

        {/* Workspace Vertical Stack */}
        {!isLoading && workspaces.length > 0 && (
          <div className="w-full max-w-2xl flex flex-col gap-6 mb-20">
            {workspaces.map((workspace, index) => (
              <motion.div
                key={getWorkspaceId(workspace)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => handleCardClick(getWorkspaceId(workspace))}
                className="w-full group cursor-pointer"
                role="button"
                aria-label={`View ${workspace.name || 'Untitled Workspace'}`}
              >
                <div className="glossy-card rounded-2xl overflow-hidden shadow-xl">
                  <div className="flex items-center justify-between p-4">
                    <div className="relative w-10 h-10 flex-shrink-0">
                      {workspace.avatar ? (
                        <img
                          src={workspace.avatar}
                          alt={`${workspace.name || 'Workspace'} avatar`}
                          className="w-full h-full rounded-full object-cover border border-pink-500/50"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div
                        className="absolute inset-0 flex items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-600 text-white text-base font-semibold"
                        style={{ display: workspace.avatar ? 'none' : 'flex' }}
                      >
                        {getWorkspaceInitial(workspace.name)}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-pink-200">
                      <svg
                        viewBox="0 0 16 16"
                        fill="currentColor"
                        height={16}
                        width={16}
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M8 1a.5.5 0 0 1 .5.5V7.5H14a.5.5 0 0 1 0 1H8.5V14a.5.5 0 0 1-1 0V8.5H2a.5.5 0 0 1 0-1h5.5V1.5A.5.5 0 0 1 8 1z" />
                      </svg>
                      <span>{workspace.members?.length || 0}</span>
                    </div>
                  </div>

                  <div className="p-4 pt-2">
                    <h2 className="text-base font-bold text-white mb-2 line-clamp-1">
                      {workspace.name || 'Untitled Workspace'}
                    </h2>
                    <p className="text-gray-300 text-sm line-clamp-2 mb-3">
                      {workspace.description || 'No description available.'}
                    </p>
                    <div className="text-xs text-gray-300 mb-3">
                      Created on {formatDate(workspace.createdAt)} at {formatTime(workspace.createdAt)}
                    </div>
                    <button
                      onClick={(e) => handleViewMoreClick(e, getWorkspaceId(workspace))}
                      className="text-pink-400 hover:underline text-sm"
                    >
                      View More
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && workspaces.length === 0 && (
          <div className="text-center text-pink-400 text-lg mt-12">
            You haven't joined or created any workspaces yet.
          </div>
        )}

        {/* Buttons */}
        <div className="fixed bottom-6 right-6 flex gap-4">
          <JoinButton reFreshFunc={reFreshFunc} />
          <button
            onClick={() => setShowModal(true)}
            className="glossy-button px-4 py-2 text-sm"
          >
            Create Workspace
          </button>
        </div>

        {/* Create Workspace Modal */}
        {showModal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
          >
            <div className="glossy-card p-6 rounded-2xl w-full max-w-sm relative">
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 text-pink-400 hover:text-pink-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-white text-lg font-semibold mb-4">Create a New Workspace</h2>

              <input
                type="text"
                placeholder="Workspace Name"
                value={workspaceData.name}
                onChange={(e) => setWorkspaceData({ ...workspaceData, name: e.target.value })}
                className="mb-3 w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-pink-400 focus:border-transparent text-sm"
              />

              <textarea
                placeholder="Description"
                value={workspaceData.description}
                onChange={(e) => setWorkspaceData({ ...workspaceData, description: e.target.value })}
                className="mb-3 w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-pink-400 focus:border-transparent text-sm"
              />

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-pink-400 border border-pink-400/50 rounded-lg hover:bg-indigo-900/50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateWorkspace}
                  disabled={isCreating}
                  className="px-4 py-2 text-sm glossy-button disabled:bg-indigo-900/30 disabled:cursor-not-allowed"
                >
                  {isCreating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default WorkSpaces;