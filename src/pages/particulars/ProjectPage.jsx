import { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import Sidebar from '../../components/Sidebar';
import { GripVertical, Shield, AlertTriangle } from 'lucide-react';
import { useParams } from 'react-router-dom';
import CreateTaskButton from '../../components/project/CreateTaskButton';
import NormalLoader from '../../components/NormalLoader';
import ProjectPageHeader from '../../components/project/ProjectPageHeader';
import ManageTaskButton from '../../components/project/ManageTaskButton';
import { motion } from 'framer-motion';

const ProjectPage = () => {
    const url = import.meta.env.VITE_BACKEND_URL;
    const { id } = useParams();
    const { user } = useUser();
    const [projectData, setProjectData] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [members, setMembers] = useState([]);
    const [showCreateTask, setShowCreateTask] = useState(false);
    const [newTaskBool, setNewTaskBool] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [draggedTask, setDraggedTask] = useState(null);
    const [currentUserRole, setCurrentUserRole] = useState('Viewer');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('deadline');
    const [refresh, setRefresh] = useState(false);
    const [dragOverColumn, setDragOverColumn] = useState(null);
    const [isDragging, setIsDragging] = useState(false);

    const reFreshFunc = () => {
        setRefresh(!refresh);
    }

    useEffect(() => {
        const fetchProjectData = async () => {
            try {
                const response = await fetch(`${url}/project/${id}`, {
                    method: 'GET',
                    headers: {
                        'content-type': 'application/json'
                    },
                });
                const data = await response.json();

                if (!data.success) {
                    throw new Error("Failed to fetch project data");
                }

                console.log("Project Data:", data);
                setProjectData(data.project);

                const currentUserMember = data.project.members.find(member => member.id === user?.id);
                if (currentUserMember) {
                    setCurrentUserRole(currentUserMember.role);
                }

                const memberPromises = data.project.members.map(async (member) => {
                    const userResponse = await fetch(`${url}/user/${member.id}`);
                    const userData = await userResponse.json();
                    return { ...userData.user, role: member.role };
                });

                const memberDetails = await Promise.all(memberPromises);
                setMembers(memberDetails);

                const taskDetails = await Promise.all(
                    data.project.taskIds.map(async (taskId) => {
                        const eachTask = await fetch(`${url}/task/${taskId}`);
                        const taskData = await eachTask.json();

                        const {
                            _id,
                            taskName,
                            taskDescription,
                            deadline,
                            priority,
                            assignedTo,
                            status
                        } = taskData;

                        const assignedToName = assignedTo === '' ? '' : await fetchUserName(assignedTo);

                        return {
                            id: _id,
                            name: taskName,
                            description: taskDescription,
                            deadline,
                            priority,
                            assignedTo: assignedToName,
                            assignedToId: assignedTo,
                            status
                        };
                    })
                );

                setTasks(taskDetails);
                console.log("Fetched Tasks:", taskDetails);
            } catch (error) {
                setError(error.message);
                console.error("Error fetching project data:", error);
            } finally {
                setLoading(false);
            }
        };

        if (user?.id) {
            fetchProjectData();
        }
    }, [id, url, user?.id, newTaskBool, refresh]);

    const fetchUserName = async (userId) => {
        try {
            console.log("Fetching username for userId:", userId);
            if (!userId || typeof userId !== 'string') {
                console.warn("Invalid userId:", userId);
                return '';
            }
            const response = await fetch(`${url}/user/${userId}`);
            if (!response.ok) {
                console.warn(`Failed to fetch user for ID: ${userId}, status: ${response.status}`);
                return '';
            }
            const newData = await response.json();
            console.log("User data:", newData);
            return newData.user?.name || '';
        } catch (error) {
            console.error(`Error fetching username for userId ${userId}:`, error);
            return '';
        }
    };

    const normalizeTaskData = async (backendTask) => {
        const assignedToName = backendTask.assignedTo && backendTask.assignedTo !== ''
            ? await fetchUserName(backendTask.assignedTo)
            : '';

        return {
            id: backendTask._id || backendTask.id,
            name: backendTask.taskName || backendTask.name,
            description: backendTask.taskDescription || backendTask.description,
            deadline: backendTask.deadline,
            priority: backendTask.priority,
            assignedTo: assignedToName,
            assignedToId: backendTask.assignedTo || '',
            status: backendTask.status
        };
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getMinMaxDates = () => {
        if (!projectData) return { min: '', max: '' };
        const startDate = new Date(projectData.startDate).toISOString().split('T')[0];
        const endDate = new Date(projectData.endDate).toISOString().split('T')[0];
        return { min: startDate, max: endDate };
    };

    const handleCreateTask = async (newTask) => {
        setLoading(true);
        try {
            const taskData = {
                projectId: id,
                taskName: newTask.taskName,
                taskDescription: newTask.taskDescription,
                deadline: newTask.deadline,
                priority: newTask.priority,
                status: newTask.status || 'ToDo',
                assignedTo: newTask.assignedTo,
            };

            const resp = await fetch(`${url}/task`, {
                method: 'POST',
                headers: {
                    'content-type': 'application/json'
                },
                body: JSON.stringify(taskData)
            });

            if (!resp.ok) {
                const errorData = await resp.json();
                const errorMsg = errorData.error || "Task creation failed";
                console.error(errorMsg);
                setError(errorMsg);
                return;
            }

            const createdTask = await resp.json();
            const taskId = createdTask._id;

            if (!taskId) {
                throw new Error("Task ID not returned from backend");
            }

            const updatedTaskIds = [...(projectData.taskIds || []), taskId];
            const projectResponse = await fetch(`${url}/project/${id}`, {
                method: 'PUT',
                headers: {
                    'content-type': 'application/json'
                },
                body: JSON.stringify({ taskIds: updatedTaskIds })
            });

            if (!projectResponse.ok) {
                const errorData = await projectResponse.json();
                const errorMsg = errorData.error || "Project update failed";
                console.error(errorMsg);
                setError(errorMsg);
                return;
            }

            setNewTaskBool(!newTaskBool);
            setProjectData({ ...projectData, taskIds: updatedTaskIds });
            console.log("New Task Created:", createdTask);
        } catch (error) {
            console.error("Error in handleCreateTask:", error.message);
            setError(error.message || "Failed to create task");
        } finally {
            setLoading(false);
        }
    };

    const canDragToStatus = (task, newStatus) => {
        if (newStatus === 'Done' && task.status === 'Review') {
            return currentUserRole === 'Admin';
        }
        if (currentUserRole === 'Viewer') {
            return false;
        }
        return true;
    };

    const handleDragStart = (e, task) => {
        setDraggedTask(task);
        setIsDragging(true);
        e.dataTransfer.setData('text/plain', task.id);
        e.dataTransfer.effectAllowed = 'move';
        
        // Create a custom drag image
        const dragImage = document.createElement('div');
        dragImage.style.position = 'absolute';
        dragImage.style.top = '-9999px';
        dragImage.style.width = '200px';
        dragImage.style.padding = '8px';
        dragImage.style.background = 'rgba(30, 41, 59, 0.8)';
        dragImage.style.border = '1px solid rgba(255, 255, 255, 0.2)';
        dragImage.style.borderRadius = '8px';
        dragImage.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        dragImage.style.color = 'white';
        dragImage.style.fontSize = '14px';
        dragImage.style.pointerEvents = 'none';
        dragImage.innerHTML = task.name;
        document.body.appendChild(dragImage);
        e.dataTransfer.setDragImage(dragImage, 100, 20);
        setTimeout(() => document.body.removeChild(dragImage), 0);
    };

    const handleDragEnd = () => {
        setDraggedTask(null);
        setIsDragging(false);
        setDragOverColumn(null);
    };

    const handleDragOver = (e, status) => {
        e.preventDefault();
        if (draggedTask && canDragToStatus(draggedTask, status)) {
            e.dataTransfer.dropEffect = 'move';
            setDragOverColumn(status);
        } else {
            e.dataTransfer.dropEffect = 'none';
        }
    };

    const handleDragEnter = (e, status) => {
        e.preventDefault();
        if (draggedTask && canDragToStatus(draggedTask, status)) {
            setDragOverColumn(status);
        }
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        if (!e.currentTarget.contains(e.relatedTarget)) {
            setDragOverColumn(null);
        }
    };

    const handleDrop = async (e, newStatus) => {
        e.preventDefault();
        setDragOverColumn(null);

        if (!draggedTask || draggedTask.status === newStatus) return;
        if (!canDragToStatus(draggedTask, newStatus)) return;

        const updatedTaskData = {
            taskName: draggedTask.name,
            taskDescription: draggedTask.description,
            deadline: draggedTask.deadline,
            priority: draggedTask.priority,
            status: newStatus,
            assignedTo: draggedTask.assignedToId || '',
        };

        try {
            const response = await fetch(`${url}/task/${draggedTask.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedTaskData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Failed to update task:", errorData.error || response.statusText);
                return;
            }

            const savedTask = await response.json();
            const normalizedTask = await normalizeTaskData(savedTask);

            setTasks(prevTasks =>
                prevTasks.map(task =>
                    task.id === draggedTask.id ? normalizedTask : task
                )
            );

        } catch (error) {
            console.error("Error updating task status:", error);
        } finally {
            setDraggedTask(null);
            setIsDragging(false);
        }
    };

    const handleAssignToMe = async (taskId) => {
        const currentUserId = user?.id;
        const currentUserName = user?.fullName || user?.firstName || 'Unknown User';

        if (!currentUserId) {
            console.error("User not logged in.");
            return;
        }

        const taskToUpdate = tasks.find(task => task.id === taskId);
        if (!taskToUpdate) {
            console.error("Task not found");
            return;
        }

        const updatedTaskData = {
            taskName: taskToUpdate.name,
            taskDescription: taskToUpdate.description,
            deadline: taskToUpdate.deadline,
            priority: taskToUpdate.priority,
            status: taskToUpdate.status,
            assignedTo: currentUserId,
        };

        try {
            const response = await fetch(`${url}/task/${taskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedTaskData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Failed to assign task:", errorData.error || response.statusText);
                return;
            }

            const savedTask = await response.json();
            const normalizedTask = await normalizeTaskData(savedTask);

            setTasks(prevTasks =>
                prevTasks.map(task =>
                    task.id === taskId ? normalizedTask : task
                )
            );

        } catch (error) {
            console.error("Error assigning task:", error);
        }
    };

    const filteredTasks = tasks
        .filter(task =>
            task.name?.toLowerCase().includes(searchQuery?.toLowerCase()) ||
            task.description?.toLowerCase().includes(searchQuery?.toLowerCase())
        )
        .sort((a, b) => {
            if (sortBy === 'deadline') {
                return new Date(a.deadline) - new Date(b.deadline);
            } else if (sortBy === 'priority') {
                const priorityOrder = { 'Critical': 1, 'High': 2, 'Medium': 3, 'Low': 4 };
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            }
            return 0;
        });

    const contributors = members.filter(member => member.role === 'Contributor');

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'Critical': return {
                text: 'text-red-400',
                bg: 'bg-red-600/20',
                border: 'border-red-600/50',
                icon: 'text-red-400'
            };
            case 'High': return {
                text: 'text-orange-400',
                bg: 'bg-orange-600/20',
                border: 'border-orange-600/50',
                icon: 'text-orange-400'
            };
            case 'Medium': return {
                text: 'text-blue-400',
                bg: 'bg-blue-600/20',
                border: 'border-blue-600/50',
                icon: 'text-blue-400'
            };
            case 'Low': return {
                text: 'text-green-400',
                bg: 'bg-green-600/20',
                border: 'border-green-600/50',
                icon: 'text-green-400'
            };
            default: return {
                text: 'text-gray-400',
                bg: 'bg-gray-600/20',
                border: 'border-gray-600/50',
                icon: 'text-gray-400'
            };
        }
    };

    const getStatusConfig = (status) => {
        switch (status) {
            case 'ToDo':
                return {
                    bg: 'bg-indigo-800/50',
                    border: 'border-indigo-500/50',
                    header: 'bg-indigo-900/70 text-white',
                    count: 'bg-indigo-600'
                };
            case 'InProgress':
                return {
                    bg: 'bg-amber-800/50',
                    border: 'border-amber-500/50',
                    header: 'bg-amber-900/70 text-white',
                    count: 'bg-amber-600'
                };
            case 'Review':
                return {
                    bg: 'bg-purple-800/50',
                    border: 'border-purple-500/50',
                    header: 'bg-purple-900/70 text-white',
                    count: 'bg-purple-600'
                };
            case 'Done':
                return {
                    bg: 'bg-green-800/50',
                    border: 'border-green-500/50',
                    header: 'bg-green-900/70 text-white',
                    count: 'bg-green-600'
                };
            default:
                return {
                    bg: 'bg-gray-800/50',
                    border: 'border-gray-500/50',
                    header: 'bg-gray-900/70 text-white',
                    count: 'bg-gray-600'
                };
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-teal-900 flex items-center justify-center font-inter">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                    <NormalLoader />
                    <p className="text-gray-300 mt-4">Loading project...</p>
                </motion.div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-teal-900 flex items-center justify-center font-inter">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center glossy-card p-8 max-w-md w-full"
                >
                    <div className="w-16 h-16 bg-pink-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="w-8 h-8 text-pink-500" />
                    </div>
                    <h2 className="text-lg font-semibold text-pink-400 mb-2">Error</h2>
                    <p className="text-gray-300 text-sm">{error}</p>
                </motion.div>
            </div>
        );
    }

    const { min, max } = getMinMaxDates();

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
                        background: linear-gradient(45deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.3));
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
                        color: white;
                        padding: 0.75rem 1.5rem;
                        font-weight: 500;
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
                        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
                        transition: all 0.5s ease;
                    }
                    .glossy-button:hover::before {
                        left: 100%;
                    }
                    .glossy-button-success {
                        background: linear-gradient(135deg, #10b981, #059669);
                    }
                    .glossy-subpanel {
                        background: rgba(255, 255, 255, 0.1);
                        backdrop-filter: blur(10px);
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        border-radius: 16px;
                        padding: 1rem;
                    }
                    .divider {
                        height: 1px;
                        background: rgba(255, 255, 255, 0.2);
                        margin: 1.5rem 0;
                    }
                    /* Enhanced Drag-and-drop styles */
                    .drag-overlay {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: rgba(0, 0, 0, 0.1);
                        backdrop-filter: blur(2px);
                        z-index: 999;
                        pointer-events: none;
                    }
                    .task-card {
                        transition: all 0.2s ease;
                        cursor: grab;
                    }
                    .task-card:active {
                        cursor: grabbing;
                    }
                    .task-card:hover .drag-handle {
                        color: rgba(244, 114, 182, 0.8);
                        transform: scale(1.1);
                    }
                    .drag-handle {
                        transition: all 0.2s ease;
                    }
                    .column-highlight {
                        border-color: rgba(244, 114, 182, 0.8) !important;
                        border-width: 3px !important;
                        box-shadow: 
                            0 0 20px rgba(244, 114, 182, 0.4),
                            inset 0 0 20px rgba(244, 114, 182, 0.1);
                        background: rgba(244, 114, 182, 0.05) !important;
                        transform: scale(1.02);
                    }
                    .column-invalid {
                        border-color: rgba(239, 68, 68, 0.8) !important;
                        border-width: 3px !important;
                        box-shadow: 
                            0 0 20px rgba(239, 68, 68, 0.4),
                            inset 0 0 20px rgba(239, 68, 68, 0.1);
                        background: rgba(239, 68, 68, 0.05) !important;
                    }
                `}
            </style>
            <Sidebar currentActive={2} />
            <div className="flex-1 p-6 flex flex-col items-center">
                {isDragging && <div className="drag-overlay" />}
                
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="glossy-card p-6 w-full max-w-6xl mb-20"
                >
                    <ProjectPageHeader
                        projectData={projectData}
                        currentUserRole={currentUserRole}
                        tasks={tasks}
                        members={members}
                        formatDate={formatDate}
                        currentUserId={user?.id}
                    />
                    <div className="divider"></div>

                    <div className="mb-4">
                        {currentUserRole === 'Admin' && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="mb-4 p-3 bg-purple-900/50 border border-purple-500/50 rounded-lg"
                            >
                                <div className="flex items-center space-x-2">
                                    <Shield className="w-4 h-4 text-purple-400" />
                                    <span className="text-xs text-purple-300">Admin: You can move tasks from Review to Done</span>
                                </div>
                            </motion.div>
                        )}
                        {currentUserRole !== 'Admin' && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="mb-4 p-3 bg-amber-900/50 border border-amber-500/50 rounded-lg"
                            >
                                <div className="flex items-center space-x-2">
                                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                                    <span className="text-xs text-amber-300">Only admins can move tasks to Done</span>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        <div className="glossy-subpanel mb-4">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="flex items-center space-x-3">
                                    <h2 className="text-xl font-semibold text-white">Task Board</h2>
                                    <span className="text-sm text-gray-300 bg-indigo-900/50 px-2 py-1 rounded-full">
                                        {filteredTasks.length} tasks
                                    </span>
                                </div>
                                {currentUserRole === 'Admin' && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-white font-medium">
                                            As an <span className="text-pink-400">Admin</span>, you can manage tasks and assign members.
                                        </span>
                                        <ManageTaskButton 
                                            projectId={id} 
                                            tasks={tasks} 
                                            members={members} 
                                            onRefresh={reFreshFunc} 
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center justify-between mb-4 mt-4">
                                <input
                                    type="text"
                                    placeholder="Search tasks..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white w-full max-w-xs"
                                />
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="ml-4 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
                                >
                                    <option value="deadline">Sort by Deadline</option>
                                    <option value="priority">Sort by Priority</option>
                                </select>
                                {currentUserRole !== 'Viewer' && (
                                    <button
                                        className="glossy-button ml-4"
                                        onClick={() => setShowCreateTask(true)}
                                    >
                                        + New Task
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>

                    {/* Task Columns */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {['ToDo', 'InProgress', 'Review', 'Done'].map(status => {
                            const statusTasks = filteredTasks.filter(task => task.status === status);
                            const statusConfig = getStatusConfig(status);
                            const isDragOver = dragOverColumn === status;
                            const isValidDrop = isDragOver && draggedTask && canDragToStatus(draggedTask, status);
                            const isInvalidDrop = isDragOver && draggedTask && !canDragToStatus(draggedTask, status);

                            return (
                                <div
                                    key={status}
                                    className={`rounded-lg border-2 p-3 transition-all duration-200 ${statusConfig.bg} ${statusConfig.border} ${
                                        isValidDrop ? 'column-highlight' : isInvalidDrop ? 'column-invalid' : ''
                                    }`}
                                    onDragOver={(e) => handleDragOver(e, status)}
                                    onDragEnter={(e) => handleDragEnter(e, status)}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, status)}
                                >
                                    <div className={`rounded-md px-4 py-2 text-sm font-semibold mb-2 ${statusConfig.header}`}>
                                        {status} <span className={`ml-2 px-2 py-1 rounded-full text-xs ${statusConfig.count}`}>{statusTasks.length}</span>
                                    </div>
                                    {statusTasks.map(task => {
                                        const priorityColors = getPriorityColor(task.priority);
                                        return (
                                            <motion.div
                                                key={task.id}
                                                className={`task-card p-3 mb-3 rounded-lg ${priorityColors.bg} border ${priorityColors.border} ${
                                                    draggedTask?.id === task.id ? 'opacity-50' : 'opacity-100'
                                                }`}
                                                draggable={currentUserRole !== 'Viewer'}
                                                onDragStart={(e) => handleDragStart(e, task)}
                                                onDragEnd={handleDragEnd}
                                                whileHover={{ scale: 1.01 }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <h4 className={`text-sm font-semibold ${priorityColors.text}`}>{task.name}</h4>
                                                    {currentUserRole !== 'Viewer' && (
                                                        <GripVertical 
                                                            className="w-4 h-4 text-gray-400 hover:text-pink-400 cursor-grab drag-handle"
                                                            onMouseDown={(e) => e.stopPropagation()}
                                                        />
                                                    )}
                                                </div>
                                                <p className="text-xs mt-1 text-gray-300">{task.description}</p>
                                                <div className="text-xs mt-2 flex justify-between text-gray-400">
                                                    <span>{formatDate(task.deadline)}</span>
                                                    <span>{task.assignedTo || 'Unassigned'}</span>
                                                </div>
                                                {task.assignedTo === '' && currentUserRole !== 'Viewer' && (
                                                    <button
                                                        className="mt-2 text-xs text-pink-300 underline"
                                                        onClick={() => handleAssignToMe(task.id)}
                                                    >
                                                        Assign to Me
                                                    </button>
                                                )}
                                            </motion.div>
                                        );
                                    })}
                                    {statusTasks.length === 0 && (
                                        <div className="text-center text-sm text-gray-400 py-4">
                                            No tasks in this column
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {showCreateTask && (
                        <CreateTaskButton
                            onClose={() => setShowCreateTask(false)}
                            onCreate={handleCreateTask}
                            contributors={contributors}
                            minDate={min}
                            maxDate={max}
                        />
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default ProjectPage;