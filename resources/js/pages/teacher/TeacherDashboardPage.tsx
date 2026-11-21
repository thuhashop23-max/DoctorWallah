import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { 
    BookOpen, 
    Users, 
    MessageSquare, 
    Layers, 
    PlayCircle, 
    GraduationCap
} from 'lucide-react';

export const TeacherDashboardPage: React.FC = () => {
    const [courses, setCourses] = useState<any[]>([]);
    const [questions, setQuestions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTeacherData = async () => {
            try {
                const [coursesRes, questionsRes] = await Promise.all([
                    apiClient.get('/teacher/my-courses'),
                    apiClient.get('/teacher/student-questions'),
                ]);
                setCourses(Array.isArray(coursesRes.data) ? coursesRes.data : []);
                setQuestions(questionsRes.data?.data || []);
            } catch {}
            finally {
                setLoading(false);
            }
        };
        fetchTeacherData();
    }, []);

    if (loading) {
        return <div className="p-12 text-center text-slate-400">Loading teacher dashboard...</div>;
    }

    const isTeachingCourse = (c: any) => Boolean(c.is_assigned_teacher === true || (c.role_in_course === 'instructor' && c.can_manage_builder));
    const teachingCourses = courses.filter((c) => isTeachingCourse(c));
    const enrolledCourses = courses.filter((c) => !isTeachingCourse(c));

    const totalStudents = teachingCourses.reduce((acc, c) => acc + (c.enrollments_count || 0), 0);
    const totalLessons = teachingCourses.reduce((acc, c) => acc + (c.lessons_count || 0), 0);

    return (
        <div className="space-y-8 max-w-7xl pb-16">
            <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Teacher Portal Dashboard</h2>
                <p className="text-xs text-slate-500 mt-0.5">Overview of assigned courses, student stats, doubts, and personal learning</p>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                    <div>
                        <span className="text-xs font-bold text-slate-400 block mb-1">Assigned Courses</span>
                        <div className="text-2xl font-black text-slate-900">{teachingCourses.length}</div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
                        <BookOpen className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                    <div>
                        <span className="text-xs font-bold text-slate-400 block mb-1">Total Students</span>
                        <div className="text-2xl font-black text-slate-900">{totalStudents}</div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <Users className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                    <div>
                        <span className="text-xs font-bold text-slate-400 block mb-1">Total Lessons</span>
                        <div className="text-2xl font-black text-slate-900">{totalLessons}</div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                        <PlayCircle className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                    <div>
                        <span className="text-xs font-bold text-slate-400 block mb-1">Enrolled Courses</span>
                        <div className="text-2xl font-black text-emerald-600">{enrolledCourses.length}</div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <GraduationCap className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* My Teaching Courses Grid */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">My Assigned Courses</h3>
                        <p className="text-xs text-slate-500">Courses you manage as an instructor</p>
                    </div>
                    <Link to="/teacher/courses" className="text-xs font-bold text-sky-600 hover:text-sky-700">
                        View All ({teachingCourses.length})
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {teachingCourses.length === 0 ? (
                        <p className="col-span-3 text-xs text-slate-400 py-6 text-center">
                            No courses assigned to you as an instructor yet.
                        </p>
                    ) : (
                        teachingCourses.slice(0, 6).map((course) => (
                            <div key={course.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-4">
                                <div>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                        course.status === 'published' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                                    }`}>
                                        {course.status}
                                    </span>
                                    <h4 className="text-sm font-bold text-slate-900 mt-2 line-clamp-2">{course.title}</h4>
                                    <p className="text-xs text-slate-500 mt-1">
                                        {course.lessons_count || 0} Lessons • {course.enrollments_count || 0} Students
                                    </p>
                                </div>

                                <Link
                                    to={`/teacher/courses/${course.id}/builder`}
                                    className="w-full py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                                >
                                    <Layers className="w-3.5 h-3.5" />
                                    <span>Curriculum Builder</span>
                                </Link>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Enrolled Courses for Teacher (Learning as Student) */}
            {enrolledCourses.length > 0 && (
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <GraduationCap className="w-5 h-5 text-emerald-600" />
                                <span>Enrolled Courses (Learning as Student)</span>
                            </h3>
                            <p className="text-xs text-slate-500">Courses you enrolled in to learn from other teachers</p>
                        </div>
                        <Link to="/teacher/courses" className="text-xs font-bold text-emerald-600 hover:text-emerald-700">
                            View All ({enrolledCourses.length})
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {enrolledCourses.slice(0, 3).map((course) => (
                            <div key={course.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-4">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                                            Enrolled
                                        </span>
                                        <span className="text-[11px] font-bold text-emerald-600">
                                            {course.progress_percentage || 0}% Completed
                                        </span>
                                    </div>
                                    <h4 className="text-sm font-bold text-slate-900 line-clamp-2">{course.title}</h4>
                                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-emerald-500 rounded-full"
                                            style={{ width: `${course.progress_percentage || 0}%` }}
                                        />
                                    </div>
                                </div>

                                <Link
                                    to={
                                        course.last_lesson_id
                                            ? `/learning/${course.id}/lessons/${course.last_lesson_id}`
                                            : `/learning/${course.id}`
                                    }
                                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                                >
                                    <PlayCircle className="w-3.5 h-3.5" />
                                    <span>Start Class</span>
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent Questions */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-lg font-bold text-slate-900">Recent Student Questions & Doubts</h3>
                    <Link to="/teacher/questions" className="text-xs font-bold text-sky-600 hover:text-sky-700">
                        Answer Questions
                    </Link>
                </div>

                <div className="divide-y divide-slate-100">
                    {questions.length === 0 ? (
                        <p className="text-xs text-slate-400 py-6 text-center">No pending questions.</p>
                    ) : (
                        questions.slice(0, 5).map((q) => (
                            <div key={q.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-900 text-xs">{q.user?.name}</span>
                                        <span className="text-[10px] text-slate-400">• {q.lesson?.title}</span>
                                    </div>
                                    <p className="text-xs text-slate-600 mt-1 italic">"{q.content}"</p>
                                </div>
                                <Link
                                    to="/teacher/questions"
                                    className="px-3 py-1.5 bg-sky-50 text-sky-700 hover:bg-sky-100 font-bold text-xs rounded-lg shrink-0 self-start sm:self-center"
                                >
                                    Reply
                                </Link>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
