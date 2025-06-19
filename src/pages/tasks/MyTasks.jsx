import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import {
    FiClock,
    FiUser,
    FiAlertTriangle,
    FiCheckCircle,
    FiPlay,
    FiEye,
    FiUserX,
    FiRefreshCw,
    FiCalendar,
    FiFlag,
    FiLoader,
    FiAlertCircle,
    FiChevronDown,
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../../components/Sidebar';

const MyTasks = () => {
    const url = import.meta.env.VITE_BACKEND_URL;
    const { user, isLoaded } = useUser();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [updatingTasks, setUpdatingTasks] = useState(new Set());
    const [filterStatus, setFilterStatus] = useState('All');
    const [sortBy, setSortBy] = useState('deadline');
    const [currentUserId, setCurrentUserId] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [expandedTasks, setExpandedTasks] = useState({});

    useEffect(() => {
        if (isLoaded && user) {
            setCurrentUserId(user.id);
        }
    }, [isLoaded, user]);

    const fetchTasks = useCallback(async () => {
        if (!currentUserId) return;

        try {
            setLoading(true);
            const response = await fetch(`${url}/task`);
            if (!response.ok) {
                throw new Error('Failed to fetch tasks');
            }
            const allTasks = await response.json();
            const userTasks = allTasks.filter(task => task.assignedTo === currentUserId);
            setTasks(userTasks);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [url, currentUserId]);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    const updateTaskStatus = useCallback(async (taskId, newStatus, currentTask) => {
        const normalizedStatus = newStatus === 'In-Progress' ? 'InProgress' : newStatus;

        try {
            setUpdatingTasks(prev => new Set([...prev, taskId]));
            const updatedTask = { ...currentTask, status: normalizedStatus };
            console.log('Sending PUT request:', { taskId, updatedTask });

            const response = await fetch(`${url}/task/${taskId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedTask),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Failed to update task: ${errorData.message || response.statusText}`);
            }

            const responseData = await response.json();
            console.log('PUT response:', responseData);
            setTasks(prev => prev.map(task =>
                task._id === taskId ? { ...task, status: normalizedStatus } : task
            ));
        } catch (err) {
            console.error('Update error:', err);
            alert('Failed to update task status: ' + err.message);
            setTasks(prev => prev.map(task =>
                task._id === taskId ? currentTask : task
            ));
        } finally {
            setUpdatingTasks(prev => {
                const newSet = new Set(prev);
                newSet.delete(taskId);
                return newSet;
            });
        }
    }, []);

    const unassignTask = useCallback(async (taskId, currentTask) => {
        try {
            setUpdatingTasks(prev => new Set([...prev, taskId]));
            const updatedTask = { ...currentTask, assignedTo: '' };
            console.log('Unassigning task:', { taskId, updatedTask });

            const response = await fetch(`${url}/task/${taskId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedTask),
            });

            if (!response.ok) {
                throw new Error('Failed to unassign task');
            }

            setTasks(prev => prev.filter(task => task._id !== taskId));
        } catch (err) {
            console.error('Unassign error:', err);
            alert('Failed to unassign task: ' + err.message);
        } finally {
            setUpdatingTasks(prev => {
                const newSet = new Set(prev);
                newSet.delete(taskId);
                return newSet;
            });
        }
    }, []);

    const getPriorityConfig = useCallback((priority) => {
        switch (priority) {
            case 'Critical':
                return { color: 'text-red-300', bg: 'bg-red-600/30', icon: FiAlertTriangle };
            case 'High':
                return { color: 'text-orange-300', bg: 'bg-orange-600/30', icon: FiFlag };
            case 'Medium':
                return { color: 'text-yellow-300', bg: 'bg-yellow-600/30', icon: FiFlag };
            case 'Low':
                return { color: 'text-green-300', bg: 'bg-green-600/30', icon: FiFlag };
            default:
                return { color: 'text-gray-300', bg: 'bg-gray-600/30', icon: FiFlag };
        }
    }, []);

    const getStatusConfig = useCallback((status) => {
        switch (status) {
            case 'ToDo':
                return { color: 'text-blue-300', bg: 'bg-blue-600/30', icon: FiClock, label: 'To Do' };
            case 'InProgress':
                return { color: 'text-purple-300', bg: 'bg-purple-600/30', icon: FiPlay, label: 'In Progress' };
            case 'Review':
                return { color: 'text-amber-300', bg: 'bg-amber-600/30', icon: FiEye, label: 'Review' };
            case 'Done':
                return { color: 'text-green-300', bg: 'bg-green-600/30', icon: FiCheckCircle, label: 'Done' };
            default:
                return { color: 'text-gray-300', bg: 'bg-gray-600/30', icon: FiClock, label: status };
        }
    }, []);

    const formatDate = useCallback((dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = date - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return { text: `${Math.abs(diffDays)} days overdue`, color: 'text-red-300', urgent: true };
        } else if (diffDays === 0) {
            return { text: 'Due today', color: 'text-orange-300', urgent: true };
        } else if (diffDays === 1) {
            return { text: 'Due tomorrow', color: 'text-yellow-300', urgent: false };
        } else {
            return { text: `${diffDays} days left`, color: 'text-pink-300', urgent: false };
        }
    }, []);

    const toggleTaskExpand = (taskId) => {
        setExpandedTasks(prev => ({
            ...prev,
            [taskId]: !prev[taskId]
        }));
    };

    const filteredAndSortedTasks = tasks
        .filter(task => filterStatus === 'All' || task.status === filterStatus)
        .sort((a, b) => {
            switch (sortBy) {
                case 'deadline':
                    return new Date(a.deadline) - new Date(b.deadline);
                case 'priority':
                    const priorityOrder = { 'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3 };
                    return priorityOrder[a.priority] - priorityOrder[b.priority];
                case 'status':
                    return a.status.localeCompare(b.status);
                default:
                    return 0;
            }
        });

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-teal-900 font-inter flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="text-center"
                >
                    <FiLoader className="w-12 h-12 text-pink-400 mx-auto mb-4" />
                    <p className="text-gray-300 text-lg">Loading your tasks...</p>
                </motion.div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-teal-900 font-inter flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center glossy-card p-8 rounded-2xl max-w-md"
                >
                    <FiAlertCircle className="w-12 h-12 text-red-300 mx-auto mb-4" />
                    <p className="text-red-300 text-lg mb-4">Error loading tasks</p>
                    <p className="text-gray-300 mb-6">{error}</p>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={fetchTasks}
                        className="glossy-button px-6 py-3 text-white rounded-xl"
                    >
                        Try Again
                    </motion.button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-teal-900 font-inter p-6">
            <style>
                {`
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                    .font-inter {
                        font-family: 'Inter', 'Roboto', sans-serif;
                    }
                    .glossy-card {
                        background: rgba(255, 255, 255, 0.1);
                        backdrop-filter: blur(20px);
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        border-image: linear-gradient(45deg, rgba(236, 72, 153, 0.3), rgba(139, 92, 246, 0.3)) 1;
                        box-shadow: 0 12px 48px rgba(0, 0, 0, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.5);
                        border-radius: 24px;
                        position: relative;
                        overflow: hidden;
                        transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
                    }
                    .glossy-card:hover {
                        transform: translateY(-6px);
                        box-shadow: 0 16px 64px rgba(236, 72, 153, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.6);
                        border-color: rgba(236, 72, 153, 0.5);
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
                            rgba(236, 72, 153, 0.2),
                            rgba(139, 92, 246, 0.1),
                            rgba(20, 184, 166, 0.2)
                        );
                        transform: rotate(45deg);
                        animation: glossy 5s linear infinite;
                    }
                    @keyframes glossy {
                        0% { transform: translateX(-50%) rotate(45deg); }
                        100% { transform: translateX(50%) rotate(45deg); }
                    }
                    .glossy-button {
                        background: linear-gradient(135deg, #f472b6, #a78bfa);
                        border: none;
                        box-shadow: 0 8px 24px rgba(236, 72, 153, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.6);
                        transition: all 0.3s ease;
                        position: relative;
                        overflow: hidden;
                        border-radius: 16px;
                    }
                    .glossy-button:hover {
                        transform: translateY(-4px);
                        box-shadow: 0 12px 32px rgba(236, 72, 153, 0.5), inset 0 1px 2px rgba(255, 255, 255, 0.7);
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
                            rgba(255, 255, 255, 0.5),
                            transparent
                        );
                        transition: all 0.5s ease;
                    }
                    .glossy-button:hover::before {
                        left: 100%;
                    }
                    .scrollbar-thin::-webkit-scrollbar {
                        width: 6px;
                    }
                    .scrollbar-thin::-webkit-scrollbar-thumb {
                        background: #a78bfa;
                        border-radius: 3px;
                    }
                    .scrollbar-thin::-webkit-scrollbar-track {
                        background: rgba(255, 255, 255, 0.05);
                    }
                `}
            </style>

            <div className="flex gap-6">
                <Sidebar currentActive={3} />
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6 }}
                    className="flex-1 max-w-5xl mx-auto flex flex-col lg:flex-row gap-6"
                >
                    {/* Sticky Sidebar (Filters & Sort) */}
                    <motion.aside
                        initial={{ x: -20 }}
                        animate={{ x: 0 }}
                        transition={{ duration: 0.5 }}
                        className={`fixed lg:static top-0 left-0 h-full lg:h-auto w-64 lg:w-48 bg-transparent p-4 z-20 transform ${
                            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                        } lg:translate-x-0 transition-transform duration-300`}
                    >
                        <div className="glossy-card p-4 rounded-2xl h-full flex flex-col gap-4 scrollbar-thin overflow-y-auto">
                            <h2 className="text-lg font-semibold text-white mb-2">Filter Tasks</h2>
                            {['All', 'ToDo', 'InProgress', 'Review'].map(status => (
                                <motion.button
                                    key={status}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                        setFilterStatus(status);
                                        setIsSidebarOpen(false);
                                    }}
                                    className={`glossy-button px-3 py-2 text-white rounded-xl text-sm font-medium text-left ${
                                        filterStatus === status ? 'bg-purple-600/50' : ''
                                    }`}
                                >
                                    {status === 'All' ? 'All' : getStatusConfig(status).label}
                                </motion.button>
                            ))}
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-300 mb-2">Sort by</label>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="glossy-card w-full p-3 text-white rounded-xl focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value="deadline">Deadline</option>
                                    <option value="priority">Priority</option>
                                    <option value="status">Status</option>
                                </select>
                            </div>
                        </div>
                    </motion.aside>

                    {/* Main Content */}
                    <div className="flex-1 flex flex-col gap-6">
                        {/* Sticky Header */}
                        <motion.header
                            initial={{ y: -20 }}
                            animate={{ y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="sticky top-0 z-10 glossy-card px-6 py-4 rounded-2xl"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
                                    My Tasks
                                </h1>
                                <div className="flex items-center gap-3">
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                        className="lg:hidden glossy-button p-2 rounded-xl text-white"
                                    >
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                        </svg>
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={fetchTasks}
                                        disabled={loading}
                                        className="glossy-button p-2 rounded-xl text-white"
                                    >
                                        <FiRefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                                    </motion.button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {['ToDo', 'InProgress', 'Review', 'All'].map(status => {
                                    const count = status === 'All' ? tasks.length : tasks.filter(t => t.status === status).length;
                                    const statusConfig = getStatusConfig(status);
                                    return (
                                        <motion.div
                                            key={status}
                                            whileHover={{ scale: 1.05 }}
                                            onClick={() => setFilterStatus(status)}
                                            className={`glossy-card p-3 rounded-xl cursor-pointer ${
                                                filterStatus === status ? 'bg-purple-600/50' : ''
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <statusConfig.icon className={`w-4 h-4 ${statusConfig.color}`} />
                                                <div>
                                                    <p className="text-lg font-bold text-white">{count}</p>
                                                    <p className="text-xs text-gray-300">
                                                        {status === 'All' ? 'Total' : statusConfig.label}
                                                    </p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </motion.header>

                        {/* Tasks List */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="glossy-card p-6 rounded-2xl"
                        >
                            {filteredAndSortedTasks.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-center py-12"
                                >
                                    <FiCheckCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold text-white mb-2">
                                        {filterStatus === 'All' ? 'No tasks assigned' : `No ${filterStatus.toLowerCase()} tasks`}
                                    </h3>
                                    <p className="text-gray-300">
                                        {filterStatus === 'All'
                                            ? 'You have no tasks assigned to you at the moment.'
                                            : `You have no tasks in ${filterStatus.toLowerCase()} status.`}
                                    </p>
                                </motion.div>
                            ) : (
                                <div className="grid grid-cols-1 gap-4">
                                    {filteredAndSortedTasks.map((task, index) => {
                                        const priorityConfig = getPriorityConfig(task.priority);
                                        const statusConfig = getStatusConfig(task.status);
                                        const dateInfo = formatDate(task.deadline);
                                        const isUpdating = updatingTasks.has(task._id);

                                        return (
                                            <motion.div
                                                key={task._id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.3, delay: index * 0.1 }}
                                                className="glossy-card p-4 rounded-2xl"
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <h3 className="text-lg font-semibold text-white line-clamp-1">
                                                        {task.taskName}
                                                    </h3>
                                                    <motion.button
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={() => toggleTaskExpand(task._id)}
                                                        className="text-gray-300 hover:text-white"
                                                    >
                                                        <FiChevronDown
                                                            size={20}
                                                            className={`transform transition-transform ${
                                                                expandedTasks[task._id] ? 'rotate-180' : ''
                                                            }`}
                                                        />
                                                    </motion.button>
                                                </div>
                                                <div className="flex items-center gap-3 mb-3">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${priorityConfig.bg} ${priorityConfig.color} flex items-center gap-1`}>
                                                        <priorityConfig.icon size={12} />
                                                        {task.priority}
                                                    </span>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusConfig.bg} ${statusConfig.color} flex items-center gap-1`}>
                                                        <statusConfig.icon size={12} />
                                                        {statusConfig.label}
                                                    </span>
                                                    <span className={`text-sm ${dateInfo.color} flex items-center gap-1`}>
                                                        <FiCalendar size={14} />
                                                        {dateInfo.text}
                                                        {dateInfo.urgent && (
                                                            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                                        )}
                                                    </span>
                                                </div>
                                                <AnimatePresence>
                                                    {expandedTasks[task._id] && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            transition={{ duration: 0.3 }}
                                                            className="text-sm text-gray-300 border-t border-gray-500/50 pt-2 mb-3"
                                                        >
                                                            {task.taskDescription}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                                <div className="grid grid-cols-3 gap-2 mb-3">
                                                    {['ToDo', 'InProgress', 'Review'].map(status => {
                                                        const config = getStatusConfig(status);
                                                        const isCurrentStatus = task.status === status;

                                                        return (
                                                            <motion.button
                                                                key={status}
                                                                whileHover={{ scale: isCurrentStatus || isUpdating ? 1 : 1.05 }}
                                                                whileTap={{ scale: isCurrentStatus || isUpdating ? 1 : 0.95 }}
                                                                onClick={() => updateTaskStatus(task._id, status, task)}
                                                                disabled={isCurrentStatus || isUpdating}
                                                                className={`glossy-button p-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1 ${
                                                                    isCurrentStatus || isUpdating ? 'opacity-50 cursor-not-allowed' : ''
                                                                }`}
                                                            >
                                                                {isUpdating ? (
                                                                    <FiLoader className="w-4 h-4 animate-spin" />
                                                                ) : (
                                                                    <>
                                                                        <config.icon size={14} />
                                                                        {config.label}
                                                                    </>
                                                                )}
                                                            </motion.button>
                                                        );
                                                    })}
                                                </div>
                                                <motion.button
                                                    whileHover={{ scale: isUpdating ? 1 : 1.05 }}
                                                    whileTap={{ scale: isUpdating ? 1 : 0.95 }}
                                                    onClick={() => unassignTask(task._id, task)}
                                                    disabled={isUpdating}
                                                    className={`glossy-button w-full p-2 rounded-xl text-sm font-medium flex items-center justify-center gap-1 ${
                                                        isUpdating ? 'opacity-50 cursor-not-allowed' : 'bg-red-600/30 text-red-300'
                                                    }`}
                                                >
                                                    {isUpdating ? (
                                                        <FiLoader className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <>
                                                            <FiUserX size={14} />
                                                            Unassign
                                                        </>
                                                    )}
                                                </motion.button>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default MyTasks;