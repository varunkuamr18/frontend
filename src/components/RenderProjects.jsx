import React, { useState, useEffect } from 'react';
import { Users, Folder, Search, Grid, List, Calendar, Activity, Star, Clock, ArrowRight, TrendingUp, Target, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RenderProjects = ({ workspace, refreshFlag }) => {
    const navigate = useNavigate();
    const url = import.meta.env.VITE_BACKEND_URL;
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [viewMode, setViewMode] = useState('grid');

    useEffect(() => {
        const fetchProjects = async () => {
            setLoading(true);
            try {
                const projectIdArray = workspace.projectIds || [];
                const projectPromises = projectIdArray.map(async (id) => {
                    const response = await fetch(`${url}/project/${id}`);
                    if (!response.ok) {
                        throw new Error(`Failed to fetch project ${id}`);
                    }
                    const data = await response.json();
                    if (data.success) {
                        let i = 0;
                        let planning = 0;
                        let planBool = false;
                        let statusPercentage = 0;
                        if (data.project.taskIds.length !== 0) {
                            for (i = 0; i < data.project.taskIds.length; i++) {
                                const fetchTaskStatus = await fetch(`${url}/task/${data.project.taskIds[i]}`);
                                const _data = await fetchTaskStatus.json();
                                if (_data.status === 'Done') {
                                    statusPercentage++;
                                } else if (_data.status === 'ToDo') {
                                    planning++;
                                }
                            }
                            statusPercentage = Math.round(statusPercentage * 100 / data.project.taskIds.length);
                        } else {
                            planBool = true;
                        }
                        if (planning === data.project.taskIds.length) {
                            planBool = true;
                        }

                        return {
                            _id: data.project._id,
                            name: data.project.projectName,
                            description: data.project.projectDescription,
                            startDate: data.project.startDate,
                            endDate: data.project.endDate,
                            members: data.project.members || [],
                            color: data.project.colorCode || '#6B46C1',
                            createdAt: data.project.createdAt,
                            updatedAt: data.project.updatedAt,
                            status: statusPercentage === 100 ? 'completed' : planBool ? 'planning' : 'in-progress',
                            progress: statusPercentage
                        };
                    } else {
                        throw new Error(`Project ${id} not found`);
                    }
                });

                const projectDetails = await Promise.all(projectPromises);
                setProjects(projectDetails);
                setLoading(false);
                console.log("rendering the proj");
            } catch (err) {
                setError(err.message);
                setProjects([]);
                setLoading(false);
            }
        };

        fetchProjects();
    }, [workspace.projectIds, url, refreshFlag]);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'in-progress': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
            case 'completed': return 'bg-green-500/20 text-green-300 border-green-500/30';
            case 'planning': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
            default: return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
        }
    };

    const getStatusIcon = (status) => {
        switch (status?.toLowerCase()) {
            case 'in-progress': return <Zap className="w-4 h-4" />;
            case 'completed': return <Target className="w-4 h-4" />;
            case 'planning': return <Clock className="w-4 h-4" />;
            default: return <Activity className="w-4 h-4" />;
        }
    };

    const filteredProjects = projects.filter(project => {
        const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            project.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === 'all' || project.status.toLowerCase() === filterStatus;
        return matchesSearch && matchesFilter;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="relative">
                        <div className="w-12 h-12 border-4 border-pink-500/30 border-t-pink-400 rounded-full animate-spin"></div>
                    </div>
                    <p className="mt-4 text-pink-300 text-base font-medium">Loading projects...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center bg-indigo-900/50 border border-pink-500/30 rounded-lg p-6">
                    <p className="text-pink-400 text-base font-medium">{error}</p>
                    <p className="text-pink-300/70 mt-1">Please try again later.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-transparent py-8 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Projects</h2>
                        <p className="text-pink-300 text-sm mt-1">Manage and track your workspace projects</p>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-pink-300" />
                            <input
                                type="text"
                                placeholder="Search projects..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 w-64 bg-indigo-900/50 border border-pink-500/30 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent text-white placeholder-pink-300/70"
                            />
                        </div>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-4 py-2 bg-indigo-900/50 border border-pink-500/30 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 text-white"
                        >
                            <option value="all" className="bg-indigo-900 text-white">All Status</option>
                            <option value="in-progress" className="bg-indigo-900 text-white">In Progress</option>
                            <option value="completed" className="bg-indigo-900 text-white">Completed</option>
                            <option value="planning" className="bg-indigo-900 text-white">Planning</option>
                        </select>
                        <div className="flex border border-pink-500/30 rounded-lg bg-indigo-900/50 shadow-sm">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 ${viewMode === 'grid' ? 'bg-pink-500/20 text-pink-400' : 'text-pink-300'} hover:bg-pink-500/10 transition-colors`}
                            >
                                <Grid className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 ${viewMode === 'list' ? 'bg-pink-500/20 text-pink-400' : 'text-pink-300'} hover:bg-pink-500/10 transition-colors`}
                            >
                                <List className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-indigo-900/50 border border-pink-500/30 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-pink-300">Total Projects</p>
                                <p className="text-2xl font-bold text-white">{projects.length}</p>
                            </div>
                            <div className="bg-purple-500/20 p-2 rounded-lg">
                                <Folder className="w-5 h-5 text-purple-300" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-indigo-900/50 border border-pink-500/30 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-pink-300">In Progress</p>
                                <p className="text-2xl font-bold text-blue-300">
                                    {projects.filter(p => p.status.toLowerCase() === 'in-progress').length}
                                </p>
                            </div>
                            <div className="bg-blue-500/20 p-2 rounded-lg">
                                <TrendingUp className="w-5 h-5 text-blue-300" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-indigo-900/50 border border-pink-500/30 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-pink-300">Completed</p>
                                <p className="text-2xl font-bold text-green-300">
                                    {projects.filter(p => p.status.toLowerCase() === 'completed').length}
                                </p>
                            </div>
                            <div className="bg-green-500/20 p-2 rounded-lg">
                                <Target className="w-5 h-5 text-green-300" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-indigo-900/50 border border-pink-500/30 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-pink-300">Planning</p>
                                <p className="text-2xl font-bold text-yellow-300">
                                    {projects.filter(p => p.status.toLowerCase() === 'planning').length}
                                </p>
                            </div>
                            <div className="bg-yellow-500/20 p-2 rounded-lg">
                                <Clock className="w-5 h-5 text-yellow-300" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Projects Display */}
                {filteredProjects.length === 0 ? (
                    <div className="text-center py-12 bg-indigo-900/50 border border-pink-500/30 rounded-lg shadow-sm">
                        <Folder className="w-12 h-12 text-pink-300/50 mx-auto mb-3" />
                        <h3 className="text-lg font-semibold text-white mb-2">No Projects Found</h3>
                        <p className="text-pink-300/70 text-sm">Adjust your search or filter criteria.</p>
                    </div>
                ) : (
                    <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                        {filteredProjects.map(project => (
                            <div
                                onClick={() => { navigate('project/' + project._id) }}
                                key={project._id}
                                className={`group bg-indigo-900/50 border border-pink-500/30 rounded-lg shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ${viewMode === 'list' ? 'flex items-center p-5' : ''}`}
                            >
                                {viewMode === 'grid' ? (
                                    <>
                                        <div className="relative">
                                            <div
                                                className="h-32 rounded-t-lg"
                                                style={{ backgroundColor: project.color }}
                                            >
                                                <div className="absolute inset-0 bg-black bg-opacity-10"></div>
                                                <div className="absolute top-3 right-3">
                                                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                                                        {getStatusIcon(project.status)}
                                                        <span>{project.status.replace('-', ' ')}</span>
                                                    </div>
                                                </div>
                                                <div className="absolute bottom-3 left-3">
                                                    <Folder className="w-8 h-8 text-white opacity-80" />
                                                </div>
                                            </div>
                                            <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                <ArrowRight className="w-5 h-5 text-white" />
                                            </div>
                                        </div>
                                        <div className="p-5">
                                            <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-pink-400 transition-colors">
                                                {project.name}
                                            </h3>
                                            <p className="text-pink-300/70 text-sm mb-3 line-clamp-2">{project.description}</p>
                                            <div className="mb-4">
                                                <div className="flex justify-between text-xs text-pink-300/70 mb-1">
                                                    <span>Progress</span>
                                                    <span>{project.progress}%</span>
                                                </div>
                                                <div className="w-full bg-indigo-800 rounded-full h-2">
                                                    <div
                                                        className="bg-pink-400 h-2 rounded-full transition-all duration-500"
                                                        style={{ width: `${project.progress}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between text-sm text-pink-300/70 pt-3 border-t border-pink-500/20">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4" />
                                                    <span>{formatDate(project.startDate)}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Users className="w-4 h-4" />
                                                    <span>{project.members.length}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex items-center w-full">
                                        <div
                                            className="w-14 h-14 rounded-lg flex items-center justify-center mr-4"
                                            style={{ backgroundColor: project.color }}
                                        >
                                            <Folder className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="text-lg font-semibold text-white truncate">{project.name}</h3>
                                                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                                                    {getStatusIcon(project.status)}
                                                    <span>{project.status.replace('-', ' ')}</span>
                                                </div>
                                            </div>
                                            <p className="text-pink-300/70 text-sm mb-3 line-clamp-1">{project.description}</p>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4 text-sm text-pink-300/70">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4"></Calendar>
                                                        <span>{formatDate(project.startDate)} - {formatDate(project.endDate)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Users className="w-4 h-4" />
                                                        <span>{project.members.length} members</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-pink-300/70">{project.progress}%</span>
                                                    <div className="w-20 bg-indigo-800 rounded-full h-2">
                                                        <div
                                                            className="bg-pink-400 h-2 rounded-full"
                                                            style={{ width: `${project.progress}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <ArrowRight className="w-5 h-5 text-pink-400" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RenderProjects;