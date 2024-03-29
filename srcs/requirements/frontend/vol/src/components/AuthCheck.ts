import router from "@/router";
import { socket } from "../services/ws";

const clearCookies = () => {
  const cookies = document.cookie.split("; ");
  for (const cookie of cookies) {
    const [name, value] = cookie.split("=");
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  }
}

export const loggedInFn = async (): Promise<Object | undefined> => {
  try {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/users/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: 'include'
    });
    if (response.status === 401) {
      const data = await response.json();
      if ('message' in data) {
        switch (data.message) {
          case 'No nickname':
            router.replace("/setup");
            break;
          case 'No 2FA token passed':
            router.replace("/2fa");
            break;
          case 'User disabled':
            router.replace(`/login?error=access_denied&error_description=${data.message}`);
            clearCookies();
            break;
          case 'User banned':
            router.replace(`/login?error=access_denied&error_description=${data.message}`);
            clearCookies();
            break;
          default:
            clearCookies();
            router.replace("/login");
            break;
        }
        return undefined;
      }
    }
    if (response.ok) {
      if (!socket.connected)
        socket.connect();
      return await response.json();
    }
  } catch (error) {
    console.error(error);
    throw new Error('Service unavailable. Try again later.');
  }
  router.push("/login");
  return undefined;
};
