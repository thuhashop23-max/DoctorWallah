import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { 
    BookOpen, 
    Layers, 
    MessageSquare, 
    PlayCircle, 
    GraduationCap, 
    ExternalLink,
    CheckCircle2
} from 'lucide-react';

export const TeacherCoursesPage: React.FC = () => {
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'all' | 'teaching' | 'enrolled'>('all');

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            const { data } = await apiClient.get('/teacher/my-courses');
            setCourses(Array.isArray(data) ? data : []);
        } catch {
            setCourses([]);
        } finally {
            setLoading(false);
        }
    };

    const isTeachingCourse = (c: any) => Boolean(c.is_assigned_teacher === true || (c.role_in_course === 'instructor' && c.can_manage_builder));
    const teachingCourses = courses.filter((c) => isTeachingCourse(c));
    const enrolledCourses = courses.filter((c) => !isTeachingCourse(c));

    const displayedCourses = 
        activeTab === 'teaching'
            ? teachingCourses
            : activeTab === 'enrolled'
            ? enrolledCourses
            : courses;

    if (loading) {
        return <div className="p-12 text-center text-slate-400">Loading courses...</div>;
    }

    return (
        <div className="space-y-6 max-w-7xl pb-16">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">My Courses</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Manage courses you instruct and continue learning in courses you're enrolled in as a student
                    </p>
                </div>

                {/* Filter Tabs */}
                <div className="inline-flex p-1 bg-slate-100 rounded-2xl border border-slate-200/80 shrink-0">
                    <button
                        type="button"
                        onClick={() => setActiveTab('all')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            activeTab === 'all'
                                ? 'bg-white text-slate-900 shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <span>All</span>
                        <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-700">
                            {courses.length}
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('teaching')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                            activeTab === 'teaching'
                                ? 'bg-white text-sky-700 shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Teaching</span>
                        <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] bg-sky-100 text-sky-800">
                            {teachingCourses.length}
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('enrolled')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                            activeTab === 'enrolled'
                                ? 'bg-white text-emerald-700 shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <GraduationCap className="w-3.5 h-3.5" />
                        <span>Enrolled as Student</span>
                        <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800">
                            {enrolledCourses.length}
                        </span>
                    </button>
                </div>
            </div>

            {/* Courses Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedCourses.length === 0 ? (
                    <div className="col-span-1 md:col-span-2 lg:col-span-3 py-16 text-center text-slate-500 bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
                        <BookOpen className="w-10 h-10 mx-auto text-slate-300" />
                        <h4 className="text-base font-bold text-slate-800">
                            {activeTab === 'teaching'
                                ? 'No courses assigned to you as an instructor yet'
                                : activeTab === 'enrolled'
                                ? "You haven't enrolled in any courses as a student yet"
                                : 'No courses found'}
                        </h4>
                        <p className="text-xs text-slate-400 max-w-md mx-auto">
                            {activeTab === 'enrolled'
                                ? 'You can explore courses on NovoNex and enroll to learn new topics from other mentors.'
                                : 'Assigned courses will appear here once linked by the platform administrator.'}
                        </p>
                        {activeTab === 'enrolled' && (
                            <div className="pt-2">
                                <Link
                                    to="/courses"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                                >
                                    <span>Explore All Courses</span>
                                    <ExternalLink className="w-3.5 h-3.5" />
                                </Link>
                            </div>
                        )}
                    </div>
                ) : (
                    displayedCourses.map((course) => {
                        const isTeaching = isTeachingCourse(course);
                        const learningTarget = course.last_lesson_id
                            ? `/learning/${course.id}/lessons/${course.last_lesson_id}`
                            : `/learning/${course.id}`;

                        return (
                            <div
                                key={course.id}
                                className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow"
                            >
                                {/* Thumbnail */}
                                {isTeaching ? (
                                    <a
                                        href={`/courses/${course.slug}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="aspect-video bg-slate-900 relative block group/thumb cursor-pointer overflow-hidden"
                                        title="View public course details"
                                    >
                                        {course.thumbnail ? (
                                            <img
                                                src={course.thumbnail}
                                                alt={course.title}
                                                className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-white">
                                                <BookOpen className="w-8 h-8 text-sky-400 opacity-60" />
                                            </div>
                                        )}

                                        <div className="absolute top-3 left-3 flex items-center gap-1.5">
                                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-600/90 text-white backdrop-blur-xs flex items-center gap-1 shadow-xs">
                                                <Layers className="w-3 h-3" />
                                                <span>Instructor</span>
                                            </span>
                                        </div>

                                        <span
                                            className={`absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                                course.status === 'published'
                                                    ? 'bg-emerald-500 text-white'
                                                    : 'bg-slate-700 text-slate-200'
                                            }`}
                                        >
                                            {course.status}
                                        </span>
                                    </a>
                                ) : (
                                    <Link
                                        to={learningTarget}
                                        className="aspect-video bg-slate-900 relative block group/thumb cursor-pointer overflow-hidden"
                                        title="Start Class in Classroom"
                                    >
                                        {course.thumbnail ? (
                                            <img
                                                src={course.thumbnail}
                                                alt={course.title}
                                                className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-white">
                                                <BookOpen className="w-8 h-8 text-emerald-400 opacity-60" />
                                            </div>
                                        )}

                                        <div className="absolute top-3 left-3 flex items-center gap-1.5">
                                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-600/90 text-white backdrop-blur-xs flex items-center gap-1 shadow-xs">
                                                <GraduationCap className="w-3 h-3" />
                                                <span>Enrolled Student</span>
                                            </span>
                                        </div>

                                        <span
                                            className={`absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                                course.status === 'published'
                                                    ? 'bg-emerald-500 text-white'
                                                    : 'bg-slate-700 text-slate-200'
                                            }`}
                                        >
                                            {course.status}
                                        </span>
                                    </Link>
                                )}

                                {/* Content Details */}
                                <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                                    <div className="space-y-2">
                                        <h3 className="font-bold text-slate-900 text-base line-clamp-2">
                                            {isTeaching ? (
                                                <a
                                                    href={`/courses/${course.slug}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="hover:text-sky-600 transition-colors"
                                                    title="View public course details"
                                                >
                                                    {course.title}
                                                </a>
                                            ) : (
                                                <Link
                                                    to={learningTarget}
                                                    className="hover:text-emerald-600 transition-colors"
                                                    title="Start Class in Classroom"
                                                >
                                                    {course.title}
                                                </Link>
                                            )}
                                        </h3>

                                        {isTeaching ? (
                                            <p className="text-xs text-slate-500">
                                                Total {course.lessons_count || 0} Lessons • {course.enrollments_count || 0} Students
                                            </p>
                                        ) : (
                                            <div className="space-y-2">
                                                <p className="text-xs text-slate-500">
                                                    Instructor:{' '}
                                                    <span className="font-semibold text-slate-700">
                                                        {course.instructors?.map((i: any) => i.name).join(', ') || 'Lead Mentor'}
                                                    </span>
                                                </p>

                                                {/* Student Progress Bar */}
                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-[11px] font-bold">
                                                        <span className="text-slate-500">
                                                            Progress ({course.completed_lessons || 0}/{course.total_lessons || 0})
                                                        </span>
                                                        <span className="text-emerald-600">
                                                            {course.progress_percentage || 0}%
                                                        </span>
                                                    </div>
                                                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                                                            style={{ width: `${course.progress_percentage || 0}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    {isTeaching ? (
                                        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
                                            <Link
                                                to={`/teacher/courses/${course.id}/builder`}
                                                className="py-2.5 px-3 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                                            >
                                                <Layers className="w-3.5 h-3.5" />
                                                <span>Course Builder</span>
                                            </Link>
                                            <Link
                                                to="/teacher/questions"
                                                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                                            >
                                                <MessageSquare className="w-3.5 h-3.5" />
                                                <span>Questions</span>
                                            </Link>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
                                            <Link
                                                to={learningTarget}
                                                className="col-span-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                                            >
                                                <PlayCircle className="w-4 h-4" />
                                                <span>Start Class</span>
                                            </Link>
                                            <a
                                                href={`/courses/${course.slug}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="col-span-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                                            >
                                                <ExternalLink className="w-3.5 h-3.5" />
                                                <span>Course Info</span>
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
