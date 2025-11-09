import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './style/output.css';
import Button from './components/ui/Button';
import Input from './components/ui/Input';
import Card from './components/ui/Card';
import Label from './components/ui/Label';
import ErrorText from './components/ui/ErrorText';


function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(''); // Clear any previous errors
        try {
            const res = await axios.post("http://localhost:5000/api/auth/login", {
                email,
                password,
            });
            
            if (res.data && res.data.token) {
                // Store user data and token
                localStorage.setItem("user", JSON.stringify({
                    _id: res.data._id,
                    name: res.data.name,
                    email: res.data.email
                }));
                localStorage.setItem("token", res.data.token);
                
                // Small delay to ensure storage is complete
                setTimeout(() => {
                    navigate("/profile");
                }, 100);
            } else {
                setError("Login failed - Invalid credentials");
            }
        } catch (error) {
            console.error('Login error:', error);
            if (error.response?.status === 401) {
                setError("Invalid email or password");
            } else {
                setError(error.response?.data?.message || "Something went wrong");
            }
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white font-sans antialiased py-16 px-4">
            <Card className="w-full max-w-md mx-auto transform transition-all duration-300 animate-fadeInUp">
                <h1 className="font-extrabold text-blue-400 text-center text-4xl mb-8 drop-shadow-md">Login</h1>
                <form className="space-y-5" onSubmit={handleLogin}>
                    <div>
                        <Label htmlFor="email">Email Address:</Label>
                        <Input
                            type="email"
                            id="email"
                            name="email"
                            placeholder="Enter your email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <Label htmlFor="password">Password:</Label>
                        <Input
                            type="password"
                            id="password"
                            name="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <div className="flex justify-between items-center flex-wrap">
                        <div className="flex items-center gap-2">
                            <input
                                className="form-checkbox h-5 w-5 text-blue-600 bg-slate-800 rounded border border-slate-700 focus:ring-1 focus:ring-blue-500"
                                type="checkbox"
                                id="remember-me"
                                name="remember-me"
                            />
                            <span className="font-medium text-sm text-slate-400">Remember me</span>
                        </div>
                        <a className="font-medium text-sm text-blue-400 hover:underline cursor-pointer" href="#">
                            Forgot Password?
                        </a>
                    </div>
                    <ErrorText>{error}</ErrorText>
                    <Button type="submit" className="w-full mt-6">
                        Login
                    </Button>
                </form>
                <div className="text-center mt-6 text-sm">
                    <p className="font-medium text-slate-400">
                        Don't have an account?{' '}
                        <span
                            className="text-blue-400 hover:underline cursor-pointer"
                            onClick={() => navigate("/signup")}
                        >
                            Sign Up here
                        </span>
                    </p>
                </div>
            </Card>
        </main>
    );
}

export default Login;