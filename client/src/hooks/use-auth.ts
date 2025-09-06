import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authManager } from "../lib/auth";
import { apiClient } from "../lib/api";
import { User } from "../types";
import { useToast } from "./use-toast";

export function useAuth() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: user, isLoading, error } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: () => apiClient.getCurrentUser(),
    enabled: authManager.isAuthenticated(),
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authManager.login(email, password),
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/auth/me'], data.user);
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Login failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: (userData: {
      name: string;
      email: string;
      phone?: string;
      password: string;
      role?: string;
    }) => authManager.register(userData),
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/auth/me'], data.user);
      toast({
        title: "Registration successful",
        description: "Welcome to CivicConnect!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Registration failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const logout = () => {
    authManager.logout();
    queryClient.clear();
  };

  return {
    user: user as User | undefined,
    isLoading: isLoading && authManager.isAuthenticated(),
    isAuthenticated: authManager.isAuthenticated(),
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
  };
}
