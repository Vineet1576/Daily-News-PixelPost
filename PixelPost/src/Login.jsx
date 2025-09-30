import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import './style/output.css'

function Login() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("");

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post("http://localhost:5000/api/auth/login", {
                email,
                password
            });
            if (res.status === 200) {
                localStorage.setItem("user", JSON.stringify(res.data.user));
                localStorage.setItem("token", res.token);
                navigate("/");
            } else {
                setError("Login failed");
            }
        } catch (error) {
            setError(error.response?.data?.message || "Something went wrong");
        }
    }
    return (
        <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white font-sans antialiased py-16 px-4">
            <div className="w-full max-w-md mx-auto bg-slate-800 rounded-2xl shadow-xl border-t border-b border-slate-700 p-8 transform transition-all duration-300 animate-fadeInUp">
                <h1 className="font-extrabold text-blue-400 text-center text-4xl mb-8 drop-shadow-md">Login</h1>
                <form className="space-y-5" onSubmit={handleLogin}>
                    <div>
                        <label className="font-semibold text-slate-200 block mb-2" htmlFor="email">Email Address:</label>
                        <input className="w-full py-3 px-4 rounded-lg border border-slate-700 bg-slate-800 text-slate-200 placeholder:text-slate-500 transition-all duration-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" type="email" id="email" name="email" placeholder="Enter your email address" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div>
                        <label className="font-semibold text-slate-200 block mb-2" htmlFor="password">Password:</label>
                        <input className="w-full py-3 px-4 rounded-lg border border-slate-700 bg-slate-800 text-slate-200 placeholder:text-slate-500 transition-all duration-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" type="password" id="password" name="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>
                    <div className="flex justify-between items-center flex-wrap">
                        <div className="flex items-center gap-2">
                            <input className="form-checkbox h-5 w-5 text-blue-600 bg-slate-800 rounded border border-slate-700 focus:ring-1 focus:ring-blue-500" type="checkbox" id="remember-me" name="remember-me" />
                            <label className="font-medium text-sm text-slate-400" htmlFor="remember-me">Remember me</label>
                        </div>
                        <a className="font-medium text-sm text-blue-400 hover:underline cursor-pointer" href="#">Forgot Password?</a>
                    </div>
                    {error && <p className="text-red-500 font-semibold mt-4 text-center text-sm">{error}</p>}
                    <button className="bg-blue-600 text-white font-bold py-3 px-6 w-full rounded-full mt-6 shadow-md transition-all duration-300 hover:bg-blue-700 hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900" type="submit">
                        Login
                    </button>
                </form>
                <div className="text-center mt-6 text-sm">
                    <p className="font-medium text-slate-400">Don't have an account? <a className="text-blue-400 hover:underline cursor-pointer" onClick={() => navigate("/signup")}>Sign Up here</a></p>
                </div>
            </div>
        </main>
    )
}

export default Login