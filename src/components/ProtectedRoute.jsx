import { useAuth } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const { isSignedIn, isLoaded } = useAuth();

  // Wait until Clerk has fully loaded
  if (!isLoaded) {
    return <div className="text-center mt-10 text-gray-500">Loading...</div>;
  }

  // If user not signed in, redirect to sign-in page
  if (!isSignedIn) {
    return <Navigate to="/landing" />;
  }

  // Otherwise, render the protected content
  return children;
};

export default ProtectedRoute;
