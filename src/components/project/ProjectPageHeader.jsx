import React, { useState } from 'react';
import { Calendar, Users, User, CheckCircle, Shield, AlertTriangle, X, Mail, Phone, MapPin, ArrowLeft } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const ProjectPageHeader = ({ projectData, currentUserRole, tasks, members, formatDate, currentUserId }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [hoveredRole, setHoveredRole] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Extract workspace ID from URL for back navigation
  const pathParts = location.pathname.split('/').filter(Boolean);
  const workspaceId = pathParts[1]; // Gets the workspace ID from /workspace/:id/project/:id

  // Role permissions mapping
  const rolePermissions = {
    'Admin': [
      'Full project access and control',
      'Manage team members and roles',
      'Create, edit, and delete tasks',
      'Modify project settings',
    ],
    'Contributor': [
      'View and update assigned tasks',
      'Comment on tasks and discussions',
      'Track time on tasks',
      'View project timeline',
    ],
    'Viewer': [
      'View project information',
      'See task progress',
    ],
  };

  // Check if current user is part of the project
  const currentUser = members.find(member => member.id === currentUserId);
  const isUserInProject = !!currentUser;

  // Sort members to prioritize current user
  const sortedMembers = [...members].sort((a, b) => {
    if (a.id === currentUserId) return -1;
    if (b.id === currentUserId) return 1;
    return 0;
  });

  const openDialog = () => setIsDialogOpen(true);
  const closeDialog = () => setIsDialogOpen(false);

  const handleBackToWorkspace = () => {
    navigate(`/workspace/${workspaceId}`);
  };

  return (
    <>
      <div className="glossy-card rounded-2xl p-6 mb-6">
        {/* Header Toolbar */}
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={handleBackToWorkspace}
            className="glossy-button flex items-center space-x-2 px-4 py-2 text-sm"
          >
            <ArrowLeft size={16} />
            <span>Back to Workspace</span>
          </button>
          {members.length > 0 && (
            <button
              onClick={openDialog}
              className="glossy-button flex items-center space-x-2 px-4 py-2 text-sm"
            >
              <Users size={16} />
              <span>View Team</span>
            </button>
          )}
        </div>

        {/* Project Title and Role */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-4">
          <div
            className="w-10 h-10 rounded-lg text-white text-xl font-semibold flex items-center justify-center shadow-md"
            style={{ backgroundColor: projectData?.colorCode }}
            title={projectData?.projectName}
          >
            {projectData?.projectName?.[0]?.toUpperCase() || 'P'}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">{projectData?.projectName}</h1>
            <div className="flex items-center space-x-2 mt-1">
              {isUserInProject ? (
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    currentUserRole === 'Admin'
                      ? 'bg-purple-600/20 text-purple-400'
                      : 'bg-indigo-600/20 text-indigo-400'
                  }`}
                >
                  {currentUserRole === 'Admin' && <Shield className="w-3 h-3 inline mr-1" />}
                  {currentUserRole}
                </span>
              ) : (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-600/20 text-gray-400">
                  <AlertTriangle className="w-3 h-3 inline mr-1" />
                  Not a member
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Project Description */}
        <p className="text-gray-300 text-sm leading-relaxed mb-4">{projectData?.projectDescription}</p>

        {/* Project Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glossy-subpanel p-4 rounded-lg flex items-center space-x-3">
            <Calendar className="w-5 h-5 text-indigo-400 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-400">Timeline</p>
              <p className="text-sm font-semibold text-white">
                {formatDate(projectData?.startDate)} - {formatDate(projectData?.endDate)}
              </p>
            </div>
          </div>
          <div className="glossy-subpanel p-4 rounded-lg flex items-center space-x-3">
            <Users className="w-5 h-5 text-green-400 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-400">Team Members</p>
              <p className="text-sm font-semibold text-white">{members.length} members</p>
            </div>
          </div>
          <div className="glossy-subpanel p-4 rounded-lg flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-purple-400 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-400">Total Tasks</p>
              <p className="text-sm font-semibold text-white">{tasks.length} tasks</p>
            </div>
          </div>
        </div>
      </div>

      {/* Team Members Dialog */}
      {isDialogOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 font-inter"
        >
          <div className="glossy-card rounded-2xl max-w-3xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-white/20">
              <div>
                <h2 className="text-xl font-bold text-white">Team Members</h2>
                <p className="text-gray-400 text-xs">{members.length} members in this project</p>
              </div>
              <button
                onClick={closeDialog}
                className="p-2 rounded-full hover:bg-pink-600/20 text-pink-400 hover:text-pink-300 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4">
              {!isUserInProject && (
                <div className="mb-4 p-3 bg-amber-600/20 border border-amber-600/50 rounded-lg flex items-center space-x-2 text-sm">
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <div>
                    <p className="text-amber-400 font-medium">Not a project member</p>
                    <p className="text-amber-400/70">Contact an admin to join.</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {sortedMembers.map((member) => (
                  <div
                    key={member.id}
                    className={`glossy-subpanel p-4 rounded-lg transition-all ${
                      member.id === currentUserId
                        ? 'border-pink-400/50'
                        : 'border-white/20 hover:border-pink-400/50'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="relative">
                        <img
                          src={
                            member.image ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random`
                          }
                          alt={member.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        {member.id === currentUserId && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-600 rounded-full flex items-center justify-center">
                            <User className="w-2 h-2 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-sm font-semibold text-white">{member.name}</h3>
                          {member.id === currentUserId && (
                            <span className="px-2 py-1 bg-indigo-600/20 text-indigo-400 text-xs rounded-full">
                              You
                            </span>
                          )}
                        </div>
                        <div className="relative inline-block">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              member.role === 'Admin'
                                ? 'bg-purple-600/20 text-purple-400'
                                : member.role === 'Contributor'
                                ? 'bg-indigo-600/20 text-indigo-400'
                                : 'bg-gray-600/20 text-gray-400'
                            }`}
                            onMouseEnter={() => setHoveredRole(member.id)}
                            onMouseLeave={() => setHoveredRole(null)}
                          >
                            {member.role === 'Admin' && <Shield className="w-3 h-3 mr-1" />}
                            {member.role}
                          </span>
                          {hoveredRole === member.id && (
                            <div className="absolute bottom-full left-0 mb-2 z-10">
                              <div className="bg-indigo-900/90 text-white p-3 rounded-lg shadow-lg text-xs w-56 border border-pink-400/50">
                                <div className="font-medium mb-1">Role Permissions:</div>
                                <ul className="space-y-1">
                                  {rolePermissions[member.role]?.map((permission, idx) => (
                                    <li key={idx} className="flex items-start">
                                      <span className="w-1 h-1 bg-pink-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                      <span>{permission}</span>
                                    </li>
                                  ))}
                                </ul>
                                <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-indigo-900/90"></div>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="mt-2 space-y-1 text-xs text-gray-400">
                          {member.email && (
                            <div className="flex items-center space-x-1">
                              <Mail className="w-3 h-3" />
                              <span>{member.email}</span>
                            </div>
                          )}
                          {member.phone && (
                            <div className="flex items-center space-x-1">
                              <Phone className="w-3 h-3" />
                              <span>{member.phone}</span>
                            </div>
                          )}
                          {member.location && (
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-3 h-3" />
                              <span>{member.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
};

export default ProjectPageHeader;