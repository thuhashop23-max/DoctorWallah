import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import {
    Award,
    Sparkles,
    Gem,
    Search,
    BookOpen,
    Upload,
    FileText,
    CheckCircle2,
    Eye,
    Clock,
    Check,
    X,
    ExternalLink,
    Paperclip,
    Loader2,
    ArrowRight,
    Users,
    ChevronRight,
    LogIn
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal';

interface CourseOption {
    id: number;
    title: string;
    slug: string;
    thumbnail?: string | null;
    active_topics_count?: number;
}

interface RewardTopic {
    id: number;
    course_id: number;
    title: string;
    description?: string | null;
    points_reward: number;
    is_active: boolean;
    total_submissions_count?: number;
    approved_submissions_count?: number;
}

interface ApprovedNote {
    id: number;
    title: string;
    description?: string | null;
    file_paths?: {
        url: string;
        file_name?: string;
        file_type?: string;
        file_size?: number;
    }[] | null;
    reviewed_at?: string | null;
    created_at: string;
    user?: {
        id: number;
        name: string;
        photo_url?: string | null;
        registration_number?: string | null;
    };
}

interface MySubmissionItem {
    id: number;
    title: string;
    description?: string | null;
    status: 'pending' | 'approved' | 'rejected';
    points_awarded: number;
    feedback?: string | null;
    created_at: string;
    topic?: {
        id: number;
        title: string;
        points_reward: number;
    };
    course?: {
        id: number;
        title: string;
        slug: string;
        thumbnail?: string | null;
    };
}

export const EarnPointsPage: React.FC = () => {
    const { user } = useAuth();
    const { settings } = useSettings();
    const isPointsActive = (settings as any)?.point_settings?.is_active !== false;
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState<'courses' | 'my_submissions'>('courses');
    const [courses, setCourses] = useState<CourseOption[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<CourseOption | null>(null);
    const [topics, setTopics] = useState<RewardTopic[]>([]);
    const [loadingCourses, setLoadingCourses] = useState(true);
    const [loadingTopics, setLoadingTopics] = useState(false);
    const [searchCourseTerm, setSearchCourseTerm] = useState('');

    // My Submissions state
    const [mySubmissions, setMySubmissions] = useState<MySubmissionItem[]>([]);
    const [loadingMySubmissions, setLoadingMySubmissions] = useState(false);
    const [totalEarnedFromNotes, setTotalEarnedFromNotes] = useState(0);

    // Submission Modal state
    const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
    const [submittingTopic, setSubmittingTopic] = useState<RewardTopic | null>(null);
    const [noteTitle, setNoteTitle] = useState('');
    const [noteDescription, setNoteDescription] = useState('');
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [submittingNote, setSubmittingNote] = useState(false);
    const [submitSuccessMsg, setSubmitSuccessMsg] = useState<string | null>(null);

    // Approved Notes Viewer Modal state
    const [isApprovedNotesModalOpen, setIsApprovedNotesModalOpen] = useState(false);
    const [viewingTopicForNotes, setViewingTopicForNotes] = useState<RewardTopic | null>(null);
    const [approvedNotes, setApprovedNotes] = useState<ApprovedNote[]>([]);
    const [loadingApprovedNotes, setLoadingApprovedNotes] = useState(false);

    // Lightbox image preview
    const [previewImageModalUrl, setPreviewImageModalUrl] = useState<string | null>(null);

    useEffect(() => {
        fetchCourses();
    }, []);

    useEffect(() => {
        if (user && activeTab === 'my_submissions') {
            fetchMySubmissions();
        }
    }, [user, activeTab]);

    const fetchCourses = async (searchParam = '') => {
        try {
            setLoadingCourses(true);
            const params: any = {};
            if (searchParam.trim()) {
                params.search = searchParam.trim();
            }
            const { data } = await apiClient.get('/earn-points/courses', { params });
            const list: CourseOption[] = data.courses || data.all_courses || (Array.isArray(data) ? data : []);
            setCourses(list);
            if (list.length > 0) {
                setSelectedCourse((prev) => {
                    if (prev && list.some((item) => item.id === prev.id)) {
                        return prev;
                    }
                    return list[0];
                });
                selectCourse(list[0]);
            }
        } catch (err) {
            console.error('Failed to load courses for earn points', err);
        } finally {
            setLoadingCourses(false);
        }
    };

    const selectCourse = async (course: CourseOption) => {
        setSelectedCourse(course);
        try {
            setLoadingTopics(true);
            const { data } = await apiClient.get(`/earn-points/courses/${course.id}/topics`);
            setTopics(data.topics || []);
        } catch (err) {
            console.error('Failed to load course topics', err);
        } finally {
            setLoadingTopics(false);
        }
    };

    const fetchMySubmissions = async () => {
        try {
            setLoadingMySubmissions(true);
            const { data } = await apiClient.get('/student/earn-points/my-submissions');
            setMySubmissions(data.submissions || []);
            setTotalEarnedFromNotes(data.total_earned_from_notes || 0);
        } catch (err) {
            console.error('Failed to load my submissions', err);
        } finally {
            setLoadingMySubmissions(false);
        }
    };

    const handleOpenSubmitModal = (topic: RewardTopic) => {
        if (!user) {
            navigate('/login');
            return;
        }
        setSubmittingTopic(topic);
        setNoteTitle('');
        setNoteDescription('');
        setSelectedFiles([]);
        setSubmitSuccessMsg(null);
        setIsSubmitModalOpen(true);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesArr = Array.from(e.target.files);
            setSelectedFiles((prev) => [...prev, ...filesArr]);
        }
    };

    const handleRemoveFile = (index: number) => {
        setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmitNoteForm = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!submittingTopic) return;
        if (!noteTitle.trim()) {
            alert('Please enter a note title.');
            return;
        }

        try {
            setSubmittingNote(true);
            setSubmitSuccessMsg(null);

            const formData = new FormData();
            formData.append('title', noteTitle.trim());
            if (noteDescription.trim()) {
                formData.append('description', noteDescription.trim());
            }
            selectedFiles.forEach((file) => {
                formData.append('files[]', file);
            });

            await apiClient.post(`/student/earn-points/topics/${submittingTopic.id}/submit`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setSubmitSuccessMsg('Your note has been submitted successfully! The instructor will review it.');
            if (selectedCourse) {
                // Refresh topic submission counts
                selectCourse(selectedCourse);
            }
            setTimeout(() => {
                setIsSubmitModalOpen(false);
                setSubmitSuccessMsg(null);
            }, 2500);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to submit note.');
        } finally {
            setSubmittingNote(false);
        }
    };

    const handleOpenApprovedNotes = async (topic: RewardTopic) => {
        setViewingTopicForNotes(topic);
        setIsApprovedNotesModalOpen(true);
        try {
            setLoadingApprovedNotes(true);
            const { data } = await apiClient.get(`/earn-points/topics/${topic.id}/approved-notes`);
            setApprovedNotes(data.approved_notes || []);
        } catch (err) {
            console.error('Failed to load approved notes', err);
        } finally {
            setLoadingApprovedNotes(false);
        }
    };

    const getThumbnailUrl = (thumb?: string | null) => {
        if (!thumb) return null;
        if (thumb.startsWith('http://') || thumb.startsWith('https://') || thumb.startsWith('/')) {
            return thumb;
        }
        return `/storage/${thumb}`;
    };

    const filteredCourses = React.useMemo(() => {
        if (!searchCourseTerm.trim()) return courses;
        const term = searchCourseTerm.toLowerCase().trim();
        return courses.filter((c) =>
            (c.title && c.title.toLowerCase().includes(term)) ||
            (c.slug && c.slug.toLowerCase().includes(term))
        );
    }, [courses, searchCourseTerm]);

    if (!isPointsActive) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-16 px-4">
                <div className="max-w-md mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center space-y-4 shadow-sm">
                    <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
                        <Gem className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white">
                        Reward Points System Inactive
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        The reward points program is temporarily disabled by the administrator. Please check back later.
                    </p>
                    <Link
                        to="/courses"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#A60201] hover:bg-[#880101] text-white font-bold text-xs rounded-xl shadow-xs transition"
                    >
                        <span>Browse Courses</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 sm:py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                {/* Hero Banner */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-sky-950 text-white p-6 sm:p-10 shadow-xl border border-slate-700/50">
                    <div className="relative z-10 max-w-3xl space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 font-extrabold text-xs shadow-2xs">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>DoctorWallah Student Rewards</span>
                        </div>

                        <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
                            Earn Reward Points by Sharing Your Lecture Notes
                        </h1>

                        <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                            Upload clear photos of your handwritten notes, formula sheets, or study summaries on topic guidelines.
                            When approved by instructors, points are credited straight to your profile!
                        </p>

                        {/* User points status banner */}
                        {user ? (
                            <div className="pt-2 flex flex-wrap items-center gap-3">
                                <div className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl flex items-center gap-2 text-sm font-extrabold text-amber-400">
                                    <Gem className="w-4 h-4 text-amber-400" />
                                    <span>My Balance: {user.points ?? 0}</span>
                                </div>

                                <button
                                    onClick={() => setActiveTab(activeTab === 'my_submissions' ? 'courses' : 'my_submissions')}
                                    className="px-4 py-2 bg-[#A60201] hover:bg-[#880101] text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                                >
                                    <span>{activeTab === 'my_submissions' ? 'Browse Topics' : 'My Submissions'}</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ) : (
                            <div className="pt-2">
                                <Link
                                    to="/login"
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-900 font-extrabold text-xs rounded-xl shadow-md transition"
                                >
                                    <LogIn className="w-4 h-4" />
                                    <span>Login to Submit Notes & Earn Points</span>
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Decorative Background Icon */}
                    <Award className="absolute right-6 -bottom-8 w-60 h-60 text-white/5 pointer-events-none" />
                </div>

                {/* Tab Navigation if logged in */}
                {user && (
                    <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1">
                        <button
                            onClick={() => setActiveTab('courses')}
                            className={`px-4 py-2 font-bold text-sm border-b-2 transition-all cursor-pointer ${activeTab === 'courses'
                                ? 'border-[#A60201] text-[#A60201]'
                                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                                }`}
                        >
                            Browse Courses & Topics
                        </button>
                        <button
                            onClick={() => setActiveTab('my_submissions')}
                            className={`px-4 py-2 font-bold text-sm border-b-2 transition-all cursor-pointer ${activeTab === 'my_submissions'
                                ? 'border-amber-500 text-amber-500'
                                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                                }`}
                        >
                            My Submissions ({mySubmissions.length})
                        </button>
                    </div>
                )}

                {/* Tab 1: Browse Courses & Topics */}
                {activeTab === 'courses' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Course List Sidebar */}
                        <div className="lg:col-span-4 space-y-4">
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                                        <BookOpen className="w-4 h-4 text-[#A60201]" />
                                        <span>Select Course</span>
                                    </h3>
                                    <span className="text-xs font-bold text-slate-400">
                                        {filteredCourses.length} Courses
                                    </span>
                                </div>

                                {/* Search course */}
                                <div className="relative">
                                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        placeholder="Search courses..."
                                        value={searchCourseTerm}
                                        onChange={(e) => setSearchCourseTerm(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                fetchCourses(searchCourseTerm);
                                            }
                                        }}
                                        className="w-full pl-8 pr-8 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:border-[#A60201]"
                                    />
                                    {searchCourseTerm && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSearchCourseTerm('');
                                                fetchCourses('');
                                            }}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                                            title="Clear search"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>

                                {/* Course Cards */}
                                <div className="max-h-[600px] overflow-y-auto space-y-2 pr-1">
                                    {loadingCourses ? (
                                        <div className="py-10 text-center space-y-2">
                                            <Loader2 className="w-6 h-6 text-[#A60201] animate-spin mx-auto" />
                                            <p className="text-xs text-slate-400">Loading courses...</p>
                                        </div>
                                    ) : filteredCourses.length === 0 ? (
                                        <div className="py-8 text-center text-xs text-slate-400 space-y-2">
                                            <p>No courses found {searchCourseTerm ? `matching "${searchCourseTerm}"` : ''}.</p>
                                            {searchCourseTerm && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSearchCourseTerm('');
                                                        fetchCourses('');
                                                    }}
                                                    className="text-xs text-[#A60201] font-bold hover:underline cursor-pointer"
                                                >
                                                    View All Courses
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        filteredCourses.map((c) => {
                                            const isSelected = selectedCourse?.id === c.id;
                                            const thumbUrl = getThumbnailUrl(c.thumbnail);

                                            return (
                                                <div
                                                    key={c.id}
                                                    onClick={() => selectCourse(c)}
                                                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${isSelected
                                                        ? 'bg-red-50/70 dark:bg-[#A60201]/10 border-[#A60201] ring-2 ring-[#A60201]/20'
                                                        : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                                                        }`}
                                                >
                                                    <div className="w-12 h-12 rounded-lg bg-slate-900 shrink-0 overflow-hidden relative">
                                                        {thumbUrl ? (
                                                            <img
                                                                src={thumbUrl}
                                                                alt={c.title}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-white text-[10px] font-black">
                                                                NN
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex-1 min-w-0 space-y-0.5">
                                                        <h4 className={`text-xs font-bold truncate ${isSelected ? 'text-[#A60201]' : 'text-slate-800 dark:text-slate-200'}`}>
                                                            {c.title}
                                                        </h4>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                                                <Sparkles className="w-3 h-3" />
                                                                <span>{c.active_topics_count ?? 0} Topics</span>
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isSelected ? 'text-[#A60201] translate-x-0.5' : 'text-slate-400'}`} />
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Topics List for Selected Course */}
                        <div className="lg:col-span-8 space-y-4">
                            {selectedCourse ? (
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs p-5 sm:p-6 space-y-5">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                                        <div>
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                                Selected Course
                                            </span>
                                            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                                                {selectedCourse.title}
                                            </h2>
                                        </div>

                                        <span className="px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-full text-xs font-bold self-start sm:self-center">
                                            {topics.length} Reward Topics Available
                                        </span>
                                    </div>

                                    {/* Topics Cards */}
                                    {loadingTopics ? (
                                        <div className="py-16 text-center space-y-3">
                                            <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
                                            <p className="text-xs font-bold text-slate-500">Loading reward topics...</p>
                                        </div>
                                    ) : topics.length === 0 ? (
                                        <div className="py-16 text-center space-y-3">
                                            <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                                            <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
                                                No reward topics have been created for this course yet.
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                Please check other courses or check back later!
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {topics.map((topic) => {
                                                const totalSubs = topic.total_submissions_count || 0;
                                                const approvedCount = topic.approved_submissions_count || 0;

                                                return (
                                                    <div
                                                        key={topic.id}
                                                        className="p-5 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl transition space-y-4"
                                                    >
                                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                                            <div className="space-y-1 max-w-xl">
                                                                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                                                                    {topic.title}
                                                                </h3>
                                                                {topic.description ? (
                                                                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                                                        {topic.description}
                                                                    </p>
                                                                ) : (
                                                                    <p className="text-xs text-slate-400 italic">
                                                                        Upload notes or formulas related to this topic.
                                                                    </p>
                                                                )}
                                                            </div>

                                                            <div className="shrink-0 flex items-center gap-2">
                                                                <span className="px-3 py-1 bg-amber-500 text-white rounded-full text-xs font-black shadow-xs flex items-center gap-1">
                                                                    <Gem className="w-3.5 h-3.5" />
                                                                    <span>+{topic.points_reward}</span>
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Submissions count banner & actions */}
                                                        <div className="pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                                                                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                                                    <Users className="w-3.5 h-3.5 text-sky-500" />
                                                                    <span>{totalSubs} Students Submitted</span>
                                                                </span>
                                                                {approvedCount > 0 && (
                                                                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                                                        • {approvedCount} Approved
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <div className="flex items-center gap-2">
                                                                {approvedCount > 0 && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleOpenApprovedNotes(topic)}
                                                                        className="px-3.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-[#A60201] text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                                                    >
                                                                        <Eye className="w-3.5 h-3.5 text-[#A60201]" />
                                                                        <span>View Approved Notes ({approvedCount})</span>
                                                                    </button>
                                                                )}

                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleOpenSubmitModal(topic)}
                                                                    className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-extrabold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                                                                >
                                                                    <Upload className="w-3.5 h-3.5" />
                                                                    <span>Submit Note</span>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-xs">
                                    Please choose a course from the left menu to view available reward topics.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Tab 2: My Submissions */}
                {activeTab === 'my_submissions' && (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs p-5 sm:p-6 space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                            <div>
                                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Award className="w-5 h-5 text-amber-500" />
                                    <span>My Note Submissions & Earned Points</span>
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    Track approval status and points awarded for your submitted notes.
                                </p>
                            </div>

                            <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-700 dark:text-amber-400 text-xs font-black flex items-center gap-1.5">
                                <Gem className="w-3.5 h-3.5 text-amber-500" />
                                <span>Total Earned From Notes: +{totalEarnedFromNotes}</span>
                            </div>
                        </div>

                        {loadingMySubmissions ? (
                            <div className="py-16 text-center space-y-3">
                                <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
                                <p className="text-xs font-bold text-slate-500">Loading your submissions...</p>
                            </div>
                        ) : mySubmissions.length === 0 ? (
                            <div className="py-16 text-center space-y-3">
                                <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                    You have not submitted any notes yet.
                                </p>
                                <button
                                    onClick={() => setActiveTab('courses')}
                                    className="px-4 py-2 bg-[#A60201] hover:bg-[#880101] text-white text-xs font-bold rounded-xl shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
                                >
                                    <span>Explore Topics & Submit Notes</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {mySubmissions.map((sub) => {
                                    const isPending = sub.status === 'pending';
                                    const isApproved = sub.status === 'approved';
                                    const isRejected = sub.status === 'rejected';

                                    return (
                                        <div
                                            key={sub.id}
                                            className="p-4 bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl space-y-2.5 transition"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                                        {sub.course?.title || 'Course'} • Topic: {sub.topic?.title || 'Topic'}
                                                    </span>
                                                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mt-0.5">
                                                        {sub.title}
                                                    </h4>
                                                </div>

                                                <div>
                                                    {isApproved && (
                                                        <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                                                            <Check className="w-3.5 h-3.5" />
                                                            <span>Approved (+{sub.points_awarded})</span>
                                                        </span>
                                                    )}
                                                    {isPending && (
                                                        <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 flex items-center gap-1">
                                                            <Clock className="w-3.5 h-3.5" />
                                                            <span>Pending Instructor Review</span>
                                                        </span>
                                                    )}
                                                    {isRejected && (
                                                        <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                                                            Rejected
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {sub.description && (
                                                <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line">
                                                    {sub.description}
                                                </p>
                                            )}

                                            {sub.feedback && (
                                                <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-800 dark:text-rose-300">
                                                    <span className="font-bold">Instructor Feedback: </span>
                                                    <span>{sub.feedback}</span>
                                                </div>
                                            )}

                                            <div className="text-[11px] text-slate-400 pt-1">
                                                Submitted on {new Date(sub.created_at).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Note Submission Modal */}
            <Modal
                isOpen={isSubmitModalOpen}
                onClose={() => setIsSubmitModalOpen(false)}
                title={`Submit Note: ${submittingTopic?.title || 'Reward Topic'}`}
                maxWidth="lg"
            >
                <form onSubmit={handleSubmitNoteForm} className="space-y-4">
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center justify-between text-xs">
                        <span className="font-bold text-amber-800 dark:text-amber-300">
                            Reward upon approval:
                        </span>
                        <span className="font-black text-amber-600 dark:text-amber-400 text-sm">
                            +{submittingTopic?.points_reward || 50} Points
                        </span>
                    </div>

                    {submitSuccessMsg && (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-bold text-emerald-700">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <span>{submitSuccessMsg}</span>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Note Title <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. Chapter 3 Calculus Handwritten Formulas & Summary"
                            value={noteTitle}
                            onChange={(e) => setNoteTitle(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:border-amber-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Note Description / Summary:
                        </label>
                        <textarea
                            rows={3}
                            placeholder="Briefly describe what your note covers or key formulas included..."
                            value={noteDescription}
                            onChange={(e) => setNoteDescription(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden focus:border-amber-500"
                        />
                    </div>

                    {/* File Upload input */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Upload Photos / PDF Document (Up to 10 files, 50MB max each):
                        </label>
                        <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-500 rounded-2xl p-5 flex flex-col items-center justify-center cursor-pointer transition bg-slate-50/50 dark:bg-slate-800/30">
                            <Upload className="w-6 h-6 text-amber-500 mb-1" />
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                Click or drag files to upload
                            </span>
                            <span className="text-[11px] text-slate-400">
                                Supported: JPG, PNG, WebP, PDF
                            </span>
                            <input
                                type="file"
                                multiple
                                accept="image/jpeg,image/png,image/webp,application/pdf"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </label>

                        {/* Selected files preview */}
                        {selectedFiles.length > 0 && (
                            <div className="mt-2 space-y-1.5">
                                <span className="text-[11px] font-bold text-slate-500">Selected Files:</span>
                                <div className="space-y-1">
                                    {selectedFiles.map((file, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center justify-between p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                                        >
                                            <span className="truncate max-w-[280px] font-medium text-slate-700 dark:text-slate-300">
                                                {file.name} ({(file.size / 1024).toFixed(1)} KB)
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveFile(idx)}
                                                className="text-rose-500 hover:text-rose-700"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={() => setIsSubmitModalOpen(false)}
                            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submittingNote}
                            className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-extrabold rounded-xl shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                        >
                            {submittingNote && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            <span>Submit Note for Review</span>
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Approved Notes Viewer Modal */}
            <Modal
                isOpen={isApprovedNotesModalOpen}
                onClose={() => setIsApprovedNotesModalOpen(false)}
                title={`Approved Student Notes: ${viewingTopicForNotes?.title || 'Topic Notes'}`}
                maxWidth="3xl"
            >
                <div className="space-y-4">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Read and learn from high quality notes submitted by fellow students and verified by instructors!
                    </p>

                    {loadingApprovedNotes ? (
                        <div className="py-12 text-center space-y-2">
                            <Loader2 className="w-7 h-7 text-amber-500 animate-spin mx-auto" />
                            <p className="text-xs font-bold text-slate-500">Loading approved notes...</p>
                        </div>
                    ) : approvedNotes.length === 0 ? (
                        <div className="py-12 text-center text-slate-400 text-xs">
                            No approved notes available for this topic yet. Be the first to submit!
                        </div>
                    ) : (
                        <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-1">
                            {approvedNotes.map((note) => {
                                const files = Array.isArray(note.file_paths) ? note.file_paths : [];

                                return (
                                    <div
                                        key={note.id}
                                        className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl space-y-3"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                                                    {note.title}
                                                </h4>
                                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                    By {note.user?.name || 'Verified Student'} • Approved on {note.reviewed_at ? new Date(note.reviewed_at).toLocaleDateString() : 'Recent'}
                                                </p>
                                            </div>
                                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1 shrink-0">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                                <span>Instructor Verified</span>
                                            </span>
                                        </div>

                                        {note.description && (
                                            <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                                                {note.description}
                                            </p>
                                        )}

                                        {/* Files Preview */}
                                        {files.length > 0 && (
                                            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 space-y-2">
                                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                                    Study Materials / Images ({files.length}):
                                                </span>
                                                <div className="flex flex-wrap gap-2">
                                                    {files.map((f: any, idx: number) => {
                                                        const fileUrl = typeof f === 'string' ? f : f?.url;
                                                        const fileName = f?.file_name || `Note File ${idx + 1}`;
                                                        const isImage = fileUrl && (fileUrl.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i) || f?.file_type?.match(/(jpeg|jpg|png|webp)/i));

                                                        return (
                                                            <div key={idx} className="flex items-center gap-1.5">
                                                                {isImage ? (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setPreviewImageModalUrl(fileUrl)}
                                                                        className="group relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0 cursor-pointer shadow-2xs"
                                                                    >
                                                                        <img
                                                                            src={fileUrl}
                                                                            alt={fileName}
                                                                            className="w-full h-full object-cover group-hover:scale-105 transition"
                                                                        />
                                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                                                                            <Eye className="w-4 h-4 text-white" />
                                                                        </div>
                                                                    </button>
                                                                ) : (
                                                                    <a
                                                                        href={fileUrl}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#A60201] rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 transition shadow-2xs"
                                                                    >
                                                                        <Paperclip className="w-4 h-4 text-[#A60201]" />
                                                                        <span className="max-w-[160px] truncate">{fileName}</span>
                                                                        <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                                                                    </a>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={() => setIsApprovedNotesModalOpen(false)}
                            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Lightbox Modal */}
            {previewImageModalUrl && (
                <div
                    className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
                    onClick={() => setPreviewImageModalUrl(null)}
                >
                    <div className="relative max-w-4xl max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => setPreviewImageModalUrl(null)}
                            className="absolute top-2 right-2 p-2 bg-black/60 hover:bg-black/90 text-white rounded-full transition cursor-pointer"
                        >
                            ✕
                        </button>
                        <img
                            src={previewImageModalUrl}
                            alt="Preview"
                            className="w-full h-full max-h-[85vh] object-contain rounded-xl"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
