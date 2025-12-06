import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './style/output.css';
import Button from './components/ui/Button';
import Input from './components/ui/Input';
import Card from './components/ui/Card';
import Label from './components/ui/Label';
import ErrorText from './components/ui/ErrorText';

function SignUp() {
    const navigate = useNavigate();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});

    const validateFields = () => {
        const errors = {};
        
        if (!name.trim()) {
            errors.name = "Name is required";
        } else if (name.trim().length < 2) {
            errors.name = "Name must be at least 2 characters";
        }
        
        if (!email.trim()) {
            errors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.email = "Please enter a valid email address";
        }
        
        if (!password) {
            errors.password = "Password is required";
        } else if (password.length < 6) {
            errors.password = "Password must be at least 6 characters";
        }
        
        if (!confirmPassword) {
            errors.confirmPassword = "Please confirm your password";
        } else if (password !== confirmPassword) {
            errors.confirmPassword = "Passwords do not match";
        }
        
        return errors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        
        const errors = validateFields();
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            setError("Please fix the errors below");
            return;
        }
        
        setFieldErrors({});
        setLoading(true);
        
        try {
            const response = await axios.post("http://localhost:5000/api/auth/register", {
                name: name.trim(),
                email: email.toLowerCase().trim(),
                password,
                confirmPassword,
            });
            
            if (response.status === 201) {
                setSuccess("Account created successfully! Redirecting to login...");
                localStorage.setItem("user", JSON.stringify({
                    _id: response.data._id,
                    name: response.data.name,
                    email: response.data.email
                }));
                localStorage.setItem("token", response.data.token);
                
                setTimeout(() => {
                    navigate("/login");
                }, 1500);
            } else {
                setError("Signup failed. Please try again.");
            }
        } catch (error) {
            console.error('Signup error:', error);
            
            if (error.response?.status === 409) {
                setError("Email already registered. Please use a different email or log in.");
                setFieldErrors({ email: "Email already in use" });
            } else if (error.response?.status === 400) {
                const message = error.response.data?.message;
                setError(message || "Invalid input. Please check your details.");
                if (message?.includes("password")) {
                    setFieldErrors({ password: message });
                } else if (message?.includes("email")) {
                    setFieldErrors({ email: message });
                }
            } else if (error.response?.status === 500) {
                setError("Server error. Please try again later.");
            } else if (error.code === 'ECONNREFUSED') {
                setError("Cannot connect to server. Please try again later.");
            } else {
                setError(error.response?.data?.message || "Something went wrong. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white font-sans antialiased py-16 px-4">
            <Card className="w-full max-w-md mx-auto transform transition-all duration-300 animate-fadeInUp">
                <h1 className="font-extrabold text-blue-400 text-center text-4xl mb-8 drop-shadow-md">Sign Up</h1>
                {success && (
                    <div className="p-4 mb-4 bg-green-900/30 border border-green-600 rounded-lg text-green-300 text-sm flex items-start gap-2">
                        <span className="text-lg">✓</span>
                        <span>{success}</span>
                    </div>
                )}
                
                <form className="space-y-5" onSubmit={handleSubmit}>
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <Label htmlFor="name">Full Name</Label>
                            {name && <span className="text-xs text-slate-400">{name.length}/50</span>}
                        </div>
                        <Input
                            type="text"
                            name="name"
                            id="name"
                            placeholder="Enter your full name"
                            value={name}
                            onChange={e => {
                                setName(e.target.value);
                                if (fieldErrors.name) setFieldErrors({...fieldErrors, name: ''});
                            }}
                            className={fieldErrors.name ? 'border-red-500' : ''}
                        />
                        {fieldErrors.name && <p className="text-red-400 text-xs mt-1">{fieldErrors.name}</p>}
                    </div>
                    
                    <div>
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                            type="email"
                            id="email"
                            name="email"
                            placeholder="your@email.com"
                            value={email}
                            onChange={e => {
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
                            placeholder="At least 6 characters"
                            value={password}
                            onChange={e => {
                                setPassword(e.target.value);
                                if (fieldErrors.password) setFieldErrors({...fieldErrors, password: ''});
                            }}
                            className={fieldErrors.password ? 'border-red-500' : ''}
                        />
                        {fieldErrors.password && <p className="text-red-400 text-xs mt-1">{fieldErrors.password}</p>}
                        {password && <p className="text-xs text-slate-400 mt-1">Password strength: {password.length < 8 ? 'Weak' : password.length < 12 ? 'Medium' : 'Strong'}</p>}
                    </div>
                    
                    <div>
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <Input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            placeholder="Re-enter your password"
                            value={confirmPassword}
                            onChange={e => {
                                setConfirmPassword(e.target.value);
                                if (fieldErrors.confirmPassword) setFieldErrors({...fieldErrors, confirmPassword: ''});
                            }}
                            className={fieldErrors.confirmPassword ? 'border-red-500' : ''}
                        />
                        {fieldErrors.confirmPassword && <p className="text-red-400 text-xs mt-1">{fieldErrors.confirmPassword}</p>}
                        {password && confirmPassword && password === confirmPassword && (
                            <p className="text-green-400 text-xs mt-1">✓ Passwords match</p>
                        )}
                    </div>
                    
                    {error && (
                        <div className="p-3 bg-red-900/30 border border-red-600 rounded-lg text-red-300 text-sm flex items-start gap-2">
                            <span className="text-lg">⚠</span>
                            <span>{error}</span>
                        </div>
                    )}
                    
                    <Button 
                        type="submit" 
                        className="w-full mt-6"
                        disabled={loading}
                    >
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </Button>
                </form>
                <div className="text-center mt-6 text-sm">
                    <p className="font-medium text-slate-400">
                        Already have an account?{' '}
                        <span
                            className="text-blue-400 hover:underline cursor-pointer"
                            onClick={() => navigate("/login")}
                        >
                            Log in here
                        </span>
                    </p>
                </div>
            </Card>
        </main>
    );
}

export default SignUp;