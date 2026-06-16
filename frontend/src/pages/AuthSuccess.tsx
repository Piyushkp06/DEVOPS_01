import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { nodeBackendAPI } from "@/services/api.config";

const AuthSuccess = () => {
  const [message, setMessage] = useState('Finalizing sign-in...');
  const navigate = useNavigate();

  useEffect(() => {
    async function check() {
      try {
        const res = await nodeBackendAPI.get('/api/auth/me');
        if (res.status === 200) {
          setMessage('Sign-in successful! Redirecting...');
          setTimeout(() => navigate('/'), 1500);
        } else {
          setMessage('Sign-in failed. Please try logging in.');
        }
      } catch (e) {
        setMessage('Sign-in failed. Please try logging in.');
      }
    }
    check();
  }, [navigate]);

  return (
    <div className="p-8">
      <h2 className="text-xl font-semibold">{message}</h2>
    </div>
  );
};

export default AuthSuccess;
