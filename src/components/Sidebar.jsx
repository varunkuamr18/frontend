import React, { useState } from "react";
import {
  FiGrid,
  FiBriefcase,
  FiCheckSquare,
  FiUsers,
  FiAward,
  FiSettings,
  FiLogOut,
  FiMenu,
  FiX,
  FiChevronRight,
} from "react-icons/fi";
import { SignOutButton } from "@clerk/clerk-react";
import { useNavigate, useLocation } from "react-router-dom";

export default function Sidebar({ currentActive }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const pathParts = location.pathname.split('/').filter(Boolean);

  let basePath = '';
  let workspaceId = '';
  let projectId = '';

  // Handle different URL patterns
  if (pathParts[0] === 'workspace' && pathParts[1]) {
    workspaceId = pathParts[1];

    if (pathParts[2] === 'project' && pathParts[3]) {
      // URL pattern: /workspace/:work_id/project/:id
      projectId = pathParts[3];
      basePath = `/workspace/${workspaceId}/project/${projectId}`;
    } else {
      // URL pattern: /workspace/:id
      basePath = `/workspace/${workspaceId}`;
    }
  }

  const navItems = [
    {
      name: "Public Space",
      icon: <FiUsers size={20} />,
      to: "/",
      restricted: false,
      gradient: "from-emerald-400 to-teal-500"
    },
    {
      name: "My Dashboard",
      icon: <FiGrid size={20} />,
      to: "/mydashboard",
      restricted: false,
      gradient: "from-purple-400 to-pink-500"
    },
    {
      name: "Workspaces",
      icon: <FiBriefcase size={20} />,
      to: "/workspace",
      restricted: false,
      gradient: "from-blue-400 to-indigo-500"
    },
    {
      name: "My Tasks",
      icon: <FiCheckSquare size={20} />,
      to: "/mytasks",
      restricted: false,
      gradient: "from-orange-400 to-amber-500"
    },
    {
      name: "Settings",
      icon: <FiSettings size={20} />,
      to: basePath ? `${basePath}/settings` : "/settings",
      restricted: true,
      gradient: "from-gray-400 to-slate-500"
    },
  ];

  const isInsideWorkspace = /^\/workspace\/[^/]+$/.test(location.pathname);
  const isInsideProject = /^\/workspace\/[^/]+\/project\/[^/]+/.test(location.pathname);

  const handleClick = (item) => {
    if (item.restricted && item.name !== "My Tasks" && !(isInsideWorkspace || isInsideProject)) {
      alert("Please select a workspace or project before accessing this section.");
      return;
    }

    navigate(item.to);
    setMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={toggleMobileMenu}
        className="md:hidden fixed top-4 left-4 z-50 p-3 bg-indigo-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-pink-500/30 hover:shadow-3xl hover:scale-105 transition-all duration-300 hover:bg-indigo-800"
      >
        <div className="relative">
          {mobileMenuOpen ? <FiX size={20} className="text-pink-300" /> : <FiMenu size={20} className="text-pink-300" />}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-lg blur-xl opacity-20 -z-10"></div>
        </div>
      </button>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-all duration-300"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed left-0 top-0 h-full w-70 bg-gradient-to-br from-indigo-950 to-purple-950 shadow-2xl border-r border-pink-500/30 z-40 
          transform transition-all duration-500 ease-out
          md:translate-x-0
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Header */}
        <div className="p-6 border-b border-pink-500/20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/20 to-purple-900/20 -z-10"></div>
          <div className="flex items-center space-x-4 relative">
            <div className="relative">
              <div className="w-11 h-12 rounded-2xl flex items-center justify-center border border-pink-500/30 overflow-hidden">
                <img src="/ms.png" alt="Logo" className="w-20 h-10 relative z-10" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">TaskForge</h1>
              <p className="text-sm text-pink-300 font-medium">Workspace Manager</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-6 py-8">
          <div className="space-y-3">
            {navItems.map((item, index) => {
              const isActive = currentActive === index;
              const isMyTasksRestricted = item.name === "My Tasks" && !isInsideProject;
              const isOtherRestricted = item.restricted && item.name !== "My Tasks" && !(isInsideWorkspace || isInsideProject);
              const isRestricted = isMyTasksRestricted || isOtherRestricted;
              const isHovered = hoveredItem === index;

              return (
                <div
                  key={index}
                  onClick={() => handleClick(item)}
                  onMouseEnter={() => setHoveredItem(index)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={`
                    group relative flex items-center space-x-4 px-5 py-4 rounded-2xl cursor-pointer
                    transition-all duration-300 ease-out transform
                    ${isActive
                      ? `bg-gradient-to-r ${item.gradient} text-white shadow-2xl scale-105 border border-pink-500/30`
                      : isRestricted
                        ? 'text-pink-300/50 cursor-not-allowed opacity-50'
                        : 'text-pink-300 hover:bg-indigo-900/50 hover:text-white hover:scale-102 hover:shadow-xl'
                    }
                    ${isHovered && !isActive && !isRestricted ? 'shadow-lg' : ''}
                  `}
                >
                  {/* Background Effects */}
                  {isActive && (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-2xl"></div>
                      <div className={`absolute -inset-1 bg-gradient-to-r ${item.gradient} rounded-2xl blur-xl opacity-50 -z-10`}></div>
                    </>
                  )}

                  {isHovered && !isActive && !isRestricted && (
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-900 to-purple-900 rounded-2xl opacity-50"></div>
                  )}

                  {/* Icon Container */}
                  <div className={`
                    relative flex items-center justify-center w-6 h-6 transition-all duration-300
                    ${isActive ? 'text-white scale-110' : isRestricted ? 'text-pink-300/50' : 'text-pink-300 group-hover:text-white group-hover:scale-110'}
                  `}>
                    {item.icon}
                    {isActive && (
                      <div className="absolute inset-0 bg-white/20 rounded-lg blur-sm"></div>
                    )}
                  </div>

                  {/* Label */}
                  <span className={`
                    font-semibold transition-all duration-300 flex-1
                    ${isActive ? 'text-white' : isRestricted ? 'text-pink-300/50' : 'text-pink-300 group-hover:text-white'}
                  `}>
                    {item.name}
                  </span>

                  {/* Arrow Icon for Active/Hover */}
                  <div className={`
                    transition-all duration-300 transform
                    ${isActive ? 'opacity-100 translate-x-0 text-white' :
                      isHovered && !isRestricted ? 'opacity-70 translate-x-0 text-pink-400' :
                        'opacity-0 -translate-x-2'}
                  `}>
                    <FiChevronRight size={16} />
                  </div>

                  {/* Active Glow Effect */}
                  {isActive && (
                    <div className="absolute right-3 w-2 h-2 bg-pink-400 rounded-full shadow-lg animate-pulse" />
                  )}

                  {/* Restricted Lock Effect */}
                  {isRestricted && (
                    <div className="absolute right-3 w-2 h-2 bg-pink-300/50 rounded-full opacity-50" />
                  )}
                </div>
              );
            })}
          </div>
        </nav>

        {/* User Section & Logout */}
        <div className="p-6 border-t border-pink-500/20 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/20 to-purple-900/20 -z-10"></div>

          <SignOutButton>
            <div className="group flex items-center space-x-4 px-5 py-4 rounded-2xl cursor-pointer text-pink-300 hover:bg-indigo-900/50 hover:text-pink-400 transition-all duration-300 hover:scale-102 hover:shadow-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/0 to-purple-900/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>

              <div className="flex items-center justify-center w-6 h-6 relative z-10 transition-transform duration-300 group-hover:scale-110">
                <FiLogOut size={18} />
              </div>
              <span className="font-semibold relative z-10 flex-1">Sign Out</span>

              <div className="opacity-0 group-hover:opacity-70 transform -translate-x-2 group-hover:translate-x-0 transition-all duration-300 text-pink-400">
                <FiChevronRight size={16} />
              </div>
            </div>
          </SignOutButton>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-1/2 -right-px w-1 h-20 bg-gradient-to-b from-pink-400 to-purple-400 opacity-30 rounded-l-full"></div>
      </div>

      {/* Spacer for main content on desktop */}
      <div className="hidden md:block w-72 flex-shrink-0" />
    </>
  );
}