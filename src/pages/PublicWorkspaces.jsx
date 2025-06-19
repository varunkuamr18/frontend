import React, { useState, useEffect, useRef } from 'react';
import { Search, Users, Calendar, ExternalLink, X, Mail, Phone, Github, Linkedin, Play } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';

const PublicWorkspaces = () => {
  const { user, isLoaded } = useUser();
  const url = import.meta.env.VITE_BACKEND_URL;
  const [workspaces, setWorkspaces] = useState([]);
  const [filteredWorkspaces, setFilteredWorkspaces] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [joinForm, setJoinForm] = useState({
    email: '',
    phone: '',
    github: '',
    linkedin: '',
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef(null);

  // Fetch workspaces data
  useEffect(() => {
    if (!isLoaded) return;
    const fetchWorkspaces = async () => {
      try {
        const response = await fetch(`${url}/workspace`);
        const data = await response.json();
        if (data.success) {
          const fws = data.workspaces.filter(workspace => !workspace.members.includes(user?.id));
          const publicWorkspaces = fws
            .filter(workspace => workspace.visibility === 'public')
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setWorkspaces(publicWorkspaces);
          setFilteredWorkspaces(publicWorkspaces);
        }
      } catch (err) {
        setError('Failed to load workspaces');
      } finally {
        setLoading(false);
      }
    };
    fetchWorkspaces();
  }, [url, user, isLoaded]);

  // Search functionality
  useEffect(() => {
    const filtered = workspaces.filter(workspace =>
      workspace.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workspace.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredWorkspaces(filtered);
    setCurrentIndex(0); // Reset carousel index on search
  }, [searchTerm, workspaces]);

  // Auto-scroll carousel
  useEffect(() => {
    if (filteredWorkspaces.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => {
        const nextIndex = prev + 1;
        if (nextIndex >= filteredWorkspaces.length) {
          return 0; // Loop back to start
        }
        return nextIndex;
      });
    }, 4000); // 4 seconds per slide
    return () => clearInterval(interval);
  }, [filteredWorkspaces]);

  const handleJoinClick = (workspace, e) => {
    e.stopPropagation();
    setSelectedWorkspace(workspace);
    setShowJoinDialog(true);
  };

  const handleJoinSubmit = async () => {
    console.log('Join request:', { workspace: selectedWorkspace, form: joinForm });
    setShowJoinDialog(false);
    setJoinForm({ email: '', phone: '', github: '', linkedin: '' });
    setSelectedWorkspace(null);
  };

  const handleWorkspaceClick = (workspaceId) => {
    window.location.href = `/workspace/${workspaceId}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="h-8 w-8 border-4 border-t-pink-500 border-gray-700 rounded-full"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-pink-400 p-4">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-teal-900 text-white font-inter">
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
          .carousel-container {
            height: 450px;
            position: relative;
            overflow: hidden;
          }
          .carousel-track {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
        `}
      </style>

      <div className="flex">
        <Sidebar currentActive={0} />
        <div className="w-full max-w-7xl mx-auto p-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8 text-center"
          >
            <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400 mb-3 tracking-tight">
              Featured Workspaces
            </h2>
            <p className="text-gray-300 text-lg">Discover vibrant collaborative experiences</p>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative mb-8 max-w-2xl mx-auto"
          >
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-pink-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search for your next adventure..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 py-4 glossy-card text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all shadow-lg shadow-pink-500/20"
            />
          </motion.div>

          {/* Vertical Carousel */}
          <div className="carousel-container">
            <motion.div
              ref={carouselRef}
              className="carousel-track"
              animate={{ y: `-${currentIndex * 450}px` }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
            >
              {filteredWorkspaces.map((workspace, index) => (
                <motion.div
                  key={workspace._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className="w-80 mb-6 group cursor-pointer mx-auto"
                  onClick={() => handleWorkspaceClick(workspace._id)}
                >
                  {/* Workspace Card */}
                  <div className="glossy-card rounded-2xl overflow-hidden shadow-xl">
                    {/* Image */}
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={workspace.avatar || 'https://via.placeholder.com/320x192'}
                        alt={workspace.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <motion.div
                          className="bg-pink-500/50 backdrop-blur-sm rounded-full p-4"
                          whileHover={{ scale: 1.2 }}
                        >
                          <Play className="w-6 h-6 text-white ml-0.5" />
                        </motion.div>
                      </div>
                      <div className="absolute top-4 left-4">
                        <span className="bg-purple-600/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {workspace.members.length}
                        </span>
                      </div>
                    </div>

                    {/* Info Section */}
                    <div className="p-5">
                      <h3 className="text-lg font-bold text-white mb-2 group-hover:text-pink-400 transition-colors">
                        {workspace.name}
                      </h3>
                      <div className="flex items-center gap-2 mb-3 text-sm text-gray-300">
                        <Calendar className="w-4 h-4 text-teal-400" />
                        <span>Created {formatDate(workspace.createdAt)}</span>
                      </div>
                      <p className="text-gray-300 text-sm mb-4 line-clamp-3 leading-relaxed">
                        {workspace.description}
                      </p>
                      <div className="flex gap-3">
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleWorkspaceClick(workspace._id);
                          }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex-1 glossy-button text-white px-3 py-2 rounded-xl text-sm font-medium shadow-lg hover:shadow-purple-500/25"
                        >
                          <ExternalLink className="w-4 h-4 inline mr-1" />
                          View
                        </motion.button>
                        <motion.button
                          onClick={(e) => handleJoinClick(workspace, e)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex-1 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white px-3 py-2 rounded-xl text-sm font-medium shadow-lg hover:shadow-green-500/25"
                        >
                          Join
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Join Dialog */}
          <AnimatePresence>
            {showJoinDialog && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="glossy-card rounded-2xl shadow-2xl w-full max-w-md"
                >
                  <div className="flex items-center justify-between p-6 border-b border-purple-500/50">
                    <h3 className="text-xl font-semibold text-white">Join {selectedWorkspace?.name}</h3>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      onClick={() => setShowJoinDialog(false)}
                      className="text-gray-300 hover:text-pink-400 transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </motion.button>
                  </div>
                  <div className="p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        <Mail className="w-4 h-4 inline mr-2 text-pink-400" />
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={joinForm.email}
                        onChange={(e) => setJoinForm({ ...joinForm, email: e.target.value })}
                        className="w-full px-4 py-3 glossy-card text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all placeholder-gray-500"
                        placeholder="your@email.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        <Phone className="w-4 h-4 inline mr-2 text-teal-400" />
                        Contact Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={joinForm.phone}
                        onChange={(e) => setJoinForm({ ...joinForm, phone: e.target.value })}
                        className="w-full px-4 py-3 glossy-card text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all placeholder-gray-500"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        <Github className="w-4 h-4 inline mr-2 text-orange-400" />
                        GitHub Profile
                      </label>
                      <input
                        type="url"
                        value={joinForm.github}
                        onChange={(e) => setJoinForm({ ...joinForm, github: e.target.value })}
                        className="w-full px-4 py-3 glossy-card text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all placeholder-gray-500"
                        placeholder="https://github.com/username"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        <Linkedin className="w-4 h-4 inline mr-2 text-blue-400" />
                        LinkedIn Profile
                      </label>
                      <input
                        type="url"
                        value={joinForm.linkedin}
                        onChange={(e) => setJoinForm({ ...joinForm, linkedin: e.target.value })}
                        className="w-full px-4 py-3 glossy-card text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all placeholder-gray-500"
                        placeholder="https://linkedin.com/in/username"
                      />
                    </div>
                    <div className="flex gap-3 pt-4">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={() => setShowJoinDialog(false)}
                        className="flex-1 px-4 py-3 glossy-card border border-purple-500/50 text-gray-300 rounded-xl hover:bg-gray-800/50 transition-all duration-200"
                      >
                        Cancel
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={handleJoinSubmit}
                        className="flex-1 glossy-button text-white rounded-xl text-sm font-medium shadow-lg hover:shadow-green-500/25"
                      >
                        Send Request
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* No results message */}
          {filteredWorkspaces.length === 0 && !loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <p className="text-gray-300">No public workspaces found matching your search.</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicWorkspaces;