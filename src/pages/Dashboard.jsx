import { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Briefcase, AlertCircle, User } from 'lucide-react';
import { useUser, UserButton } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import { Typewriter } from 'react-simple-typewriter';
import React from 'react';

// Error Boundary Component
class ErrorBoundary extends React.Component {
    state = { hasError: false, error: null };
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    render() {
        if (this.state.hasError) {
            return (
                <div className="text-center text-pink-400">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                    <p>Something went wrong: {this.state.error?.message}</p>
                </div>
            );
        }
        return this.props.children;
    }
}

const Dashboard = () => {
    const { user, isLoaded, isSignedIn } = useUser();
    const [workspaces, setWorkspaces] = useState([]);
    const [projects, setProjects] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const scrollContainerRef = useRef(null);

    // Get current user ID
    const currentUserId = user?.id || null;

    // Backend URL with fallback
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    if (!import.meta.env.VITE_BACKEND_URL) {
        console.warn('VITE_BACKEND_URL not set. Using fallback:', BACKEND_URL);
    }

    // Logging utility for development
    const log = import.meta.env.DEV ? console.log : () => {};

    useEffect(() => {
        if (!isLoaded) return;
        if (!isSignedIn) {
            setError('User not signed in');
            setLoading(false);
            return;
        }
        if (!currentUserId) {
            setError('User ID not available. Please ensure your account is configured.');
            setLoading(false);
            return;
        }
        fetchDashboardData();
    }, [isLoaded, isSignedIn, currentUserId]);

    // Auto-scroll carousel for workspaces
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container || workspaces.length === 0) return;

        const cardWidth = 304; // w-72 (288px) + space-x-4 (~16px)
        const scrollDuration = 4000; // 4 seconds per card

        const scrollNext = () => {
            const maxScroll = container.scrollWidth - container.clientWidth;
            const nextScroll = container.scrollLeft + cardWidth;

            if (nextScroll >= maxScroll) {
                container.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
                container.scrollTo({ left: nextScroll, behavior: 'smooth' });
            }
        };

        const interval = setInterval(scrollNext, scrollDuration);
        return () => clearInterval(interval);
    }, [workspaces]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);

            log('Fetching workspaces...');
            if (!BACKEND_URL) {
                throw new Error('Backend URL is not defined');
            }
            let workspaceResponse;
            try {
                workspaceResponse = await fetch(`${BACKEND_URL}/workspace`);
            } catch (fetchErr) {
                throw new Error(`Network error while fetching workspaces: ${fetchErr.message}`);
            }
            if (!workspaceResponse.ok) {
                throw new Error(`Failed to fetch workspaces: ${workspaceResponse.status}`);
            }
            const workspaceData = await workspaceResponse.json();
            if (!workspaceData.success || !Array.isArray(workspaceData.workspaces)) {
                throw new Error('Invalid workspace data format');
            }

            const userWorkspaces = workspaceData.workspaces.filter(workspace => {
                const members = Array.isArray(workspace.members) ? workspace.members : [];
                return members.some(member =>
                    typeof member === 'string' ? member === currentUserId : member.id === currentUserId
                );
            });
            setWorkspaces(userWorkspaces);

            const projectPromises = userWorkspaces.flatMap(workspace =>
                (workspace.projectIds || []).map(projectId =>
                    fetch(`${BACKEND_URL}/project/${projectId}`)
                        .then(res => res.ok ? res.json() : Promise.reject(`Failed to fetch project ${projectId}`))
                        .then(data => {
                            if (data.success && data.project) {
                                return { ...data.project, workspaceName: workspace.name };
                            }
                            return null;
                        })
                        .catch(err => {
                            console.error(err);
                            return null;
                        })
                )
            );
            const allProjects = (await Promise.all(projectPromises)).filter(project => project !== null);
            setProjects(allProjects);

            const taskPromises = allProjects.flatMap(project =>
                (project.taskIds || []).map(taskId =>
                    fetch(`${BACKEND_URL}/task/${taskId}`)
                        .then(res => res.ok ? res.json() : Promise.reject(`Failed to fetch task ${taskId}`))
                        .then(data => {
                            if (data) {
                                return { ...data, projectName: project.projectName, workspaceName: project.workspaceName };
                            }
                            return null;
                        })
                        .catch(err => {
                            console.error(err);
                            return null;
                        })
                )
            );
            const allTasks = (await Promise.all(taskPromises)).filter(task => task !== null);
            setTasks(allTasks);
        } catch (err) {
            setError(`Error fetching dashboard data: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const markTaskDone = async (taskId) => {
        try {
            const response = await fetch(`${BACKEND_URL}/task/${taskId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'Done' }),
            });
            if (response.ok) {
                fetchDashboardData();
            } else {
                setError('Failed to update task status');
            }
        } catch (err) {
            setError(`Error updating task: ${err.message}`);
        }
    };

    // Loading state while Clerk is loading
    if (!isLoaded) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-teal-900 flex items-center justify-center font-inter">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="h-12 w-12 border-4 border-t-pink-500 border-gray-700 rounded-full"
                />
                <p className="mt-4 text-gray-300">Loading user information...</p>
            </div>
        );
    }

    // Error state if not signed in
    if (!isSignedIn) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-teal-900 flex items-center justify-center font-inter">
                <div className="text-center text-pink-400">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                    <p>Please sign in to view your dashboard.</p>
                </div>
            </div>
        );
    }

    // Calculate metrics
    const myTasks = tasks.filter(task => task.assignedTo === currentUserId);
    const unassignedTasks = tasks.filter(task => !task.assignedTo);

    // Role distribution
    const roleStats = projects.reduce((acc, project) => {
        const member = project.members?.find(m => m.id === currentUserId || m === currentUserId);
        if (member) {
            const role = typeof member === 'string' ? member : member.role;
            acc[role] = (acc[role] || 0) + 1;
        }
        return acc;
    }, {});
    const roleData = Object.entries(roleStats).map(([role, count]) => ({
        role,
        count,
        color: role === 'Admin' ? '#EC4899' : role === 'Contributor' ? '#8B5CF6' : '#14B8A6'
    })).filter(entry => entry.count > 0);

    // Upcoming deadlines (next 7 days)
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcomingTasks = tasks
        .filter(task => {
            if (!task.deadline) return false;
            const deadline = new Date(task.deadline);
            return deadline >= now && deadline <= sevenDaysFromNow && task.status !== 'Done';
        })
        .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

    // Task status distribution
    const statusStats = tasks.reduce((acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
    }, {});
    const statusData = Object.entries(statusStats).map(([status, count]) => ({
        status,
        count,
        color:
            status === 'Done' ? '#14B8A6' :
            status === 'In-Progress' ? '#F59E0B' :
            status === 'Review' ? '#8B5CF6' :
            status === 'ToDo' ? '#EC4899' : '#9CA3AF'
    }));

    // Priority distribution
    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'High': return 'bg-pink-600/20 text-pink-300 border-pink-500/50';
            case 'Medium': return 'bg-yellow-600/20 text-yellow-300 border-yellow-500/50';
            case 'Low': return 'bg-teal-600/20 text-teal-300 border-teal-500/50';
            default: return 'bg-gray-600/20 text-gray-300 border-gray-500/50';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-teal-900 flex items-center justify-center font-inter">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="h-12 w-12 border-4 border-t-pink-500 border-gray-700 rounded-full"
                />
                <p className="mt-4 text-gray-300">Loading dashboard...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-teal-900 flex items-center justify-center font-inter">
                <div className="text-center text-pink-400">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                    <p>Error loading dashboard: {error}</p>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={fetchDashboardData}
                        className="mt-4 px-4 py-2 glossy-button text-white rounded-xl"
                    >
                        Retry
                    </motion.button>
                </div>
            </div>
        );
    }

    return (
        <ErrorBoundary>
            <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-teal-900 font-inter">
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

                <div className="flex">
                    <Sidebar currentActive={1} />
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6 }}
                        className="flex-1 p-6 flex flex-col gap-8 max-w-4xl mx-auto"
                    >
                        {/* Sticky Header */}
                        <motion.header
                            initial={{ y: -20 }}
                            animate={{ y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="sticky top-0 z-10 glossy-card px-6 py-4 mb-6 flex items-center justify-between rounded-2xl"
                        >
                            <div className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400 flex items-center gap-2">
                                Toman
                                <span className="text-gray-300 text-lg ml-4 font-medium">
                                    {Typewriter ? (
                                        <Typewriter
                                            words={["Empowering Teams 💡", "Organize. Assign. Track 📌", "Your Tasks, Your Way 🛠️"]}
                                            loop={0}
                                            cursor
                                            cursorStyle="|"
                                            typeSpeed={60}
                                            deleteSpeed={40}
                                            delaySpeed={1500}
                                        />
                                    ) : (
                                        <span>Empowering Teams 💡</span>
                                    )}
                                </span>
                            </div>
                            <motion.div whileHover={{ scale: 1.05 }}>
                                <UserButton />
                            </motion.div>
                        </motion.header>

                        {/* Your Workspaces (Carousel) */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="glossy-card p-6 rounded-2xl"
                        >
                            <h3 className="text-lg font-semibold text-white mb-4">Your Workspaces</h3>
                            {workspaces.length > 0 ? (
                                <div
                                    ref={scrollContainerRef}
                                    className="flex space-x-4 snap-x snap-mandatory overflow-x-auto pb-4 scrollbar-thin"
                                >
                                    {workspaces.map((workspace, index) => (
                                        <motion.div
                                            key={workspace._id}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.3, delay: index * 0.1 }}
                                            whileHover={{ scale: 1.05 }}
                                            className="snap-center flex-shrink-0 w-72 cursor-pointer"
                                        >
                                            <div className="glossy-card p-4 rounded-xl">
                                                <div className="flex items-center mb-3">
                                                    <img
                                                        src={workspace.avatar}
                                                        alt={workspace.name}
                                                        className="w-10 h-10 rounded-full mr-3 object-cover border border-pink-500/50"
                                                        onError={(e) => (e.target.src = 'https://via.placeholder.com/40')}
                                                    />
                                                    <div>
                                                        <h4 className="font-semibold text-white">{workspace.name}</h4>
                                                        <p className="text-sm text-gray-300">{workspace.visibility || 'Private'}</p>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-gray-300 mb-3 line-clamp-2">{workspace.description || 'No description'}</p>
                                                <div className="flex justify-between text-sm text-gray-300">
                                                    <span>{workspace.projectIds?.length || 0} Projects</span>
                                                    <span>{workspace.members?.length || 0} Members</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-300 mb-2">No workspaces found</p>
                                    <p className="text-sm text-gray-400">You haven't joined any workspaces yet.</p>
                                </div>
                            )}
                        </motion.section>

                        {/* Task Assignment */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="glossy-card p-6 rounded-2xl"
                        >
                            <h3 className="text-lg font-semibold text-white mb-4">Task Assignment</h3>
                            <div className="space-y-4">
                                <motion.div
                                    whileHover={{ scale: 1.03 }}
                                    className="flex items-center justify-between p-4 glossy-card rounded-xl"
                                >
                                    <div className="flex items-center">
                                        <User className="h-5 w-5 text-pink-400 mr-3" />
                                        <span className="font-medium text-white">My Tasks</span>
                                    </div>
                                    <span className="text-2xl font-bold text-pink-400">{myTasks.length}</span>
                                </motion.div>
                                <motion.div
                                    whileHover={{ scale: 1.03 }}
                                    className="flex items-center justify-between p-4 glossy-card rounded-xl"
                                >
                                    <div className="flex items-center">
                                        <AlertCircle className="h-5 w-5 text-orange-400 mr-3" />
                                        <span className="font-medium text-white">Unassigned Tasks</span>
                                    </div>
                                    <span className="text-2xl font-bold text-orange-400">{unassignedTasks.length}</span>
                                </motion.div>
                                {(myTasks.length > 0 || unassignedTasks.length > 0) && (
                                    <div className="mt-4 h-32">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={[
                                                { name: 'My Tasks', value: myTasks.length, fill: '#EC4899' },
                                                { name: 'Unassigned', value: unassignedTasks.length, fill: '#F59E0B' }
                                            ]}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
                                                <XAxis dataKey="name" stroke="#D1D5DB" />
                                                <YAxis stroke="#D1D5DB" />
                                                <Tooltip />
                                                <Bar dataKey="value" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                            </div>
                        </motion.section>

                        {/* Upcoming Deadlines */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="glossy-card p-6 rounded-2xl"
                        >
                            <h3 className="text-lg font-semibold text-white mb-4">Upcoming Deadlines (Next 7 Days)</h3>
                            <div className="space-y-3 max-h-64 overflow-y-auto">
                                {upcomingTasks.length > 0 ? upcomingTasks.map((task, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="glossy-card p-4 rounded-xl flex items-center justify-between"
                                    >
                                        <div className="flex-1">
                                            <h4 className="font-medium text-white">{task.taskName}</h4>
                                            <p className="text-sm text-gray-300">{task.projectName}</p>
                                            <p className="text-xs text-gray-400">Due: {new Date(task.deadline).toLocaleDateString()}</p>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                                                {task.priority}
                                            </span>
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => markTaskDone(task._id)}
                                                className="glossy-button px-3 py-1 text-white rounded-xl text-xs font-medium"
                                            >
                                                Mark Done
                                            </motion.button>
                                        </div>
                                    </motion.div>
                                )) : (
                                    <p className="text-gray-300 text-center py-8">No upcoming deadlines in the next 7 days</p>
                                )}
                            </div>
                        </motion.section>

                        {/* Charts (Role & Status) */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="flex flex-col sm:flex-row gap-6"
                        >
                            {/* Role Distribution */}
                            <div className="flex-1 glossy-card p-6 rounded-2xl">
                                <h3 className="text-lg font-semibold text-white mb-3">Role Distribution</h3>
                                {roleData.length > 0 ? (
                                    <>
                                        <div className="h-48">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={roleData}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={40}
                                                        outerRadius= {80}
                                                        paddingAngle={5}
                                                        dataKey="count"
                                                    >
                                                        {roleData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip formatter={(value, name) => [value, `${name} Projects`]} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="flex justify-center space-x-4 mt-4 flex-wrap gap-2">
                                            {roleData.map((role, index) => (
                                                <div key={index} className="flex items-center">
                                                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: role.color }}></div>
                                                    <span className="text-sm text-gray-300">{role.role}: {role.count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex items-center justify-center h-48 text-gray-300">
                                        <p>No project roles found</p>
                                    </div>
                                )}
                            </div>

                            {/* Task Status Distribution */}
                            <div className="flex-1 glossy-card p-6 rounded-2xl">
                                <h3 className="text-lg font-semibold text-white mb-4">Task Status Overview</h3>
                                {statusData.length > 0 ? (
                                    <div className="h-48">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={statusData}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
                                                <XAxis dataKey="status" stroke="#D1D5DB" />
                                                <YAxis stroke="#D1D5DB" />
                                                <Tooltip />
                                                <Bar dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center h-48 text-gray-300">
                                        <p>No tasks found</p>
                                    </div>
                                )}
                            </div>
                        </motion.section>
                    </motion.div>
                </div>
            </div>
        </ErrorBoundary>
    );
};

export default Dashboard;
