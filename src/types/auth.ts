export interface AuthFormData {
  email: string;
  password: string;
}

export interface SignupFormData extends AuthFormData {
  username: string;
  confirmPassword: string;
}