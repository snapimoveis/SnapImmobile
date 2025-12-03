import { UserProfile } from "../types";

const USERS_KEY = "snap_users";
const CURRENT_KEY = "snap_current_user";

export const authService = {
  getUsers(): UserProfile[] {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
  },

  saveUsers(users: UserProfile[]) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },

  getCurrentUser(): UserProfile | null {
    return JSON.parse(localStorage.getItem(CURRENT_KEY) || "null");
  },

  login(email: string, password: string): UserProfile | null {
    const users = this.getUsers();
    const user = users.find((u) => u.email === email && u.password === password);
    if (!user) return null;

    localStorage.setItem(CURRENT_KEY, JSON.stringify(user));
    return user;
  },

  register(data: any): UserProfile {
    const users = this.getUsers();

    const newUser: UserProfile = {
      id: crypto.randomUUID(),
      firstName: data.firstName || "",
      lastName: data.lastName || "",
      email: data.email,
      password: data.password,
      avatar: null,
    };

    users.push(newUser);
    this.saveUsers(users);
    localStorage.setItem(CURRENT_KEY, JSON.stringify(newUser));

    return newUser;
  },

  logout() {
    localStorage.removeItem(CURRENT_KEY);
  },
};
