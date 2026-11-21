import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Lesson, CourseSection, LessonAttachment, LessonComment } from '../../types';
import { 
    PlayCircle, 
    CheckCircle2, 
    Circle, 
    Download, 
    ChevronLeft, 
    ChevronRight, 
    Menu, 
    X, 
    BookOpen, 
    Paperclip, 
    MessageSquare, 
    Send, 
    Sparkles, 
    ArrowLeft,
    Check,
    ExternalLink,
    Loader2,
    AlertCircle,
    ShieldCheck,
    Eye,
    Star,
    Edit3
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { PlyrVideoPlayer } from '../../components/shared/PlyrVideoPlayer';

export const LessonPlayerPage: React.FC = () => {
    const { courseId, lessonId } = useParams<{ courseId: string; lessonId?: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { t, language } = useLanguage();

    const [lesson, setLesson] = useState<Lesson | null>(null);
    const [sections, setSections] = useState<CourseSection[]>([]);
    const [completedLessonIds, setCompletedLessonIds] = useState<number[]>([]);
    const [isCompleted, setIsCompleted] = useState(false);
    const [comments, setComments] = useState<LessonComment[]>([]);
    const [commentText, setCommentText] = useState('');
    const [replyText, setReplyText] = useState<Record<number, string>>({});
    const [activeReplyId, setActiveReplyId] = useState<number | null>(null);

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [togglingProgress, setTogglingProgress] = useState(false);
    const [submittingComment, setSubmittingComment] = useState(false);
    const [canManageBuilder, setCanManageBuilder] = useState(false);

    // Class Rating & Reviews State
    const [reviewStats, setReviewStats] = useState<{ total_reviews: number; average_rating: number; distribution?: Record<number, number> } | null>(null);
    const [myReview, setMyReview] = useState<{ id?: number; rating: number; review: string | null; updated_at?: string } | null>(null);
    const [studentReviews, setStudentReviews] = useState<any[]>([]);
    const [ratingValue, setRatingValue] = useState<number>(5);
    const [ratingHover, setRatingHover] = useState<number>(0);
    const [reviewText, setReviewText] = useState<string>('');
    const [isEditingReview, setIsEditingReview] = useState<boolean>(false);
    const [submittingReview, setSubmittingReview] = useState<boolean>(false);
    const [reviewSuccessMessage, setReviewSuccessMessage] = useState<string | null>(null);

    // VdoCipher DRM playback state
    const [vdoOtpData, setVdoOtpData] = useState<{ otp: string; playbackInfo: string; embedUrl?: string } | null>(null);
    const [vdoLoading, setVdoLoading] = useState(false);
    const [vdoError, setVdoError] = useState<string | null>(null);

    const isVdoCipher = Boolean(
        lesson?.video_provider === 'vdocipher' ||
        (lesson?.video_url && (
            lesson.video_url.includes('vdocipher') ||
            lesson.video_url.includes('[vdo') ||
            /^[a-f0-9]{32}$/i.test(lesson.video_url.trim())
        ))
    );

    useEffect(() => {
        if (!lesson || !isVdoCipher) {
            setVdoOtpData(null);
            setVdoError(null);
            return;
        }

        const rawUrl = lesson.video_url?.trim() || '';
        if (rawUrl.startsWith('<iframe') || rawUrl.includes('player.vdocipher.com/v2/?otp=')) {
            setVdoOtpData({ otp: '', playbackInfo: '', embedUrl: rawUrl });
            return;
        }

        let isMounted = true;
        setVdoLoading(true);
        setVdoError(null);

        apiClient.get(`/learning/lessons/${lesson.id}/vdocipher-otp`)
            .then(({ data }) => {
                if (isMounted) {
                    setVdoOtpData({
                        otp: data.otp,
                        playbackInfo: data.playbackInfo,
                        embedUrl: data.embedUrl,
                    });
                }
            })
            .catch((err: any) => {
                if (isMounted) {
                    console.error('Failed to get VdoCipher OTP:', err);
                    setVdoError(err.response?.data?.message || 'Failed to authenticate secure DRM video playback.');
                }
            })
            .finally(() => {
                if (isMounted) setVdoLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [lesson?.id, lesson?.video_url, isVdoCipher]);

    useEffect(() => {
        if (!lessonId) {
            setLoading(true);
            apiClient.get(`/learning/${courseId}/first-lesson`)
                .then(({ data }) => {
                    if (data?.lesson_id) {
                        navigate(`/learning/${courseId}/lessons/${data.lesson_id}`, { replace: true });
                    } else if (data?.course_slug) {
                        navigate(`/courses/${data.course_slug}`, { replace: true });
                    } else {
                        navigate('/courses');
                    }
                })
                .catch((err: any) => {
                    const slug = err.response?.data?.course_slug;
                    if (slug) {
                        navigate(`/courses/${slug}`, { replace: true });
                    } else {
                        navigate('/courses');
                    }
                })
                .finally(() => {
                    setLoading(false);
                });
            return;
        }

        fetchLessonData();
        fetchComments();
        fetchLessonReviews();
    }, [courseId, lessonId]);

    const fetchLessonData = async () => {
        setLoading(true);
        try {
            const { data } = await apiClient.get(`/learning/${courseId}/lessons/${lessonId}`);
            setLesson(data.lesson);
            setSections(data.sections || []);
            setCompletedLessonIds(data.completed_lesson_ids || []);
            setIsCompleted(data.is_completed || false);
            setCanManageBuilder(Boolean(data.can_manage_builder));
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to access lesson.');
            navigate(`/courses`);
        } finally {
            setLoading(false);
        }
    };

    const fetchComments = async () => {
        try {
            const { data } = await apiClient.get(`/learning/lessons/${lessonId}/comments`);
            setComments(data || []);
        } catch {}
    };

    const fetchLessonReviews = async () => {
        if (!lessonId) return;
        try {
            const { data } = await apiClient.get(`/learning/lessons/${lessonId}/reviews`);
            setReviewStats(data.stats || null);
            setMyReview(data.my_review || null);
            setStudentReviews(data.reviews || []);
            if (data.my_review) {
                setRatingValue(data.my_review.rating || 5);
                setReviewText(data.my_review.review || '');
            } else {
                setRatingValue(5);
                setReviewText('');
                setIsEditingReview(false);
            }
        } catch (err) {
            console.error('Failed to load lesson reviews', err);
        }
    };

    const handleSubmitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!lesson) return;
        setSubmittingReview(true);
        setReviewSuccessMessage(null);
        try {
            const { data } = await apiClient.post(`/learning/lessons/${lesson.id}/reviews`, {
                rating: ratingValue,
                review: reviewText.trim() || null,
            });
            setMyReview(data.review);
            if (data.stats) {
                setReviewStats(prev => ({
                    total_reviews: data.stats.total_reviews,
                    average_rating: data.stats.average_rating,
                    distribution: prev?.distribution,
                }));
            }
            setIsEditingReview(false);
            setReviewSuccessMessage(data.message || 'Review submitted successfully!');
            fetchLessonReviews();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to submit class review.');
        } finally {
            setSubmittingReview(false);
        }
    };

    const handleToggleComplete = async () => {
        if (!lesson) return;
        setTogglingProgress(true);
        try {
            const { data } = await apiClient.post(`/learning/lessons/${lesson.id}/progress`);
            setIsCompleted(data.is_completed);
            if (data.is_completed) {
                setCompletedLessonIds(prev => [...prev, lesson.id]);
            } else {
                setCompletedLessonIds(prev => prev.filter(id => id !== lesson.id));
            }
        } catch {}
        finally {
            setTogglingProgress(false);
        }
    };

    const handlePostComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentText.trim() || !lesson) return;

        setSubmittingComment(true);
        try {
            const { data } = await apiClient.post(`/learning/lessons/${lesson.id}/comments`, {
                content: commentText,
            });
            setComments(prev => [data.comment, ...prev]);
            setCommentText('');
            alert('Your question has been posted. A notification was sent to the course instructor.');
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to submit comment.');
        } finally {
            setSubmittingComment(false);
        }
    };

    const handlePostReply = async (commentId: number) => {
        const text = replyText[commentId];
        if (!text || !text.trim()) return;

        try {
            const { data } = await apiClient.post(`/learning/comments/${commentId}/reply`, {
                content: text,
            });
            setComments(prev => prev.map(c => {
                if (c.id === commentId) {
                    return {
                        ...c,
                        replies: [...(c.replies || []), data.reply],
                    };
                }
                return c;
            }));
            setReplyText(prev => ({ ...prev, [commentId]: '' }));
            setActiveReplyId(null);
        } catch {}
    };

    // Calculate Previous & Next lesson navigation
    const allLessons = sections.flatMap(s => s.lessons || []);
    const currentIndex = allLessons.findIndex(l => String(l.id) === String(lessonId));
    const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
    const nextLesson = currentIndex >= 0 && currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

    if (loading || !lesson) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
                <div className="flex items-center gap-3">
                    <PlayCircle className="w-8 h-8 text-sky-400 animate-spin" />
                    <span className="text-sm font-bold">Loading lesson...</span>
                </div>
            </div>
        );
    }

    // Video Embed helper
    const getEmbedUrl = (url?: string | null) => {
        if (!url) return null;
        if (url.includes('youtube.com/watch?v=')) {
            const videoId = url.split('v=')[1]?.split('&')[0];
            return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
        }
        if (url.includes('youtu.be/')) {
            const videoId = url.split('youtu.be/')[1]?.split('?')[0];
            return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
        }
        if (url.includes('vimeo.com/')) {
            const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
            return `https://player.vimeo.com/video/${videoId}?autoplay=1`;
        }
        return url;
    };

    const embedUrl = getEmbedUrl(lesson.video_url);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
            {/* Top Learning Header */}
            <header className="h-16 bg-slate-900 border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between shrink-0 z-20">
                <div className="flex items-center gap-3 truncate mr-4">
                    <Link
                        to={
                            canManageBuilder
                                ? (user?.role === 'admin'
                                    ? `/admin/courses/${courseId}/builder`
                                    : `/teacher/courses/${courseId}/builder`)
                                : (user?.role === 'teacher'
                                    ? '/teacher/courses'
                                    : '/student/my-courses')
                        }
                        className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors shrink-0"
                        title={canManageBuilder ? "Back to Course Builder" : "Back to Course List"}
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div className="truncate">
                        <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block">
                            {lesson.section?.title || 'Classroom'}
                        </span>
                        <h2 className="text-sm sm:text-base font-bold text-white truncate">
                            {lesson.title}
                        </h2>
                    </div>
                </div>

                {/* Admin / Teacher Preview Indicator */}
                {canManageBuilder && (
                    <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-xl shrink-0 mx-2">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        <span className="text-xs font-bold text-amber-300">
                            {user?.role === 'teacher' ? 'Student Preview Mode (Teacher)' : 'Student Preview Mode (Admin)'}
                        </span>
                        <Link
                            to={user?.role === 'teacher' ? `/teacher/courses/${courseId}/builder` : `/admin/courses/${courseId}/builder`}
                            className="ml-2 px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] uppercase rounded-lg transition-colors inline-flex items-center gap-1 shadow-xs"
                        >
                            <span>Back to Builder</span>
                        </Link>
                    </div>
                )}

                <div className="flex items-center gap-3 shrink-0">
                    {/* Mark as Complete Button */}
                    <button
                        onClick={handleToggleComplete}
                        disabled={togglingProgress}
                        className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                            isCompleted
                                ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                    >
                        {isCompleted ? <Check className="w-4 h-4 text-emerald-400" /> : <Circle className="w-4 h-4" />}
                        <span className="hidden sm:inline">
                            {isCompleted ? 'Completed' : 'Mark as Complete'}
                        </span>
                    </button>

                    {/* Sidebar Toggle for Mobile & Desktop */}
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                        title="Syllabus & Lesson List"
                    >
                        <BookOpen className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {/* Main Player Area + Sidebar */}
            <div className="flex-1 flex overflow-hidden relative">
                {/* Center Content Scroll Area */}
                <div className="flex-1 overflow-y-auto">
                    {/* Video Player Box */}
                    <div className="w-full bg-black aspect-video max-h-[65vh] flex items-center justify-center relative">
                        {isVdoCipher ? (
                            <div className="w-full h-full relative bg-black flex items-center justify-center">
                                {vdoLoading ? (
                                    <div className="flex flex-col items-center gap-3 text-slate-400 p-8">
                                        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                                        <p className="text-xs font-semibold">Loading DRM Protected Video Player...</p>
                                    </div>
                                ) : vdoError ? (
                                    <div className="p-6 text-center max-w-md space-y-2 text-rose-400">
                                        <AlertCircle className="w-10 h-10 mx-auto text-rose-500" />
                                        <p className="text-sm font-bold">Playback Authorization Notice</p>
                                        <p className="text-xs text-slate-400">{vdoError}</p>
                                    </div>
                                ) : vdoOtpData ? (
                                    vdoOtpData.embedUrl && vdoOtpData.embedUrl.startsWith('<iframe') ? (
                                        <div 
                                            className="w-full h-full [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:border-0"
                                            dangerouslySetInnerHTML={{ __html: vdoOtpData.embedUrl }}
                                        />
                                    ) : (
                                        <iframe
                                            src={vdoOtpData.embedUrl || `https://player.vdocipher.com/v2/?otp=${vdoOtpData.otp}&playbackInfo=${vdoOtpData.playbackInfo}`}
                                            style={{ border: 0, width: '100%', height: '100%' }}
                                            allow="encrypted-media; fullscreen"
                                            allowFullScreen
                                            title={lesson.title}
                                            className="w-full h-full"
                                        />
                                    )
                                ) : (
                                    <div className="text-center p-8 text-slate-500 space-y-2">
                                        <PlayCircle className="w-12 h-12 mx-auto text-slate-600" />
                                        <p className="text-xs">No video is ready for this lesson.</p>
                                    </div>
                                )}
                            </div>
                        ) : lesson.video_url ? (
                            <PlyrVideoPlayer
                                url={lesson.video_url}
                                title={lesson.title}
                                onEnded={handleToggleComplete}
                                className="w-full h-full"
                            />
                        ) : (
                            <div className="text-center p-8 text-slate-500 space-y-2">
                                <PlayCircle className="w-12 h-12 mx-auto text-slate-600" />
                                <p className="text-xs">
                                    No video is attached to this lesson. Please read the notes below.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Navigation Bar (Prev / Next) */}
                    <div className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between">
                        <div>
                            {prevLesson ? (
                                <button
                                    onClick={() => navigate(`/learning/${courseId}/lessons/${prevLesson.id}`)}
                                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    <span className="hidden sm:inline">Previous Lesson:</span>
                                    <span className="max-w-[120px] truncate">{prevLesson.title}</span>
                                </button>
                            ) : <div />}
                        </div>

                        <div>
                            {nextLesson ? (
                                <button
                                    onClick={() => navigate(`/learning/${courseId}/lessons/${nextLesson.id}`)}
                                    className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-md"
                                >
                                    <span className="hidden sm:inline">Next Lesson:</span>
                                    <span className="max-w-[120px] truncate">{nextLesson.title}</span>
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            ) : (
                                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                                    <Sparkles className="w-4 h-4" />
                                    Last lesson of the course!
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Lesson Notes & Discussion Container */}
                    <div className="max-w-4xl mx-auto p-6 sm:p-10 space-y-12">
                        {/* Title & Notes */}
                        <div className="space-y-4">
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                                {lesson.title}
                            </h1>
                            {lesson.content && (
                                <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                                    {lesson.content}
                                </div>
                            )}
                        </div>

                        {/* Downloadable Materials Section */}
                        {lesson.attachments && lesson.attachments.length > 0 && (
                            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    <Paperclip className="w-4 h-4 text-sky-400" />
                                    <span>Study Materials & Resources ({lesson.attachments.length})</span>
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {lesson.attachments.map((att) => {
                                        const isLink = att.file_path?.startsWith('http') || att.file_type === 'link' || att.file_type === 'google_drive';
                                        const isDrive = att.file_type === 'google_drive' || att.file_path?.includes('drive.google.com') || att.file_path?.includes('docs.google.com');
                                        const token = localStorage.getItem('auth_token') || '';
                                        const targetUrl = isLink
                                            ? att.file_path
                                            : `/api/learning/attachments/${att.id}/download${token ? `?token=${encodeURIComponent(token)}` : ''}`;

                                        return (
                                            <a
                                                key={att.id}
                                                href={targetUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 flex items-center justify-between transition-colors group cursor-pointer"
                                            >
                                                <div className="truncate mr-3">
                                                    <div className="flex items-center gap-1.5">
                                                        <h4 className="text-xs font-bold text-white truncate group-hover:text-sky-400">
                                                            {att.file_name}
                                                        </h4>
                                                    </div>
                                                    <span className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                                                        {isDrive ? (
                                                            <span className="text-amber-400 font-semibold">Google Drive Link</span>
                                                        ) : isLink ? (
                                                            <span className="text-sky-400 font-semibold">Web Link</span>
                                                        ) : (
                                                            <span>{att.file_type.toUpperCase()} • {att.formatted_size || `${Math.round(att.file_size / 1024)} KB`}</span>
                                                        )}
                                                    </span>
                                                </div>
                                                {isLink ? (
                                                    <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-amber-400 shrink-0" />
                                                ) : (
                                                    <Download className="w-4 h-4 text-slate-400 group-hover:text-sky-400 shrink-0" />
                                                )}
                                            </a>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Class Rating & Review Section */}
                        <div className="bg-slate-900 p-6 sm:p-7 rounded-3xl border border-slate-800 space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                                            <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                                <span>Class Rating & Feedback</span>
                                                {reviewStats && reviewStats.total_reviews > 0 && (
                                                    <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                                                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                                        {reviewStats.average_rating} ({reviewStats.total_reviews})
                                                    </span>
                                                )}
                                            </h3>
                                            <p className="text-xs text-slate-400">
                                                Rate this lesson and share your valuable feedback to help your instructor improve.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {myReview && !isEditingReview && (
                                    <button
                                        type="button"
                                        onClick={() => setIsEditingReview(true)}
                                        className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors self-start sm:self-auto cursor-pointer"
                                    >
                                        <Edit3 className="w-3.5 h-3.5 text-sky-400" />
                                        <span>Edit My Review</span>
                                    </button>
                                )}
                            </div>

                            {/* Success Notification */}
                            {reviewSuccessMessage && (
                                <div className="p-3 bg-emerald-500/15 border border-emerald-500/40 rounded-xl text-xs font-semibold text-emerald-300 flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                    <span>{reviewSuccessMessage}</span>
                                </div>
                            )}

                            {/* If Student Already Reviewed and Not in Editing Mode */}
                            {myReview && !isEditingReview ? (
                                <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-3 text-center">
                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pb-2 border-b border-slate-700/50">
                                        <span className="text-xs font-bold text-slate-400">
                                            Your Submitted Class Rating
                                        </span>
                                        {myReview.updated_at && (
                                            <span className="text-[10px] text-slate-500">
                                                Submitted on {new Date(myReview.updated_at).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>

                                    {/* Centered Stars Display */}
                                    <div className="flex flex-col items-center justify-center gap-1.5 py-1">
                                        <div className="flex items-center justify-center gap-1">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Star
                                                    key={star}
                                                    className={`w-6 h-6 ${
                                                        star <= myReview.rating
                                                            ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                                                            : 'text-slate-600'
                                                    }`}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-sm font-black text-amber-400">
                                            {myReview.rating === 5 ? '5/5 • Excellent!' : myReview.rating === 4 ? '4/5 • Very Good' : myReview.rating === 3 ? '3/5 • Good' : myReview.rating === 2 ? '2/5 • Fair' : '1/5 • Poor'}
                                        </span>
                                    </div>

                                    {myReview.review && (
                                        <p className="text-xs text-slate-300 italic bg-slate-900/40 p-3 rounded-xl border border-slate-800 text-center max-w-lg mx-auto">
                                            "{myReview.review}"
                                        </p>
                                    )}
                                </div>
                            ) : (
                                /* Rating Form */
                                <form onSubmit={handleSubmitReview} className="space-y-4">
                                    {/* Centered Stars Selection */}
                                    <div className="flex flex-col items-center justify-center text-center space-y-2 py-2">
                                        <label className="text-xs sm:text-sm font-bold text-slate-300 block text-center">
                                            {myReview ? 'Update Your Rating for this Class:' : 'How would you rate this class?'}
                                        </label>
                                        <div className="flex items-center justify-center gap-2 p-2.5 bg-slate-800/80 rounded-2xl border border-slate-700/80 shadow-inner">
                                            {[1, 2, 3, 4, 5].map((star) => {
                                                const isFilled = star <= (ratingHover || ratingValue);
                                                return (
                                                    <button
                                                        key={star}
                                                        type="button"
                                                        onClick={() => setRatingValue(star)}
                                                        onMouseEnter={() => setRatingHover(star)}
                                                        onMouseLeave={() => setRatingHover(0)}
                                                        className="p-1 sm:p-1.5 rounded-xl hover:scale-125 transition-transform cursor-pointer focus:outline-none"
                                                        title={`${star} Star`}
                                                    >
                                                        <Star
                                                            className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                                                                isFilled
                                                                    ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]'
                                                                    : 'text-slate-600 hover:text-slate-400'
                                                            }`}
                                                        />
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <span className="text-xs sm:text-sm font-black text-amber-400 block tracking-wide">
                                            {(ratingHover || ratingValue) === 5 ? '5/5 • Excellent!'
                                                : (ratingHover || ratingValue) === 4 ? '4/5 • Very Good'
                                                : (ratingHover || ratingValue) === 3 ? '3/5 • Good'
                                                : (ratingHover || ratingValue) === 2 ? '2/5 • Fair'
                                                : '1/5 • Poor'}
                                        </span>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-300 block">
                                            Write your feedback (Optional):
                                        </label>
                                        <textarea
                                            rows={2}
                                            value={reviewText}
                                            onChange={(e) => setReviewText(e.target.value)}
                                            placeholder="What did you like about this class? Any suggestions or difficulties you faced?"
                                            className="w-full p-3.5 bg-slate-800/60 border border-slate-700/80 rounded-2xl text-xs sm:text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                                        />
                                    </div>

                                    <div className="flex items-center gap-2 justify-end">
                                        {myReview && isEditingReview && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsEditingReview(false);
                                                    setRatingValue(myReview.rating);
                                                    setReviewText(myReview.review || '');
                                                }}
                                                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                        <button
                                            type="submit"
                                            disabled={submittingReview}
                                            className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs rounded-xl shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                                        >
                                            {submittingReview ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            ) : (
                                                <Star className="w-3.5 h-3.5 fill-white" />
                                            )}
                                            <span>{myReview ? 'Update Review' : 'Submit Review'}</span>
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Recent Student Feedback for this class */}
                            {studentReviews.length > 0 && (
                                <div className="space-y-3 pt-4 border-t border-slate-800/80">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                        Class Reviews from Students ({studentReviews.length})
                                    </h4>
                                    <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                                        {studentReviews.map((rev) => (
                                            <div
                                                key={rev.id}
                                                className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40 text-xs space-y-1.5"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-lg bg-sky-600/30 text-sky-300 font-bold flex items-center justify-center text-[10px]">
                                                            {rev.user?.name ? rev.user.name.charAt(0) : 'S'}
                                                        </div>
                                                        <span className="font-semibold text-white">
                                                            {rev.user?.name || 'Student'}
                                                        </span>
                                                        <div className="flex items-center gap-0.5 ml-1">
                                                            {[1, 2, 3, 4, 5].map((s) => (
                                                                <Star
                                                                    key={s}
                                                                    className={`w-3 h-3 ${
                                                                        s <= rev.rating
                                                                            ? 'fill-amber-400 text-amber-400'
                                                                            : 'text-slate-600'
                                                                    }`}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <span className="text-[10px] text-slate-500">
                                                        {new Date(rev.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                {rev.review && (
                                                    <p className="text-slate-300 pl-8 text-xs leading-relaxed">
                                                        {rev.review}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Threaded Discussion Section */}
                        <div className="space-y-6 pt-6 border-t border-slate-800">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <MessageSquare className="w-5 h-5 text-sky-400" />
                                    <span>Q&A & Discussion Forum ({comments.length})</span>
                                </h3>
                            </div>

                            {/* Comment Form */}
                            <form onSubmit={handlePostComment} className="space-y-3">
                                <textarea
                                    rows={3}
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    placeholder="Type your question or doubt about this lesson..."
                                    className="w-full p-4 bg-slate-900 border border-slate-800 rounded-2xl text-xs sm:text-sm text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                                />
                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={submittingComment || !commentText.trim()}
                                        className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all disabled:opacity-50"
                                    >
                                        <Send className="w-3.5 h-3.5" />
                                        <span>{submittingComment ? 'Posting...' : 'Post Question'}</span>
                                    </button>
                                </div>
                            </form>

                            {/* Comments Thread */}
                            <div className="space-y-4">
                                {comments.length === 0 ? (
                                    <p className="text-xs text-slate-500 text-center py-6">
                                        No questions asked yet. Be the first to ask a question!
                                    </p>
                                ) : (
                                    comments.map((comment) => (
                                        <div
                                            key={comment.id}
                                            className="p-5 rounded-2xl bg-slate-900 border border-slate-800/80 space-y-3"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-8 h-8 rounded-xl bg-sky-600 text-white font-bold flex items-center justify-center text-xs">
                                                        {comment.user.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xs font-bold text-white">{comment.user.name}</h4>
                                                        <span className="text-[10px] text-slate-500 capitalize">
                                                            {comment.user.role === 'student' ? 'Student' : 'Instructor'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <span className="text-[10px] text-slate-500">
                                                    {new Date(comment.created_at).toLocaleDateString('en-US')}
                                                </span>
                                            </div>

                                            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pl-10">
                                                {comment.content}
                                            </p>

                                            {/* Nested Replies */}
                                            {comment.replies && comment.replies.length > 0 && (
                                                <div className="pl-10 space-y-2 pt-2 border-t border-slate-800/50">
                                                    {comment.replies.map((reply) => (
                                                        <div
                                                            key={reply.id}
                                                            className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-xs space-y-1"
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-bold text-sky-400">{reply.user.name}</span>
                                                                    <span className="text-[9px] bg-sky-950 text-sky-300 border border-sky-800 px-1.5 py-0.2 rounded font-semibold">
                                                                        {reply.user.role === 'teacher' ? 'Instructor' : 'Reply'}
                                                                    </span>
                                                                </div>
                                                                <span className="text-[9px] text-slate-500">
                                                                    {new Date(reply.created_at).toLocaleDateString('en-US')}
                                                                </span>
                                                            </div>
                                                            <p className="text-slate-300 pl-1">{reply.content}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Reply Action */}
                                            <div className="pl-10 pt-1">
                                                {activeReplyId === comment.id ? (
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            value={replyText[comment.id] || ''}
                                                            onChange={(e) => setReplyText(prev => ({ ...prev, [commentId(comment.id)]: e.target.value }))}
                                                            placeholder="Type your reply..."
                                                            className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                                                        />
                                                        <button
                                                            onClick={() => handlePostReply(comment.id)}
                                                            className="px-4 py-1.5 bg-sky-600 text-white font-bold text-xs rounded-xl"
                                                        >
                                                            Send
                                                        </button>
                                                        <button
                                                            onClick={() => setActiveReplyId(null)}
                                                            className="px-3 py-1.5 text-slate-400 text-xs"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setActiveReplyId(comment.id)}
                                                        className="text-[11px] font-bold text-sky-400 hover:text-sky-300"
                                                    >
                                                        Reply
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Backdrop Overlay: Closes drawer when clicked outside */}
                {sidebarOpen && (
                    <div 
                        onClick={() => setSidebarOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
                        aria-hidden="true"
                    />
                )}

                {/* Right / Collapsible Curriculum Sidebar - Slides in OVER video on mobile */}
                <aside className={`
                    fixed inset-y-0 right-0 z-50 w-80 sm:w-96 max-w-[85vw] bg-slate-900 border-l border-slate-800 flex flex-col shadow-2xl
                    transition-transform duration-300 ease-in-out
                    lg:static lg:z-auto lg:w-80 xl:w-96 lg:shadow-none lg:flex shrink-0
                    ${sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
                `}>
                    <div className="h-16 px-5 border-b border-slate-800 flex items-center justify-between shrink-0">
                        <h3 className="font-bold text-sm text-white flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-sky-400" />
                            <span>Curriculum</span>
                        </h3>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-400">
                                {completedLessonIds.length} / {allLessons.length} Done
                            </span>
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors lg:hidden"
                                title="Close"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto divide-y divide-slate-800/80">
                        {sections.map((section, sIndex) => (
                            <div key={section.id} className="p-3">
                                <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    Section {sIndex + 1}: {section.title}
                                </div>
                                <div className="space-y-1">
                                    {section.lessons?.map((l) => {
                                        const isCurrent = String(l.id) === String(lessonId);
                                        const isDone = completedLessonIds.includes(l.id);
                                        return (
                                            <Link
                                                key={l.id}
                                                to={`/learning/${courseId}/lessons/${l.id}`}
                                                onClick={() => setSidebarOpen(false)}
                                                className={`w-full px-3 py-2.5 rounded-xl flex items-center justify-between text-xs transition-colors ${
                                                    isCurrent
                                                        ? 'bg-sky-600 text-white font-bold shadow-xs'
                                                        : 'text-slate-300 hover:bg-slate-800/70'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2.5 truncate mr-2">
                                                    {isDone ? (
                                                        <CheckCircle2 className={`w-4 h-4 shrink-0 ${isCurrent ? 'text-white' : 'text-emerald-400'}`} />
                                                    ) : (
                                                        <Circle className="w-4 h-4 text-slate-600 shrink-0" />
                                                    )}
                                                    <span className="truncate">{l.title}</span>
                                                </div>
                                                <span className={`text-[10px] shrink-0 ${isCurrent ? 'text-sky-100' : 'text-slate-500'}`}>
                                                    {l.duration_minutes}m
                                                </span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </aside>
            </div>
        </div>
    );
};

function commentId(id: number): number {
    return id;
}
