import React from 'react';
import { X, Mail, Calendar, Crown, User } from 'lucide-react';
import { motion } from 'framer-motion';

const MembersWS = ({ isOpen, onClose, members, workspace }) => {
    if (!isOpen) return null;

    // Utility function to get user initials
    const getUserInitials = (name) => {
        if (!name) return 'U';
        const names = name.split(' ').filter(Boolean); // Remove empty strings
        if (names.length === 1) return names[0].charAt(0).toUpperCase();
        return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
    };

    // Format date utility
    const formatDate = (dateString) => {
        if (!dateString) return 'Unknown';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    // Check if user is workspace owner
    const isOwner = (memberId) => {
        return workspace?.userId === memberId; // Use userId from workspace data
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 font-inter"
        >
            <div className="glossy-card rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] flex flex-col border border-pink-500/30">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                        <User className="w-6 h-6 text-pink-400 mr-3" />
                        <div>
                            <h2 className="text-xl font-semibold text-white">Workspace Members</h2>
                            <p className="text-pink-300/70 text-sm">
                                {members?.length || 0} member{members?.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-pink-400 hover:text-pink-300 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Members List */}
                <div className="flex-1 overflow-y-auto">
                    {(!members || members.length === 0) ? (
                        <div className="text-center py-12 text-pink-300/70">
                            <User className="w-12 h-12 mx-auto mb-4 text-pink-300/50" />
                            <p className="text-lg font-medium text-white">No members found</p>
                            <p className="text-sm">Invite people to join this workspace</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {members.map((member, index) => (
                                <div
                                    key={member.id || index}
                                    className="flex items-center p-4 bg-indigo-800/50 rounded-xl hover:bg-indigo-700/50 transition-colors"
                                >
                                    {/* Avatar */}
                                    <div className="relative w-12 h-12 flex-shrink-0 mr-4">
                                        {member.image ? (
                                            <img
                                                src={member.image}
                                                alt={member.name || 'Member'}
                                                className="w-full h-full rounded-full object-cover border-2 border-pink-500/30 shadow-sm"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling.style.display = 'flex';
                                                }}
                                            />
                                        ) : null}
                                        <div
                                            className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-600 to-indigo-600 text-white text-lg font-semibold rounded-full"
                                            style={{ display: member.image ? 'none' : 'flex' }}
                                        >
                                            {getUserInitials(member.name || member.email)}
                                        </div>

                                        {/* Owner Badge */}
                                        {isOwner(member.id) && (
                                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                                                <Crown className="w-3 h-3 text-white" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Member Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center mb-1">
                                            <h3 className="text-lg font-semibold text-white truncate">
                                                {member.name || 'Unknown User'}
                                            </h3>
                                            {isOwner(member.id) && (
                                                <span className="ml-2 px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs font-medium rounded-full">
                                                    Owner
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center text-pink-300/70 mb-2">
                                            <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
                                            <span className="truncate">{member.email || 'No email'}</span>
                                        </div>

                                        {/* Additional Info */}
                                        {member.role && (
                                            <div className="mt-2">
                                                <span className="inline-flex items-center px-2 py-1 bg-purple-500/20 text-purple-300 text-xs font-medium rounded-full">
                                                    {member.role}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Status Indicator */}
                                    <div className="flex-shrink-0 ml-4">
                                        <div className="w-3 h-3 bg-green-500 rounded-full" title="Active"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer with Buttons */}
                <div className="fixed bottom-6 left-6 z-20 flex space-x-6">
                    <button
                        onClick={onClose}
                        className="glossy-button flex items-center space-x-2 px-4 py-2 text-sm font-inter text-pink-400 border border-pink-400/50 rounded-lg hover:bg-indigo-900/50 transition-colors"
                    >
                        Close
                    </button>
                    <button
                        className="glossy-button flex items-center space-x-2 px-4 py-2 text-sm font-inter"
                    >
                        <svg viewBox="0 0 16 16" fill="currentColor" height={16} width={16} xmlns="http://www.w3.org/2000/svg">
                            <path d="M8 1a.5.5 0 0 1 .5.5V7.5H14a.5.5 0 0 1 0 1H8.5V14a.5.5 0 0 1-1 0V8.5H2a.5.5 0 0 1 0-1h5.5V1.5A.5.5 0 0 1 8 1z" />
                        </svg>
                        <span>Invite Members</span>
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default MembersWS;