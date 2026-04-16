import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import api from "@/services/api";

export const useAuthStore = defineStore("auth", () => {
  const router = useRouter();
  const token = ref(localStorage.getItem("hl_token") || null);
  const user = ref(JSON.parse(localStorage.getItem("hl_user") || "null"));

  const isLoggedIn = computed(() => !!token.value);
  const isAdmin = computed(() => user.value?.role === "admin");

  function setAuth(newToken, newUser) {
    token.value = newToken;
    user.value = newUser;
    localStorage.setItem("hl_token", newToken);
    localStorage.setItem("hl_user", JSON.stringify(newUser));
  }

  async function fetchMe() {
    try {
      const { data } = await api.get("/auth/me");
      user.value = data.data;
      localStorage.setItem("hl_user", JSON.stringify(data.data));
    } catch {
      logout();
    }
  }

  function logout() {
    token.value = null;
    user.value = null;
    localStorage.removeItem("hl_token");
    localStorage.removeItem("hl_user");
    router.push({ name: "Login" });
  }

  return { token, user, isLoggedIn, isAdmin, setAuth, fetchMe, logout };
});
