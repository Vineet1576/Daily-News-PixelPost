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
    const [loading, setLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const [attemptedLogin, setAttemptedLogin] = useState(false);

    const validateFields = () => {
        const errors = {};
        
        if (!email.trim()) {
            errors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.email = "Please enter a valid email address";
        }
        
        if (!password) {
            errors.password = "Password is required";
        }
        
        return errors;
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setAttemptedLogin(true);
        
        const errors = validateFields();
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            setError("Please enter valid credentials");
            return;
        }
        
        setFieldErrors({});
        setLoading(true);
        
        try {
            const res = await axios.post("http://localhost:5000/api/auth/login", {
                email: email.toLowerCase().trim(),
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
                setError("Login failed. Please try again.");
            }
        } catch (error) {
            console.error('Login error:', error);
            
            if (error.response?.status === 401) {
                setError("Invalid email or password. Please check your credentials.");
                setFieldErrors({ email: "Invalid credentials" });
            } else if (error.response?.status === 400) {
                const message = error.response.data?.message;
                if (message?.includes("required")) {
                    setError("Email and password are required");
                } else {
                    setError(message || "Invalid login details. Please try again.");
                }
            } else if (error.response?.status === 404) {
                setError("Account not found. Please sign up or check your email.");
                setFieldErrors({ email: "No account with this email" });
            } else if (error.response?.status === 500) {
                setError("Server error. Please try again later.");
            } else if (error.code === 'ECONNREFUSED') {
                setError("Cannot connect to server. Please try again later.");
            } else {
                setError(error.response?.data?.message || "Login failed. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white font-sans antialiased py-16 px-4">
            <Card className="w-full max-w-md mx-auto transform transition-all duration-300 animate-fadeInUp">
                <h1 className="font-extrabold text-blue-400 text-center text-4xl mb-8 drop-shadow-md">Login</h1>
                <form className="space-y-5" onSubmit={handleLogin}>
                    <div>
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                            type="email"
                            id="email"
                            name="email"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                if (fieldErrors.email) setFieldErrors({...fieldErrors, email: ''});
                            }}
                            className={fieldErrors.email ? 'border-red-500' : ''}
                        />
                        {fieldErrors.email && <p className="text-red-400 text-xs mt-1">{fieldErrors.email}</p>}
                    </div>
                    
                    <div>
                        <Label htmlFor="password">Password</Label>
                        <Input
                            type="password"
                            id="password"
                            name="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                if (fieldErrors.password) setFieldErrors({...fieldErrors, password: ''});
                            }}
                            className={fieldErrors.password ? 'border-red-500' : ''}
                        />
                        {fieldErrors.password && <p className="text-red-400 text-xs mt-1">{fieldErrors.password}</p>}
                    </div>
                    
                    <div className="flex justify-between items-center flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                            <input
                                className="form-checkbox h-5 w-5 text-blue-600 bg-slate-800 rounded border border-slate-700 focus:ring-1 focus:ring-blue-500"
                                type="checkbox"
                                id="remember-me"
                                name="remember-me"
                            />
                            <span className="font-medium text-sm text-slate-400">Remember me</span>
                        </div>
                        <button 
                            type="button"
                            className="font-medium text-sm text-blue-400 hover:text-blue-300 transition"
                            onClick={() => navigate('/forgot-password')}
                        >
                            Forgot Password?
                        </button>
                    </div>
                    
                    {error && (
                        <div className="p-3 bg-red-900/30 border border-red-600 rounded-lg text-red-300 text-sm flex items-start gap-2">
                            <span className="text-lg">⚠</span>
                            <div>
                                <p>{error}</p>
                                {attemptedLogin && !email && (
                                    <p className="text-xs mt-1 text-slate-300">Don't have an account? <span className="text-blue-400 cursor-pointer hover:underline" onClick={() => navigate('/signup')}>Create one here</span></p>
                                )}
                            </div>
                        </div>
                    )}
                    
                    <Button 
                        type="submit" 
                        className="w-full mt-6"
                        disabled={loading}
                    >
                        {loading ? 'Logging in...' : 'Login'}
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