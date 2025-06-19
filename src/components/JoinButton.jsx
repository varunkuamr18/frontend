import React, { useState } from 'react';
import { Check, X, Loader2 } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { motion } from 'framer-motion';

const JoinButton = ({ reFreshFunc }) => {
  const { user, isLoaded } = useUser();
  const url = import.meta.env.VITE_BACKEND_URL;
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [code, setCode] = useState('');
  const [validationState, setValidationState] = useState('idle'); // idle, validating, valid, invalid
  const [workspaceName, setWorkspaceName] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [workspaceData, setWorkspaceData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const handleJoinWorkSpaceViaCode = () => {
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
    if (!code.trim()) {
      setErrorMessage('Please enter a valid invitation code.');
      setValidationState('invalid');
      return;
    }

    setValidationState('validating');
    setErrorMessage('');

    try {
      console.log('Validating code:', code);
      const inviteResp = await fetch(`${url}/invite/${code}`, {
        method: 'GET',
        headers: {
          'content-type': 'application/json',
        },
      });

      if (!inviteResp.ok) {
        const errorData = await inviteResp.json();
        console.error('Invite fetch error:', errorData);
        setValidationState('invalid');
        setErrorMessage(errorData.message || 'Invalid invitation code. Please try again.');
        return;
      }

      const { data: inviteData } = await inviteResp.json();
      console.log('Invite data:', inviteData);

      const workspaceResp = await fetch(`${url}/workspace/${inviteData.workspaceId}`, {
        method: 'GET',
        headers: {
          'content-type': 'application/json',
        },
      });

      if (!workspaceResp.ok) {
        const errorData = await workspaceResp.json();
        console.error('Workspace fetch error:', errorData);
        setValidationState('invalid');
        setErrorMessage(errorData.message || 'Unable to fetch workspace details.');
        return;
      }

      const { workspace } = await workspaceResp.json();
      console.log('Workspace data:', workspace);
      setWorkspaceData(workspace);

      if (workspace.members.includes(user.id)) {
        setValidationState('invalid');
        setErrorMessage('You are already a member of this workspace.');
        return;
      }

      setValidationState('valid');
      setWorkspaceName(workspace.name);
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
      console.log('Joining workspace:', workspaceData._id, 'with user:', user.id);
      const response = await fetch(`${url}/workspace/${workspaceData._id}`, {
        method: 'PUT',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          ...workspaceData,
          members: [...workspaceData.members, user.id],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Join workspace error:', errorData);
        throw new Error(errorData.message || 'Failed to join workspace');
      }

      const updatedWorkspace = await response.json();
      console.log('Successfully joined workspace:', updatedWorkspace);

      try {
        console.log('Deleting invitation:', code);
        const inviteDeleteResponse = await fetch(`${url}/invite/${code}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!inviteDeleteResponse.ok) {
          const errorData = await inviteDeleteResponse.json();
          console.error('Invite deletion error:', errorData);
          throw new Error(errorData.message || 'Failed to delete the invite');
        }

        const result = await inviteDeleteResponse.json();
        console.log('✅ Invitation deleted successfully:', result.message || result);
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
    return (
      <div className="text-pink-400 text-sm font-inter">Loading user data...</div>
    );
  }

  if (!user) {
    return (
      <div className="text-pink-400 text-sm font-inter">Please sign in to join a workspace.</div>
    );
  }

  return (
    <div className="fixed bottom-6 left-6 z-20">
      <button
        onClick={handleJoinWorkSpaceViaCode}
        className="glossy-button flex items-center space-x-2 px-4 py-2 text-sm font-inter"
      >
        <svg viewBox="0 0 16 16" fill="currentColor" height={16} width={16} xmlns="http://www.w3.org/2000/svg">
          <path d="M8 1a.5.5 0 0 1 .5.5V7.5H14a.5.5 0 0 1 0 1H8.5V14a.5.5 0 0 1-1 0V8.5H2a.5.5 0 0 1 0-1h5.5V1.5A.5.5 0 0 1 8 1z" />
        </svg>
        <span>Join Workspace</span>
      </button>

      {isPopupOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 font-inter"
        >
          <div className="glossy-card rounded-2xl p-6 w-full max-w-sm mx-4">
            <button
              onClick={handleClosePopup}
              className="absolute top-4 right-4 text-pink-400 hover:text-pink-300 transition-colors"
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
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="Enter code"
                      className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-pink-400 focus:border-transparent text-sm"
                      disabled={validationState === 'validating'}
                    />
                    {validationState !== 'idle' && (
                      <div className="absolute right-3 top-2.5">{getValidationIcon()}</div>
                    )}
                  </div>
                </div>

                {validationState !== 'idle' && (
                  <div className="mb-3 flex items-center gap-2 text-sm">{getValidationText()}</div>
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

export default JoinButton;