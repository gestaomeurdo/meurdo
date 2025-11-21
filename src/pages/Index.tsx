import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // AuthProvider handles the primary redirect logic based on session status.
    // This page serves as a quick entry point.
    navigate("/dashboard");
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-lg text-muted-foreground">Carregando...</p>
    </div>
  );
};

export default Index;