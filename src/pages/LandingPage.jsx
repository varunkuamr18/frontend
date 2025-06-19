import React, { useState, useEffect, useRef } from 'react';
import { SignInButton, SignUpButton, useUser } from '@clerk/clerk-react';
import { Infinity, Github, ChevronRight, Bug, Users, Layout, Search, CheckCircle, Clock, Zap, Target, GitBranch, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const TomanLogo = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="40" height="40" rx="10" fill="url(#gradient)" />
    <path d="M12 10H16V18H24V10H28V30H24V22H16V30H12V10Z" fill="white" />
    <defs>
      <linearGradient id="gradient" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop stopColor="#EC4899" />
        <stop offset="1" stopColor="#8B5CF6" />
      </linearGradient>
    </defs>
  </svg>
);

const LandingPage = () => {
  const { isSignedIn, isLoaded } = useUser();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [currentFeature, setCurrentFeature] = useState(0);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      navigate('/');
    }
    setIsVisible(true);
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, [isSignedIn, isLoaded, navigate]);

  // Auto-scroll effect for features section
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const cardWidth = 336; // Approximate width of each card (w-80 = 320px + padding/margin)
    const scrollDuration = 4000; // Time between scrolls (4 seconds)

    const scrollNext = () => {
      const maxScroll = container.scrollWidth - container.clientWidth;
      const nextScroll = container.scrollLeft + cardWidth;

      if (nextScroll >= maxScroll) {
        // Reset to start for seamless loop
        container.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        // Scroll to next card
        container.scrollTo({ left: nextScroll, behavior: 'smooth' });
      }
    };

    const interval = setInterval(scrollNext, scrollDuration);

    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: <Target className="w-6 h-6" />,
      title: "Project Management",
      description: "Create and manage multiple projects with custom workflows and milestones",
      color: "from-pink-500 to-purple-500",
    },
    {
      icon: <Bug className="w-6 h-6" />,
      title: "Issue Tracking",
      description: "Track bugs, features, and tasks with detailed reporting and analytics",
      color: "from-orange-500 to-red-500",
    },
    {
      icon: <Layout className="w-6 h-6" />,
      title: "Kanban Boards",
      description: "Visualize your workflow with drag-and-drop boards and custom statuses",
      color: "from-green-500 to-teal-500",
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Team Workspaces",
      description: "Organize teams in dedicated workspaces with role-based permissions",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: <Search className="w-6 h-6" />,
      title: "Smart Filtering",
      description: "Find what you need instantly with powerful search and filtering tools",
      color: "from-yellow-500 to-orange-500",
    },
    {
      icon: <GitBranch className="w-6 h-6" />,
      title: "Version Control",
      description: "Link issues to commits and track development progress seamlessly",
      color: "from-purple-500 to-pink-500",
    },
  ];

  const stats = [
    { number: "100%", label: "Free Forever", icon: <CheckCircle className="w-5 h-5 text-pink-400" /> },
    { number: "Open", label: "Source", icon: <Github className="w-5 h-5 text-orange-400" /> },
    { number: "24/7", label: "Available", icon: <Clock className="w-5 h-5 text-blue-400" /> },
    { number: "Unlimited", label: "Projects", icon: <Infinity className="w-5 h-5 text-green-400" /> },
  ];

  const heroFeatures = features.slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-teal-900 text-white font-sans">
      <style>
        {`
          .glossy-card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.3);
            border-radius: 16px;
            position: relative;
            overflow: hidden;
          }
          .glossy-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: -50%;
            width: 200%;
            height: 200%;
            background: linear-gradient(
              45deg,
              rgba(255, 255, 255, 0.2),
              rgba(255, 255, 255, 0.05),
              rgba(255, 255, 255, 0.2)
            );
            transform: rotate(45deg);
            animation: glossy 8s linear infinite;
          }
          @keyframes glossy {
            0% { transform: translateX(-50%) rotate(45deg); }
            100% { transform: translateX(50%) rotate(45deg); }
          }
          .glossy-button {
            background: linear-gradient(135deg, #ec4899, #8b5cf6);
            border: none;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.4);
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
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
              rgba(255, 255, 255, 0.3),
              transparent
            );
            transition: all 0.5s ease;
          }
          .glossy-button:hover::before {
            left: 100%;
          }
          .glossy-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
          }
          .scrollbar-thin::-webkit-scrollbar {
            height: 8px;
          }
          .scrollbar-thin::-webkit-scrollbar-thumb {
            background: #8b5cf6;
            border-radius: 4px;
          }
          .scrollbar-thin::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.1);
          }
        `}
      </style>

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-50 glossy-card"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <motion.div className="flex items-center space-x-3" whileHover={{ scale: 1.05 }}>
            <TomanLogo />
            <span className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
              Toman
            </span>
          </motion.div>
          <div className="flex items-center space-x-4">
            <SignInButton
              mode="modal"
              className="px-5 py-2 text-pink-300 hover:text-pink-100 transition-colors duration-300 text-sm font-semibold rounded-md glossy-button"
            >
              Login
            </SignInButton>
            <SignUpButton
              mode="modal"
              className="px-5 py-2 glossy-button text-white rounded-md text-sm font-semibold shadow-md"
            >
              Get Started
            </SignUpButton>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-teal-500/20 blur-3xl animate-pulse" />
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : -50 }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center px-4 py-2 glossy-card rounded-full text-sm font-medium text-pink-200">
              <Zap className="w-4 h-4 mr-2 text-yellow-400" /> Free & Open Source
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight">
              Create with <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-teal-400 bg-clip-text text-transparent">Toman</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-200 max-w-md">
              A vibrant, free platform for project management and team collaboration.
            </p>
            <motion.div
              className="grid grid-cols-2 sm:grid-cols-4 gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.1 }}
                  className="text-center p-4 glossy-card"
                >
                  {stat.icon}
                  <div className="text-lg font-bold text-white">{stat.number}</div>
                  <div className="text-xs text-gray-300">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : 50 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="glossy-card p-6 shadow-xl">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-3 h-3 bg-pink-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-teal-500 rounded-full"></div>
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentFeature}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.5 }}
                  className="glossy-card p-4"
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div
                      className={`w-10 h-10 bg-gradient-to-r ${heroFeatures[currentFeature].color} rounded-lg flex items-center justify-center shadow-md`}
                    >
                      {heroFeatures[currentFeature].icon}
                    </div>
                    <h3 className="text-xl font-semibold text-white">{heroFeatures[currentFeature].title}</h3>
                  </div>
                  <p className="text-gray-300 text-sm mb-4">{heroFeatures[currentFeature].description}</p>
                  <div className="flex justify-between items-center">
                    <motion.div
                      className="w-8 h-8 glossy-button rounded-full flex items-center justify-center"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                    >
                      <CheckCircle className="w-4 h-4 text-white" />
                    </motion.div>
                    <span className="text-xs text-gray-300">Feature {currentFeature + 1}/{heroFeatures.length}</span>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
            <motion.div
              className="absolute -bottom-4 -left-4 bg-teal-500/40 w-24 h-24 rounded-full blur-2xl"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <motion.div
              className="absolute -top-4 -right-4 bg-pink-500/40 w-20 h-20 rounded-full blur-2xl"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 glossy-card">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Color Your Workflow</h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto mt-4">
              Explore vibrant tools to enhance your development journey.
            </p>
          </motion.div>
          <div className="relative overflow-hidden">
            <div
              ref={scrollContainerRef}
              className="flex space-x-6 snap-x snap-mandatory overflow-x-auto pb-8 scrollbar-thin"
            >
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className="snap-center flex-shrink-0 w-80 p-6 glossy-card cursor-pointer"
                >
                  <div
                    className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-lg flex items-center justify-center mb-4 shadow-md shadow-${feature.color.split('-')[1]}-500/50`}
                  >
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                  <p className="text-gray-300 text-sm mb-4">{feature.description}</p>
                  <motion.div className="flex items-center text-pink-400 hover:text-pink-300" whileHover={{ x: 5 }}>
                    <span className="text-sm font-medium">Discover More</span>
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl mx-auto text-center"
        >
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Paint Your Projects with Toman</h2>
          <p className="text-lg text-gray-300 max-w-xl mx-auto mt-4">
            Join teams bringing color to their workflows, free forever.
          </p>
          <motion.div
            className="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-3 glossy-button text-white rounded-lg flex items-center text-sm font-semibold shadow-lg shadow-pink-500/50"
            >
              <Target className="w-5 h-5 mr-2" />
              Start Free Trial
              <ArrowRight className="w-5 h-5 ml-2" />
            </motion.button>
            <div className="flex items-center text-gray-300 text-sm">
              <span>✓ No credit card needed</span>
              <span className="mx-2">•</span>
              <span>✓ 14-day trial</span>
            </div>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
};

export default LandingPage;