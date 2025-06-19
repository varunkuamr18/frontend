import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { X, Edit2, Trash2, User, Calendar, Flag, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

const ManageTaskButton = ({ projectData, tasks, members, onRefresh }) => {
  const { id: projectId } = useParams();
  const url = import.meta.env.VITE_BACKEND_URL;

  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    deadline: '',
    priority: 'Medium',
    assignedToId: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const contributorMembers = members ? members.filter((member) => member.role === 'Contributor') : [];

  const openTaskPopup = (task) => {
    setSelectedTask(task);
    setEditForm({
      name: task.name || '',
      description: task.description || '',
      deadline: task.deadline ? task.deadline.split('T')[0] : '',
      priority: task.priority || 'Medium',
      assignedToId: task.assignedToId || '',
    });
    setIsPopupOpen(true);
    setIsEditing(false);
    setError('');
  };

  const closePopup = () => {
    setIsPopupOpen(false);
    setSelectedTask(null);
    setIsEditing(false);
    setEditForm({
      name: '',
      description: '',
      deadline: '',
      priority: 'Medium',
      assignedToId: '',
    });
    setError('');
  };

  const handleInputChange = (field, value) => {
    setEditForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const isValidDeadline = (deadline) => {
    if (!deadline) return true;
    const deadlineDate = new Date(deadline);
    const startDate = new Date(projectData.startDate);
    const endDate = new Date(projectData.endDate);
    return deadlineDate >= startDate && deadlineDate <= endDate;
  };

  const handleUpdateTask = async () => {
    if (!selectedTask) return;

    if (!editForm.name.trim()) {
      setError('Task name is required');
      return;
    }

    if (!isValidDeadline(editForm.deadline)) {
      setError('Deadline must be within project start and end dates');
      return;
    }

    setLoading(true);
    try {
      const updateData = {
        _id: selectedTask.id,
        taskName: editForm.name,
        taskDescription: editForm.description,
        deadline: editForm.deadline ? new Date(editForm.deadline).toISOString() : null,
        priority: editForm.priority,
        assignedTo: editForm.assignedToId,
        status: selectedTask.status,
        createdAt: selectedTask.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        __v: selectedTask.__v || 0,
      };

      const response = await fetch(`${url}/task/${selectedTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        closePopup();
        onRefresh();
      } else {
        const errorData = await response.json();
        setError('Failed to update task: ' + (errorData.message || 'Unknown error'));
      }
    } catch (error) {
      setError('Error updating task: ' + error.message);
    }
    setLoading(false);
  };

  const handleDeleteTask = async () => {
    if (!selectedTask || !window.confirm('Are you sure you want to delete this task?')) return;

    setLoading(true);
    try {
      const deleteResponse = await fetch(`${url}/task/${selectedTask.id}`, {
        method: 'DELETE',
      });
      if (!deleteResponse.ok) {
        const errorData = await deleteResponse.json();
        throw new Error('Failed to delete task: ' + (errorData.message || 'Unknown error'));
      }

      const updatedTaskIds = projectData.taskIds.filter((taskId) => taskId !== selectedTask.id);
      const updateProjectData = {
        _id: projectData._id,
        projectName: projectData.projectName,
        projectDescription: projectData.projectDescription,
        startDate: projectData.startDate,
        endDate: projectData.endDate,
        colorCode: projectData.colorCode,
        taskIds: updatedTaskIds,
        members: projectData.members,
        createdAt: projectData.createdAt,
        updatedAt: new Date().toISOString(),
        __v: projectData.__v,
      };

      const updateProjectResponse = await fetch(`${url}/project/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateProjectData),
      });
      if (!updateProjectResponse.ok) {
        const errorData = await updateProjectResponse.json();
        throw new Error('Failed to update project: ' + (errorData.message || 'Unknown error'));
      }

      closePopup();
      onRefresh();
    } catch (error) {
      setError('Error deleting task: ' + error.message);
    }
    setLoading(false);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Critical': return 'text-purple-400 bg-purple-600/20 border-purple-600/50';
      case 'High': return 'text-red-400 bg-red-600/20 border-red-600/50';
      case 'Medium': return 'text-amber-400 bg-amber-600/20 border-amber-600/50';
      case 'Low': return 'text-emerald-400 bg-emerald-600/20 border-emerald-600/50';
      default: return 'text-gray-400 bg-gray-600/20 border-gray-600/50';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ToDo': return 'text-indigo-400 bg-indigo-600/20 border-indigo-600/50';
      case 'InProgress': return 'text-amber-400 bg-amber-600/20 border-amber-600/50';
      case 'Review': return 'text-purple-400 bg-purple-600/20 border-purple-600/50';
      case 'Done': return 'text-green-400 bg-green-600/20 border-green-600/50';
      default: return 'text-gray-400 bg-gray-600/20 border-gray-600/50';
    }
  };

  // Add this import at the top of your file:

  return (
    <div>
      <button
        onClick={() => setIsPopupOpen(true)}
        className="glossy-button flex items-center space-x-2"
      >
        <Edit2 size={16} />
        <span>Manage Tasks</span>
      </button>

      {isPopupOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 font-inter"
        >
          <div className="glossy-card rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto">
            {!selectedTask ? (
              // Task List View
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-white">Manage Tasks</h2>
                  <button
                    onClick={closePopup}
                    className="p-2 rounded-full hover:bg-pink-600/20 text-pink-400 hover:text-pink-300 transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="space-y-3">
                  {tasks && tasks.length > 0 ? (
                    tasks.map((task) => (
                      <motion.div
                        key={task.id}
                        className="glossy-subpanel p-4 rounded-lg cursor-pointer hover:shadow-lg transition-all"
                        onClick={() => openTaskPopup(task)}
                        whileHover={{ scale: 1.02 }}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="text-white font-semibold text-sm">{task.name || 'Unnamed Task'}</h3>
                            <p className="text-gray-300 text-xs mt-1 truncate max-w-xs">{task.description || 'No description'}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(task.status)}`}>
                              {task.status}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-300">
                      <FileText size={32} className="mx-auto mb-2 text-pink-400" />
                      <p>No tasks found</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Task Detail/Edit View
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-white">{isEditing ? 'Edit Task' : 'Task Details'}</h2>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setSelectedTask(null)}
                      className="p-2 rounded-full hover:bg-indigo-600/20 text-indigo-400 hover:text-indigo-300 transition-all"
                    >
                      ← Back
                    </button>
                    <button
                      onClick={closePopup}
                      className="p-2 rounded-full hover:bg-pink-600/20 text-pink-400 hover:text-pink-300 transition-all"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
                {error && (
                  <div className="bg-red-600/20 border border-red-600/50 text-red-400 p-3 rounded-lg mb-4 text-sm">
                    {error}
                  </div>
                )}
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center text-sm font-medium text-white mb-2">
                      <FileText size={14} className="mr-1 text-pink-400" />
                      Task Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-pink-400 focus:border-transparent"
                        placeholder="Enter task name..."
                      />
                    ) : (
                      <p className="p-3 bg-white/10 rounded-lg text-white border border-white/20">
                        {selectedTask.name || 'Unnamed Task'}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="flex items-center text-sm font-medium text-white mb-2">
                      <FileText size={14} className="mr-1 text-pink-400" />
                      Description
                    </label>
                    {isEditing ? (
                      <textarea
                        value={editForm.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        rows="3"
                        className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-pink-400 focus:border-transparent resize-none"
                        placeholder="Enter task description..."
                      />
                    ) : (
                      <p className="p-3 bg-white/10 rounded-lg text-white border border-white/20">
                        {selectedTask.description || 'No description'}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center text-sm font-medium text-white mb-2">
                        <Flag size={14} className="mr-1 text-pink-400" />
                        Priority
                      </label>
                      {isEditing ? (
                        <select
                          value={editForm.priority}
                          onChange={(e) => handleInputChange('priority', e.target.value)}
                          className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:ring-2 focus:ring-pink-400 focus:border-transparent"
                        >
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                          <option value="Critical">Critical</option>
                        </select>
                      ) : (
                        <span className={`px-3 py-1 rounded-full text-xs ${getPriorityColor(selectedTask.priority)}`}>
                          {selectedTask.priority || 'Unknown'}
                        </span>
                      )}
                    </div>
                    <div>
                      <label className="flex items-center text-sm font-medium text-white mb-2">
                        <FileText size={14} className="mr-1 text-pink-400" />
                        Status
                      </label>
                      <span className={`px-3 py-1 rounded-full text-xs ${getStatusColor(selectedTask.status)}`}>
                        {selectedTask.status || 'Unknown'}
                      </span>
                    </div>
                    <div>
                      <label className="flex items-center text-sm font-medium text-white mb-2">
                        <Calendar size={14} className="mr-1 text-pink-400" />
                        Deadline
                      </label>
                      {isEditing ? (
                        <input
                          type="date"
                          value={editForm.deadline}
                          onChange={(e) => handleInputChange('deadline', e.target.value)}
                          className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:ring-2 focus:ring-pink-400 focus:border-transparent"
                        />
                      ) : (
                        <p className="p-3 bg-white/10 rounded-lg text-white border border-white/20">
                          {selectedTask.deadline ? new Date(selectedTask.deadline).toLocaleDateString() : 'No deadline'}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="flex items-center text-sm font-medium text-white mb-2">
                        <User size={14} className="mr-1 text-pink-400" />
                        Assigned To
                      </label>
                      {isEditing ? (
                        <select
                          value={editForm.assignedToId}
                          onChange={(e) => handleInputChange('assignedToId', e.target.value)}
                          className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:ring-2 focus:ring-pink-400 focus:border-transparent"
                        >
                          <option value="">Unassigned</option>
                          {contributorMembers.map((member) => (
                            <option key={member.id} value={member.id}>
                              {member.name} ({member.email})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p className="p-3 bg-white/10 rounded-lg text-white border border-white/20">
                          {selectedTask.assignedTo || 'Unassigned'}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/20">
                    {isEditing ? (
                      <div className="flex space-x-3">
                        <button
                          onClick={handleUpdateTask}
                          disabled={loading}
                          className="glossy-button-success px-4 py-2 text-sm"
                        >
                          {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button
                          onClick={() => setIsEditing(false)}
                          className="glossy-button px-4 py-2 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="glossy-button px-4 py-2 text-sm flex items-center"
                      >
                        <Edit2 size={14} className="mr-1" />
                        Edit Task
                      </button>
                    )}
                    <button
                      onClick={handleDeleteTask}
                      disabled={loading}
                      className="glossy-button bg-gradient-to-r from-red-600 to-pink-600 px-4 py-2 text-sm flex items-center"
                    >
                      <Trash2 size={14} className="mr-1" />
                      {loading ? 'Deleting...' : 'Delete Task'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ManageTaskButton;