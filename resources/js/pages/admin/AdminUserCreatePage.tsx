import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { Role } from '../../types';
import {
    UserPlus,
    ArrowLeft,
    CheckCircle2,
    AlertCircle,
    User,
    Phone,
    Mail,
    Lock,
    Eye,
    EyeOff,
    Shield,
    GraduationCap,
    BookOpen,
    Sparkles,
    RefreshCw,
    Layers,
    Plus
} from 'lucide-react';

export const AdminUserCreatePage: React.FC = () => {
    const navigate = useNavigate();

    const [roles, setRoles] = useState<Role[]>([]);
    const [loadingRoles, setLoadingRoles] = useState(false);

    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [roleType, setRoleType] = useState<'student' | 'teacher' | 'admin' | 'custom'>('student');
    const [selectedCustomRoleId, setSelectedCustomRoleId] = useState<number | string>('');
    const [status, setStatus] = useState<'active' | 'inactive'>('active');

    // Teacher specific fields
    const [designation, setDesignation] = useState('');
    const [institution, setInstitution] = useState('');
    const [bio, setBio] = useState('');

    const [showPassword, setShowPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        setLoadingRoles(true);
        try {
            const { data } = await apiClient.get('/admin/roles');
            setRoles(data.roles || []);
            if (data.roles && data.roles.length > 0) {
                setSelectedCustomRoleId(data.roles[0].id);
            }
        } catch {
            // silent fail
        } finally {
            setLoadingRoles(false);
        }
    };

    const generateRandomPassword = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
        let pwd = '';
        for (let i = 0; i < 10; i++) {
            pwd += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setPassword(pwd);
        setShowPassword(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);
        setSuccessMessage(null);

        if (!name.trim() || !phone.trim() || !email.trim() || !password) {
            setErrorMessage('Please fill in name, phone, email, and password correctly.');
            return;
        }

        if (roleType === 'custom' && !selectedCustomRoleId) {
            setErrorMessage('Please select a custom role.');
            return;
        }

        setSubmitting(true);

        const payload: any = {
            name: name.trim(),
            phone: phone.trim(),
            email: email.trim().toLowerCase(),
            password: password,
            role: roleType === 'custom' ? 'custom' : roleType,
            custom_role_id: roleType === 'custom' ? Number(selectedCustomRoleId) : null,
            status: status,
        };

        if (roleType === 'teacher') {
            payload.designation = designation.trim() || undefined;
            payload.institution = institution.trim() || undefined;
            payload.bio = bio.trim() || undefined;
        }

        try {
            const { data } = await apiClient.post('/admin/users', payload);
            setSuccessMessage(data.message || 'New user created successfully!');
            setTimeout(() => {
                navigate('/admin/users');
            }, 1200);
        } catch (err: any) {
            const resData = err.response?.data;
            if (resData?.errors) {
                const firstError = Object.values(resData.errors)[0] as string[];
                setErrorMessage(firstError?.[0] || resData.message || 'Failed to create user.');
            } else {
                setErrorMessage(resData?.message || 'Failed to create user.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
            {/* Top Navigation & Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
                <div className="space-y-1">
                    <Link
                        to="/admin/users"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-sky-600 transition mb-2"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Back to Users List</span>
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
                            <UserPlus className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                Create New User
                            </h1>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Add a new student, teacher, administrator, or custom staff account to the system.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Alerts */}
            {successMessage && (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2.5 animate-fadeIn">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>{successMessage}</span>
                </div>
            )}
            {errorMessage && (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-center gap-2.5 animate-fadeIn">
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    <span>{errorMessage}</span>
                </div>
            )}

            {/* Main Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Section 1: Basic Information */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-5">
                    <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm pb-3 border-b border-slate-100 dark:border-slate-800">
                        <User className="w-4 h-4 text-sky-500" />
                        <span>Basic Details</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                Full Name <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Ariful Islam"
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                Phone Number <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <Phone className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    required
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="017xxxxxxxx"
                                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                Email Address <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <Mail className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="user@example.com"
                                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Login Password <span className="text-rose-500">*</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={generateRandomPassword}
                                    className="text-[11px] font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 cursor-pointer"
                                >
                                    <Sparkles className="w-3 h-3" />
                                    <span>Auto Generate</span>
                                </button>
                            </div>
                            <div className="relative">
                                <Lock className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="At least 6 characters"
                                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden font-mono"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 2: Role & Access Assignment */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-5">
                    <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm pb-3 border-b border-slate-100 dark:border-slate-800">
                        <Shield className="w-4 h-4 text-sky-500" />
                        <span>Role & Permissions</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {/* Student */}
                        <label
                            className={`p-4 rounded-2xl border-2 cursor-pointer transition select-none flex flex-col justify-between space-y-2 ${roleType === 'student'
                                ? 'border-sky-500 bg-sky-50/60 dark:bg-sky-950/30 text-sky-950 dark:text-sky-100 ring-2 ring-sky-500/20'
                                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-800/40'
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-900/40 text-sky-600 flex items-center justify-center font-bold">
                                    <User className="w-4 h-4" />
                                </div>
                                <input
                                    type="radio"
                                    name="roleType"
                                    checked={roleType === 'student'}
                                    onChange={() => setRoleType('student')}
                                    className="text-sky-600 focus:ring-sky-500"
                                />
                            </div>
                            <div>
                                <span className="font-extrabold text-sm block">Student</span>
                                <span className="text-[11px] text-slate-500">Course enrollment and learning access</span>
                            </div>
                        </label>

                        {/* Teacher */}
                        <label
                            className={`p-4 rounded-2xl border-2 cursor-pointer transition select-none flex flex-col justify-between space-y-2 ${roleType === 'teacher'
                                ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/30 text-indigo-950 dark:text-indigo-100 ring-2 ring-indigo-500/20'
                                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-800/40'
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 flex items-center justify-center font-bold">
                                    <GraduationCap className="w-4 h-4" />
                                </div>
                                <input
                                    type="radio"
                                    name="roleType"
                                    checked={roleType === 'teacher'}
                                    onChange={() => setRoleType('teacher')}
                                    className="text-indigo-600 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <span className="font-extrabold text-sm block">Teacher</span>
                                <span className="text-[11px] text-slate-500">Course management and exam grading</span>
                            </div>
                        </label>

                        {/* Custom Role */}
                        <label
                            className={`p-4 rounded-2xl border-2 cursor-pointer transition select-none flex flex-col justify-between space-y-2 ${roleType === 'custom'
                                ? 'border-purple-500 bg-purple-50/60 dark:bg-purple-950/30 text-purple-950 dark:text-purple-100 ring-2 ring-purple-500/20'
                                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-800/40'
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 flex items-center justify-center font-bold">
                                    <Shield className="w-4 h-4" />
                                </div>
                                <input
                                    type="radio"
                                    name="roleType"
                                    checked={roleType === 'custom'}
                                    onChange={() => setRoleType('custom')}
                                    className="text-purple-600 focus:ring-purple-500"
                                />
                            </div>
                            <div>
                                <span className="font-extrabold text-sm block">Custom Role (Staff)</span>
                                <span className="text-[11px] text-slate-500">Librarian, Course Manager, Moderator</span>
                            </div>
                        </label>

                        {/* Super Admin */}
                        <label
                            className={`p-4 rounded-2xl border-2 cursor-pointer transition select-none flex flex-col justify-between space-y-2 ${roleType === 'admin'
                                ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/30 text-amber-950 dark:text-amber-100 ring-2 ring-amber-500/20'
                                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-800/40'
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 flex items-center justify-center font-bold">
                                    <Shield className="w-4 h-4" />
                                </div>
                                <input
                                    type="radio"
                                    name="roleType"
                                    checked={roleType === 'admin'}
                                    onChange={() => setRoleType('admin')}
                                    className="text-amber-600 focus:ring-amber-500"
                                />
                            </div>
                            <div>
                                <span className="font-extrabold text-sm block">Super Admin</span>
                                <span className="text-[11px] text-slate-500">Full system access and control</span>
                            </div>
                        </label>
                    </div>

                    {/* Custom Role Dropdown Picker (Visible when Custom Role is selected) */}
                    {roleType === 'custom' && (
                        <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/60 space-y-3 animate-fadeIn">
                            <div className="flex items-center justify-between">
                                <label className="block text-xs font-bold text-purple-900 dark:text-purple-200">
                                    Select Custom Role <span className="text-rose-500">*</span>
                                </label>
                                <Link
                                    to="/admin/users/roles"
                                    target="_blank"
                                    className="text-[11px] font-bold text-purple-700 dark:text-purple-300 hover:underline flex items-center gap-1"
                                >
                                    <Plus className="w-3 h-3" />
                                    <span>Create New Role</span>
                                </Link>
                            </div>

                            {loadingRoles ? (
                                <div className="text-xs text-purple-600 flex items-center gap-2">
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    <span>Loading roles...</span>
                                </div>
                            ) : roles.length === 0 ? (
                                <div className="text-xs text-purple-800 dark:text-purple-200 space-y-1">
                                    <p>No custom roles created yet.</p>
                                    <Link
                                        to="/admin/users/roles"
                                        className="inline-block text-xs font-bold text-purple-700 underline"
                                    >
                                        Create a custom role first &rarr;
                                    </Link>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {roles.map((r) => {
                                        const isSelected = String(selectedCustomRoleId) === String(r.id);
                                        return (
                                            <div
                                                key={r.id}
                                                onClick={() => setSelectedCustomRoleId(r.id)}
                                                className={`p-3 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between ${isSelected
                                                    ? 'bg-white dark:bg-slate-900 border-purple-500 shadow-xs ring-2 ring-purple-500/20'
                                                    : 'bg-white/80 dark:bg-slate-900/60 border-purple-200/80 hover:border-purple-300'
                                                    }`}
                                            >
                                                <div>
                                                    <span className="font-extrabold text-slate-900 dark:text-white block">
                                                        {r.name}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-mono">
                                                        {r.permissions?.length || 0} permissions assigned
                                                    </span>
                                                </div>
                                                <input
                                                    type="radio"
                                                    name="custom_role_select"
                                                    checked={isSelected}
                                                    onChange={() => setSelectedCustomRoleId(r.id)}
                                                    className="text-purple-600 focus:ring-purple-500"
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Teacher Extra Fields */}
                    {roleType === 'teacher' && (
                        <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/60 space-y-3 animate-fadeIn">
                            <span className="font-bold text-xs text-indigo-900 dark:text-indigo-200 block">
                                Teacher Profile Details
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        Designation
                                    </label>
                                    <input
                                        type="text"
                                        value={designation}
                                        onChange={(e) => setDesignation(e.target.value)}
                                        placeholder="e.g. Senior Instructor"
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        Institution
                                    </label>
                                    <input
                                        type="text"
                                        value={institution}
                                        onChange={(e) => setInstitution(e.target.value)}
                                        placeholder="e.g. University of Dhaka"
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Account Status */}
                    <div className="pt-2">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                            Account Status
                        </label>
                        <div className="flex items-center gap-4">
                            <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                                <input
                                    type="radio"
                                    name="status"
                                    value="active"
                                    checked={status === 'active'}
                                    onChange={() => setStatus('active')}
                                    className="text-emerald-600 focus:ring-emerald-500"
                                />
                                <span className="text-emerald-600">Active</span>
                            </label>
                            <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                                <input
                                    type="radio"
                                    name="status"
                                    value="inactive"
                                    checked={status === 'inactive'}
                                    onChange={() => setStatus('inactive')}
                                    className="text-rose-600 focus:ring-rose-500"
                                />
                                <span className="text-rose-600">Inactive</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Submit Action Bar */}
                <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                        type="button"
                        onClick={() => navigate('/admin/users')}
                        className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex items-center gap-2 px-7 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition shadow-sm shadow-sky-600/30 disabled:opacity-60 cursor-pointer"
                    >
                        {submitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                        <span>{submitting ? 'Creating User...' : 'Create User Account'}</span>
                    </button>
                </div>
            </form>
        </div>
    );
};

