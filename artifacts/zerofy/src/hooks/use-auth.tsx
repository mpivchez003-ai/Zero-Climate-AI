import { createContext, useContext, ReactNode } from "react";
import { useGetMe, getGetMeQueryKey, useLogin, useRegister, useLogout } from "@workspace/api-client-react";
import type { LoginInput, RegisterInput, User } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: User | null | undefined;
  isLoading: boolean;
  login: (data: LoginInput) => void;
  register: (data: RegisterInput) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: user, isLoading } = useGetMe({
    query: {
      retry: false,
      queryKey: getGetMeQueryKey()
    }
  });

  const loginMutation = useLogin({
    mutation: {
      onSuccess: (data) => {
        localStorage.setItem("zerofy_token", data.token);
        queryClient.setQueryData(getGetMeQueryKey(), data.user);
        setLocation("/dashboard");
      },
      onError: (error) => {
        toast({
          title: "Login failed",
          description: error.data?.error || "An error occurred",
          variant: "destructive"
        });
      }
    }
  });

  const registerMutation = useRegister({
    mutation: {
      onSuccess: (data) => {
        localStorage.setItem("zerofy_token", data.token);
        queryClient.setQueryData(getGetMeQueryKey(), data.user);
        setLocation("/dashboard");
      },
      onError: (error) => {
        toast({
          title: "Registration failed",
          description: error.data?.error || "An error occurred",
          variant: "destructive"
        });
      }
    }
  });

  const logoutMutation = useLogout({
    mutation: {
      onSettled: () => {
        localStorage.removeItem("zerofy_token");
        queryClient.setQueryData(getGetMeQueryKey(), null);
        setLocation("/login");
      }
    }
  });

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login: (data) => loginMutation.mutate({ data }),
        register: (data) => registerMutation.mutate({ data }),
        logout: () => logoutMutation.mutate()
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
