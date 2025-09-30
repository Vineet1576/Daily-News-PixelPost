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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || !email || !password || !confirmPassword) {
            setError("Please fill in all fields.");
            return;
        }
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        try {
            const response = await axios.post("http://localhost:5000/api/auth/register", {
                name,
                email,
                password,
            });
            if (response.status === 201) {
                localStorage.setItem("user", JSON.stringify(response.data.user));
                localStorage.setItem("token", response.token);
                navigate("/login");
            } else {
                setError("Signup failed");
            }
        } catch (error) {
            setError(error.response?.data?.message || "Something went wrong");
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white font-sans antialiased py-16 px-4">
            <Card className="w-full max-w-md mx-auto transform transition-all duration-300 animate-fadeInUp">
                <h1 className="font-extrabold text-blue-400 text-center text-4xl mb-8 drop-shadow-md">Sign Up</h1>
                <form className="space-y-5" onSubmit={handleSubmit}>
                    <div>
                        <Label htmlFor="name">Name:</Label>
                        <Input
                            type="text"
                            name="name"
                            id="name"
                            placeholder="Enter your name"
                            value={name}
                            onChange={e => setName(e.target.value)}
                        />
                    </div>
                    <div>
                        <Label htmlFor="email">Email Address:</Label>
                        <Input
                            type="email"
                            id="email"
                            name="email"
                            placeholder="Enter your email address"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
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
                            onChange={e => setPassword(e.target.value)}
                        />
                    </div>
                    <div>
                        <Label htmlFor="confirmPassword">Confirm Password:</Label>
                        <Input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            placeholder="Confirm your password"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            className="form-checkbox h-5 w-5 text-blue-600 bg-slate-800 rounded border border-slate-700 focus:ring-1 focus:ring-blue-500"
                            type="checkbox"
                            id="terms"
                            name="terms"
                        />
                        <span className="font-medium text-sm text-slate-400">
                            I agree to the{' '}
                            <a className="text-blue-400 hover:underline cursor-pointer" href="#">
                                Terms and Conditions
                            </a>
                        </span>
                    </div>
                    <ErrorText>{error}</ErrorText>
                    <Button type="submit" className="w-full mt-6">
                        Sign Up
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