import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Course, CourseSection, Lesson, LessonAttachment } from '../../types';
import {
    ArrowLeft,
    Plus,
    Layers,
    PlayCircle,
    FileText,
    Trash2,
    Edit,
    Copy,
    ChevronUp,
    ChevronDown,
    Upload,
    Paperclip,
    Download,
    Sparkles,
    Gem,
    Lock,
    Eye,
    Save,
    Check,
    ShieldCheck,
    Globe,
    Video,
    ClipboardList,
    Clock,
    Award,
    Users,
    Unlink,
    Search,
    Loader2,
    AlertCircle,
    ExternalLink,
    BookOpen,
    CheckCircle2,
    Radio,
    MessageSquare,
    Calendar,
    Package,
    Truck,
    FileUp,
    Zap,
    Key,
    KeyRound
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal';

export interface CourseActionButton {
    id: string;
    label: string;
    type: 'file' | 'link';
    url: string;
    file_name?: string;
}

export interface EnrolledActionButton {
    id: string;
    label: string;
    url: string;
    requires_access_key: boolean;
}

export const AdminCourseBuilderPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const isTeacher = user?.role === 'teacher';
    const examBasePath = isTeacher ? '/teacher/exams' : '/admin/exams';

    const [course, setCourse] = useState<any>(null);
    const [sections, setSections] = useState<CourseSection[]>([]);
    const [loading, setLoading] = useState(true);
    const [accessError, setAccessError] = useState<string | null>(null);
    const [previewMenuOpen, setPreviewMenuOpen] = useState(false);

    // Tab state ('lessons' | 'live_classes' | 'practice_exams' | 'live_exams' | 'routine' | 'outline_buttons' | 'reward_setup')
    const [activeTab, setActiveTab] = useState<'lessons' | 'live_classes' | 'practice_exams' | 'live_exams' | 'routine' | 'outline_buttons' | 'reward_setup'>('lessons');

    // Reward Setup state
    const [rewardTopics, setRewardTopics] = useState<any[]>([]);
    const [loadingRewardTopics, setLoadingRewardTopics] = useState(false);
    const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
    const [editingTopic, setEditingTopic] = useState<any | null>(null);
    const [topicTitle, setTopicTitle] = useState('');
    const [topicDescription, setTopicDescription] = useState('');
    const [topicPointsReward, setTopicPointsReward] = useState('50');
    const [topicIsActive, setTopicIsActive] = useState(true);
    const [savingTopic, setSavingTopic] = useState(false);

    // Submissions Review Modal state
    const [isSubmissionsModalOpen, setIsSubmissionsModalOpen] = useState(false);
    const [selectedTopicForSubmissions, setSelectedTopicForSubmissions] = useState<any | null>(null);
    const [submissionsList, setSubmissionsList] = useState<any[]>([]);
    const [loadingSubmissions, setLoadingSubmissions] = useState(false);
    const [submissionStatusFilter, setSubmissionStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
    const [reviewingSubmissionId, setReviewingSubmissionId] = useState<number | null>(null);
    const [previewFileModalUrl, setPreviewFileModalUrl] = useState<string | null>(null);
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [selectedSubmissionToReject, setSelectedSubmissionToReject] = useState<any | null>(null);
    const [rejectFeedbackText, setRejectFeedbackText] = useState('');

    // Outline & Enrolled Action Buttons state
    const [actionButtons, setActionButtons] = useState<CourseActionButton[]>([]);
    const [enrolledButtons, setEnrolledButtons] = useState<EnrolledActionButton[]>([]);
    const [savingCustomButtons, setSavingCustomButtons] = useState(false);
    const [customButtonsSuccess, setCustomButtonsSuccess] = useState<string | null>(null);
    const [uploadingButtonFileId, setUploadingButtonFileId] = useState<string | null>(null);

    // Routine state
    const [routineItems, setRoutineItems] = useState<any[]>([]);
    const [loadingRoutine, setLoadingRoutine] = useState(false);
    const [routineModalOpen, setRoutineModalOpen] = useState(false);
    const [editingRoutineItem, setEditingRoutineItem] = useState<any | null>(null);
    const [routineItemType, setRoutineItemType] = useState<'class_upload' | 'material' | 'book_parcel' | 'general'>('class_upload');
    const [routineItemTitle, setRoutineItemTitle] = useState('');
    const [routineItemSubject, setRoutineItemSubject] = useState('');
    const [routineItemStartTime, setRoutineItemStartTime] = useState('');
    const [routineItemEndTime, setRoutineItemEndTime] = useState('');
    const [routineItemDesc, setRoutineItemDesc] = useState('');
    const [routineItemLinkUrl, setRoutineItemLinkUrl] = useState('');
    const [routineItemActionText, setRoutineItemActionText] = useState('');
    const [routineItemStatus, setRoutineItemStatus] = useState('upcoming');
    const [routineItemCourier, setRoutineItemCourier] = useState('');
    const [routineItemTracking, setRoutineItemTracking] = useState('');
    const [savingRoutineItem, setSavingRoutineItem] = useState(false);

    // Live Classes state
    const [liveClasses, setLiveClasses] = useState<any[]>([]);
    const [loadingLiveClasses, setLoadingLiveClasses] = useState(false);
    const [liveClassModalOpen, setLiveClassModalOpen] = useState(false);
    const [editingLiveClass, setEditingLiveClass] = useState<any | null>(null);
    const [liveClassTitle, setLiveClassTitle] = useState('');
    const [liveClassDesc, setLiveClassDesc] = useState('');
    const [liveClassUrl, setLiveClassUrl] = useState('');
    const [liveClassStartTime, setLiveClassStartTime] = useState('');
    const [liveClassEndTime, setLiveClassEndTime] = useState('');
    const [liveClassStatus, setLiveClassStatus] = useState<'upcoming' | 'live' | 'completed' | 'cancelled'>('upcoming');
    const [savingLiveClass, setSavingLiveClass] = useState(false);

    // Course Attached Exams state
    const [attachedExams, setAttachedExams] = useState<any[]>([]);
    const [availableExams, setAvailableExams] = useState<any[]>([]);
    const [loadingExams, setLoadingExams] = useState(false);

    // Create / Edit Exam Modal state
    const [examModalOpen, setExamModalOpen] = useState(false);
    const [examModalType, setExamModalType] = useState<'practice' | 'live'>('practice');
    const [editingExam, setEditingExam] = useState<any | null>(null);
    const [examTitle, setExamTitle] = useState('');
    const [examDesc, setExamDesc] = useState('');
    const [examDuration, setExamDuration] = useState('30');
    const [examPassMarks, setExamPassMarks] = useState('0');
    const [examHasNegativeMarking, setExamHasNegativeMarking] = useState(false);
    const [examNegativeMarks, setExamNegativeMarks] = useState('0.25');
    const [examStartTime, setExamStartTime] = useState('');
    const [examEndTime, setExamEndTime] = useState('');
    const [examStatus, setExamStatus] = useState<'published' | 'draft'>('published');
    const [savingExam, setSavingExam] = useState(false);

    // Attach Exam Modal state
    const [attachModalOpen, setAttachModalOpen] = useState(false);
    const [attachExamType, setAttachExamType] = useState<'practice' | 'live'>('practice');
    const [attachStartTime, setAttachStartTime] = useState('');
    const [attachEndTime, setAttachEndTime] = useState('');
    const [selectedExamId, setSelectedExamId] = useState<string>('');
    const [attaching, setAttaching] = useState(false);
    const [examSearch, setExamSearch] = useState('');

    // Section modal
    const [sectionModalOpen, setSectionModalOpen] = useState(false);
    const [editingSection, setEditingSection] = useState<CourseSection | null>(null);
    const [sectionTitle, setSectionTitle] = useState('');
    const [sectionDesc, setSectionDesc] = useState('');

    // Lesson modal
    const [lessonModalOpen, setLessonModalOpen] = useState(false);
    const [targetSectionId, setTargetSectionId] = useState<number | null>(null);
    const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
    const [lessonTitle, setLessonTitle] = useState('');
    const [lessonContent, setLessonContent] = useState('');
    const [lessonVideoProvider, setLessonVideoProvider] = useState<'youtube' | 'vdocipher'>('youtube');
    const [lessonVideoUrl, setLessonVideoUrl] = useState('');
    const [lessonDuration, setLessonDuration] = useState('0');
    const [lessonIsPreview, setLessonIsPreview] = useState(false);
    const [lessonStatus, setLessonStatus] = useState<'draft' | 'published'>('published');

    // VdoCipher upload & shortcode state for Lesson modal
    const [vdoMode, setVdoMode] = useState<'upload' | 'shortcode'>('upload');
    const [vdoSelectedFile, setVdoSelectedFile] = useState<File | null>(null);
    const [vdoUploading, setVdoUploading] = useState(false);
    const [vdoUploadProgress, setVdoUploadProgress] = useState(0);
    const [vdoUploadStatus, setVdoUploadStatus] = useState('');
    const [vdoUploadError, setVdoUploadError] = useState<string | null>(null);
    const [vdoUploadedVideoId, setVdoUploadedVideoId] = useState<string | null>(null);
    const vdoXhrRef = React.useRef<XMLHttpRequest | null>(null);

    // Attachments upload state
    const [uploadingAttachment, setUploadingAttachment] = useState(false);

    useEffect(() => {
        fetchCurriculum();
        fetchCourseExams();
        fetchLiveClasses();
        fetchCourseRoutine();
        fetchRewardTopics();
    }, [id]);

    const fetchRewardTopics = async () => {
        if (!id) return;
        try {
            setLoadingRewardTopics(true);
            const { data } = await apiClient.get(`/builder/${id}/reward-topics`);
            setRewardTopics(data.topics || []);
        } catch (err) {
            console.error('Failed to load reward topics', err);
        } finally {
            setLoadingRewardTopics(false);
        }
    };

    const openAddRewardTopicModal = () => {
        setEditingTopic(null);
        setTopicTitle('');
        setTopicDescription('');
        setTopicPointsReward('50');
        setTopicIsActive(true);
        setIsTopicModalOpen(true);
    };

    const openEditRewardTopicModal = (topic: any) => {
        setEditingTopic(topic);
        setTopicTitle(topic.title);
        setTopicDescription(topic.description || '');
        setTopicPointsReward(String(topic.points_reward));
        setTopicIsActive(Boolean(topic.is_active));
        setIsTopicModalOpen(true);
    };

    const handleSaveTopic = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!topicTitle.trim()) {
            alert('Topic title is required.');
            return;
        }
        const pts = parseInt(topicPointsReward, 10);
        if (isNaN(pts) || pts <= 0) {
            alert('Points reward must be a positive number.');
            return;
        }

        try {
            setSavingTopic(true);
            const payload = {
                title: topicTitle.trim(),
                description: topicDescription.trim() || null,
                points_reward: pts,
                is_active: topicIsActive,
            };

            if (editingTopic) {
                await apiClient.put(`/builder/reward-topics/${editingTopic.id}`, payload);
            } else {
                await apiClient.post(`/builder/${id}/reward-topics`, payload);
            }

            setIsTopicModalOpen(false);
            fetchRewardTopics();
            alert('Saved successfully!');
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to save topic.');
        } finally {
            setSavingTopic(false);
        }
    };

    const handleDeleteTopic = async (topicId: number) => {
        if (!confirm('Are you sure you want to delete this reward topic and all associated submissions?')) {
            return;
        }
        try {
            await apiClient.delete(`/builder/reward-topics/${topicId}`);
            fetchRewardTopics();
            alert('Topic deleted successfully!');
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to delete topic.');
        }
    };

    const handleOpenResponses = async (topic: any) => {
        setSelectedTopicForSubmissions(topic);
        setIsSubmissionsModalOpen(true);
        setSubmissionStatusFilter('all');
        try {
            setLoadingSubmissions(true);
            const { data } = await apiClient.get(`/builder/reward-topics/${topic.id}/submissions`);
            setSubmissionsList(data.submissions || []);
        } catch (err) {
            console.error('Failed to load submissions', err);
        } finally {
            setLoadingSubmissions(false);
        }
    };

    const handleApproveSubmission = async (sub: any) => {
        if (!confirm(`Approve this submission and award ${selectedTopicForSubmissions?.points_reward || 50} points to ${sub.user?.name || 'the student'}?`)) {
            return;
        }
        try {
            setReviewingSubmissionId(sub.id);
            await apiClient.post(`/builder/reward-submissions/${sub.id}/review`, {
                action: 'approve'
            });
            if (selectedTopicForSubmissions) {
                const { data } = await apiClient.get(`/builder/reward-topics/${selectedTopicForSubmissions.id}/submissions`);
                setSubmissionsList(data.submissions || []);
            }
            fetchRewardTopics();
            alert('Submission approved successfully! Points awarded to the student.');
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to approve submission.');
        } finally {
            setReviewingSubmissionId(null);
        }
    };

    const openRejectSubmissionModal = (sub: any) => {
        setSelectedSubmissionToReject(sub);
        setRejectFeedbackText('');
        setRejectModalOpen(true);
    };

    const handleConfirmRejectSubmission = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSubmissionToReject) return;
        try {
            setReviewingSubmissionId(selectedSubmissionToReject.id);
            await apiClient.post(`/builder/reward-submissions/${selectedSubmissionToReject.id}/review`, {
                action: 'reject',
                feedback: rejectFeedbackText.trim() || null,
            });
            setRejectModalOpen(false);
            if (selectedTopicForSubmissions) {
                const { data } = await apiClient.get(`/builder/reward-topics/${selectedTopicForSubmissions.id}/submissions`);
                setSubmissionsList(data.submissions || []);
            }
            fetchRewardTopics();
            alert('Submission marked as rejected.');
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to reject submission.');
        } finally {
            setReviewingSubmissionId(null);
        }
    };

    const fetchCourseRoutine = async () => {
        try {
            setLoadingRoutine(true);
            const { data } = await apiClient.get(`/builder/${id}/routine`);
            setRoutineItems(data.routine_items || []);
        } catch (err) {
            console.error('Failed to load course routine', err);
        } finally {
            setLoadingRoutine(false);
        }
    };

    const openAddRoutineItem = (defaultType?: 'class_upload' | 'material' | 'book_parcel' | 'general') => {
        setEditingRoutineItem(null);
        setRoutineItemType(defaultType || 'class_upload');
        setRoutineItemTitle('');
        setRoutineItemSubject('');

        const now = new Date();
        now.setHours(16, 0, 0, 0);
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        const h = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        setRoutineItemStartTime(`${y}-${m}-${d}T${h}:${min}`);
        setRoutineItemEndTime('');
        setRoutineItemDesc('');
        setRoutineItemLinkUrl('');
        setRoutineItemActionText('');
        setRoutineItemStatus('upcoming');
        setRoutineItemCourier('');
        setRoutineItemTracking('');
        setRoutineModalOpen(true);
    };

    const openEditRoutineItem = (item: any) => {
        setEditingRoutineItem(item);
        setRoutineItemType(item.type || 'class_upload');
        setRoutineItemTitle(item.title || '');
        setRoutineItemSubject(item.subject || '');

        const formatForInput = (isoStr: string | null) => {
            if (!isoStr) return '';
            const dt = new Date(isoStr);
            const y = dt.getFullYear();
            const m = String(dt.getMonth() + 1).padStart(2, '0');
            const d = String(dt.getDate()).padStart(2, '0');
            const h = String(dt.getHours()).padStart(2, '0');
            const min = String(dt.getMinutes()).padStart(2, '0');
            return `${y}-${m}-${d}T${h}:${min}`;
        };

        setRoutineItemStartTime(formatForInput(item.start_time));
        setRoutineItemEndTime(formatForInput(item.end_time));
        setRoutineItemDesc(item.description || '');
        setRoutineItemLinkUrl(item.link_url || '');
        setRoutineItemActionText(item.action_text || '');
        setRoutineItemStatus(item.status || 'upcoming');
        setRoutineItemCourier(item.meta?.courier_name || '');
        setRoutineItemTracking(item.meta?.tracking_code || '');
        setRoutineModalOpen(true);
    };

    const handleSaveRoutineItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!routineItemTitle.trim() || !routineItemStartTime) {
            alert('Please provide title and date/time.');
            return;
        }

        try {
            setSavingRoutineItem(true);
            const payload: any = {
                type: routineItemType,
                title: routineItemTitle.trim(),
                subject: routineItemSubject.trim() || null,
                start_time: routineItemStartTime,
                end_time: routineItemEndTime || null,
                description: routineItemDesc.trim() || null,
                link_url: routineItemLinkUrl.trim() || null,
                action_text: routineItemActionText.trim() || null,
                status: routineItemStatus,
                meta: routineItemType === 'book_parcel' ? {
                    courier_name: routineItemCourier.trim() || null,
                    tracking_code: routineItemTracking.trim() || null,
                } : null,
            };

            if (editingRoutineItem) {
                await apiClient.put(`/builder/${id}/routine/items/${editingRoutineItem.id}`, payload);
            } else {
                await apiClient.post(`/builder/${id}/routine/items`, payload);
            }

            setRoutineModalOpen(false);
            fetchCourseRoutine();
            alert('Saved successfully!');
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to save routine schedule.');
        } finally {
            setSavingRoutineItem(false);
        }
    };

    const handleDeleteRoutineItem = async (itemId: number, title: string) => {
        if (!window.confirm(`Are you sure you want to delete routine item "${title}"?`)) {
            return;
        }
        try {
            await apiClient.delete(`/builder/${id}/routine/items/${itemId}`);
            fetchCourseRoutine();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to delete routine item.');
        }
    };

    const fetchLiveClasses = async () => {
        try {
            setLoadingLiveClasses(true);
            const { data } = await apiClient.get(`/builder/${id}/live-classes`);
            setLiveClasses(data.live_classes || []);
        } catch (err) {
            console.error('Failed to load live classes', err);
        } finally {
            setLoadingLiveClasses(false);
        }
    };

    const openAddLiveClass = () => {
        setEditingLiveClass(null);
        setLiveClassTitle('');
        setLiveClassDesc('');
        setLiveClassUrl('');
        const d = new Date();
        d.setMinutes(d.getMinutes() + 60);
        d.setMinutes(0);
        const iso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        setLiveClassStartTime(iso);
        setLiveClassEndTime('');
        setLiveClassStatus('upcoming');
        setLiveClassModalOpen(true);
    };

    const openEditLiveClass = (lc: any) => {
        setEditingLiveClass(lc);
        setLiveClassTitle(lc.title);
        setLiveClassDesc(lc.description || '');
        setLiveClassUrl(lc.live_url || '');
        if (lc.start_time) {
            const d = new Date(lc.start_time);
            setLiveClassStartTime(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
        } else {
            setLiveClassStartTime('');
        }
        if (lc.end_time) {
            const d = new Date(lc.end_time);
            setLiveClassEndTime(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
        } else {
            setLiveClassEndTime('');
        }
        setLiveClassStatus(lc.status || 'upcoming');
        setLiveClassModalOpen(true);
    };

    const handleSaveLiveClass = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!liveClassTitle.trim() || !liveClassUrl.trim() || !liveClassStartTime) {
            alert('Please provide class title, YouTube live link, and start time.');
            return;
        }

        try {
            setSavingLiveClass(true);
            const payload = {
                title: liveClassTitle.trim(),
                description: liveClassDesc.trim() || null,
                live_url: liveClassUrl.trim(),
                start_time: liveClassStartTime,
                end_time: liveClassEndTime || null,
                status: liveClassStatus,
            };

            if (editingLiveClass) {
                await apiClient.put(`/builder/${id}/live-classes/${editingLiveClass.id}`, payload);
            } else {
                await apiClient.post(`/builder/${id}/live-classes`, payload);
            }

            setLiveClassModalOpen(false);
            fetchLiveClasses();
            fetchCourseRoutine();
            alert('Saved successfully!');
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to save live class.');
        } finally {
            setSavingLiveClass(false);
        }
    };

    const handleDeleteLiveClass = async (lcId: number, title?: string) => {
        if (title && !window.confirm(`Are you sure you want to delete live class "${title}"?`)) {
            return;
        }
        if (!title && !window.confirm('Are you sure you want to delete this live class?')) {
            return;
        }
        try {
            await apiClient.delete(`/builder/${id}/live-classes/${lcId}`);
            setLiveClasses(prev => prev.filter(c => c.id !== lcId));
            fetchCourseRoutine();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to delete live class.');
        }
    };

    const handleToggleLiveStatus = async (lc: any, newStatus: string) => {
        try {
            await apiClient.patch(`/builder/${id}/live-classes/${lc.id}/status`, { status: newStatus });
            fetchLiveClasses();
            fetchCourseRoutine();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to update status.');
        }
    };

    const fetchCurriculum = async () => {
        try {
            const { data } = await apiClient.get(`/builder/${id}/curriculum`);
            setCourse(data.course);
            if (data.course) {
                if (Array.isArray(data.course.action_buttons)) {
                    setActionButtons(data.course.action_buttons);
                }
                if (Array.isArray(data.course.enrolled_action_buttons)) {
                    setEnrolledButtons(data.course.enrolled_action_buttons);
                }
            }
            setSections(data.sections || []);
            setAccessError(null);
        } catch (err: any) {
            if (err.response?.status === 403) {
                setAccessError(err.response?.data?.message || 'You do not have permission to manage this course.');
            } else {
                setAccessError('Failed to load course builder.');
            }
        } finally {
            setLoading(false);
        }
    };

    /* Handlers for Outline and Custom Action Buttons */
    const handleAddActionButton = () => {
        const newBtn: CourseActionButton = {
            id: 'btn-' + Date.now(),
            label: 'Course Outline',
            type: 'link',
            url: '',
        };
        setActionButtons(prev => [...prev, newBtn]);
    };

    const handleRemoveActionButton = (btnId: string) => {
        setActionButtons(prev => prev.filter(b => b.id !== btnId));
    };

    const handleUpdateButton = (btnId: string, updates: Partial<CourseActionButton>) => {
        setActionButtons(prev => prev.map(b => (b.id === btnId ? { ...b, ...updates } : b)));
    };

    const handleAddEnrolledButton = () => {
        const newBtn: EnrolledActionButton = {
            id: 'ebtn-' + Date.now(),
            label: 'Join our Facebook Discussion Group',
            url: '',
            requires_access_key: true,
        };
        setEnrolledButtons(prev => [...prev, newBtn]);
    };

    const handleRemoveEnrolledButton = (btnId: string) => {
        setEnrolledButtons(prev => prev.filter(b => b.id !== btnId));
    };

    const handleUpdateEnrolledButton = (btnId: string, updates: Partial<EnrolledActionButton>) => {
        setEnrolledButtons(prev => prev.map(b => (b.id === btnId ? { ...b, ...updates } : b)));
    };

    const handleUploadButtonFile = async (e: React.ChangeEvent<HTMLInputElement>, btnId: string) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingButtonFileId(btnId);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await apiClient.post(`/builder/${id}/upload-button-file`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            if (res.data && res.data.url) {
                handleUpdateButton(btnId, {
                    type: 'file',
                    url: res.data.url,
                    file_name: res.data.file_name || file.name,
                });
            }
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to upload button file.');
        } finally {
            setUploadingButtonFileId(null);
            e.target.value = '';
        }
    };

    const handleSaveCustomButtons = async () => {
        setSavingCustomButtons(true);
        setCustomButtonsSuccess(null);
        try {
            const payload = {
                action_buttons: actionButtons.filter(b => b.label.trim().length > 0 && b.url.trim().length > 0),
                enrolled_action_buttons: enrolledButtons.filter(b => b.label.trim().length > 0 && b.url.trim().length > 0),
            };
            const { data } = await apiClient.put(`/builder/${id}/custom-buttons`, payload);
            if (data.action_buttons) setActionButtons(data.action_buttons);
            if (data.enrolled_action_buttons) setEnrolledButtons(data.enrolled_action_buttons);
            setCustomButtonsSuccess('Saved successfully!');
            alert('Saved successfully!');
            setTimeout(() => setCustomButtonsSuccess(null), 4000);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to save custom buttons.');
        } finally {
            setSavingCustomButtons(false);
        }
    };

    const fetchCourseExams = async () => {
        try {
            setLoadingExams(true);
            const { data } = await apiClient.get(`/builder/${id}/exams`);
            setAttachedExams(data.attached_exams || []);
            setAvailableExams(data.available_exams || []);
        } catch (err) {
            console.error('Failed to load course exams', err);
        } finally {
            setLoadingExams(false);
        }
    };

    const formatExamDate = (dateStr: string) => {
        if (!dateStr) return '';
        try {
            const d = new Date(dateStr);
            return d.toLocaleString('bn-BD', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
            });
        } catch {
            return dateStr;
        }
    };

    const isExamExpired = (exam: any) => {
        if (!exam.end_time) return false;
        return new Date(exam.end_time) < new Date();
    };

    const isExamLiveNow = (exam: any) => {
        if (exam.exam_type !== 'live' || !exam.start_time || !exam.end_time) return false;
        const now = new Date();
        return new Date(exam.start_time) <= now && now <= new Date(exam.end_time);
    };

    const isExamUpcoming = (exam: any) => {
        if (exam.exam_type !== 'live' || !exam.start_time) return false;
        return new Date(exam.start_time) > new Date();
    };

    // Practice Exams List:
    // 1) All exams where exam_type === 'practice' (or unset)
    // 2) PLUS live exams whose end_time has passed (they automatically transition to practice exams!)
    const practiceExamsList = attachedExams.filter(exam => {
        const isLive = exam.exam_type === 'live';
        if (!isLive) return true;
        return isExamExpired(exam);
    });

    // Live Exams List:
    // All exams created as 'live'
    const liveExamsList = attachedExams.filter(exam => exam.exam_type === 'live');

    const openAddExam = (type: 'practice' | 'live') => {
        setEditingExam(null);
        setExamModalType(type);
        setExamTitle('');
        setExamDesc('');
        setExamDuration('30');
        setExamPassMarks('0');
        setExamHasNegativeMarking(false);
        setExamNegativeMarks('0.25');
        setExamStartTime('');
        setExamEndTime('');
        setExamStatus('published');
        setExamModalOpen(true);
    };

    const openEditExam = (exam: any) => {
        setEditingExam(exam);
        setExamModalType(exam.exam_type === 'live' ? 'live' : 'practice');
        setExamTitle(exam.title || '');
        setExamDesc(exam.description || '');
        setExamDuration(String(exam.duration_minutes || 30));
        setExamPassMarks(String(exam.pass_marks || 0));
        setExamHasNegativeMarking(Boolean(exam.has_negative_marking));
        setExamNegativeMarks(String(exam.negative_marks || 0.25));
        setExamStartTime(exam.start_time ? exam.start_time.substring(0, 16) : '');
        setExamEndTime(exam.end_time ? exam.end_time.substring(0, 16) : '');
        setExamStatus(exam.status || 'published');
        setExamModalOpen(true);
    };

    const openAttachModal = (type: 'practice' | 'live') => {
        setSelectedExamId('');
        setAttachExamType(type);
        setAttachStartTime('');
        setAttachEndTime('');
        setExamSearch('');
        setAttachModalOpen(true);
    };

    const handleSaveExam = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!examTitle.trim()) {
            alert('Exam title is required.');
            return;
        }
        if (examModalType === 'live') {
            if (!examStartTime || !examEndTime) {
                alert('Start time and end time are required for live exam.');
                return;
            }
            if (new Date(examEndTime) <= new Date(examStartTime)) {
                alert('End time must be later than start time for live exam.');
                return;
            }
        }

        try {
            setSavingExam(true);
            const payload = {
                title: examTitle.trim(),
                description: examDesc.trim() || null,
                exam_type: examModalType,
                duration_minutes: parseInt(examDuration) || 30,
                pass_marks: parseFloat(examPassMarks) || 0,
                has_negative_marking: examHasNegativeMarking,
                negative_marks: examHasNegativeMarking ? (parseFloat(examNegativeMarks) || 0) : 0,
                start_time: examModalType === 'live' ? examStartTime : null,
                end_time: examModalType === 'live' ? examEndTime : null,
                status: examStatus,
            };

            if (editingExam) {
                await apiClient.put(`/builder/${id}/exams/${editingExam.id}`, payload);
            } else {
                await apiClient.post(`/builder/${id}/exams/create`, payload);
            }

            setExamModalOpen(false);
            fetchCourseExams();
            fetchCourseRoutine();
            alert('Saved successfully!');
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to save exam.');
        } finally {
            setSavingExam(false);
        }
    };

    const handleAttachExam = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedExamId) return;

        if (attachExamType === 'live') {
            if (!attachStartTime || !attachEndTime) {
                alert('Start time and end time are required for live exam.');
                return;
            }
            if (new Date(attachEndTime) <= new Date(attachStartTime)) {
                alert('End time must be later than start time for live exam.');
                return;
            }
        }

        try {
            setAttaching(true);
            await apiClient.post(`/builder/${id}/exams`, {
                exam_id: Number(selectedExamId),
                exam_type: attachExamType,
                start_time: attachExamType === 'live' ? attachStartTime : null,
                end_time: attachExamType === 'live' ? attachEndTime : null,
            });
            setSelectedExamId('');
            setAttachModalOpen(false);
            fetchCourseExams();
            fetchCourseRoutine();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to attach exam.');
        } finally {
            setAttaching(false);
        }
    };

    const handleDetachExam = async (examId: number, examTitle: string) => {
        if (!window.confirm(`Are you sure you want to detach "${examTitle}" from this course? (The original exam will not be deleted, only unlinked from this course)`)) {
            return;
        }

        try {
            await apiClient.delete(`/builder/${id}/exams/${examId}`);
            setAttachedExams(prev => prev.filter(e => e.id !== examId));
            fetchCourseExams();
            fetchCourseRoutine();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to detach exam.');
        }
    };

    /* Section Actions */
    const openAddSection = () => {
        setEditingSection(null);
        setSectionTitle('');
        setSectionDesc('');
        setSectionModalOpen(true);
    };

    const openEditSection = (section: CourseSection) => {
        setEditingSection(section);
        setSectionTitle(section.title);
        setSectionDesc(section.description || '');
        setSectionModalOpen(true);
    };

    const handleSaveSection = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingSection) {
                await apiClient.put(`/builder/sections/${editingSection.id}`, {
                    title: sectionTitle,
                    description: sectionDesc,
                });
            } else {
                await apiClient.post(`/builder/${id}/sections`, {
                    title: sectionTitle,
                    description: sectionDesc,
                });
            }
            setSectionModalOpen(false);
            fetchCurriculum();
            alert('Saved successfully!');
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to save section.');
        }
    };

    const handleDeleteSection = async (sectionId: number) => {
        if (!window.confirm('Are you sure you want to delete this section and all lessons inside it?')) return;
        try {
            await apiClient.delete(`/builder/sections/${sectionId}`);
            setSections(prev => prev.filter(s => s.id !== sectionId));
        } catch { }
    };

    const moveSection = async (index: number, direction: 'up' | 'down') => {
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= sections.length) return;

        const updated = [...sections];
        const temp = updated[index];
        updated[index] = updated[targetIndex];
        updated[targetIndex] = temp;

        setSections(updated);

        try {
            await apiClient.post(`/builder/${id}/sections/reorder`, {
                section_ids: updated.map(s => s.id),
            });
        } catch { }
    };

    /* Lesson Actions */
    const openAddLesson = (sectionId: number) => {
        setTargetSectionId(sectionId);
        setEditingLesson(null);
        setLessonTitle('');
        setLessonContent('');
        setLessonVideoProvider('youtube');
        setLessonVideoUrl('');
        setLessonDuration('0');
        setLessonIsPreview(false);
        setLessonStatus('published');
        // Reset VdoCipher states
        setVdoMode('upload');
        setVdoSelectedFile(null);
        setVdoUploading(false);
        setVdoUploadProgress(0);
        setVdoUploadStatus('');
        setVdoUploadError(null);
        setVdoUploadedVideoId(null);
        setLessonModalOpen(true);
    };

    const openEditLesson = (lesson: Lesson) => {
        setEditingLesson(lesson);
        setTargetSectionId(lesson.section_id);
        setLessonTitle(lesson.title);
        setLessonContent(lesson.content || '');
        const rawUrl = lesson.video_url || '';
        const isVdo = lesson.video_provider === 'vdocipher' ||
            rawUrl.includes('vdocipher') ||
            rawUrl.includes('[vdo') ||
            /^[a-f0-9]{32}$/i.test(rawUrl.trim());
        setLessonVideoProvider(isVdo ? 'vdocipher' : 'youtube');
        setLessonVideoUrl(rawUrl);
        setLessonDuration(String(lesson.duration_minutes || '0'));
        setLessonIsPreview(Boolean(lesson.is_preview));
        setLessonStatus(lesson.status);

        // Reset VdoCipher states
        setVdoMode(rawUrl ? 'shortcode' : 'upload');
        setVdoSelectedFile(null);
        setVdoUploading(false);
        setVdoUploadProgress(0);
        setVdoUploadStatus('');
        setVdoUploadError(null);
        setVdoUploadedVideoId(isVdo && rawUrl ? rawUrl : null);
        setLessonModalOpen(true);
    };

    const handleUploadToVdoCipher = async () => {
        if (!vdoSelectedFile) {
            setVdoUploadError('Please select a video file to upload.');
            return;
        }

        setVdoUploading(true);
        setVdoUploadProgress(0);
        setVdoUploadError(null);
        setVdoUploadStatus('Requesting secure VdoCipher upload link...');

        try {
            const credsRes = await apiClient.post('/vdocipher/upload-credentials', {
                title: lessonTitle.trim() || vdoSelectedFile.name.replace(/\.[^/.]+$/, ''),
            });

            const { clientPayload, videoId, uploadLink } = credsRes.data;

            if (!clientPayload || !uploadLink) {
                throw new Error('Failed to obtain upload link from VdoCipher.');
            }

            const uploadSizeMb = (vdoSelectedFile.size / (1024 * 1024)).toFixed(1);
            setVdoUploadStatus(`Uploading to VdoCipher cloud (${uploadSizeMb} MB)...`);

            // AWS S3 POST Policy requires fields in strict order BEFORE the file
            // S3 policy explicitly enforces success_action_status=201
            const s3OrderedKeys = [
                'key',
                'policy',
                'x-amz-algorithm',
                'x-amz-credential',
                'x-amz-date',
                'x-amz-signature',
                'success_action_status',
                'success_action_redirect'
            ];

            const formData = new FormData();
            s3OrderedKeys.forEach((k) => {
                if (clientPayload[k] !== undefined && clientPayload[k] !== null) {
                    formData.append(k, String(clientPayload[k]));
                } else if (k === 'success_action_status') {
                    formData.append('success_action_status', '201');
                } else if (k === 'success_action_redirect') {
                    formData.append('success_action_redirect', '');
                }
            });

            // Append any additional keys from clientPayload
            Object.keys(clientPayload).forEach((k) => {
                if (k !== 'uploadLink' && k !== 'file' && !s3OrderedKeys.includes(k)) {
                    formData.append(k, String(clientPayload[k]));
                }
            });

            // The binary file parameter MUST strictly be appended last
            const cleanFilename = (vdoSelectedFile.name || 'video.mp4').replace(/[^a-zA-Z0-9._-]/g, '_');
            formData.append('file', vdoSelectedFile, cleanFilename);

            await new Promise<void>((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                vdoXhrRef.current = xhr;
                xhr.open('POST', uploadLink, true);

                xhr.upload.onprogress = (e) => {
                    if (e.lengthComputable) {
                        const percent = Math.round((e.loaded / e.total) * 100);
                        setVdoUploadProgress(percent);
                        const loadedMb = (e.loaded / (1024 * 1024)).toFixed(1);
                        const totalMb = (e.total / (1024 * 1024)).toFixed(1);
                        setVdoUploadStatus(`Uploading to VdoCipher: ${percent}% (${loadedMb} MB / ${totalMb} MB)`);
                    }
                };

                xhr.onload = () => {
                    vdoXhrRef.current = null;
                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve();
                    } else {
                        let detailedMsg = '';
                        if (xhr.responseText) {
                            try {
                                const parser = new DOMParser();
                                const xmlDoc = parser.parseFromString(xhr.responseText, 'text/xml');
                                const errorNode = xmlDoc.getElementsByTagName('Message')[0];
                                const codeNode = xmlDoc.getElementsByTagName('Code')[0];
                                if (errorNode?.textContent) {
                                    detailedMsg = `${codeNode?.textContent ? codeNode.textContent + ': ' : ''}${errorNode.textContent}`;
                                }
                            } catch (_) {}
                        }
                        reject(new Error(
                            detailedMsg
                                ? `VdoCipher S3 upload rejected (${xhr.status}): ${detailedMsg}`
                                : `VdoCipher S3 upload failed with HTTP status ${xhr.status}: ${xhr.statusText || 'Upload rejected'}`
                        ));
                    }
                };

                xhr.onerror = () => {
                    vdoXhrRef.current = null;
                    reject(new Error('Network error during video upload. Please check your internet connection.'));
                };

                xhr.onabort = () => {
                    vdoXhrRef.current = null;
                    reject(new Error('Upload was cancelled.'));
                };

                xhr.send(formData);
            });

            setVdoUploadProgress(100);
            setVdoUploadStatus('Video uploaded successfully! Cloud compression and DRM encryption initiated.');
            setVdoUploadedVideoId(videoId);
            setLessonVideoUrl(videoId);
            setVdoSelectedFile(null);
        } catch (err: any) {
            console.error('VdoCipher direct upload error:', err);

            if (err.message?.includes('cancelled')) {
                setVdoUploading(false);
                setVdoUploadStatus('');
                return;
            }

            // Automatic resilient fallback: if direct S3 upload failed and file size is <= 250MB, retry via secure server proxy
            if (vdoSelectedFile && vdoSelectedFile.size <= 250 * 1024 * 1024) {
                try {
                    setVdoUploadStatus('Direct S3 blocked. Retrying via secure server proxy...');
                    const cleanFilename = (vdoSelectedFile.name || 'video.mp4').replace(/[^a-zA-Z0-9._-]/g, '_');
                    const proxyFormData = new FormData();
                    proxyFormData.append('file', vdoSelectedFile, cleanFilename);
                    proxyFormData.append('title', lessonTitle.trim() || cleanFilename);

                    const proxyRes = await apiClient.post('/vdocipher/upload-proxy', proxyFormData, {
                        headers: { 'Content-Type': 'multipart/form-data' },
                        onUploadProgress: (progressEvent) => {
                            if (progressEvent.total) {
                                const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100);
                                setVdoUploadProgress(percent);
                                setVdoUploadStatus(`Uploading via secure server proxy: ${percent}%`);
                            }
                        }
                    });

                    if (proxyRes.data?.videoId) {
                        const fallbackVideoId = proxyRes.data.videoId;
                        setVdoUploadProgress(100);
                        setVdoUploadStatus('Video uploaded successfully via secure proxy! Video ID: ' + fallbackVideoId);
                        setVdoUploadedVideoId(fallbackVideoId);
                        setLessonVideoUrl(fallbackVideoId);
                        setVdoSelectedFile(null);
                        return;
                    }
                } catch (proxyErr: any) {
                    console.error('Proxy upload error:', proxyErr);
                }
            }

            const msg = err.response?.data?.message || err.message || 'Failed to upload video to VdoCipher.';
            setVdoUploadError(msg);
            setVdoUploadStatus('');
        } finally {
            setVdoUploading(false);
            vdoXhrRef.current = null;
        }
    };

    const handleCancelVdoUpload = () => {
        if (vdoXhrRef.current) {
            try {
                vdoXhrRef.current.abort();
            } catch (_) {}
            vdoXhrRef.current = null;
        }
        setVdoUploading(false);
        setVdoUploadStatus('');
        setVdoUploadError('Upload was cancelled.');
    };

    const extractVdoCipherId = (input: string): string => {
        const trimmed = (input || '').trim();
        if (!trimmed) return '';
        if (/^[a-f0-9]{32}$/i.test(trimmed)) return trimmed;
        const scMatch = trimmed.match(/\[(?:vdo|vdocipher)[^\]]*?(?:id|video-id|videoId)\s*=\s*['"`“”‘’]?([a-zA-Z0-9_-]{16,40})['"`“”‘’]?[^\]]*\]/i);
        if (scMatch) return scMatch[1];
        const rawSc = trimmed.match(/\[(?:vdo|vdocipher)\s+['"`“”‘’]?([a-zA-Z0-9_-]{16,40})['"`“”‘’]?/i);
        if (rawSc) return rawSc[1];
        const idMatch = trimmed.match(/(?:id|video-id|videoId)\s*=\s*['"`“”‘’]?([a-zA-Z0-9_-]{16,40})['"`“”‘’]?/i);
        if (idMatch) return idMatch[1];
        const urlMatch = trimmed.match(/(?:videos|video|v)\/([a-zA-Z0-9_-]{16,40})/i);
        if (urlMatch) return urlMatch[1];
        const hexMatch = trimmed.match(/([a-f0-9]{32})/i);
        if (hexMatch) return hexMatch[1];
        return trimmed;
    };

    const handleSaveLesson = async (e: React.FormEvent) => {
        e.preventDefault();
        let cleanVideoUrl = lessonVideoUrl.trim();
        if (lessonVideoProvider === 'vdocipher' && cleanVideoUrl) {
            const extracted = extractVdoCipherId(cleanVideoUrl);
            if (extracted) {
                cleanVideoUrl = extracted;
            }
        }

        const payload = {
            title: lessonTitle,
            content: lessonContent,
            video_provider: lessonVideoProvider,
            video_url: cleanVideoUrl,
            duration_minutes: parseInt(lessonDuration, 10) || 0,
            is_preview: lessonIsPreview,
            status: lessonStatus,
        };

        try {
            if (editingLesson) {
                await apiClient.put(`/builder/lessons/${editingLesson.id}`, payload);
            } else if (targetSectionId) {
                await apiClient.post(`/builder/sections/${targetSectionId}/lessons`, payload);
            }
            setLessonModalOpen(false);
            fetchCurriculum();
            alert('Saved successfully!');
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to save lesson.');
        }
    };

    const handleDeleteLesson = async (lessonId: number) => {
        if (!window.confirm('Are you sure you want to delete this lesson?')) return;
        try {
            await apiClient.delete(`/builder/lessons/${lessonId}`);
            fetchCurriculum();
        } catch { }
    };

    const handleDuplicateLesson = async (lessonId: number) => {
        try {
            await apiClient.post(`/builder/lessons/${lessonId}/duplicate`);
            fetchCurriculum();
        } catch { }
    };

    const moveLesson = async (section: CourseSection, lessonIndex: number, direction: 'up' | 'down') => {
        const lessons = [...section.lessons];
        const targetIndex = direction === 'up' ? lessonIndex - 1 : lessonIndex + 1;
        if (targetIndex < 0 || targetIndex >= lessons.length) return;

        const temp = lessons[lessonIndex];
        lessons[lessonIndex] = lessons[targetIndex];
        lessons[targetIndex] = temp;

        setSections(prev => prev.map(s => s.id === section.id ? { ...s, lessons } : s));

        try {
            await apiClient.post(`/builder/sections/${section.id}/reorder-lessons`, {
                lesson_ids: lessons.map(l => l.id),
            });
        } catch { }
    };

    /* Attachment Actions */
    // Study Material Modal States
    const [materialModalOpen, setMaterialModalOpen] = useState(false);
    const [materialLesson, setMaterialLesson] = useState<Lesson | null>(null);
    const [materialTab, setMaterialTab] = useState<'upload' | 'link'>('upload');
    const [materialLinkTitle, setMaterialLinkTitle] = useState('');
    const [materialLinkUrl, setMaterialLinkUrl] = useState('');
    const [submittingLink, setSubmittingLink] = useState(false);

    const openMaterialModal = (lesson: Lesson) => {
        setMaterialLesson(lesson);
        setMaterialTab('upload');
        setMaterialLinkTitle('');
        setMaterialLinkUrl('');
        setMaterialModalOpen(true);
    };

    const handleSaveMaterialLink = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!materialLesson) return;
        if (!materialLinkTitle.trim() || !materialLinkUrl.trim()) {
            alert('Please provide both title and URL.');
            return;
        }

        setSubmittingLink(true);
        try {
            await apiClient.post(`/builder/lessons/${materialLesson.id}/attachments/link`, {
                title: materialLinkTitle.trim(),
                url: materialLinkUrl.trim(),
            });
            setMaterialLinkTitle('');
            setMaterialLinkUrl('');
            await fetchCurriculum();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to add link.');
        } finally {
            setSubmittingLink(false);
        }
    };

    const activeMaterialLesson = React.useMemo(() => {
        if (!materialLesson) return null;
        for (const sec of sections) {
            const found = sec.lessons?.find((l) => l.id === materialLesson.id);
            if (found) return found;
        }
        return materialLesson;
    }, [sections, materialLesson]);

    const handleUploadAttachment = async (e: React.ChangeEvent<HTMLInputElement>, lessonId: number) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setUploadingAttachment(true);
        try {
            await apiClient.post(`/builder/lessons/${lessonId}/attachments`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            fetchCurriculum();
            // Reset the file input value so same file can be selected again if needed
            e.target.value = '';
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to upload file.');
        } finally {
            setUploadingAttachment(false);
        }
    };

    const handleDeleteAttachment = async (attachmentId: number) => {
        if (!window.confirm('Are you sure you want to delete this file?')) return;
        try {
            await apiClient.delete(`/builder/attachments/${attachmentId}`);
            fetchCurriculum();
        } catch { }
    };

    const firstLesson = React.useMemo(() => {
        if (!sections || sections.length === 0) return null;
        for (const sec of sections) {
            if (sec.lessons && sec.lessons.length > 0) {
                return sec.lessons[0];
            }
        }
        return null;
    }, [sections]);

    if (accessError) {
        return (
            <div className="max-w-xl mx-auto my-16 p-8 bg-white rounded-3xl border border-slate-200 shadow-sm text-center space-y-4">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <GraduationCap className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-black text-slate-900">Enrolled Learner Access</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                    {accessError} If you enrolled in this course as a learner, curriculum editing is restricted, but you can attend classes and watch lessons directly in the classroom.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                    <Link
                        to={isTeacher ? "/teacher/courses" : "/admin/courses"}
                        className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors"
                    >
                        Back to My Courses
                    </Link>
                    <Link
                        to={`/learning/${id}`}
                        className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors shadow-xs flex items-center justify-center gap-1.5"
                    >
                        <PlayCircle className="w-4 h-4" />
                        <span>Start Class in Classroom</span>
                    </Link>
                </div>
            </div>
        );
    }

    if (loading || !course) {
        return <div className="p-12 text-center text-slate-400">Loading curriculum builder...</div>;
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
            {/* Top Bar Navigation */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
                <div className="flex items-center gap-3">
                    <Link
                        to={isTeacher ? "/teacher/courses" : "/admin/courses"}
                        className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">Visual Course Builder</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${course.status === 'published' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                                }`}>
                                {course.status}
                            </span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{course.title}</h2>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Course Preview Dropdown / Button */}
                    <div className="relative">
                        <div className="inline-flex items-center shadow-xs rounded-xl overflow-hidden border border-slate-200 bg-white">
                            <a
                                href={firstLesson ? `/learning/${course.id}/lessons/${firstLesson.id}` : `/courses/${course.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-sm flex items-center gap-2 transition-colors border-r border-slate-200 group"
                                title={firstLesson ? "Preview course in student classroom player (new tab)" : "Preview course landing page"}
                            >
                                <Eye className="w-4 h-4 text-sky-600 group-hover:scale-110 transition-transform" />
                                <span>Preview as Student</span>
                                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                            </a>
                            <button
                                type="button"
                                onClick={() => setPreviewMenuOpen(!previewMenuOpen)}
                                className="px-2.5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                                title="More preview options"
                            >
                                <ChevronDown className="w-4 h-4" />
                            </button>
                        </div>

                        {previewMenuOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setPreviewMenuOpen(false)}
                                />
                                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
                                    <div className="px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                                        Course Preview Mode
                                    </div>
                                    <a
                                        href={firstLesson ? `/learning/${course.id}/lessons/${firstLesson.id}` : '#'}
                                        onClick={(e) => {
                                            if (!firstLesson) {
                                                e.preventDefault();
                                                alert('Please add at least one lesson first to preview the student classroom player.');
                                            }
                                            setPreviewMenuOpen(false);
                                        }}
                                        target={firstLesson ? '_blank' : undefined}
                                        rel="noopener noreferrer"
                                        className={`px-3.5 py-2.5 flex items-start gap-3 hover:bg-sky-50/70 transition-colors ${!firstLesson ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center shrink-0 mt-0.5">
                                            <PlayCircle className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                                                <span>Student Classroom</span>
                                                <span className="text-[10px] px-1.5 py-0.5 bg-sky-100 text-sky-700 font-bold rounded">Player</span>
                                            </div>
                                            <div className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                                                Watch video player, syllabus accordion, resources & discussions as a student.
                                            </div>
                                        </div>
                                    </a>

                                    <div className="my-1 border-t border-slate-100" />

                                    <a
                                        href={`/courses/${course.slug}`}
                                        onClick={() => setPreviewMenuOpen(false)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-3.5 py-2.5 flex items-start gap-3 hover:bg-emerald-50/70 transition-colors"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                                            <Globe className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                                                <span>Public Course Details</span>
                                                <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-700 font-bold rounded">Public</span>
                                            </div>
                                            <div className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                                                View public landing page, pricing, overview syllabus and enrollment.
                                            </div>
                                        </div>
                                    </a>
                                </div>
                            </>
                        )}
                    </div>

                    {activeTab === 'lessons' && (
                        <button
                            onClick={openAddSection}
                            className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm rounded-xl shadow-md shadow-sky-600/30 flex items-center gap-2 transition-all cursor-pointer"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Add New Section</span>
                        </button>
                    )}

                    {activeTab === 'live_classes' && (
                        <button
                            onClick={openAddLiveClass}
                            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-xl shadow-md shadow-rose-600/30 flex items-center gap-2 transition-all cursor-pointer"
                        >
                            <Plus className="w-4 h-4" />
                            <span>+ New Live Class</span>
                        </button>
                    )}

                    {activeTab === 'practice_exams' && (
                        <div className="flex items-center gap-2.5">
                            <button
                                onClick={() => openAddExam('practice')}
                                className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm rounded-xl shadow-md shadow-sky-600/30 flex items-center gap-2 transition-all cursor-pointer"
                            >
                                <Plus className="w-4 h-4" />
                                <span>+ New Practice Exam</span>
                            </button>
                            <button
                                onClick={() => openAttachModal('practice')}
                                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl flex items-center gap-2 transition-all cursor-pointer"
                            >
                                <Paperclip className="w-4 h-4" />
                                <span>+ Attach Existing Exam</span>
                            </button>
                        </div>
                    )}

                    {activeTab === 'live_exams' && (
                        <div className="flex items-center gap-2.5">
                            <button
                                onClick={() => openAddExam('live')}
                                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm rounded-xl shadow-md shadow-amber-600/30 flex items-center gap-2 transition-all cursor-pointer"
                            >
                                <Plus className="w-4 h-4" />
                                <span>+ New Live Exam</span>
                            </button>
                            <button
                                onClick={() => openAttachModal('live')}
                                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl flex items-center gap-2 transition-all cursor-pointer"
                            >
                                <Paperclip className="w-4 h-4" />
                                <span>+ Attach Exam as Live</span>
                            </button>
                        </div>
                    )}

                    {activeTab === 'routine' && (
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                onClick={openAddLiveClass}
                                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                            >
                                <Radio className="w-3.5 h-3.5" />
                                <span>+ Live Class</span>
                            </button>
                            <button
                                onClick={() => openAddExam('live')}
                                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                            >
                                <Clock className="w-3.5 h-3.5" />
                                <span>+ Live Exam</span>
                            </button>
                            <button
                                onClick={() => openAddRoutineItem()}
                                className="px-3.5 py-2 bg-[#0B4B34] hover:bg-[#083827] text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>+ New Schedule (Upload / Material / Parcel)</span>
                            </button>
                        </div>
                    )}

                    {activeTab === 'outline_buttons' && (
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                onClick={handleSaveCustomButtons}
                                disabled={savingCustomButtons}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                            >
                                {savingCustomButtons ? (
                                    <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        <span>Saving...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-3.5 h-3.5" />
                                        <span>Save</span>
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    {activeTab === 'reward_setup' && (
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                onClick={openAddRewardTopicModal}
                                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                            >
                                <Plus className="w-4 h-4" />
                                <span>+ New Reward Topic</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Builder Navigation Tabs */}
            <div className="flex items-center gap-2 sm:gap-4 border-b border-slate-200 overflow-x-auto pb-1 sm:pb-0">
                <button
                    onClick={() => setActiveTab('lessons')}
                    className={`pb-3 px-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${activeTab === 'lessons'
                        ? 'border-sky-600 text-sky-600'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                >
                    <Layers className="w-4 h-4" />
                    <span>Lessons</span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600">
                        {sections.reduce((acc, s) => acc + (s.lessons?.length || 0), 0)}
                    </span>
                </button>

                <button
                    onClick={() => setActiveTab('live_classes')}
                    className={`pb-3 px-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${activeTab === 'live_classes'
                        ? 'border-rose-600 text-rose-600'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                >
                    <Radio className="w-4 h-4" />
                    <span>Live Class</span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700">
                        {liveClasses.length}
                    </span>
                </button>

                <button
                    onClick={() => setActiveTab('practice_exams')}
                    className={`pb-3 px-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${activeTab === 'practice_exams'
                        ? 'border-sky-600 text-sky-600'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                >
                    <BookOpen className="w-4 h-4" />
                    <span>Practice Exam</span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-700">
                        {practiceExamsList.length}
                    </span>
                </button>

                <button
                    onClick={() => setActiveTab('live_exams')}
                    className={`pb-3 px-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${activeTab === 'live_exams'
                        ? 'border-amber-600 text-amber-700'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                >
                    <Clock className="w-4 h-4" />
                    <span>Live Exam</span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                        {liveExamsList.length}
                    </span>
                </button>

                <button
                    onClick={() => setActiveTab('routine')}
                    className={`pb-3 px-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${activeTab === 'routine'
                        ? 'border-[#0B4B34] text-[#0B4B34]'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                >
                    <Calendar className="w-4 h-4" />
                    <span>Routine</span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-[#0B4B34]">
                        {routineItems.length}
                    </span>
                </button>

                <button
                    onClick={() => setActiveTab('outline_buttons')}
                    className={`pb-3 px-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${activeTab === 'outline_buttons'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                >
                    <FileText className="w-4 h-4" />
                    <span>Outline / Custom Buttons</span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-700">
                        {actionButtons.length + enrolledButtons.length}
                    </span>
                </button>

                <button
                    onClick={() => setActiveTab('reward_setup')}
                    className={`pb-3 px-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${activeTab === 'reward_setup'
                        ? 'border-amber-600 text-amber-600'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                >
                    <Award className="w-4 h-4" />
                    <span>Reward Setup</span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                        {rewardTopics.length}
                    </span>
                </button>
            </div>

            {/* Lessons Tab Content */}
            {activeTab === 'lessons' && (
                <div className="space-y-6">
                    {sections.length === 0 ? (
                        <div className="bg-white p-12 rounded-3xl border border-slate-200/80 shadow-xs text-center space-y-4">
                            <Layers className="w-12 h-12 text-slate-300 mx-auto" />
                            <h3 className="text-lg font-bold text-slate-800">No sections added yet</h3>
                            <p className="text-xs text-slate-500 max-w-sm mx-auto">
                                To organize your course, create a topic or section first, such as "Introduction", "Chapter 01".
                            </p>
                            <button
                                onClick={openAddSection}
                                className="px-6 py-2.5 bg-sky-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-sky-700"
                            >
                                Create First Section
                            </button>
                        </div>
                    ) : (
                        sections.map((section, sIndex) => (
                            <div
                                key={section.id}
                                className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden"
                            >
                                {/* Section Header */}
                                <div className="p-5 sm:p-6 bg-slate-50/70 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <span className="w-8 h-8 rounded-lg bg-sky-600 text-white text-xs font-black flex items-center justify-center shrink-0">
                                            {String(sIndex + 1).padStart(2, '0')}
                                        </span>
                                        <div>
                                            <h3 className="text-base font-bold text-slate-900">{section.title}</h3>
                                            {section.description && (
                                                <p className="text-xs text-slate-500 mt-0.5">{section.description}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {/* Move Section Up / Down */}
                                        <button
                                            onClick={() => moveSection(sIndex, 'up')}
                                            disabled={sIndex === 0}
                                            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg disabled:opacity-30"
                                            title="Move Up"
                                        >
                                            <ChevronUp className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => moveSection(sIndex, 'down')}
                                            disabled={sIndex === sections.length - 1}
                                            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg disabled:opacity-30"
                                            title="Move Down"
                                        >
                                            <ChevronDown className="w-4 h-4" />
                                        </button>

                                        {/* Edit Section */}
                                        <button
                                            onClick={() => openEditSection(section)}
                                            className="p-1.5 text-slate-500 hover:text-sky-600 rounded-lg hover:bg-slate-100"
                                            title="Edit Section"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>

                                        {/* Delete Section */}
                                        <button
                                            onClick={() => handleDeleteSection(section.id)}
                                            className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50"
                                            title="Delete Section"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>

                                        {/* Add Lesson Button */}
                                        <button
                                            onClick={() => openAddLesson(section.id)}
                                            className="ml-2 px-3.5 py-1.5 bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                            <span>Add Lesson</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Lessons List inside Section */}
                                <div className="p-4 sm:p-6 space-y-3">
                                    {section.lessons && section.lessons.length > 0 ? (
                                        section.lessons.map((lesson, lIndex) => (
                                            <div
                                                key={lesson.id}
                                                className="p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-sky-300 shadow-2xs hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                                                        <PlayCircle className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <h4 className="text-sm font-bold text-slate-800">{lesson.title}</h4>
                                                            {lesson.is_preview && (
                                                                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                                                                    Free Preview
                                                                </span>
                                                            )}
                                                            {lesson.status === 'draft' && (
                                                                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">
                                                                    Draft
                                                                </span>
                                                            )}
                                                            {Boolean(lesson.video_provider === 'vdocipher' || (lesson.video_url && (lesson.video_url.includes('[vdo') || /^[a-f0-9]{32}$/i.test(lesson.video_url.trim())))) && (
                                                                <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold flex items-center gap-1" title="VdoCipher DRM Anti-Piracy Protected">
                                                                    <ShieldCheck className="w-3 h-3 text-purple-600" /> VdoCipher DRM
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                                                            <span>Duration: {lesson.duration_minutes} mins</span>
                                                            {lesson.attachments && lesson.attachments.length > 0 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => openMaterialModal(lesson)}
                                                                    className="flex items-center gap-1 text-sky-600 hover:text-sky-700 font-semibold cursor-pointer"
                                                                    title="View or add study materials"
                                                                >
                                                                    <Paperclip className="w-3 h-3" />
                                                                    <span>{lesson.attachments.length} Materials</span>
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Lesson Actions */}
                                                <div className="flex items-center gap-1.5">
                                                    {/* Reorder Lesson Up / Down */}
                                                    <button
                                                        onClick={() => moveLesson(section, lIndex, 'up')}
                                                        disabled={lIndex === 0}
                                                        className="p-1 text-slate-400 hover:text-slate-700 rounded disabled:opacity-30"
                                                    >
                                                        <ChevronUp className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => moveLesson(section, lIndex, 'down')}
                                                        disabled={lIndex === section.lessons.length - 1}
                                                        className="p-1 text-slate-400 hover:text-slate-700 rounded disabled:opacity-30"
                                                    >
                                                        <ChevronDown className="w-4 h-4" />
                                                    </button>

                                                    {/* Manage Study Material (Upload File or Google Drive Link) */}
                                                    <button
                                                        type="button"
                                                        onClick={() => openMaterialModal(lesson)}
                                                        className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-slate-800 rounded-lg relative transition-colors cursor-pointer"
                                                        title="Study Materials (Upload or Google Drive link)"
                                                    >
                                                        <Paperclip className="w-4 h-4" />
                                                        {lesson.attachments && lesson.attachments.length > 0 && (
                                                            <span className="absolute -top-1 -right-1 min-w-3.5 h-3.5 px-0.5 bg-sky-600 text-white rounded-full text-[9px] font-black flex items-center justify-center">
                                                                {lesson.attachments.length}
                                                            </span>
                                                        )}
                                                    </button>

                                                    {/* Duplicate */}
                                                    <button
                                                        onClick={() => handleDuplicateLesson(lesson.id)}
                                                        className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-slate-100 rounded-lg"
                                                        title="Duplicate Lesson"
                                                    >
                                                        <Copy className="w-4 h-4" />
                                                    </button>

                                                    {/* Edit */}
                                                    <button
                                                        onClick={() => openEditLesson(lesson)}
                                                        className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-slate-100 rounded-lg"
                                                        title="Edit Lesson"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>

                                                    {/* Delete */}
                                                    <button
                                                        onClick={() => handleDeleteLesson(lesson.id)}
                                                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg"
                                                        title="Delete Lesson"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-6 text-center text-xs text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                                            There are no lessons in this section yet. Click "+ Add Lesson" to get started.
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Live Classes Tab Content */}
            {activeTab === 'live_classes' && (
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                        <div>
                            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                <Radio className="w-5 h-5 text-rose-600 animate-pulse" />
                                <span>Course Live Classes ({liveClasses.length})</span>
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Start an Unlisted Live stream on YouTube, set the stream URL and scheduled time. Enrolled students can join live and participate in real-time chat.
                            </p>
                        </div>
                        <button
                            onClick={openAddLiveClass}
                            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                        >
                            <Plus className="w-4 h-4" />
                            <span>+ Create New Live Class</span>
                        </button>
                    </div>

                    {loadingLiveClasses ? (
                        <div className="bg-white p-12 rounded-3xl border border-slate-200/80 text-center">
                            <Loader2 className="w-8 h-8 animate-spin text-rose-500 mx-auto mb-3" />
                            <p className="text-xs text-slate-400">Loading live classes...</p>
                        </div>
                    ) : liveClasses.length === 0 ? (
                        <div className="bg-white p-12 rounded-3xl border border-slate-200/80 shadow-xs text-center space-y-4">
                            <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
                                <Radio className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-800">No live classes added yet</h3>
                                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                                    Schedule a live class with YouTube unlisted live stream link to hold interactive sessions with your students.
                                </p>
                            </div>
                            <div className="pt-2">
                                <button
                                    onClick={openAddLiveClass}
                                    className="px-5 py-2.5 bg-rose-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-rose-700 flex items-center gap-1.5 mx-auto cursor-pointer"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>Create First Live Class</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {liveClasses.map((lc, index) => {
                                const isLive = lc.status === 'live' || lc.is_currently_live;
                                const isCompleted = lc.status === 'completed';

                                return (
                                    <div
                                        key={lc.id}
                                        className={`bg-white rounded-2xl border p-5 sm:p-6 transition-all space-y-4 shadow-xs ${isLive
                                            ? 'border-rose-300 ring-2 ring-rose-500/15'
                                            : 'border-slate-200/80 hover:border-slate-300'
                                            }`}
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                            <div className="space-y-1.5 flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center shrink-0">
                                                        {index + 1}
                                                    </span>
                                                    <h4 className="text-base font-extrabold text-slate-900 tracking-tight">
                                                        {lc.title}
                                                    </h4>

                                                    {/* Status Badge */}
                                                    {isLive ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-white" />
                                                            <span>Live Now</span>
                                                        </span>
                                                    ) : isCompleted ? (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                                                            Completed
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                                            Upcoming
                                                        </span>
                                                    )}
                                                </div>

                                                {lc.description && (
                                                    <p className="text-xs text-slate-500 pl-8 line-clamp-2">
                                                        {lc.description}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Action buttons */}
                                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                                                {/* Live Toggle */}
                                                {!isLive && !isCompleted && (
                                                    <button
                                                        onClick={() => handleToggleLiveStatus(lc, 'live')}
                                                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                                                        title="Go Live"
                                                    >
                                                        <Radio className="w-3.5 h-3.5" />
                                                        <span>Go Live</span>
                                                    </button>
                                                )}
                                                {isLive && (
                                                    <button
                                                        onClick={() => handleToggleLiveStatus(lc, 'completed')}
                                                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                                                        title="End Live"
                                                    >
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                                        <span>End Class</span>
                                                    </button>
                                                )}

                                                <Link
                                                    to={`/student/live-classes/${lc.id}`}
                                                    target="_blank"
                                                    className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-xs rounded-lg flex items-center gap-1 transition-colors"
                                                    title="Open Live Classroom"
                                                >
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                    <span>Classroom</span>
                                                </Link>

                                                <button
                                                    onClick={() => openEditLiveClass(lc)}
                                                    className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                                                    title="Edit"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>

                                                <button
                                                    onClick={() => handleDeleteLiveClass(lc.id, lc.title)}
                                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Metadata row */}
                                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-3 border-t border-slate-100">
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="w-3.5 h-3.5 text-sky-600" />
                                                <span>
                                                    Starts: <strong>{new Date(lc.start_time).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong>
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-1.5 text-rose-600 font-semibold">
                                                <ExternalLink className="w-3.5 h-3.5" />
                                                <a
                                                    href={lc.live_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="hover:underline truncate max-w-xs"
                                                >
                                                    {lc.live_url}
                                                </a>
                                            </div>

                                            <div className="flex items-center gap-1.5 ml-auto text-slate-500">
                                                <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                                                <span>{lc.comments_count || 0} Comments</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Practice Exams Tab Content */}
            {activeTab === 'practice_exams' && (
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                        <div>
                            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-sky-600" />
                                <span>Practice Exams</span>
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Total {practiceExamsList.length} practice exams. Live exams automatically convert here once their schedule ends, so students can practice anytime.
                            </p>
                        </div>
                        <div className="flex items-center gap-2 self-start sm:self-auto">
                            <button
                                onClick={() => openAddExam('practice')}
                                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                            >
                                <Plus className="w-4 h-4" />
                                <span>+ New Practice Exam</span>
                            </button>
                            <button
                                onClick={() => openAttachModal('practice')}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                            >
                                <Paperclip className="w-4 h-4" />
                                <span>+ Attach Existing Exam</span>
                            </button>
                        </div>
                    </div>

                    {loadingExams ? (
                        <div className="bg-white p-12 rounded-3xl border border-slate-200/80 text-center">
                            <Loader2 className="w-8 h-8 animate-spin text-sky-500 mx-auto mb-3" />
                            <p className="text-xs text-slate-400">Loading practice exams...</p>
                        </div>
                    ) : practiceExamsList.length === 0 ? (
                        <div className="bg-white p-12 rounded-3xl border border-slate-200/80 shadow-xs text-center space-y-4">
                            <div className="w-16 h-16 rounded-2xl bg-sky-50 text-sky-500 flex items-center justify-center mx-auto">
                                <BookOpen className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-800">No practice exams found</h3>
                                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                                    Create a new practice exam or attach an existing exam for students to practice regularly.
                                </p>
                            </div>
                            <div className="flex items-center justify-center gap-3 pt-2">
                                <button
                                    onClick={() => openAddExam('practice')}
                                    className="px-5 py-2.5 bg-sky-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-sky-700 flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>Create Practice Exam</span>
                                </button>
                                <button
                                    onClick={() => openAttachModal('practice')}
                                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Paperclip className="w-4 h-4" />
                                    <span>Attach Existing Exam</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {practiceExamsList.map((exam, index) => {
                                const isFromLive = exam.exam_type === 'live';
                                return (
                                    <div
                                        key={exam.id}
                                        className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 hover:border-sky-200 transition-all space-y-4"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                            <div className="space-y-1.5">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="w-6 h-6 rounded-md bg-sky-100 text-sky-700 text-xs font-bold flex items-center justify-center shrink-0">
                                                        {index + 1}
                                                    </span>
                                                    <h4 className="text-base font-bold text-slate-900 tracking-tight">
                                                        {exam.title}
                                                    </h4>
                                                    {isFromLive ? (
                                                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 flex items-center gap-1">
                                                            <Sparkles className="w-3 h-3 text-purple-600" />
                                                            <span>Live Completed • Available in Practice Mode</span>
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 uppercase">
                                                            Practice Exam
                                                        </span>
                                                    )}
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${exam.status === 'published' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                                                        }`}>
                                                        {exam.status}
                                                    </span>
                                                </div>
                                                {exam.description && (
                                                    <p className="text-xs text-slate-500 line-clamp-2 pl-8">
                                                        {exam.description}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                                                <Link
                                                    to={`${examBasePath}/${exam.id}/builder`}
                                                    className="px-3.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors"
                                                    title="Add or edit questions"
                                                >
                                                    <Edit className="w-3.5 h-3.5 text-sky-600" />
                                                    <span>Question Builder</span>
                                                </Link>

                                                <Link
                                                    to={`${examBasePath}/${exam.id}/submissions`}
                                                    className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors"
                                                    title="View student submissions and results"
                                                >
                                                    <FileText className="w-3.5 h-3.5 text-emerald-600" />
                                                    <span>Submissions ({exam.submissions_count ?? 0})</span>
                                                </Link>

                                                <button
                                                    onClick={() => openEditExam(exam)}
                                                    className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                                                    title="Edit Exam"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>

                                                <button
                                                    onClick={() => handleDetachExam(exam.id, exam.title)}
                                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                                    title="Detach exam from course"
                                                >
                                                    <Unlink className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Meta Badges */}
                                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-3 border-t border-slate-100">
                                            <div className="flex items-center gap-1.5 font-medium">
                                                <Award className="w-4 h-4 text-amber-500" />
                                                <span>Total Marks: <strong className="text-slate-800">{exam.total_marks}</strong></span>
                                            </div>
                                            <div className="flex items-center gap-1.5 font-medium">
                                                <Clock className="w-4 h-4 text-sky-500" />
                                                <span>Time: <strong className="text-slate-800">{exam.duration_minutes} mins</strong></span>
                                            </div>
                                            <div className="flex items-center gap-1.5 font-medium">
                                                <FileText className="w-4 h-4 text-violet-500" />
                                                <span>Questions: <strong className="text-slate-800">{exam.questions_count ?? 0}</strong></span>
                                            </div>
                                            {exam.has_negative_marking ? (
                                                <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-600 text-[11px] font-semibold">
                                                    Negative Marking: -{exam.negative_marks}
                                                </span>
                                            ) : (
                                                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[11px] font-semibold">
                                                    No Negative Marking
                                                </span>
                                            )}
                                            {exam.creator && (
                                                <span className="text-slate-400 text-[11px] ml-auto">
                                                    Created by: {exam.creator.name}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Live Exams Tab Content */}
            {activeTab === 'live_exams' && (
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                        <div>
                            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-amber-600" />
                                <span>Live Exams</span>
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Total {liveExamsList.length} live exams. Students participate in live exams based on the scheduled start and end times. Once expired, it automatically moves to practice exams.
                            </p>
                        </div>
                        <div className="flex items-center gap-2 self-start sm:self-auto">
                            <button
                                onClick={() => openAddExam('live')}
                                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                            >
                                <Plus className="w-4 h-4" />
                                <span>+ New Live Exam</span>
                            </button>
                            <button
                                onClick={() => openAttachModal('live')}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                            >
                                <Paperclip className="w-4 h-4" />
                                <span>+ Attach Existing Exam as Live</span>
                            </button>
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/70 text-amber-900 text-xs flex items-start gap-2.5">
                        <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                            <span className="font-bold">Automatic Practice Conversion: </span>
                            As soon as the scheduled End Time passes, the exam automatically converts into a practice exam under the Practice Exams tab for regular practice.
                        </div>
                    </div>

                    {loadingExams ? (
                        <div className="bg-white p-12 rounded-3xl border border-slate-200/80 text-center">
                            <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto mb-3" />
                            <p className="text-xs text-slate-400">Loading live exams...</p>
                        </div>
                    ) : liveExamsList.length === 0 ? (
                        <div className="bg-white p-12 rounded-3xl border border-slate-200/80 shadow-xs text-center space-y-4">
                            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                                <Clock className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-800">No live exams created yet</h3>
                                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                                    Schedule a live exam with specific time boundaries. Students can participate simultaneously and compete on the leaderboard.
                                </p>
                            </div>
                            <div className="flex items-center justify-center gap-3 pt-2">
                                <button
                                    onClick={() => openAddExam('live')}
                                    className="px-5 py-2.5 bg-amber-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-amber-700 flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>Create Live Exam</span>
                                </button>
                                <button
                                    onClick={() => openAttachModal('live')}
                                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Paperclip className="w-4 h-4" />
                                    <span>Attach Existing Exam as Live</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {liveExamsList.map((exam, index) => {
                                const isLiveNow = isExamLiveNow(exam);
                                const isUpcoming = isExamUpcoming(exam);
                                const isExpired = isExamExpired(exam);

                                return (
                                    <div
                                        key={exam.id}
                                        className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 hover:border-amber-200 transition-all space-y-4"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                            <div className="space-y-1.5">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="w-6 h-6 rounded-md bg-amber-100 text-amber-800 text-xs font-bold flex items-center justify-center shrink-0">
                                                        {index + 1}
                                                    </span>
                                                    <h4 className="text-base font-bold text-slate-900 tracking-tight">
                                                        {exam.title}
                                                    </h4>

                                                    {isLiveNow && (
                                                        <span className="px-2.5 py-1 rounded-full text-xs font-black bg-rose-500 text-white flex items-center gap-1.5 animate-pulse shadow-sm">
                                                            <Radio className="w-3.5 h-3.5" />
                                                            <span>Live Now</span>
                                                        </span>
                                                    )}

                                                    {isUpcoming && (
                                                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                                                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                                                            <span>Upcoming Live</span>
                                                        </span>
                                                    )}

                                                    {isExpired && (
                                                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                                            <span>Completed (Active in Practice)</span>
                                                        </span>
                                                    )}

                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${exam.status === 'published' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                                                        }`}>
                                                        {exam.status}
                                                    </span>
                                                </div>

                                                {/* Live Schedule Timeline */}
                                                {(exam.start_time || exam.end_time) && (
                                                    <div className="flex flex-wrap items-center gap-3 text-xs bg-amber-50/70 border border-amber-200/60 px-3 py-1.5 rounded-xl text-amber-900 font-medium">
                                                        <div className="flex items-center gap-1">
                                                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                                                            <span>Starts: <strong>{formatExamDate(exam.start_time)}</strong></span>
                                                        </div>
                                                        <span>—</span>
                                                        <div className="flex items-center gap-1">
                                                            <span>Ends: <strong>{formatExamDate(exam.end_time)}</strong></span>
                                                        </div>
                                                    </div>
                                                )}

                                                {exam.description && (
                                                    <p className="text-xs text-slate-500 line-clamp-2 pl-8">
                                                        {exam.description}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                                                <Link
                                                    to={`${examBasePath}/${exam.id}/builder`}
                                                    className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors"
                                                    title="Add or edit questions"
                                                >
                                                    <Edit className="w-3.5 h-3.5 text-amber-600" />
                                                    <span>Question Builder</span>
                                                </Link>

                                                <Link
                                                    to={`${examBasePath}/${exam.id}/submissions`}
                                                    className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors"
                                                    title="View student submissions and results"
                                                >
                                                    <FileText className="w-3.5 h-3.5 text-emerald-600" />
                                                    <span>Submissions ({exam.submissions_count ?? 0})</span>
                                                </Link>

                                                <button
                                                    onClick={() => openEditExam(exam)}
                                                    className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                                                    title="Edit Schedule / Settings"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>

                                                <button
                                                    onClick={() => handleDetachExam(exam.id, exam.title)}
                                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                                    title="Detach exam from course"
                                                >
                                                    <Unlink className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Meta Badges */}
                                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-3 border-t border-slate-100">
                                            <div className="flex items-center gap-1.5 font-medium">
                                                <Award className="w-4 h-4 text-amber-500" />
                                                <span>Total Marks: <strong className="text-slate-800">{exam.total_marks}</strong></span>
                                            </div>
                                            <div className="flex items-center gap-1.5 font-medium">
                                                <Clock className="w-4 h-4 text-sky-500" />
                                                <span>Duration: <strong className="text-slate-800">{exam.duration_minutes} mins</strong></span>
                                            </div>
                                            <div className="flex items-center gap-1.5 font-medium">
                                                <FileText className="w-4 h-4 text-violet-500" />
                                                <span>Questions: <strong className="text-slate-800">{exam.questions_count ?? 0}</strong></span>
                                            </div>
                                            {exam.has_negative_marking ? (
                                                <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-600 text-[11px] font-semibold">
                                                    Negative Marking: -{exam.negative_marks}
                                                </span>
                                            ) : (
                                                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[11px] font-semibold">
                                                    No Negative Marking
                                                </span>
                                            )}
                                            {exam.creator && (
                                                <span className="text-slate-400 text-[11px] ml-auto">
                                                    Created by: {exam.creator.name}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Routine Tab Content */}
            {activeTab === 'routine' && (
                <div className="space-y-6">
                    {/* Header Card */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                        <div>
                            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-[#0B4B34]" />
                                <span>Course Routine</span>
                            </h3>
                            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                                Complete schedule of live classes, live exams, class uploads, study materials, and book/parcel deliveries. Any item added here appears automatically on students' routines and dashboards.
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <button
                                onClick={openAddLiveClass}
                                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                            >
                                <Radio className="w-3.5 h-3.5" />
                                <span>+ Live Class</span>
                            </button>
                            <button
                                onClick={() => openAddExam('live')}
                                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                            >
                                <Clock className="w-3.5 h-3.5" />
                                <span>+ Live Exam</span>
                            </button>
                            <button
                                onClick={() => openAddRoutineItem('class_upload')}
                                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                            >
                                <Video className="w-3.5 h-3.5" />
                                <span>+ Class Upload</span>
                            </button>
                            <button
                                onClick={() => openAddRoutineItem('material')}
                                className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                            >
                                <FileText className="w-3.5 h-3.5" />
                                <span>+ Material</span>
                            </button>
                            <button
                                onClick={() => openAddRoutineItem('book_parcel')}
                                className="px-3 py-1.5 bg-[#0B4B34] hover:bg-[#083827] text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                            >
                                <Package className="w-3.5 h-3.5" />
                                <span>+ Book/Parcel Delivery</span>
                            </button>
                        </div>
                    </div>

                    {/* Quick Stats Strip */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#0B4B34] flex items-center justify-center font-black shrink-0">
                                <Calendar className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                                <span className="text-[10px] font-bold text-slate-400 block uppercase truncate">Total Events</span>
                                <span className="text-base font-black text-slate-800">{routineItems.length}</span>
                            </div>
                        </div>

                        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-black shrink-0">
                                <Radio className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                                <span className="text-[10px] font-bold text-slate-400 block uppercase truncate">Live Classes</span>
                                <span className="text-base font-black text-slate-800">{routineItems.filter(i => i.type === 'live_class').length}</span>
                            </div>
                        </div>

                        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-black shrink-0">
                                <Clock className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                                <span className="text-[10px] font-bold text-slate-400 block uppercase truncate">Live Exams</span>
                                <span className="text-base font-black text-slate-800">{routineItems.filter(i => i.type === 'live_exam').length}</span>
                            </div>
                        </div>

                        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-black shrink-0">
                                <Video className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                                <span className="text-[10px] font-bold text-slate-400 block uppercase truncate">Class Uploads</span>
                                <span className="text-base font-black text-slate-800">{routineItems.filter(i => i.type === 'class_upload').length}</span>
                            </div>
                        </div>

                        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-black shrink-0">
                                <FileText className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                                <span className="text-[10px] font-bold text-slate-400 block uppercase truncate">Materials</span>
                                <span className="text-base font-black text-slate-800">{routineItems.filter(i => i.type === 'material').length}</span>
                            </div>
                        </div>

                        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-black shrink-0">
                                <Package className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                                <span className="text-[10px] font-bold text-slate-400 block uppercase truncate">Books & Parcels</span>
                                <span className="text-base font-black text-slate-800">{routineItems.filter(i => i.type === 'book_parcel').length}</span>
                            </div>
                        </div>
                    </div>

                    {/* Routine Items List */}
                    {loadingRoutine ? (
                        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80 shadow-xs">
                            <Loader2 className="w-8 h-8 text-[#0B4B34] animate-spin mx-auto mb-2" />
                            <p className="text-xs text-slate-500 font-bold">Loading routine data...</p>
                        </div>
                    ) : routineItems.length === 0 ? (
                        <div className="bg-white p-12 rounded-3xl border border-slate-200/80 shadow-xs text-center space-y-4">
                            <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
                            <h3 className="text-base font-bold text-slate-800">No routine schedules added yet</h3>
                            <p className="text-xs text-slate-500 max-w-md mx-auto">
                                Schedule live classes, live exams, class uploads, study materials, or parcel deliveries for your students.
                            </p>
                            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                                <button
                                    onClick={openAddLiveClass}
                                    className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
                                >
                                    <Radio className="w-3.5 h-3.5" />
                                    <span>Live Class</span>
                                </button>
                                <button
                                    onClick={() => openAddExam('live')}
                                    className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
                                >
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>Live Exam</span>
                                </button>
                                <button
                                    onClick={() => openAddRoutineItem()}
                                    className="px-3.5 py-2 bg-[#0B4B34] hover:bg-[#083827] text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Other Routine Items (Upload / Material / Parcel)</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {routineItems.map((item: any) => {
                                const isClass = item.type === 'live_class';
                                const isExam = item.type === 'live_exam';
                                const isCustom = Boolean(item.is_custom_routine);
                                const isClassUpload = item.type === 'class_upload';
                                const isMaterial = item.type === 'material';
                                const isBookParcel = item.type === 'book_parcel';

                                const matchingLiveClass = isClass ? liveClasses.find(lc => lc.id === item.id) : null;
                                const matchingLiveExam = isExam ? liveExamsList.find(e => e.id === item.id) : null;

                                return (
                                    <div
                                        key={`${item.type}-${item.id}`}
                                        className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                                    >
                                        <div className="flex items-start gap-4 flex-1 min-w-0">
                                            {/* Date / Time Card */}
                                            <div className="shrink-0 text-center w-28 p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
                                                <div className="text-[11px] font-extrabold text-[#0B4B34] uppercase tracking-wider">
                                                    {item.day_name || 'Date'}
                                                </div>
                                                <div className="text-sm font-black text-slate-800 my-0.5">
                                                    {item.date_formatted?.split(' ')?.[0] || ''} {item.date_formatted?.split(' ')?.[1] || ''}
                                                </div>
                                                <div className="text-[10px] font-bold text-slate-500">
                                                    {item.time_display || 'Scheduled Time'}
                                                </div>
                                            </div>

                                            {/* Main Info */}
                                            <div className="space-y-1.5 flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    {isClass && (
                                                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                                                            <Radio className="w-3 h-3 text-rose-500 animate-pulse" />
                                                            <span>Live Class</span>
                                                        </span>
                                                    )}
                                                    {isExam && (
                                                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                                                            <Clock className="w-3 h-3 text-amber-600" />
                                                            <span>Live Exam</span>
                                                        </span>
                                                    )}
                                                    {isClassUpload && (
                                                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-sky-50 text-sky-700 border border-sky-200 flex items-center gap-1">
                                                            <Video className="w-3 h-3 text-sky-600" />
                                                            <span>Class Upload</span>
                                                        </span>
                                                    )}
                                                    {isMaterial && (
                                                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-teal-50 text-teal-700 border border-teal-200 flex items-center gap-1">
                                                            <FileText className="w-3 h-3 text-teal-600" />
                                                            <span>Study Material</span>
                                                        </span>
                                                    )}
                                                    {isBookParcel && (
                                                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-orange-50 text-orange-700 border border-orange-200 flex items-center gap-1">
                                                            <Package className="w-3 h-3 text-orange-600" />
                                                            <span>Book / Parcel Delivery</span>
                                                        </span>
                                                    )}
                                                    {!isClass && !isExam && !isClassUpload && !isMaterial && !isBookParcel && (
                                                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                                                            <Calendar className="w-3 h-3 text-slate-600" />
                                                            <span>{item.type_label || 'General Schedule'}</span>
                                                        </span>
                                                    )}

                                                    {/* Status Badge */}
                                                    {item.status === 'live' ? (
                                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white flex items-center gap-1 shadow-xs animate-pulse">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                                                            <span>Live Now</span>
                                                        </span>
                                                    ) : item.status === 'completed' || item.status === 'delivered' ? (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                                                            {item.status === 'delivered' ? 'Delivered' : 'Completed'}
                                                        </span>
                                                    ) : item.status === 'shipped' ? (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                                                            <Truck className="w-3 h-3" />
                                                            <span>Shipped</span>
                                                        </span>
                                                    ) : item.status === 'published' ? (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                                            Published
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700">
                                                            Upcoming
                                                        </span>
                                                    )}

                                                    {item.subject && (
                                                        <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                                            {item.subject}
                                                        </span>
                                                    )}
                                                </div>

                                                <h4 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                                                    {item.title}
                                                </h4>

                                                {item.description && (
                                                    <p className="text-xs text-slate-500 line-clamp-1">
                                                        {item.description}
                                                    </p>
                                                )}

                                                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                                                    {isBookParcel && item.meta?.courier_name && (
                                                        <span className="flex items-center gap-1 text-orange-700 font-semibold bg-orange-50 px-2 py-0.5 rounded-md text-[11px]">
                                                            <Truck className="w-3.5 h-3.5" />
                                                            <span>Courier: {item.meta.courier_name}</span>
                                                            {item.meta.tracking_code && <span>(Tracking: {item.meta.tracking_code})</span>}
                                                        </span>
                                                    )}
                                                    {isClass && item.live_url && (
                                                        <span className="text-emerald-600 font-medium text-[11px] flex items-center gap-1">
                                                            <ExternalLink className="w-3 h-3" />
                                                            <span>YouTube Live Attached</span>
                                                        </span>
                                                    )}
                                                    {isExam && matchingLiveExam && (
                                                        <span className="text-amber-700 font-medium text-[11px] flex items-center gap-1">
                                                            <Award className="w-3 h-3 text-amber-500" />
                                                            <span>Total Marks: {matchingLiveExam.total_marks} | Questions: {matchingLiveExam.questions_count ?? 0}</span>
                                                        </span>
                                                    )}
                                                    {item.link_url && (
                                                        <span className="text-sky-600 font-medium text-[11px] flex items-center gap-1 truncate max-w-[200px]">
                                                            <Paperclip className="w-3 h-3 shrink-0" />
                                                            <span className="truncate">{item.action_text || 'Attached Link'}</span>
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex items-center gap-2 shrink-0 self-end md:self-auto border-t md:border-t-0 pt-2 md:pt-0 w-full md:w-auto justify-end">
                                            {isClass && (
                                                <>
                                                    <Link
                                                        to={`/student/live-class/${item.id}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors"
                                                        title="View Live Class"
                                                    >
                                                        <Radio className="w-3.5 h-3.5 text-rose-600" />
                                                        <span>Classroom</span>
                                                    </Link>

                                                    {matchingLiveClass && (
                                                        <button
                                                            onClick={() => openEditLiveClass(matchingLiveClass)}
                                                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                                            title="Edit Live Class"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                    )}

                                                    <button
                                                        onClick={() => handleDeleteLiveClass(item.id)}
                                                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                                        title="Delete Live Class"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}

                                            {isExam && (
                                                <>
                                                    <Link
                                                        to={`${examBasePath}/${item.id}/builder`}
                                                        className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors"
                                                        title="Question Builder"
                                                    >
                                                        <Edit className="w-3.5 h-3.5 text-amber-600" />
                                                        <span>Question Builder</span>
                                                    </Link>

                                                    <Link
                                                        to={`${examBasePath}/${item.id}/submissions`}
                                                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors"
                                                        title="Submissions"
                                                    >
                                                        <FileText className="w-3.5 h-3.5 text-emerald-600" />
                                                        <span>Results ({matchingLiveExam?.submissions_count ?? 0})</span>
                                                    </Link>

                                                    {matchingLiveExam && (
                                                        <button
                                                            onClick={() => openEditExam(matchingLiveExam)}
                                                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                                                            title="Edit Live Exam"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                    )}

                                                    <button
                                                        onClick={() => handleDetachExam(item.id, item.title)}
                                                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                                        title="Detach Exam"
                                                    >
                                                        <Unlink className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}

                                            {isCustom && (
                                                <>
                                                    {item.link_url && (
                                                        <a
                                                            href={item.link_url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors"
                                                        >
                                                            <ExternalLink className="w-3.5 h-3.5" />
                                                            <span>{item.action_text || 'View Link'}</span>
                                                        </a>
                                                    )}

                                                    <button
                                                        onClick={() => openEditRoutineItem(item)}
                                                        className="p-1.5 text-slate-400 hover:text-[#0B4B34] hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                                        title="Edit Schedule"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>

                                                    <button
                                                        onClick={() => handleDeleteRoutineItem(item.id, item.title)}
                                                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                                        title="Delete Schedule"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Outline / Custom Buttons Tab Content */}
            {activeTab === 'outline_buttons' && (
                <div className="space-y-6">
                    {/* Header Card */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                        <div>
                            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-indigo-600" />
                                <span>Course Outline & Custom Buttons</span>
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Manage course outline files, external links, and private community action buttons with student access keys.
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            {customButtonsSuccess && (
                                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>{customButtonsSuccess}</span>
                                </span>
                            )}
                            <button
                                onClick={handleSaveCustomButtons}
                                disabled={savingCustomButtons}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                            >
                                {savingCustomButtons ? (
                                    <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        <span>Saving...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-3.5 h-3.5" />
                                        <span>Save</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Section 1: Course Outline & Custom Buttons (Public) */}
                    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-sky-100 rounded-xl text-sky-700 shrink-0">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                        <span>Course Outline & Custom Buttons</span>
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-700 border border-sky-200">
                                            Public / Course Details Sidebar
                                        </span>
                                    </h4>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                        These buttons appear below the 'Enroll' button on the course details sidebar (e.g. Course Outline PDF, Syllabus link, How to Enroll).
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleAddActionButton}
                                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition cursor-pointer shrink-0"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>+ Add New Button</span>
                            </button>
                        </div>

                        <div className="space-y-3">
                            {actionButtons.map((btn) => (
                                <div
                                    key={btn.id}
                                    className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 shadow-2xs hover:border-slate-300 transition-colors"
                                >
                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                        {/* Button Label */}
                                        <div className="flex-1">
                                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                                Button Name (e.g. Course Outline / How to Enroll / Syllabus)
                                            </label>
                                            <input
                                                type="text"
                                                value={btn.label}
                                                onChange={(e) => handleUpdateButton(btn.id, { label: e.target.value })}
                                                placeholder="Enter button label"
                                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                                            />
                                        </div>

                                        {/* Type Selector: File Upload vs Link */}
                                        <div className="w-full sm:w-48">
                                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                                Type
                                            </label>
                                            <div className="inline-flex p-0.5 bg-slate-200/70 rounded-lg border border-slate-200 w-full">
                                                <button
                                                    type="button"
                                                    onClick={() => handleUpdateButton(btn.id, { type: 'file' })}
                                                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition cursor-pointer ${btn.type === 'file'
                                                        ? 'bg-white text-sky-700 shadow-2xs'
                                                        : 'text-slate-600 hover:text-slate-900'
                                                        }`}
                                                >
                                                    File Upload
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleUpdateButton(btn.id, { type: 'link' })}
                                                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition cursor-pointer ${btn.type === 'link'
                                                        ? 'bg-white text-sky-700 shadow-2xs'
                                                        : 'text-slate-600 hover:text-slate-900'
                                                        }`}
                                                >
                                                    Link
                                                </button>
                                            </div>
                                        </div>

                                        {/* Delete Button */}
                                        <div className="sm:pt-5 flex items-center justify-end">
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveActionButton(btn.id)}
                                                className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 transition cursor-pointer"
                                                title="Remove button"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Content based on type */}
                                    {btn.type === 'file' ? (
                                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2 border-t border-slate-200">
                                            <input
                                                type="file"
                                                id={`file-btn-${btn.id}`}
                                                className="hidden"
                                                onChange={(e) => handleUploadButtonFile(e, btn.id)}
                                            />
                                            <label
                                                htmlFor={`file-btn-${btn.id}`}
                                                className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold cursor-pointer transition shrink-0"
                                            >
                                                <Upload className="w-3.5 h-3.5 text-slate-500" />
                                                <span>
                                                    {uploadingButtonFileId === btn.id ? 'Uploading...' : 'Upload File (PDF/Doc/Image)'}
                                                </span>
                                            </label>

                                            {btn.url ? (
                                                <div className="flex-1 flex items-center justify-between px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-200 text-xs">
                                                    <span className="font-medium text-emerald-800 truncate max-w-xs">
                                                        {btn.file_name || btn.url}
                                                    </span>
                                                    <a
                                                        href={btn.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-emerald-700 hover:underline font-bold inline-flex items-center gap-1 ml-2"
                                                    >
                                                        View <ExternalLink className="w-3 h-3" />
                                                    </a>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-400">No file uploaded yet</span>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="pt-2 border-t border-slate-200">
                                            <input
                                                type="url"
                                                value={btn.url}
                                                onChange={(e) => handleUpdateButton(btn.id, { url: e.target.value })}
                                                placeholder="https://drive.google.com/... or enter URL"
                                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}

                            {actionButtons.length === 0 && (
                                <div className="text-center py-8 bg-slate-50/70 rounded-xl border border-dashed border-slate-200 space-y-2">
                                    <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                                    <p className="text-xs text-slate-500 font-medium">
                                        No public outline or action buttons added yet.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={handleAddActionButton}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        <span>Add Course Outline Button</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Section 2: Enrolled Students Action Buttons & Access Keys (Private) */}
                    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-indigo-200/80 shadow-xs space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-indigo-100">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-indigo-100 rounded-xl text-indigo-700 shrink-0">
                                    <KeyRound className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                        <span>Enrolled Students Action Buttons & Access Keys</span>
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">
                                            Private / Student Dashboard
                                        </span>
                                    </h4>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                        After enrolling, students see these buttons and their unique secret access key on their dashboard (e.g. Join Facebook Discussion Group, Telegram Channel).
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleAddEnrolledButton}
                                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition cursor-pointer shrink-0"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>+ Add Group Button</span>
                            </button>
                        </div>

                        <div className="space-y-3">
                            {enrolledButtons.map((btn) => (
                                <div
                                    key={btn.id}
                                    className="p-4 bg-gradient-to-r from-indigo-50/40 via-white to-sky-50/30 rounded-xl border border-indigo-200 space-y-3 shadow-2xs hover:border-indigo-300 transition-colors"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex-1">
                                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                                Button Name (e.g. Join our Facebook Discussion Group / Telegram Group)
                                            </label>
                                            <input
                                                type="text"
                                                value={btn.label}
                                                onChange={(e) => handleUpdateEnrolledButton(btn.id, { label: e.target.value })}
                                                placeholder="Enter button label"
                                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handleRemoveEnrolledButton(btn.id)}
                                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer shrink-0 mt-5"
                                            title="Delete button"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* URL Input */}
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                            Community or Group URL (Facebook / Telegram / Discord / WhatsApp)
                                        </label>
                                        <input
                                            type="url"
                                            value={btn.url}
                                            onChange={(e) => handleUpdateEnrolledButton(btn.id, { url: e.target.value })}
                                            placeholder="https://facebook.com/groups/your-group-name"
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>

                                    {/* Access Key Toggle */}
                                    <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/70 p-2.5 rounded-lg">
                                        <label className="flex items-center gap-2 cursor-pointer select-none">
                                            <input
                                                type="checkbox"
                                                checked={Boolean(btn.requires_access_key)}
                                                onChange={(e) => handleUpdateEnrolledButton(btn.id, { requires_access_key: e.target.checked })}
                                                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                            />
                                            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                                <Key className="w-3.5 h-3.5 text-amber-500" />
                                                <span>Does this button require a Student Access Key?</span>
                                            </span>
                                        </label>
                                        {btn.requires_access_key ? (
                                            <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 shrink-0">
                                                🔑 Verification Key Active
                                            </span>
                                        ) : (
                                            <span className="text-[11px] text-slate-400">
                                                Direct access without verification key
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {enrolledButtons.length === 0 && (
                                <div className="text-center py-8 bg-indigo-50/30 rounded-xl border border-dashed border-indigo-200 space-y-2">
                                    <KeyRound className="w-8 h-8 text-indigo-300 mx-auto" />
                                    <p className="text-xs text-slate-500 font-medium">
                                        No private community or enrolled buttons added yet.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={handleAddEnrolledButton}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        <span>Add Facebook/Community Group</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Bottom Save Bar */}
                    <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                        <span className="text-xs text-slate-500 font-medium">
                            Remember to save your changes after adding or updating buttons.
                        </span>
                        <button
                            type="button"
                            onClick={handleSaveCustomButtons}
                            disabled={savingCustomButtons}
                            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
                        >
                            {savingCustomButtons ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    <span>Save</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Reward Setup Tab Content */}
            {activeTab === 'reward_setup' && (
                <div className="space-y-6">
                    {/* Header Card */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                        <div>
                            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                <Award className="w-5 h-5 text-amber-500" />
                                <span>Course Reward Topics & Note Submissions</span>
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Set up topics where students can submit their lecture notes or study summaries to earn reward points.
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={openAddRewardTopicModal}
                                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                            >
                                <Plus className="w-4 h-4" />
                                <span>+ Add Topic</span>
                            </button>
                        </div>
                    </div>

                    {/* Topics List */}
                    {loadingRewardTopics ? (
                        <div className="bg-white p-12 rounded-2xl border border-slate-200/80 text-center space-y-3">
                            <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
                            <p className="text-xs font-bold text-slate-500">Loading reward topics...</p>
                        </div>
                    ) : rewardTopics.length === 0 ? (
                        <div className="bg-white p-12 rounded-2xl border border-slate-200/80 text-center space-y-4">
                            <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto">
                                <Award className="w-8 h-8" />
                            </div>
                            <div className="max-w-md mx-auto space-y-1">
                                <h4 className="font-extrabold text-sm text-slate-800">No Reward Topics Created Yet</h4>
                                <p className="text-xs text-slate-500">
                                    Create topics for this course so students can upload their handwritten or digital notes and earn reward points upon your approval.
                                </p>
                            </div>
                            <button
                                onClick={openAddRewardTopicModal}
                                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-1.5 transition-all"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Create First Topic</span>
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {rewardTopics.map((topic) => {
                                const pendingCount = topic.pending_submissions_count || 0;
                                const totalSubmissions = topic.submissions_count || 0;

                                return (
                                    <div
                                        key={topic.id}
                                        className="bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-amber-300 shadow-xs transition-all space-y-4 flex flex-col justify-between"
                                    >
                                        <div className="space-y-2">
                                            <div className="flex items-start justify-between gap-3">
                                                <h4 className="font-extrabold text-sm text-slate-900 line-clamp-2">
                                                    {topic.title}
                                                </h4>
                                                <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 shrink-0 flex items-center gap-1">
                                                    <Gem className="w-3 h-3 text-amber-600" />
                                                    <span>+{topic.points_reward}</span>
                                                </span>
                                            </div>

                                            {topic.description ? (
                                                <p className="text-xs text-slate-600 line-clamp-3">
                                                    {topic.description}
                                                </p>
                                            ) : (
                                                <p className="text-xs text-slate-400 italic">
                                                    No special instructions provided.
                                                </p>
                                            )}
                                        </div>

                                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                                            {/* Responses button */}
                                            <button
                                                type="button"
                                                onClick={() => handleOpenResponses(topic)}
                                                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${pendingCount > 0
                                                    ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs'
                                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                                    }`}
                                            >
                                                <MessageSquare className="w-3.5 h-3.5" />
                                                <span>Responses ({totalSubmissions})</span>
                                                {pendingCount > 0 && (
                                                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-white text-amber-700">
                                                        {pendingCount} new
                                                    </span>
                                                )}
                                            </button>

                                            {/* Action buttons */}
                                            <div className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => openEditRewardTopicModal(topic)}
                                                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                                                    title="Edit Topic"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteTopic(topic.id)}
                                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                                    title="Delete Topic"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Add / Edit Reward Topic Modal */}
            <Modal
                isOpen={isTopicModalOpen}
                onClose={() => setIsTopicModalOpen(false)}
                title={editingTopic ? 'Edit Reward Topic' : 'Add New Reward Topic'}
                maxWidth="md"
            >
                <form onSubmit={handleSaveTopic} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                            Topic Title <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. Chapter 3 Calculus & Integration Notes"
                            value={topicTitle}
                            onChange={(e) => setTopicTitle(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:border-amber-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                            Topic Description & Submission Guidelines:
                        </label>
                        <textarea
                            rows={3}
                            placeholder="Describe what students should upload (e.g. Upload clear photos of your handwriting or PDF formula sheet)."
                            value={topicDescription}
                            onChange={(e) => setTopicDescription(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:border-amber-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                            Points Reward (Upon Approval) <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                            <Sparkles className="w-4 h-4 text-amber-500 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="number"
                                min="1"
                                max="10000"
                                value={topicPointsReward}
                                onChange={(e) => setTopicPointsReward(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs font-extrabold text-slate-800 focus:outline-hidden focus:border-amber-500"
                                required
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                        <input
                            type="checkbox"
                            id="topicActiveToggle"
                            checked={topicIsActive}
                            onChange={(e) => setTopicIsActive(e.target.checked)}
                            className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                        />
                        <label htmlFor="topicActiveToggle" className="text-xs font-bold text-slate-700 cursor-pointer">
                            Active (Visible to students on Earn Points page)
                        </label>
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={() => setIsTopicModalOpen(false)}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={savingTopic}
                            className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                        >
                            {savingTopic && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            <span>Save Topic</span>
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Submissions Review Modal */}
            <Modal
                isOpen={isSubmissionsModalOpen}
                onClose={() => setIsSubmissionsModalOpen(false)}
                title={`Submissions: ${selectedTopicForSubmissions?.title || 'Topic Responses'}`}
                maxWidth="3xl"
            >
                <div className="space-y-4">
                    {/* Filter tabs */}
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                        {(['all', 'pending', 'approved', 'rejected'] as const).map((st) => (
                            <button
                                key={st}
                                onClick={() => setSubmissionStatusFilter(st)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${submissionStatusFilter === st
                                    ? 'bg-amber-500 text-white shadow-2xs'
                                    : 'text-slate-600 hover:bg-slate-100'
                                    }`}
                            >
                                {st}
                            </button>
                        ))}
                    </div>

                    {/* Submissions List */}
                    {loadingSubmissions ? (
                        <div className="py-12 text-center space-y-2">
                            <Loader2 className="w-7 h-7 text-amber-500 animate-spin mx-auto" />
                            <p className="text-xs font-bold text-slate-500">Loading submissions...</p>
                        </div>
                    ) : (
                        <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-1">
                            {submissionsList
                                .filter((s) => submissionStatusFilter === 'all' || s.status === submissionStatusFilter)
                                .length === 0 ? (
                                <div className="py-12 text-center text-slate-400 text-xs">
                                    No submissions found in this category.
                                </div>
                            ) : (
                                submissionsList
                                    .filter((s) => submissionStatusFilter === 'all' || s.status === submissionStatusFilter)
                                    .map((sub) => {
                                        const isPending = sub.status === 'pending';
                                        const isApproved = sub.status === 'approved';
                                        const isRejected = sub.status === 'rejected';
                                        const files = Array.isArray(sub.file_paths) ? sub.file_paths : [];

                                        return (
                                            <div
                                                key={sub.id}
                                                className="p-4 bg-slate-50/80 hover:bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3 transition"
                                            >
                                                {/* Student Header */}
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <p className="font-extrabold text-xs text-slate-900">
                                                            {sub.user?.name || `Student #${sub.user_id}`}
                                                        </p>
                                                        <p className="text-[11px] text-slate-500">
                                                            {sub.user?.phone || sub.user?.email} {sub.user?.registration_number ? `(${sub.user.registration_number})` : ''} • {new Date(sub.created_at).toLocaleDateString()}
                                                        </p>
                                                    </div>

                                                    <div>
                                                        {isApproved && (
                                                            <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                                                                <Check className="w-3.5 h-3.5" />
                                                                <span>Approved (+{sub.points_awarded})</span>
                                                            </span>
                                                        )}
                                                        {isPending && (
                                                            <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800">
                                                                Pending Review
                                                            </span>
                                                        )}
                                                        {isRejected && (
                                                            <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-rose-100 text-rose-800">
                                                                Rejected
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Note content */}
                                                <div className="space-y-1">
                                                    <h5 className="font-bold text-xs text-slate-800">
                                                        {sub.title}
                                                    </h5>
                                                    {sub.description && (
                                                        <p className="text-xs text-slate-600 whitespace-pre-line">
                                                            {sub.description}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Uploaded Files */}
                                                {files.length > 0 && (
                                                    <div className="space-y-1.5 pt-1">
                                                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                                            Attached Files ({files.length}):
                                                        </span>
                                                        <div className="flex flex-wrap gap-2">
                                                            {files.map((f: any, idx: number) => {
                                                                const fileUrl = typeof f === 'string' ? f : f?.url;
                                                                const fileName = f?.file_name || `Attachment ${idx + 1}`;
                                                                const isImage = fileUrl && (fileUrl.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i) || f?.file_type?.match(/(jpeg|jpg|png|webp)/i));

                                                                return (
                                                                    <div key={idx} className="flex items-center gap-1.5">
                                                                        {isImage ? (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => setPreviewFileModalUrl(fileUrl)}
                                                                                className="group relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 shrink-0 cursor-pointer"
                                                                            >
                                                                                <img
                                                                                    src={fileUrl}
                                                                                    alt={fileName}
                                                                                    className="w-full h-full object-cover group-hover:scale-105 transition"
                                                                                />
                                                                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                                                                                    <Eye className="w-4 h-4 text-white" />
                                                                                </div>
                                                                            </button>
                                                                        ) : (
                                                                            <a
                                                                                href={fileUrl}
                                                                                target="_blank"
                                                                                rel="noreferrer"
                                                                                className="px-3 py-1.5 bg-white border border-slate-200 hover:border-[#25a2ee] rounded-xl text-xs font-bold text-slate-700 hover:text-[#25a2ee] flex items-center gap-1.5 transition"
                                                                            >
                                                                                <Paperclip className="w-3.5 h-3.5" />
                                                                                <span className="max-w-[140px] truncate">{fileName}</span>
                                                                                <ExternalLink className="w-3 h-3 text-slate-400" />
                                                                            </a>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Rejection feedback display */}
                                                {sub.feedback && (
                                                    <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-800">
                                                        <span className="font-bold">Feedback / Reason: </span>
                                                        <span>{sub.feedback}</span>
                                                    </div>
                                                )}

                                                {/* Action buttons */}
                                                {isPending && (
                                                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => openRejectSubmissionModal(sub)}
                                                            disabled={reviewingSubmissionId === sub.id}
                                                            className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-rose-50 hover:border-rose-300 text-rose-600 text-xs font-bold rounded-xl transition"
                                                        >
                                                            Reject
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleApproveSubmission(sub)}
                                                            disabled={reviewingSubmissionId === sub.id}
                                                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition"
                                                        >
                                                            {reviewingSubmissionId === sub.id ? (
                                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                            ) : (
                                                                <Check className="w-3.5 h-3.5" />
                                                            )}
                                                            <span>Approve & Award Points</span>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                            )}
                        </div>
                    )}

                    <div className="flex justify-end pt-2 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={() => setIsSubmissionsModalOpen(false)}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Reject Feedback Reason Modal */}
            <Modal
                isOpen={rejectModalOpen}
                onClose={() => setRejectModalOpen(false)}
                title="Reject Note Submission"
                maxWidth="sm"
            >
                <form onSubmit={handleConfirmRejectSubmission} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                            Reason / Feedback for Student:
                        </label>
                        <textarea
                            rows={3}
                            placeholder="e.g. Note photos are blurry or formula sheet is incomplete."
                            value={rejectFeedbackText}
                            onChange={(e) => setRejectFeedbackText(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:border-rose-500"
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={() => setRejectModalOpen(false)}
                            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs"
                        >
                            Confirm Reject
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Image Preview Lightbox Modal */}
            {previewFileModalUrl && (
                <div
                    className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
                    onClick={() => setPreviewFileModalUrl(null)}
                >
                    <div className="relative max-w-4xl max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => setPreviewFileModalUrl(null)}
                            className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/90 text-white rounded-full transition"
                        >
                            ✕
                        </button>
                        <img
                            src={previewFileModalUrl}
                            alt="Preview"
                            className="w-full h-full max-h-[85vh] object-contain rounded-xl"
                        />
                    </div>
                </div>
            )}

            {/* Custom Routine Item Modal (Class Upload, Materials, Book/Parcel Delivery, Notice) */}
            <Modal
                isOpen={routineModalOpen}
                onClose={() => setRoutineModalOpen(false)}
                title={editingRoutineItem ? 'Edit Routine Schedule' : 'Add New Routine Schedule'}
                maxWidth="lg"
            >
                <form onSubmit={handleSaveRoutineItem} className="space-y-4">
                    {/* Routine Type Selector */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-2">
                            Select Schedule Type <span className="text-rose-500">*</span>
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <button
                                type="button"
                                onClick={() => setRoutineItemType('class_upload')}
                                className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${routineItemType === 'class_upload'
                                    ? 'border-sky-500 bg-sky-50 text-sky-700 ring-2 ring-sky-400/20 shadow-xs'
                                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                <Video className="w-5 h-5 text-sky-600" />
                                <span>Class Upload</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setRoutineItemType('material')}
                                className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${routineItemType === 'material'
                                    ? 'border-teal-500 bg-teal-50 text-teal-700 ring-2 ring-teal-400/20 shadow-xs'
                                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                <FileText className="w-5 h-5 text-teal-600" />
                                <span>Study Material</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setRoutineItemType('book_parcel')}
                                className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${routineItemType === 'book_parcel'
                                    ? 'border-orange-500 bg-orange-50 text-orange-700 ring-2 ring-orange-400/20 shadow-xs'
                                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                <Package className="w-5 h-5 text-orange-600" />
                                <span>Book / Parcel Delivery</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setRoutineItemType('general')}
                                className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${routineItemType === 'general'
                                    ? 'border-emerald-500 bg-emerald-50 text-[#0B4B34] ring-2 ring-emerald-400/20 shadow-xs'
                                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                <Calendar className="w-5 h-5 text-[#0B4B34]" />
                                <span>General Notice</span>
                            </button>
                        </div>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                            Title <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={routineItemTitle}
                            onChange={e => setRoutineItemTitle(e.target.value)}
                            placeholder={
                                routineItemType === 'class_upload'
                                    ? 'e.g. Physics Paper 1 - Dynamics Lecture 02 Upload'
                                    : routineItemType === 'material'
                                        ? 'e.g. Chemistry Chapter 1 Special Sheet & Practice Booklet PDF'
                                        : routineItemType === 'book_parcel'
                                            ? 'e.g. Physics Question Bank & Practice Book Courier Delivery'
                                            : 'e.g. Special Session / Important Notice'
                            }
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#0B4B34]"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Subject */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                Subject / Topic (Optional)
                            </label>
                            <input
                                type="text"
                                value={routineItemSubject}
                                onChange={e => setRoutineItemSubject(e.target.value)}
                                placeholder="e.g. Physics, Chemistry, English, Book Delivery"
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#0B4B34]"
                            />
                        </div>

                        {/* Status */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                Status
                            </label>
                            <select
                                value={routineItemStatus}
                                onChange={e => setRoutineItemStatus(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#0B4B34]"
                            >
                                <option value="upcoming">Upcoming</option>
                                <option value="published">Published / Uploaded</option>
                                {routineItemType === 'book_parcel' && (
                                    <>
                                        <option value="shipped">Shipped</option>
                                        <option value="delivered">Delivered</option>
                                    </>
                                )}
                                <option value="completed">Completed</option>
                            </select>
                        </div>
                    </div>

                    {/* Schedule Date & Times */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                Date & Start Time <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="datetime-local"
                                required
                                value={routineItemStartTime}
                                onChange={e => setRoutineItemStartTime(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#0B4B34]"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                End Time / Expected Delivery (Optional)
                            </label>
                            <input
                                type="datetime-local"
                                value={routineItemEndTime}
                                onChange={e => setRoutineItemEndTime(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#0B4B34]"
                            />
                        </div>
                    </div>

                    {/* Book / Parcel specific fields */}
                    {routineItemType === 'book_parcel' && (
                        <div className="p-4 rounded-2xl bg-orange-50/70 border border-orange-200/80 space-y-3">
                            <h4 className="text-xs font-bold text-orange-900 flex items-center gap-1.5">
                                <Truck className="w-4 h-4 text-orange-600" />
                                <span>Courier & Parcel Tracking Info</span>
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                        Courier Service
                                    </label>
                                    <input
                                        type="text"
                                        value={routineItemCourier}
                                        onChange={e => setRoutineItemCourier(e.target.value)}
                                        placeholder="e.g. Steadfast, Sundarban, RedX, Pathao"
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                        Tracking Code or Invoice No
                                    </label>
                                    <input
                                        type="text"
                                        value={routineItemTracking}
                                        onChange={e => setRoutineItemTracking(e.target.value)}
                                        placeholder="e.g. TRK-982341 or Invoice #402"
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-400"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Link & Action Button Text */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                Link / File / Tracking URL (Optional)
                            </label>
                            <input
                                type="url"
                                value={routineItemLinkUrl}
                                onChange={e => setRoutineItemLinkUrl(e.target.value)}
                                placeholder="https://..."
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#0B4B34]"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                Button Text (Optional)
                            </label>
                            <input
                                type="text"
                                value={routineItemActionText}
                                onChange={e => setRoutineItemActionText(e.target.value)}
                                placeholder={
                                    routineItemType === 'class_upload'
                                        ? 'e.g. Watch Class'
                                        : routineItemType === 'material'
                                            ? 'e.g. Download Note'
                                            : routineItemType === 'book_parcel'
                                                ? 'e.g. Track Parcel'
                                                : 'e.g. View Details'
                                }
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#0B4B34]"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                            Description / Note for Students (Optional)
                        </label>
                        <textarea
                            rows={3}
                            value={routineItemDesc}
                            onChange={e => setRoutineItemDesc(e.target.value)}
                            placeholder="Instructions, chapters or estimated delivery timeline for students..."
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#0B4B34]"
                        />
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={() => setRoutineModalOpen(false)}
                            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={savingRoutineItem}
                            className="px-5 py-2.5 bg-[#0B4B34] hover:bg-[#083827] text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-950/20 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                        >
                            {savingRoutineItem ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <>
                                    <Save className="w-3.5 h-3.5" />
                                    <span>{editingRoutineItem ? 'Update' : 'Save'}</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Create / Edit Exam Modal */}
            <Modal
                isOpen={examModalOpen}
                onClose={() => setExamModalOpen(false)}
                title={editingExam ? 'Edit Exam' : (examModalType === 'live' ? 'Create New Live Exam' : 'Create New Practice Exam')}
                maxWidth="lg"
            >
                <form onSubmit={handleSaveExam} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                            Exam Title <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={examTitle}
                            onChange={e => setExamTitle(e.target.value)}
                            placeholder={examModalType === 'live' ? 'e.g. Physics Chapter 1 - Live Weekly Test' : 'e.g. Chemistry Paper 1 Model Test - 01'}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                            Description & Instructions (Optional)
                        </label>
                        <textarea
                            rows={3}
                            value={examDesc}
                            onChange={e => setExamDesc(e.target.value)}
                            placeholder="Exam guidelines and instructions..."
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500"
                        />
                    </div>

                    {/* Live Exam Times Window */}
                    {examModalType === 'live' && (
                        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-3">
                            <div className="flex items-center gap-2 text-amber-900 text-xs font-bold">
                                <Clock className="w-4 h-4 text-amber-600" />
                                <span>Live Exam Schedule (Start & End) <span className="text-rose-500">*</span></span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                        Start Time
                                    </label>
                                    <input
                                        type="datetime-local"
                                        required
                                        value={examStartTime}
                                        onChange={e => setExamStartTime(e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                        End Time
                                    </label>
                                    <input
                                        type="datetime-local"
                                        required
                                        value={examEndTime}
                                        onChange={e => setExamEndTime(e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
                                    />
                                </div>
                            </div>
                            <p className="text-[11px] text-amber-800 leading-relaxed">
                                💡 <strong>Automatic Practice Conversion:</strong> As soon as this scheduled end time passes, the exam automatically converts into a <strong>Practice Exam</strong> so students can practice anytime.
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                Duration (Minutes) <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="1440"
                                required
                                value={examDuration}
                                onChange={e => setExamDuration(e.target.value)}
                                placeholder="30"
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                Pass Marks (Optional)
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="any"
                                value={examPassMarks}
                                onChange={e => setExamPassMarks(e.target.value)}
                                placeholder="0"
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500"
                            />
                        </div>
                    </div>

                    {/* Negative Marking */}
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                            <input
                                type="checkbox"
                                checked={examHasNegativeMarking}
                                onChange={e => setExamHasNegativeMarking(e.target.checked)}
                                className="rounded text-sky-600 focus:ring-sky-500"
                            />
                            <span>Enable Negative Marking</span>
                        </label>
                        {examHasNegativeMarking && (
                            <div className="flex items-center gap-2 pl-6">
                                <span className="text-xs text-slate-500">Marks deducted per wrong answer:</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.05"
                                    value={examNegativeMarks}
                                    onChange={e => setExamNegativeMarks(e.target.value)}
                                    placeholder="0.25"
                                    className="w-24 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-sky-500"
                                />
                            </div>
                        )}
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                        <div className="flex items-center gap-4 text-xs font-medium">
                            <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                    type="radio"
                                    name="exam_status"
                                    value="published"
                                    checked={examStatus === 'published'}
                                    onChange={() => setExamStatus('published')}
                                    className="text-sky-600"
                                />
                                <span>Published (Visible to students)</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                    type="radio"
                                    name="exam_status"
                                    value="draft"
                                    checked={examStatus === 'draft'}
                                    onChange={() => setExamStatus('draft')}
                                    className="text-sky-600"
                                />
                                <span>Draft</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={() => setExamModalOpen(false)}
                            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={savingExam}
                            className={`px-6 py-2.5 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${examModalType === 'live' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-sky-600 hover:bg-sky-700'
                                }`}
                        >
                            {savingExam ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>{editingExam ? 'Update' : 'Create'}</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Enhanced Attach Exam Modal */}
            <Modal
                isOpen={attachModalOpen}
                onClose={() => setAttachModalOpen(false)}
                title={attachExamType === 'live' ? 'Attach Live Exam to Course' : 'Attach Practice Exam to Course'}
                maxWidth="lg"
            >
                <div className="space-y-4">
                    {/* Mode Toggle */}
                    <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-xl">
                        <button
                            type="button"
                            onClick={() => setAttachExamType('practice')}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${attachExamType === 'practice'
                                ? 'bg-white text-sky-700 shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                                }`}
                        >
                            📝 As Practice Exam
                        </button>
                        <button
                            type="button"
                            onClick={() => setAttachExamType('live')}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${attachExamType === 'live'
                                ? 'bg-white text-amber-800 shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                                }`}
                        >
                            ⏰ As Live Exam
                        </button>
                    </div>

                    {attachExamType === 'live' && (
                        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/70 space-y-2.5">
                            <p className="text-xs font-bold text-amber-900 flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-amber-600" />
                                <span>Set Live Exam Schedule (Start & End Time)</span>
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-700 mb-0.5">Start Time</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        value={attachStartTime}
                                        onChange={e => setAttachStartTime(e.target.value)}
                                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-700 mb-0.5">End Time</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        value={attachEndTime}
                                        onChange={e => setAttachEndTime(e.target.value)}
                                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                                    />
                                </div>
                            </div>
                            <p className="text-[10px] text-amber-700">
                                💡 The exam automatically converts to practice mode once the end time passes.
                            </p>
                        </div>
                    )}

                    <p className="text-xs text-slate-500">
                        Select an exam from the list below:
                    </p>

                    {availableExams.length === 0 ? (
                        <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
                            <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
                            <p className="text-xs text-slate-600 font-medium">
                                No available exams found.
                            </p>
                            <button
                                type="button"
                                onClick={() => {
                                    setAttachModalOpen(false);
                                    openAddExam(attachExamType);
                                }}
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Create New Exam</span>
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleAttachExam} className="space-y-4">
                            <div className="relative">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={examSearch}
                                    onChange={e => setExamSearch(e.target.value)}
                                    placeholder="Search by exam name..."
                                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500"
                                />
                            </div>

                            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                                {availableExams
                                    .filter(e => !examSearch || e.title.toLowerCase().includes(examSearch.toLowerCase()))
                                    .map(exam => (
                                        <label
                                            key={exam.id}
                                            className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedExamId === String(exam.id)
                                                ? 'border-sky-500 bg-sky-50/50 ring-1 ring-sky-500'
                                                : 'border-slate-200 hover:bg-slate-50'
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name="selected_exam"
                                                value={exam.id}
                                                checked={selectedExamId === String(exam.id)}
                                                onChange={e => setSelectedExamId(e.target.value)}
                                                className="mt-1 text-sky-600 focus:ring-sky-500"
                                            />
                                            <div className="space-y-1 flex-1">
                                                <div className="font-bold text-xs text-slate-900">{exam.title}</div>
                                                <div className="flex items-center gap-3 text-[11px] text-slate-500">
                                                    <span>Time: {exam.duration_minutes} mins</span>
                                                    <span>•</span>
                                                    <span>Marks: {exam.total_marks}</span>
                                                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${exam.status === 'published' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                                                        }`}>
                                                        {exam.status}
                                                    </span>
                                                </div>
                                            </div>
                                        </label>
                                    ))}
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setAttachModalOpen(false)}
                                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!selectedExamId || attaching}
                                    className="px-5 py-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
                                >
                                    {attaching ? (
                                        <>
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            <span>Attaching...</span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            <span>Attach to Course</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </Modal>

            {/* Section Modal */}
            <Modal
                isOpen={sectionModalOpen}
                onClose={() => setSectionModalOpen(false)}
                title={editingSection ? 'Edit Section' : 'Create New Section'}
            >
                <form onSubmit={handleSaveSection} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Section / Topic Title *</label>
                        <input
                            type="text"
                            required
                            value={sectionTitle}
                            onChange={(e) => setSectionTitle(e.target.value)}
                            placeholder="e.g. Chapter 01 - Vectors and Mechanics"
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Short Description (Optional)</label>
                        <textarea
                            rows={3}
                            value={sectionDesc}
                            onChange={(e) => setSectionDesc(e.target.value)}
                            placeholder="Topics covered in this section..."
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm rounded-xl shadow-md"
                    >
                        Save Section
                    </button>
                </form>
            </Modal>

            {/* Lesson Modal */}
            <Modal
                isOpen={lessonModalOpen}
                onClose={() => setLessonModalOpen(false)}
                title={editingLesson ? 'Edit Lesson' : 'Create New Lesson'}
                maxWidth="xl"
            >
                <form onSubmit={handleSaveLesson} className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Lesson Title *</label>
                        <input
                            type="text"
                            required
                            value={lessonTitle}
                            onChange={(e) => setLessonTitle(e.target.value)}
                            placeholder="e.g. Lecture 01: Vector Resolution and Applications"
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500"
                        />
                    </div>

                    {/* Video Source Selection */}
                    <div className="space-y-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                    <Video className="w-4 h-4 text-[#25a2ee]" />
                                    <span>Video Source</span>
                                </label>
                                {lessonVideoProvider === 'vdocipher' && (
                                    <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200 flex items-center gap-1">
                                        <ShieldCheck className="w-3 h-3 text-purple-600" />
                                        DRM Protected
                                    </span>
                                )}
                            </div>
                            <select
                                value={lessonVideoProvider}
                                onChange={(e) => {
                                    const val = e.target.value as 'youtube' | 'vdocipher';
                                    setLessonVideoProvider(val);
                                    if (val === 'youtube' && (lessonVideoUrl.includes('[vdo') || /^[a-f0-9]{32}$/i.test(lessonVideoUrl.trim()))) {
                                        setLessonVideoUrl('');
                                    }
                                }}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-[#25a2ee]"
                            >
                                <option value="youtube">YouTube</option>
                                <option value="vdocipher">VdoCipher (DRM Anti-Piracy)</option>
                            </select>
                        </div>

                        {/* YouTube Video URL Input */}
                        {lessonVideoProvider === 'youtube' && (
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    YouTube Video URL
                                </label>
                                <input
                                    type="text"
                                    value={lessonVideoUrl}
                                    onChange={(e) => setLessonVideoUrl(e.target.value)}
                                    placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#25a2ee]"
                                />
                                <p className="text-[11px] text-slate-500 mt-1">
                                    Paste standard YouTube or unlisted video URL.
                                </p>
                            </div>
                        )}

                        {/* VdoCipher Upload & Shortcode Options */}
                        {lessonVideoProvider === 'vdocipher' && (
                            <div className="space-y-3 pt-1">
                                {/* Sub-mode Tabs */}
                                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                                    <button
                                        type="button"
                                        onClick={() => setVdoMode('upload')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${vdoMode === 'upload'
                                            ? 'bg-[#25a2ee] text-white shadow-xs'
                                            : 'text-slate-600 hover:bg-slate-200'
                                            }`}
                                    >
                                        <Upload className="w-3.5 h-3.5" />
                                        Upload Video
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setVdoMode('shortcode')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${vdoMode === 'shortcode'
                                            ? 'bg-[#25a2ee] text-white shadow-xs'
                                            : 'text-slate-600 hover:bg-slate-200'
                                            }`}
                                    >
                                        <FileText className="w-3.5 h-3.5" />
                                        Shortcode / Video ID
                                    </button>
                                </div>

                                {vdoMode === 'upload' ? (
                                    <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                                Select Video File to Upload
                                            </label>
                                            <input
                                                type="file"
                                                accept="video/mp4,video/quicktime,video/x-matroska,video/webm,video/x-msvideo,video/*"
                                                onChange={(e) => {
                                                    const f = e.target.files?.[0] || null;
                                                    setVdoSelectedFile(f);
                                                    setVdoUploadError(null);
                                                    setVdoUploadStatus('');
                                                }}
                                                disabled={vdoUploading}
                                                className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#25a2ee]/10 file:text-[#25a2ee] hover:file:bg-[#25a2ee]/20 cursor-pointer"
                                            />
                                            <p className="text-[11px] text-slate-500 mt-1">
                                                Direct high-speed upload to VdoCipher cloud storage with multi-bitrate DRM protection.
                                            </p>
                                        </div>

                                        {/* HandBrake Recommendation for Large Videos (1-3 GB) */}
                                        <div className="p-3.5 bg-gradient-to-r from-sky-50 via-sky-50/70 to-indigo-50/50 border border-sky-100 rounded-2xl text-xs space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-sky-950 flex items-center gap-1.5">
                                                    <Sparkles className="w-4 h-4 text-sky-600 shrink-0" />
                                                    Recommended for Large Videos (1-3 GB)
                                                </span>
                                                <a
                                                    href="https://handbrake.fr/"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 hover:text-sky-900 bg-white border border-sky-200 px-2.5 py-1 rounded-lg shadow-xs hover:bg-sky-50 transition"
                                                >
                                                    <span>Download HandBrake (Free)</span>
                                                    <ExternalLink className="w-3 h-3" />
                                                </a>
                                            </div>
                                            <p className="text-slate-600 leading-relaxed text-[11px]">
                                                For 10x faster uploads and to save your VdoCipher account quota, compress raw 1-3 GB recordings with HandBrake using the <span className="font-semibold text-slate-700">Fast 720p30</span> or <span className="font-semibold text-slate-700">Web 1080p30</span> preset before uploading. It takes only 1-2 minutes on your computer and compresses files down to <span className="font-bold text-emerald-700">~150-200 MB</span> without visual quality loss.
                                            </p>
                                        </div>

                                        {vdoSelectedFile && (
                                            <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                                                {/* File Info */}
                                                <div className="flex items-center justify-between">
                                                    <div className="min-w-0 pr-3">
                                                        <p className="text-xs font-bold text-slate-800 truncate flex items-center gap-1.5">
                                                            <Video className="w-4 h-4 text-sky-500 shrink-0" />
                                                            <span>{vdoSelectedFile.name}</span>
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-[11px] font-semibold text-slate-500">
                                                                 Size: {(vdoSelectedFile.size / (1024 * 1024)).toFixed(1)} MB
                                                                {vdoSelectedFile.size > 1024 * 1024 * 1024 ? ` (${(vdoSelectedFile.size / (1024 * 1024 * 1024)).toFixed(2)} GB)` : ''}
                                                            </span>
                                                            {vdoSelectedFile.size > 500 * 1024 * 1024 ? (
                                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                                                    Large File • HandBrake recommended
                                                                </span>
                                                            ) : (
                                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                                                    Ready to Upload
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {!vdoUploading && (
                                                        <button
                                                            type="button"
                                                            onClick={handleUploadToVdoCipher}
                                                            className="shrink-0 px-4 py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-sky-600/20 flex items-center gap-2 transition cursor-pointer"
                                                        >
                                                            <Upload className="w-4 h-4" />
                                                            <span>Upload to VdoCipher</span>
                                                        </button>
                                                    )}

                                                    {vdoUploading && (
                                                        <button
                                                            type="button"
                                                            onClick={handleCancelVdoUpload}
                                                            className="shrink-0 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition cursor-pointer"
                                                        >
                                                            Cancel
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Upload Progress Bar */}
                                        {vdoUploading && (
                                            <div className="space-y-1.5 pt-1">
                                                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                                                    <div
                                                        className="bg-[#25a2ee] h-2.5 rounded-full transition-all duration-200"
                                                        style={{ width: `${vdoUploadProgress}%` }}
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between text-[11px] text-slate-600 font-medium">
                                                    <span>{vdoUploadStatus}</span>
                                                    <span>{vdoUploadProgress}%</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Upload Error */}
                                        {vdoUploadError && (
                                            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
                                                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                                                <span>{vdoUploadError}</span>
                                            </div>
                                        )}

                                        {/* Upload Success Badge */}
                                        {lessonVideoUrl && (lessonVideoUrl.length === 32 || vdoUploadedVideoId) && (
                                            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs space-y-1">
                                                <div className="flex items-center gap-1.5 font-bold">
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                                    <span>Video Attached to Lesson!</span>
                                                </div>
                                                <p className="font-mono text-[11px] text-emerald-900 break-all">
                                                    Video ID: {lessonVideoUrl}
                                                </p>
                                                <p className="text-[10px] text-emerald-700">
                                                    VdoCipher cloud encoding is running. It will be protected with dynamic student watermarking.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-2 bg-white p-4 rounded-xl border border-slate-200">
                                        <label className="block text-xs font-bold text-slate-700">
                                            VdoCipher Video ID or Shortcode
                                        </label>
                                        <input
                                            type="text"
                                            value={lessonVideoUrl}
                                            onChange={(e) => setLessonVideoUrl(e.target.value)}
                                            placeholder='e.g. 1234567890abcdef1234567890abcdef or [vdo id="..."]'
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-[#25a2ee]"
                                        />
                                        <p className="text-[11px] text-slate-500">
                                            Enter the 32-character Video ID from your VdoCipher dashboard, or paste the WordPress embed shortcode <code className="bg-slate-100 px-1 py-0.5 rounded text-[10px]">[vdo id="..."]</code> or iframe embed code.
                                        </p>
                                        {lessonVideoUrl && (
                                            <div className="pt-1">
                                                {(() => {
                                                    const cleanId = extractVdoCipherId(lessonVideoUrl);
                                                    const isShortcode = lessonVideoUrl.includes('[vdo') || lessonVideoUrl.includes('[vdocipher');
                                                    const isIframe = lessonVideoUrl.includes('<iframe');

                                                    if (cleanId && cleanId.length === 32) {
                                                        return (
                                                            <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                                                                <span className="inline-flex items-center gap-1.5 font-semibold">
                                                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                                                    <span>
                                                                        {isShortcode ? 'Shortcode detected (Video ID: ' : 'Valid Video ID: '}
                                                                        <code className="font-mono text-emerald-950 font-bold">{cleanId}</code>
                                                                        {isShortcode ? ')' : ''}
                                                                    </span>
                                                                </span>
                                                                {isShortcode && cleanId !== lessonVideoUrl.trim() && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setLessonVideoUrl(cleanId)}
                                                                        className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] cursor-pointer"
                                                                    >
                                                                        Convert to ID
                                                                    </button>
                                                                )}
                                                            </div>
                                                        );
                                                    }
                                                    if (isIframe) {
                                                        return (
                                                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-200">
                                                                <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                                                                VdoCipher Embed Iframe detected
                                                            </span>
                                                        );
                                                    }
                                                    return (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                                                            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                                                            Enter a valid 32-character Video ID or [vdo id=&quot;...&quot;] shortcode
                                                        </span>
                                                    );
                                                })()}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Lesson Duration (Minutes)</label>
                            <input
                                type="number"
                                min={0}
                                value={lessonDuration}
                                onChange={(e) => setLessonDuration(e.target.value)}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#25a2ee]"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Detailed Lesson Notes / Reading Material</label>
                        <textarea
                            rows={4}
                            value={lessonContent}
                            onChange={(e) => setLessonContent(e.target.value)}
                            placeholder="Instructions, key formulas, or discussion..."
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500"
                        />
                    </div>

                    {/* Preview & Status Checkboxes */}
                    <div className="flex flex-wrap items-center gap-6 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                            <input
                                type="checkbox"
                                checked={lessonIsPreview}
                                onChange={(e) => setLessonIsPreview(e.target.checked)}
                                className="w-4 h-4 text-sky-600 rounded border-slate-300"
                            />
                            <span>Free Preview Lesson (Students can watch without purchasing)</span>
                        </label>

                        <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                            <span>Status:</span>
                            <select
                                value={lessonStatus}
                                onChange={(e) => setLessonStatus(e.target.value as any)}
                                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs"
                            >
                                <option value="published">Published</option>
                                <option value="draft">Draft</option>
                            </select>
                        </div>
                    </div>

                    {/* Uploaded Attachments in Edit mode */}
                    {editingLesson && (
                        <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                            <div className="flex items-center justify-between">
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Attached Study Materials ({editingLesson.attachments?.length || 0})
                                </label>
                                <button
                                    type="button"
                                    onClick={() => openMaterialModal(editingLesson)}
                                    className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 cursor-pointer"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Add Material (Upload / Drive Link)</span>
                                </button>
                            </div>
                            {editingLesson.attachments && editingLesson.attachments.length > 0 && (
                                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                                    {editingLesson.attachments.map((att) => {
                                        const isLink = att.file_path?.startsWith('http') || att.file_type === 'link' || att.file_type === 'google_drive';
                                        const isDrive = att.file_type === 'google_drive' || att.file_path?.includes('drive.google.com') || att.file_path?.includes('docs.google.com');
                                        return (
                                            <div key={att.id} className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                                                <div className="flex items-center gap-2 truncate mr-2">
                                                    {isDrive ? (
                                                        <Globe className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                                    ) : isLink ? (
                                                        <ExternalLink className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                                                    ) : (
                                                        <Paperclip className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                                                    )}
                                                    <span className="font-semibold truncate">{att.file_name}</span>
                                                    <span className="text-slate-400 text-[10px]">
                                                        {isDrive ? '(Google Drive)' : isLink ? '(Web Link)' : `(${att.file_type.toUpperCase()})`}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1 shrink-0">
                                                    <a
                                                        href={isLink ? att.file_path : `/api/learning/attachments/${att.id}/download${localStorage.getItem('auth_token') ? `?token=${encodeURIComponent(localStorage.getItem('auth_token') || '')}` : ''}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-slate-400 hover:text-sky-600 p-1"
                                                        title="View / Preview"
                                                    >
                                                        <ExternalLink className="w-3.5 h-3.5" />
                                                    </a>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteAttachment(att.id)}
                                                        className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm rounded-xl shadow-md"
                    >
                        Save Lesson
                    </button>
                </form>
            </Modal>

            {/* Live Class Modal */}
            <Modal
                isOpen={liveClassModalOpen}
                onClose={() => setLiveClassModalOpen(false)}
                title={editingLiveClass ? 'Edit Live Class' : 'Create New Live Class'}
            >
                <form onSubmit={handleSaveLiveClass} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                            Class Title / Topic *
                        </label>
                        <input
                            type="text"
                            required
                            value={liveClassTitle}
                            onChange={(e) => setLiveClassTitle(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:border-sky-500 focus:outline-hidden"
                            placeholder="e.g. Physics 1st Paper - Dynamics Live Class 01"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                            YouTube Live Link (Unlisted Live Stream URL) *
                        </label>
                        <input
                            type="text"
                            required
                            value={liveClassUrl}
                            onChange={(e) => setLiveClassUrl(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:border-sky-500 focus:outline-hidden"
                            placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                        />
                        <p className="text-[11px] text-slate-400 mt-1">
                            Start an Unlisted Live stream from YouTube Studio and paste its link here. Students will be able to join and comment directly during the class.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                Class Start Time *
                            </label>
                            <input
                                type="datetime-local"
                                required
                                value={liveClassStartTime}
                                onChange={(e) => setLiveClassStartTime(e.target.value)}
                                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:border-sky-500 focus:outline-hidden"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                Estimated End Time (Optional)
                            </label>
                            <input
                                type="datetime-local"
                                value={liveClassEndTime}
                                onChange={(e) => setLiveClassEndTime(e.target.value)}
                                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:border-sky-500 focus:outline-hidden"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                            Status
                        </label>
                        <select
                            value={liveClassStatus}
                            onChange={(e: any) => setLiveClassStatus(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:border-sky-500 focus:outline-hidden"
                        >
                            <option value="upcoming">Upcoming</option>
                            <option value="live">🔴 Live Now</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                            Description or Syllabus (Optional)
                        </label>
                        <textarea
                            rows={3}
                            value={liveClassDesc}
                            onChange={(e) => setLiveClassDesc(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:border-sky-500 focus:outline-hidden"
                            placeholder="Topics to be covered in this live class..."
                        />
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={savingLiveClass}
                            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                        >
                            {savingLiveClass && <Loader2 className="w-4 h-4 animate-spin" />}
                            <span>{savingLiveClass ? 'Saving...' : editingLiveClass ? 'Update Live Class' : 'Create Live Class'}</span>
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Study Material Modal (Upload File or Google Drive / External Link) */}
            <Modal
                isOpen={materialModalOpen}
                onClose={() => {
                    setMaterialModalOpen(false);
                    setMaterialLesson(null);
                }}
                title="Study Materials & Resources"
            >
                {activeMaterialLesson && (
                    <div className="space-y-5">
                        {/* Target Lesson Info */}
                        <div className="p-3.5 rounded-2xl bg-sky-50/80 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/60 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0">
                                <FileText className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                                <div className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
                                    Lesson Title
                                </div>
                                <div className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white truncate">
                                    {activeMaterialLesson.title}
                                </div>
                            </div>
                        </div>

                        {/* Option Tabs: 1) File Upload, 2) Link */}
                        <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                            <button
                                type="button"
                                onClick={() => setMaterialTab('upload')}
                                className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${materialTab === 'upload'
                                    ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                    }`}
                            >
                                <Upload className="w-4 h-4" />
                                <span>File Upload</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setMaterialTab('link')}
                                className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${materialTab === 'link'
                                    ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                    }`}
                            >
                                <Globe className="w-4 h-4" />
                                <span>Link</span>
                            </button>
                        </div>

                        {/* TAB 1: FILE UPLOAD */}
                        {materialTab === 'upload' && (
                            <div className="space-y-4">
                                <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-sky-500 dark:hover:border-sky-500 rounded-2xl p-6 text-center transition-colors">
                                    <input
                                        type="file"
                                        id="modal-attachment-file"
                                        className="hidden"
                                        disabled={uploadingAttachment}
                                        onChange={(e) => handleUploadAttachment(e, activeMaterialLesson.id)}
                                    />
                                    <label
                                        htmlFor="modal-attachment-file"
                                        className="cursor-pointer block space-y-2"
                                    >
                                        <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 mx-auto flex items-center justify-center">
                                            {uploadingAttachment ? (
                                                <Loader2 className="w-6 h-6 animate-spin" />
                                            ) : (
                                                <Upload className="w-6 h-6" />
                                            )}
                                        </div>
                                        <div>
                                            <span className="text-xs font-bold text-sky-600 hover:underline">
                                                Select file from device
                                            </span>
                                            <p className="text-[11px] text-slate-400 mt-1">
                                                PDF, DOC, DOCX, PPT, PPTX, ZIP, etc. (Max 50 MB)
                                            </p>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* TAB 2: LINK */}
                        {materialTab === 'link' && (
                            <form onSubmit={handleSaveMaterialLink} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        Title / Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={materialLinkTitle}
                                        onChange={(e) => setMaterialLinkTitle(e.target.value)}
                                        placeholder="e.g. Lecture Sheet (Google Drive or Web Link)"
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-medium focus:border-purple-500 focus:outline-hidden dark:bg-slate-800 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        URL / Link *
                                    </label>
                                    <input
                                        type="url"
                                        required
                                        value={materialLinkUrl}
                                        onChange={(e) => setMaterialLinkUrl(e.target.value)}
                                        placeholder="https://drive.google.com/... or https://..."
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-mono focus:border-purple-500 focus:outline-hidden dark:bg-slate-800 dark:text-white"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={submittingLink || !materialLinkTitle.trim() || !materialLinkUrl.trim()}
                                    className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md shadow-purple-600/20 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    {submittingLink ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                    <span>Save Link</span>
                                </button>
                            </form>
                        )}

                        {/* List of currently attached study materials */}
                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                                <span>Attached Materials ({activeMaterialLesson.attachments?.length || 0})</span>
                            </div>

                            {(!activeMaterialLesson.attachments || activeMaterialLesson.attachments.length === 0) ? (
                                <div className="p-6 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
                                    <Paperclip className="w-6 h-6 text-slate-400 mx-auto" />
                                    <p className="text-xs text-slate-500">No study materials attached yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                                    {activeMaterialLesson.attachments.map((att) => {
                                        const isLink = att.file_path?.startsWith('http') || att.file_type === 'link' || att.file_type === 'google_drive';
                                        const isDrive = att.file_type === 'google_drive' || att.file_path?.includes('drive.google.com') || att.file_path?.includes('docs.google.com');

                                        return (
                                            <div
                                                key={att.id}
                                                className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 text-xs"
                                            >
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isDrive
                                                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-600'
                                                        : isLink
                                                            ? 'bg-purple-100 dark:bg-purple-950 text-purple-600'
                                                            : 'bg-sky-100 dark:bg-sky-950 text-sky-600'
                                                        }`}>
                                                        {isDrive ? (
                                                            <Globe className="w-4 h-4" />
                                                        ) : isLink ? (
                                                            <ExternalLink className="w-4 h-4" />
                                                        ) : (
                                                            <FileText className="w-4 h-4" />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="font-bold text-slate-900 dark:text-white truncate">
                                                            {att.file_name}
                                                        </div>
                                                        <div className="text-[10px] text-slate-400 font-mono">
                                                            {isDrive ? (
                                                                <span className="text-amber-600 font-semibold">Google Drive Link</span>
                                                            ) : isLink ? (
                                                                <span className="text-purple-600 font-semibold">Web Link</span>
                                                            ) : (
                                                                <span>{att.file_type?.toUpperCase()} • {att.formatted_size || `${Math.round((att.file_size || 0) / 1024)} KB`}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    <a
                                                        href={isLink ? att.file_path : `/api/learning/attachments/${att.id}/download${localStorage.getItem('auth_token') ? `?token=${encodeURIComponent(localStorage.getItem('auth_token') || '')}` : ''}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition"
                                                        title="Open / Test Link"
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                    </a>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteAttachment(att.id)}
                                                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};
