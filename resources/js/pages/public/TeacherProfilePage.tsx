import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiClient, formatBDT, getImageUrl } from '../../api/client';
import { Course } from '../../types';
import {
    GraduationCap,
    BookOpen,
    Users,
    Star,
    Award,
    CheckCircle2,
    ArrowRight,
    Loader2,
    ChevronRight,
    Sparkles,
    Video,
    Check,
    Share2,
    Globe,
    FileText,
    ShoppingCart,
    PlayCircle
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { PagePreloader } from '../../components/shared/PagePreloader';

interface TeacherData {
    id: number;
    name: string;
    designation: string;
    institution: string;
    photo_url?: string | null;
    bio?: string | null;
    expertise?: string | null;
    experience?: string | null;
    social_links?: any;
    courses_count: number;
    total_students: number;
}

export const TeacherProfilePage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { addToCart, isInCart } = useCart();
    const [teacher, setTeacher] = useState<TeacherData | null>(null);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchTeacherProfile();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [id]);

    const fetchTeacherProfile = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const res = await apiClient.get(`/teachers/${id}`);
            if (res.data?.teacher) {
                setTeacher(res.data.teacher);
                setCourses(res.data.courses || []);
            } else {
                setError('Instructor profile not found.');
            }
        } catch (err: any) {
            console.error('Failed to load teacher profile', err);
            setError('Failed to load instructor profile or instructor not found.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <PagePreloader
                title="Loading instructor profile..."
                subtitle="Retrieving mentor experience and courses"
            />
        );
    }

    if (error || !teacher) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center mx-auto">
                    <GraduationCap className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
                    {error || 'Instructor profile not found'}
                </h2>
                <p className="text-sm text-slate-500">Please check the URL or return to the homepage.</p>
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-sky-500 text-white font-bold text-xs hover:bg-sky-600 transition-colors shadow-md"
                >
                    Back to Home
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-24 transition-colors font-sans">
            {/* Breadcrumb Navigation */}
            <div className="border-b border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md sticky top-16 z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <Link to="/" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
                        Home
                    </Link>
                    <ChevronRight className="w-3.5 h-3.5" />
                    <Link to="/" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
                        Instructors
                    </Link>
                    <ChevronRight className="w-3.5 h-3.5" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{teacher.name}</span>
                </div>
            </div>

            {/* Profile Hero Header (Bondi Pathshala Inspired Layout) */}
            <section className="bg-gradient-to-b from-sky-50/70 via-white to-slate-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-950 pt-8 pb-12 border-b border-slate-200/60 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-slate-900 rounded-[28px] p-6 sm:p-10 border border-slate-200/90 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none flex flex-col md:flex-row items-center md:items-start gap-8 lg:gap-10">
                        {/* Arched Portrait Box */}
                        <div className="relative shrink-0 w-52 sm:w-60">
                            <div className="relative aspect-[3/3.8] rounded-3xl overflow-hidden bg-gradient-to-b from-sky-400 via-sky-600 to-slate-950 dark:from-sky-500 dark:via-sky-800 dark:to-slate-950 flex items-end justify-center shadow-lg">
                                {/* Soft radial glow */}
                                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent pointer-events-none" />

                                {/* Sparkle stars */}
                                <div className="absolute top-4 right-5 text-sky-200/60 pointer-events-none animate-pulse">
                                    <Sparkles className="w-4 h-4" />
                                </div>
                                <div className="absolute top-12 left-4 text-cyan-200/40 pointer-events-none">
                                    <Sparkles className="w-3 h-3" />
                                </div>

                                {/* Arched contour ring */}
                                <div className="absolute inset-1.5 rounded-t-full border border-sky-300/30 pointer-events-none" />

                                {/* Top Left Institution Badge */}
                                <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full bg-slate-950/60 backdrop-blur-md border border-white/20 text-xs font-black text-white flex items-center gap-1 shadow-xs">
                                    <span>{teacher.institution || 'BUET'}</span>
                                </div>

                                {/* Top Right Golden Crest */}
                                <div className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-amber-400/25 backdrop-blur-md border border-amber-300/50 flex items-center justify-center text-amber-300 shadow-xs">
                                    <Award className="w-4 h-4" />
                                </div>

                                {/* Photo / Avatar */}
                                <div className="w-full h-[90%] relative flex items-end justify-center overflow-hidden">
                                    {teacher.photo_url ? (
                                        <img
                                            src={teacher.photo_url}
                                            alt={teacher.name}
                                            className="w-full h-full object-cover object-top drop-shadow-md"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-white">
                                            <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-xs border border-white/20 flex items-center justify-center text-3xl font-black mb-1">
                                                {(teacher.name || 'T').charAt(0).toUpperCase()}
                                            </div>
                                            <span className="text-xs font-bold text-sky-200">Instructor & Mentor</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Verified check badge at bottom right */}
                            <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-2xl shadow-lg border-2 border-white dark:border-slate-800 flex items-center gap-1" title="Verified Instructor">
                                <CheckCircle2 className="w-4 h-4" />
                            </div>
                        </div>

                        {/* Details & Information */}
                        <div className="flex-1 text-center md:text-left space-y-4">
                            <div>
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 text-xs font-bold border border-sky-200/80 dark:border-sky-800/80 mb-2.5">
                                    <Sparkles className="w-3.5 h-3.5 text-sky-500" />
                                    <span>DoctorWallah Faculty Member</span>
                                </div>

                                <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                                    {teacher.name}
                                </h1>

                                <p className="text-base sm:text-lg font-bold text-sky-600 dark:text-sky-400 mt-1">
                                    {teacher.designation}
                                </p>
                            </div>

                            {/* Institution Badge */}
                            {teacher.institution && (
                                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-semibold border border-slate-200 dark:border-slate-700">
                                    <GraduationCap className="w-4 h-4 text-sky-500 shrink-0" />
                                    <span>Institution: <strong>{teacher.institution}</strong></span>
                                </div>
                            )}

                            {/* Bio */}
                            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
                                {teacher.bio || 'Experienced and dedicated instructor at DoctorWallah. Helping students master complex topics with clarity and confidence.'}
                            </p>

                            {/* Quick Stats Bar */}
                            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs font-semibold">
                                <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
                                    <BookOpen className="w-4 h-4 text-sky-500" />
                                    <span>Courses: <strong className="text-slate-900 dark:text-slate-100 font-bold">{teacher.courses_count || courses.length}</strong></span>
                                </div>

                                <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
                                    <Users className="w-4 h-4 text-emerald-500" />
                                    <span>Total Students: <strong className="text-slate-900 dark:text-slate-100 font-bold">{teacher.total_students ? teacher.total_students.toLocaleString('en-US') : '12,500'}+</strong></span>
                                </div>

                                <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
                                    <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                                    <span>Rating: <strong className="text-slate-900 dark:text-slate-100 font-bold">5.0 (Top Rated)</strong></span>
                                </div>

                                {teacher.experience && (
                                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
                                        <Award className="w-4 h-4 text-sky-500" />
                                        <span>Experience: <strong className="text-slate-900 dark:text-slate-100 font-bold">{teacher.experience}</strong></span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Courses Section ("Courses by Instructor") */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800 pb-4">
                    <div>
                        <h2 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
                            <BookOpen className="w-6 h-6 sm:w-7 sm:h-7 text-sky-500" />
                            <span>Courses by Instructor</span>
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                            All ongoing and specialized courses guided by {teacher.name}
                        </p>
                    </div>

                    <span className="text-xs font-bold px-3.5 py-1.5 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 self-start sm:self-auto border border-sky-200 dark:border-sky-800">
                        {courses.length} Active Courses
                    </span>
                </div>

                {courses.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200/80 dark:border-slate-800 space-y-3">
                        <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
                        <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No courses currently available</h3>
                        <p className="text-xs text-slate-400">New batches from this instructor will be announced soon.</p>
                        <Link
                            to="/courses"
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 hover:underline pt-2"
                        >
                            <span>View All Courses</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                        {courses.map((course) => (
                            <div
                                key={course.id}
                                className="group bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-2xl hover:border-sky-400 dark:hover:border-sky-500 transition-all flex flex-col justify-between overflow-hidden relative"
                            >
                                <div>
                                    {/* Thumbnail */}
                                    <Link to={`/courses/${course.slug}`} className="block relative aspect-video w-full bg-slate-950 overflow-hidden cursor-pointer group/thumb">
                                        {(course.thumbnail || (course as any).thumbnail_url) ? (
                                            <img
                                                src={getImageUrl(course.thumbnail || (course as any).thumbnail_url)}
                                                alt={course.title}
                                                className="w-full h-full object-cover group-hover:scale-105 group-hover/thumb:scale-105 transition-transform duration-500"
                                                onError={(e) => {
                                                    (e.currentTarget as HTMLElement).style.display = 'none';
                                                    const fallback = (e.currentTarget.parentElement?.querySelector('.fallback-thumb') as HTMLElement);
                                                    if (fallback) fallback.style.display = 'flex';
                                                }}
                                            />
                                        ) : null}
                                        <div className={`fallback-thumb w-full h-full ${(course.thumbnail || (course as any).thumbnail_url) ? 'hidden' : 'flex'} items-center justify-center bg-gradient-to-tr from-slate-800 to-sky-950 text-white`}>
                                            <BookOpen className="w-12 h-12 text-sky-400 opacity-60" />
                                        </div>

                                        {/* Discount Badge */}
                                        {course.discount_percent && course.discount_percent > 0 ? (
                                            <span className="absolute top-3 right-3 px-3 py-1 text-xs font-black bg-rose-600 text-white rounded-xl shadow-md">
                                                {course.discount_percent}% OFF
                                            </span>
                                        ) : course.price === 0 ? (
                                            <span className="absolute top-3 right-3 px-3 py-1 text-xs font-black bg-emerald-600 text-white rounded-xl shadow-md">
                                                Free Course
                                            </span>
                                        ) : null}
                                    </Link>

                                    {/* Details */}
                                    <div className="p-5 sm:p-6 space-y-3">
                                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                                            <span className="flex items-center gap-1">
                                                <Video className="w-3.5 h-3.5 text-sky-500" />
                                                <span>{course.lessons_count || 0} Lessons</span>
                                            </span>
                                            <span>•</span>
                                            <span className="flex items-center gap-1">
                                                <Users className="w-3.5 h-3.5 text-emerald-500" />
                                                <span>{(course.fake_enrollment_count || 0) + (course.enrollments_count || 0)} Students</span>
                                            </span>
                                        </div>

                                        <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 transition-colors line-clamp-2">
                                            <Link
                                                to={`/courses/${course.slug}`}
                                                className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors cursor-pointer"
                                            >
                                                {course.title}
                                            </Link>
                                        </h3>

                                        {/* Course feature checklist */}
                                        <div className="space-y-1.5 pt-1 text-xs text-slate-600 dark:text-slate-300">
                                            {((course.features && Array.isArray(course.features) && course.features.length > 0)
                                                ? course.features.filter((f: any) => typeof f === 'string' && f.trim().length > 0)
                                                : [
                                                    'Live & Full HD Recorded Class Archive',
                                                    'Chapter-wise Lecture Sheets & Question Bank',
                                                    'NexPilot AI 24/7 Instant Doubt Solver',
                                                ]
                                            ).slice(0, 4).map((feat: string, fIdx: number) => (
                                                <div key={fIdx} className="flex items-start gap-1.5">
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                                    <span className="line-clamp-1 leading-tight">{feat}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Footer & Action */}
                                <div className="p-5 sm:p-6 pt-0 space-y-3">
                                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                        <span className="text-xs text-slate-500 font-medium">Course Fee:</span>
                                        <div className="text-right">
                                            {(course as any).is_enrolled ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold text-xs rounded-full border border-emerald-200 dark:border-emerald-800">
                                                    <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                                    <span>Enrolled</span>
                                                </span>
                                            ) : course.price === 0 ? (
                                                <span className="text-lg font-black text-emerald-600">Free</span>
                                            ) : (
                                                <div className="flex items-baseline gap-1.5">
                                                    <span className="text-xl font-black text-sky-600 dark:text-sky-400">
                                                        {formatBDT(
                                                            course.sale_price !== null && course.sale_price !== undefined && Number(course.sale_price) < Number(course.price)
                                                                ? Number(course.sale_price)
                                                                : (course.effective_price ?? Number(course.price))
                                                        )}
                                                    </span>
                                                    {course.sale_price && course.sale_price < course.price && (
                                                        <span className="text-xs text-slate-400 line-through">
                                                            {formatBDT(course.price)}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="grid grid-cols-2 gap-2 pt-1">
                                        <Link
                                            to={`/courses/${course.slug}`}
                                            className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-xs text-slate-700 dark:text-slate-200 text-center transition-all cursor-pointer flex items-center justify-center"
                                        >
                                            View Details
                                        </Link>
                                        {(course as any).is_enrolled ? (
                                            <Link
                                                to={`/learning/${course.id}`}
                                                className="py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20"
                                            >
                                                <PlayCircle className="w-3.5 h-3.5" />
                                                <span>Start Class</span>
                                            </Link>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => addToCart(course)}
                                                className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                                                    isInCart(course.id)
                                                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                                                        : 'bg-[#25a2ee] hover:bg-[#1f8ed1] text-white shadow-sky-500/20'
                                                }`}
                                            >
                                                <ShoppingCart className="w-3.5 h-3.5" />
                                                <span>{isInCart(course.id) ? 'In Cart' : 'Add to Cart'}</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};