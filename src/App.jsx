import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import WorkSpaces from './pages/WorkSpaces';
import WorkspaceDetail from './pages/particulars/WorkSpaceDetails';
import ProjectPage from './pages/particulars/ProjectPage';
import WorkspaceSettings from './pages/settings/WorkspaceSettings';
import ProjectSettings from './pages/settings/ProjectSettings';
import { Toaster } from 'react-hot-toast';
import WorkSpaceMyTasks from './pages/tasks/WorkSpaceMyTasks';
import Dashboard from './pages/Dashboard';
import PublicWorkspaces from './pages/PublicWorkspaces';
import MyTasks from './pages/tasks/MyTasks';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
    return (
        <BrowserRouter>
            <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
            <Routes>
                {/* Public Route */}
                <Route path="/landing" element={<LandingPage />} />

                {/* Protected Routes */}
                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <PublicWorkspaces />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/mydashboard"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/mytasks"
                    element={
                        <ProtectedRoute>
                            <MyTasks />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/workspace"
                    element={
                        <ProtectedRoute>
                            <WorkSpaces />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/workspace/:id"
                    element={
                        <ProtectedRoute>
                            <WorkspaceDetail />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/workspace/:id/mytasks"
                    element={
                        <ProtectedRoute>
                            <WorkSpaceMyTasks />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/workspace/:id/settings"
                    element={
                        <ProtectedRoute>
                            <WorkspaceSettings />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/workspace/:work_id/project/:id/settings"
                    element={
                        <ProtectedRoute>
                            <ProjectSettings />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/workspace/:work_id/project/:id"
                    element={
                        <ProtectedRoute>
                            <ProjectPage />
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </BrowserRouter>
    );
}
