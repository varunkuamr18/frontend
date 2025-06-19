import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, ChevronDown, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const WorkSpaceMyTasks = () => {
    const url = import.meta.env.VITE_BACKEND_URL;
    const { id } = useParams();
    const [currentUserTasks, setCurrentUserTasks] = useState([]);
    const [error, setError] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [expandedTasks, setExpandedTasks] = useState({});
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    useEffect(() => {
        fetchWorkSpaceTasks();
    }, [id]);

    const fetchWorkSpaceTasks = async () => {
        try {
            const fetchData = await fetch(`${url}/workspace/${id}`);
            if (!fetchData.ok) {
                throw new Error('Failed to fetch workspace tasks');
            }
            const fetchJsonData = await fetchData.json();
            console.log(fetchJsonData);

            const tasks = fetchJsonData.tasks || [];
            setCurrentUserTasks(tasks.map(task => ({
                ...task,
                id: task.id || task._id,
                status: task.status || 'pending',
                title: task.title || 'Untitled Task',
                description: task.description || 'No description available.',
                dueDate: task.dueDate || null
            })));
        } catch (err) {
            console.error('Error fetching tasks:', err);
            setError('Failed to load tasks. Please try again.');
            setTimeout(() => setError(''), 3000);
        }
    };

    const markTaskCompleted = async (taskId) => {
        try {
            const response = await fetch(`${url}/task/${taskId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'completed' }),
            });
            if (!response.ok) {
                throw new Error('Failed to update task status');
            }
            setCurrentUserTasks(prev =>
                prev.map(task =>
                    task.id === taskId ? { ...task, status: 'completed' } : task
                )
            );
        } catch (err) {
            console.error('Error updating task:', err);
            setError('Failed to mark task as completed.');
            setTimeout(() => setError(''), 3000);
        }
    };

    const toggleTaskExpand = (taskId) => {
        setExpandedTasks(prev => ({
            ...prev,
            [taskId]: !prev[taskId]
        }));
    };

    const filteredTasks = filterStatus === 'All'
        ? currentUserTasks
        : currentUserTasks.filter(task => task.status.toLowerCase() === filterStatus.toLowerCase());

    const getStatusStyles = (status) => {
        switch (status.toLowerCase()) {
            case 'completed':
                return 'bg-green-600/30 text-green-200 border-green-500/50';
            case 'inprogress':
                return 'bg-purple-600/30 text-purple-200 border-purple-500/50';
            case 'pending':
            default:
                return 'bg-gray-600/30 text-gray-200 border-gray-500/50';
        }
    };

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

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6"
            >
                {/* Filter Panel (Sidebar) */}
                <motion.aside
                    initial={{ x: -20 }}
                    animate={{ x: 0 }}
                    transition={{ duration: 0.5 }}
                    className={`fixed lg:static top-0 left-0 h-full lg:h-auto w-64 lg:w-48 bg-transparent p-4 z-20 transform ${
                        isFilterOpen ? 'translate-x-0' : '-translate-x-full'
                    } lg:translate-x-0 transition-transform duration-300`}
                >
                    <div className="glossy-card p-4 rounded-2xl h-full flex flex-col gap-3 scrollbar-thin overflow-y-auto">
                        <h2 className="text-lg font-semibold text-white mb-2">Filter Tasks</h2>
                        {['All', 'Pending', 'InProgress', 'Completed'].map(status => (
                            <motion.button
                                key={status}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                    setFilterStatus(status);
                                    setIsFilterOpen(false);
                                }}
                                className={`glossy-button px-3 py-2 text-white rounded-xl text-sm font-medium text-left ${
                                    filterStatus === status ? 'bg-purple-600/50' : ''
                                }`}
                            >
                                {status}
                            </motion.button>
                        ))}
                    </div>
                </motion.aside>

                {/* Main Content */}
                <div className="flex-1 flex flex-col gap-6">
                    {/* Sticky Header */}
                    <motion.header
                        initial={{ y: -20 }}
                        animate={{ y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="sticky top-0 z-10 glossy-card px-6 py-4 rounded-2xl flex items-center justify-between"
                    >
                        <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
                            My Tasks
                        </h1>
                        <div className="flex items-center gap-3">
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className="lg:hidden glossy-button p-2 rounded-xl text-white"
                            >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={fetchWorkSpaceTasks}
                                className="glossy-button p-2 rounded-xl text-white"
                                title="Refresh Tasks"
                            >
                                <RefreshCw size={20} />
                            </motion.button>
                        </div>
                    </motion.header>

                    {/* Error Message */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="glossy-card p-3 border border-red-300/50 text-red-300 rounded-2xl"
                            >
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Tasks List */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="glossy-card p-6 rounded-2xl"
                    >
                        {filteredTasks.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center py-12 text-gray-300"
                            >
                                <CheckCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                <p className="text-lg">
                                    No tasks {filterStatus === 'All' ? 'assigned to you' : `with status "${filterStatus}"`}.
                                </p>
                            </motion.div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {filteredTasks.map((task, index) => (
                                    <motion.div
                                        key={task.id || index}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: index * 0.1 }}
                                        className="glossy-card p-4 rounded-2xl"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h3 className="text-lg font-semibold text-white">
                                                        {task.title}
                                                    </h3>
                                                    <motion.button
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={() => toggleTaskExpand(task.id)}
                                                        className="text-gray-300 hover:text-white"
                                                    >
                                                        <ChevronDown
                                                            size={20}
                                                            className={`transform transition-transform ${
                                                                expandedTasks[task.id] ? 'rotate-180' : ''
                                                            }`}
                                                        />
                                                    </motion.button>
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-gray-300">
                                                    <span>
                                                        Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                                                    </span>
                                                    <span
                                                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusStyles(
                                                            task.status
                                                        )}`}
                                                    >
                                                        {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                                                    </span>
                                                </div>
                                            </div>
                                            {task.status.toLowerCase() !== 'completed' && (
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => markTaskCompleted(task.id)}
                                                    className="glossy-button px-3 py-1 text-white rounded-xl text-sm font-medium ml-4"
                                                >
                                                    Mark as Completed
                                                </motion.button>
                                            )}
                                        </div>
                                        <AnimatePresence>
                                            {expandedTasks[task.id] && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.3 }}
                                                    className="mt-3 text-sm text-gray-300 border-t border-gray-500/50 pt-2"
                                                >
                                                    {task.description}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
};

export default WorkSpaceMyTasks;