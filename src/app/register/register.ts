import { Component, computed, signal } from '@angular/core';
import { email, form, FormField, minLength, required, validate } from '@angular/forms/signals';
import axios from 'axios';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-register',
  imports: [FormField, RouterLink],
  templateUrl: './register.html'
})
export class Register {
  registerModel = signal<{ username: string; email: string; password: string; confirmPassword: string }>({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  })

  registerForm = form(this.registerModel, (schema) => {
    required(schema.username, { message: "Username is required" }),
      required(schema.password, { message: "Password is required" }),
      minLength(schema.password, 8, { message: "Password must be at least 8 characters long " })
    email(schema.email, { message: "Enter a valid email address" })
    required(schema.email, { message: "Email address is required" })
    validate(schema.confirmPassword, ({ value, valueOf }) => {
      if (value() !== valueOf(schema.password)) {
        return { kind: "passwordMismatch", message: "Passwords do not match" }
      } else {
        return null
      }
    })
  })

  async onSubmit() {
    const res = await axios.post(`${import.meta.env.NG_APP_API_URL}/api/Auth/register`, {
      Username: this.registerForm.username().value(),
      Email: this.registerForm.email().value(),
      Password: this.registerForm.password().value()
    })
    console.log(res)
  }

  passwordStrength = computed(() => {
    const value = this.registerForm.password().value()
    let strength = 0
    if (value.length >= 8) strength++
    if (value.length >= 12) strength++
    if (/[a-z]/.test(value)) strength++
    if (/[A-Z]/.test(value)) strength++
    if (/[0-9]/.test(value)) strength++
    if (/[^A-Za-z0-9]/.test(value)) strength++
    return strength
  })

  strengthLabel = computed(
    () => ['Too weak', 'Too weak', 'Weak', 'Okay', 'Good', 'Strong', 'Strong'][this.passwordStrength()],
  );
}
