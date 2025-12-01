import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

interface Role {
  id: string;
  name: string;
}

interface Organization {
  id: string;
  name: string;
  type: string;
}

interface User {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  roles: Role[];
  permissions: any;
  organization: Organization;
  scopes: any;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log("AuthContext useEffect running on mount...");
    // Check for existing session on mount
    const token = localStorage.getItem("auth_token");
    console.log("Token from localStorage:", token);

    if (token) {
      // TODO: Validate token with API
      // For now, we'll simulate a logged in user
      const userData = localStorage.getItem("user_data");
      console.log("User data from localStorage:", userData);

      if (userData && userData !== "undefined" && userData.trim() !== "") {
        try {
          const parsedUser = JSON.parse(userData);
          console.log("Parsed user from localStorage:", parsedUser);
          setUser(parsedUser);
        } catch (error) {
          console.error("Failed to parse user data from localStorage:", error);
          // Remove corrupted data
          localStorage.removeItem("user_data");
          localStorage.removeItem("auth_token");
        }
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_IDENTITY_URL}/api/public/v1/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Login API error:", errorData);

        // Tampilkan error yang lebih informatif
        if (errorData.errors && errorData.errors.username) {
          throw new Error(
            `Username tidak ditemukan: ${errorData.errors.username[0]}`
          );
        } else if (errorData.message) {
          throw new Error(errorData.message);
        } else {
          throw new Error(`Login gagal dengan status ${response.status}`);
        }
      }

      const data = await response.json();
      console.log("Login API response:", data);

      // Expected format: { data: { token: "..." } }
      let token;

      if (data.data && data.data.token) {
        // Format yang diinginkan: hanya token di response
        token = data.data.token;
      } else if (data.token) {
        // Format alternatif: token langsung
        token = data.token;
      } else {
        // Tampilkan response lengkap untuk debugging
        console.error(
          "Response format tidak dikenal:",
          JSON.stringify(data, null, 2)
        );
        throw new Error(
          "Response format tidak dikenal. Harap mengembalikan token dalam response."
        );
      }


      localStorage.setItem("auth_token", token);
      
      // Verify token was saved successfully
      const savedToken = localStorage.getItem("auth_token");
      if (!savedToken || savedToken !== token) {
        console.error("Token was not saved properly to localStorage!");
        throw new Error("Gagal menyimpan token. Silakan coba lagi.");
      }
      console.log("Token saved successfully to localStorage:", {
        tokenLength: token.length,
        tokenPreview: token.substring(0, 20) + "...",
        verified: savedToken === token,
      });


      // Get user data dari /whoami
      try {
        console.log("Fetching user data from /whoami...");
        const userResponse = await fetch(
          `${import.meta.env.VITE_API_IDENTITY_URL}/api/v1/users/whoami`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!userResponse.ok) {
          const errorData = await userResponse.json().catch(() => ({}));
          console.error("Whoami error:", errorData);
          throw new Error("Gagal mengambil data user. Silakan coba lagi.");
        }

        const userData = await userResponse.json();
        console.log("User data from whoami:", userData);

        // Expected format: { data: { user data } }
        let finalUserData;

        if (userData.data) {
          // Format yang diinginkan: { data: { user data } }
          finalUserData = userData.data;
        } else if (userData.id || userData.username) {
          // Format langsung user object
          finalUserData = userData;
        } else {
          console.error("Unexpected whoami response format:", userData);
          throw new Error("Format response /whoami tidak dikenal");
        }

        localStorage.setItem("user_data", JSON.stringify(finalUserData));
        setUser(finalUserData);
        console.log("Final user data set:", finalUserData);

        console.log("Data stored in localStorage:", {
          token: token,
          user_data: localStorage.getItem("user_data"),
        });
      } catch (error) {
        console.error("Error fetching whoami:", error);
        // Hapus token jika whoami gagal
        localStorage.removeItem("auth_token");
        throw new Error("Gagal mengambil data user. Silakan login kembali.");
      }

      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_data");
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user,
  };

  // Debug logging
  console.log("AuthContext state:", {
    user,
    isLoading,
    isAuthenticated: !!user,
  });

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
