import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const BASE_URL = import.meta.env.MODE === "development" ? import.meta.env.VITE_API_BASE_URL : "/";

export const useAuthStore = create((set, get) => {
  const setLoading = (key, value) => set({ [key]: value });

  const handleError = (error, defaultMsg = "Something went wrong") => {
    const message = error.response?.data?.message || defaultMsg;
    console.error(message);
    toast.error(message);
    return message;
  };

  const handleSuccess = (message) => toast.success(message);

  const connectSocket = () => {
    const { authUser, socket } = get();
    if (!authUser || socket?.connected) return;

    const newSocket = io(BASE_URL, { query: { userId: authUser._id } });
    set({ socket: newSocket });

    newSocket.on("getOnlineUsers", (userIds) => set({ onlineUsers: userIds }));
  };

  const disconnectSocket = () => {
    const { socket } = get();
    if (socket?.connected) socket.disconnect();
  };

  return {
    authUser: null,
    isSigningUp: false,
    isLoggingIn: false,
    isUpdatingProfile: false,
    isCheckingAuth: true,
    error: null,
    onlineUsers: [],
    socket: null,

    checkAuth: async () => {
      setLoading("isCheckingAuth", true);
      try {
        const res = await axiosInstance.get("/auth/check");
        set({ authUser: res.data });
        connectSocket();
      } catch (error) {
        set({ authUser: null, error: handleError(error) });
      } finally {
        setLoading("isCheckingAuth", false);
      }
    },

    signup: async (data) => {
      setLoading("isSigningUp", true);
      try {
        const res = await axiosInstance.post("/auth/signup", data);
        set({ authUser: res.data });
        handleSuccess("Account created successfully");
        connectSocket();
      } catch (error) {
        handleError(error);
      } finally {
        setLoading("isSigningUp", false);
      }
    },

    login: async (data) => {
      setLoading("isLoggingIn", true);
      try {
        const res = await axiosInstance.post("/auth/login", data);
        set({ authUser: res.data });
        handleSuccess("Logged in successfully");
        connectSocket();
      } catch (error) {
        handleError(error);
      } finally {
        setLoading("isLoggingIn", false);
      }
    },

    logout: async () => {
      try {
        await axiosInstance.post("/auth/logout");
        set({ authUser: null });
        handleSuccess("Logged out successfully");
        disconnectSocket();
      } catch (error) {
        handleError(error);
      }
    },

    updateProfile: async (data) => {
      setLoading("isUpdatingProfile", true);
      try {
        const res = await axiosInstance.put("/auth/update-profile", data);
        set({ authUser: res.data });
        handleSuccess("Profile updated successfully");
      } catch (error) {
        handleError(error);
      } finally {
        setLoading("isUpdatingProfile", false);
      }
    },
  };
});
