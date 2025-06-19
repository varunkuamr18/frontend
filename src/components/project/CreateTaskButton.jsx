import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';

const CreateTaskButton = ({ onClose, onCreate, contributors, minDate, maxDate }) => {
    const [showModal, setShowModal] = useState(false);
    const [newTask, setNewTask] = useState({
        taskName: '',
        taskDescription: '',
        deadline: '',
        priority: 'Medium',
        status: 'ToDo',
        assignedTo: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!newTask.taskName.trim()) return;

        onCreate(newTask);

        setNewTask({
            taskName: '',
            taskDescription: '',
            deadline: '',
            priority: 'Medium',
            status: 'ToDo',
            assignedTo: ''
        });
        setShowModal(false);
        if (onClose) onClose();
    };

    return (
        <div>
            <button
                onClick={() => setShowModal(true)}
                className="flex items-center justify-center space-x-2 bg-indigo-900/50 text-pink-300 px-4 lg:px-6 py-2 lg:py-2.5 rounded-xl hover:bg-indigo-800/70 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm lg:text-base border border-pink-500/30"
            >
                <Plus className="w-4 h-4 lg:w-5 lg:h-5" />
                <span className="font-medium">Create Task</span>
            </button>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-indigo-900/90 rounded-2xl max-w-lg w-full p-8 shadow-2xl border border-pink-500/30">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-2xl font-bold text-white">Create New Task</h3>
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    if (onClose) onClose();
                                }}
                                className="p-2 hover:bg-indigo-800/50 rounded-xl transition-colors"
                            >
                                <X className="w-6 h-6 text-pink-300 hover:text-pink-400" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-white mb-3">Task Name *</label>
                                <input
                                    type="text"
                                    value={newTask.taskName}
                                    onChange={(e) => setNewTask({ ...newTask, taskName: e.target.value })}
                                    className="w-full px-4 py-3 border border-pink-500/30 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent shadow-sm bg-indigo-800/50 text-white placeholder-pink-300/70"
                                    placeholder="Enter task name"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-white mb-3">Task Description</label>
                                <textarea
                                    value={newTask.taskDescription}
                                    onChange={(e) => setNewTask({ ...newTask, taskDescription: e.target.value })}
                                    className="w-full px-4 py-3 border border-pink-500/30 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent shadow-sm h-24 resize-none bg-indigo-800/50 text-white placeholder-pink-300/70"
                                    placeholder="Enter task description"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-white mb-3">Deadline *</label>
                                    <input
                                        type="date"
                                        value={newTask.deadline}
                                        onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                                        min={minDate}
                                        max={maxDate}
                                        className="w-full px-4 py-3 border border-pink-500/30 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent shadow-sm bg-indigo-800/50 text-white"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-white mb-3">Priority</label>
                                    <select
                                        value={newTask.priority}
                                        onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                                        className="w-full px-4 py-3 border border-pink-500/30 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent shadow-sm bg-indigo-800/50 text-white"
                                    >
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                        <option value="Critical">Critical</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-white mb-3">Assign To</label>
                                <select
                                    value={newTask.assignedTo}
                                    onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
                                    className="w-full px-4 py-3 border border-pink-500/30 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent shadow-sm bg-indigo-800/50 text-white"
                                >
                                    <option value="">Select a contributor</option>
                                    {contributors.map((contributor) => (
                                        <option key={contributor.id} value={contributor.id}>
                                            {contributor.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex space-x-4 pt-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        if (onClose) onClose();
                                    }}
                                    className="flex-1 px-6 py-3 border border-pink-500/30 text-pink-300 rounded-xl hover:bg-indigo-800/50 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-3 bg-indigo-900/50 text-pink-300 rounded-xl hover:bg-indigo-800/70 transition-all duration-200 shadow-lg hover:shadow-xl font-medium border border-pink-500/30"
                                >
                                    Create Task
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreateTaskButton;
