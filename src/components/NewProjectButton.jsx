import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { motion } from "framer-motion";

const roles = ["Admin", "Contributor", "Viewer"];

const NewProjectButton = ({
  refreshFunc = () => {},
  workspaceId = "",
  memberDetails = [],
  workspace = { projectIds: [] },
}) => {
  useEffect(() => {
    console.log("NewProjectButton mounted with props:", {
      workspaceId,
      memberDetails,
      memberDetailsLength: memberDetails.length,
      workspaceProjectIds: workspace.projectIds,
      refreshFunc: !!refreshFunc,
    });
  }, [workspaceId, memberDetails, workspace, refreshFunc]);

  const url = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#FF5733");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedMembers, setSelectedMembers] = useState({});
  const [errors, setErrors] = useState({});

  const handleOpenPopup = () => {
    console.log("New Project button clicked, opening popup");
    setIsPopupOpen(true);
  };

  const handleClosePopup = () => {
    console.log("Closing popup");
    setIsPopupOpen(false);
    setProjectName("");
    setDescription("");
    setColor("#FF5733");
    setStartDate("");
    setEndDate("");
    setSelectedMembers({});
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};
    if (!projectName.trim()) newErrors.projectName = "Project name is required";
    if (!description.trim()) newErrors.description = "Description is required";
    if (!startDate) newErrors.startDate = "Start date is required";
    if (!endDate) newErrors.endDate = "End date is required";
    else if (startDate && new Date(endDate) <= new Date(startDate)) {
      newErrors.endDate = "End date must be after start date";
    }

    const selectedMembersList = Object.entries(selectedMembers).filter(
      ([_, role]) => role !== undefined
    );
    if (selectedMembersList.length === 0 && memberDetails.length > 0) {
      newErrors.members = "At least one member must be selected";
    } else if (selectedMembersList.length > 0) {
      const hasAdmin = selectedMembersList.some(([_, role]) => role === "Admin");
      if (!hasAdmin) newErrors.members = "At least one Admin must be selected";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateWorkspaceWithNewProject = async (workspaceId, projectObj) => {
    let newProjectId;
    try {
      const projectResp = await fetch(`${url}/project`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(projectObj),
        credentials: "include",
      });

      const data = await projectResp.json();
      if (data.success) {
        console.log("Project created:", data.project);
        newProjectId = data.project._id;
      } else {
        console.error("Failed to create project:", data.message);
        setErrors((prev) => ({
          ...prev,
          submit: data.message || "Failed to create project",
        }));
        return;
      }
    } catch (error) {
      console.error("Error creating project:", error);
      setErrors((prev) => ({
        ...prev,
        submit: "Error creating project: " + error.message,
      }));
      return;
    }

    try {
      const res = await fetch(`${url}/workspace/${workspaceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...workspace,
          projectIds: [...(workspace.projectIds || []), newProjectId],
        }),
        credentials: "include",
      });

      const data = await res.json();
      if (data.success) {
        console.log("Workspace updated:", data.workspace);
      } else {
        console.error("Failed to update workspace:", data.message);
        setErrors((prev) => ({
          ...prev,
          submit: data.message || "Failed to update workspace",
        }));
      }
    } catch (error) {
      console.error("Error updating workspace:", error);
      setErrors((prev) => ({
        ...prev,
        submit: "Error updating workspace: " + error.message,
      }));
    }
  };

  const handleSubmit = async () => {
    console.log("Submitting project form");
    if (!validateForm()) return;

    const members = Object.entries(selectedMembers)
      .filter(([_, role]) => role !== undefined)
      .map(([id, role]) => ({ id, role }));

    const payload = {
      projectName,
      projectDescription: description,
      startDate,
      endDate,
      colorCode: color,
      members,
      taskIds: [],
    };

    await updateWorkspaceWithNewProject(workspaceId, payload);
    handleClosePopup();
    refreshFunc();
  };

  const toggleMember = (id) => {
    setSelectedMembers((prev) =>
      id in prev ? { ...prev, [id]: undefined } : { ...prev, [id]: "Viewer" }
    );
    if (errors.members) setErrors((prev) => ({ ...prev, members: undefined }));
  };

  const updateRole = (id, role) => {
    setSelectedMembers((prev) => ({ ...prev, [id]: role }));
    if (errors.members) setErrors((prev) => ({ ...prev, members: undefined }));
  };

  const clearFieldError = (fieldName) => {
    if (errors[fieldName]) setErrors((prev) => ({ ...prev, [fieldName]: undefined }));
  };

  const colors = ["#FF5733", "#33C1FF", "#28A745", "#FFC107", "#6F42C1"];
  const today = new Date().toISOString().split("T")[0];

  if (!workspaceId) {
    console.warn("NewProjectButton: Missing workspaceId - not rendering button");
    return null;
  }

  if (!Array.isArray(memberDetails)) {
    console.error("memberDetails must be an array", { memberDetails });
    return null;
  }

  return (
    <div className="fixed bottom-20 right-6 z-30">
      <button
        onClick={handleOpenPopup}
        className="glossy-button flex items-center space-x-2 px-4 py-2 text-sm font-inter bg-indigo-900/50 text-pink-300 font-bold uppercase rounded-full hover:bg-indigo-800/70 transition-colors border border-pink-500/30"
      >
        <svg viewBox="0 0 16 16" fill="currentColor" height={16} width={16} xmlns="http://www.w3.org/2000/svg">
          <path d="M8 1a.5.5 0 0 1 .5.5V7.5H14a.5.5 0 0 1 0 1H8.5V14a.5.5 0 0 1-1 0V8.5H2a.5.5 0 0 1 0-1h5.5V1.5A.5.5 0 0 1 8 1z" />
        </svg>
        <span>New Project</span>
      </button>

      {isPopupOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 font-inter"
        >
          <div className="glossy-card rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-pink-500/30 bg-indigo-900/90">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">Create New Project</h2>
              <button
                onClick={handleClosePopup}
                className="p-2 text-pink-400 hover:text-pink-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block font-medium mb-1 text-white">
                  Project Name <span className="text-pink-400">*</span>
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => {
                    setProjectName(e.target.value);
                    clearFieldError("projectName");
                  }}
                  className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent bg-indigo-800/50 text-white placeholder-pink-300/70 text-sm ${
                    errors.projectName ? "border-pink-400" : "border-pink-500/30"
                  }`}
                  placeholder="Enter project name"
                />
                {errors.projectName && (
                  <p className="text-pink-400 text-sm mt-1">{errors.projectName}</p>
                )}
              </div>

              <div>
                <label className="block font-medium mb-1 text-white">
                  Description <span className="text-pink-400">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    clearFieldError("description");
                  }}
                  className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent bg-indigo-800/50 text-white placeholder-pink-300/70 text-sm ${
                    errors.description ? "border-pink-400" : "border-pink-500/30"
                  }`}
                  rows="3"
                  placeholder="Enter project description"
                ></textarea>
                {errors.description && (
                  <p className="text-pink-400 text-sm mt-1">{errors.description}</p>
                )}
              </div>

              <div>
                <label className="block font-medium mb-1 text-white">Color</label>
                <div className="flex gap-3">
                  {colors.map((c) => (
                    <div
                      key={c}
                      className={`w-8 h-8 rounded-full cursor-pointer border-2 transition-all ${
                        color === c ? "border-pink-400 scale-110" : "border-transparent hover:scale-105"
                      }`}
                      style={{ backgroundColor: c }}
                      onClick={() => setColor(c)}
                    ></div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-1 text-white">
                    Start Date <span className="text-pink-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    min={today}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      clearFieldError("startDate");
                    }}
                    className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent bg-indigo-800/50 text-white ${
                      errors.startDate ? "border-pink-400" : "border-pink-500/30"
                    }`}
                  />
                  {errors.startDate && (
                    <p className="text-pink-400 text-sm mt-1">{errors.startDate}</p>
                  )}
                </div>
                <div>
                  <label className="block font-medium mb-1 text-white">
                    End Date <span className="text-pink-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    min={startDate || today}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      clearFieldError("endDate");
                    }}
                    className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent bg-indigo-800/50 text-white ${
                      errors.endDate ? "border-pink-400" : "border-pink-500/30"
                    }`}
                  />
                  {errors.endDate && (
                    <p className="text-pink-400 text-sm mt-1">{errors.endDate}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-medium mb-1 text-white">
                  Select Members <span className="text-pink-400">*</span>
                  <span className="text-sm text-pink-300/70 font-normal ml-2">
                    (At least one Admin is required)
                  </span>
                </label>
                {memberDetails.length === 0 ? (
                  <p className="text-pink-400 text-sm mt-1">
                    No members available. Please add members to the workspace first.
                  </p>
                ) : (
                  <div
                    className={`border rounded-lg p-3 max-h-48 overflow-y-auto ${
                      errors.members ? "border-pink-400" : "border-pink-500/30"
                    }`}
                  >
                    {memberDetails.map((member) => (
                      <div key={member.id} className="flex items-center justify-between mb-3 last:mb-0">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedMembers[member.id] !== undefined}
                            onChange={() => toggleMember(member.id)}
                            className="w-4 h-4 text-pink-400 rounded focus:ring-pink-400 bg-indigo-800/50 border-pink-500/30"
                          />
                          <img
                            src={member.image}
                            alt={member.name || "Member"}
                            className="w-8 h-8 rounded-full object-cover"
                            onError={(e) => {
                              e.target.style.display = "none";
                              e.target.nextSibling.style.display = "flex";
                            }}
                          />
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-600 to-indigo-600 text-white text-sm font-semibold"
                            style={{ display: member.image ? "none" : "flex" }}
                          >
                            {(member.name || member.email || "U").charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-white">
                            {member.name || "Unknown User"}
                          </span>
                        </label>

                        {selectedMembers[member.id] !== undefined && (
                          <select
                            value={selectedMembers[member.id]}
                            onChange={(e) => updateRole(member.id, e.target.value)}
                            className="ml-auto border rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent bg-indigo-800/50 text-white border-pink-500/30"
                          >
                            {roles.map((role) => (
                              <option key={role} value={role} className="bg-indigo-900 text-white">
                                {role}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {errors.members && (
                  <p className="text-pink-400 text-sm mt-1">{errors.members}</p>
                )}
              </div>

              {errors.submit && (
                <p className="text-pink-400 text-sm mt-1">{errors.submit}</p>
              )}

              <div className="flex gap-6 pt-4">
                <button
                  type="button"
                  onClick={handleClosePopup}
                  className="flex-1 px-4 py-2 text-sm text-pink-400 border border-pink-500/30 rounded-lg hover:bg-indigo-800/50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={memberDetails.length === 0}
                  className="flex-1 px-4 py-2 text-sm glossy-button hover:bg-indigo-800/70 transition-colors disabled:bg-indigo-900/30 disabled:cursor-not-allowed"
                >
                  Create Project
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default NewProjectButton;