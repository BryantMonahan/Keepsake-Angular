import { computed, Injectable, signal } from '@angular/core';
import { User } from '../Types/user';
import axios from 'axios';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private _user = signal<User | null>(null)
  isLoggedIn = computed(() => this._user() !== null)

  async loadUser() {
    try {
      const res = await axios.get<User>(`${import.meta.env.NG_APP_API_URL}/api/Auth/who-am-i`)
      console.log(res.data)
      this._user.set(res.data)
    } catch {
      this._user.set(null) // 401 = not logged in
    }
  }
  setUser(user: User) {
    this._user.set(user)
    console.log(this._user())
  }

  clearUser() {
    this._user.set(null)
  }

  username() {
    return this._user()?.username
  }
}
