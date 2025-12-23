/**
 * CourseDetailDayBased - Day-Based Course Content Page
 * 
 * Features:
 * - Each day contains: Video + PDF + Quiz
 * - Day unlocks only after previous day's quiz is passed (>=60%)
 * - Progress tracking per day
 * - Clean, beginner-friendly UI
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { 
  ArrowLeft, 
  Video, 
  FileText, 
  HelpCircle, 
  CheckCircle, 
  Lock, 
  PlayCircle,
  Clock,
  BookOpen,
  Calendar,
  Download
} from 'lucide-react';

export const CourseDetailDayBased = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  
  // State management
  const [course, setCourse] = useState(null);
  const [days, setDays] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [lastAccessedLessonId, setLastAccessedLessonId] = useState(null);
  const [lessonContent, setLessonContent] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('video'); // 'video', 'pdf', 'quiz'
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizResult, setQuizResult] = useState(null);

  // Derived state: has the quiz for the current day/lesson already been completed/passed?
  const quizCompleted = !!(
    quizResult?.passed ||
    progress?.quiz_passed ||
    quiz?.progress?.quiz_passed ||
    // If the day itself is marked completed and has a quiz, treat quiz as completed
    (selectedDay?.isCompleted && selectedDay?.quiz)
  );

  // Load lesson content (no side effects on progress)
  const loadLessonContent = async (lesson) => {
    if (!lesson) return;

    try {
      setSelectedLesson(lesson);

      // Fetch lesson content
      const { data } = await api.get(`/lessons/${lesson.id}/content`);
      
      setLessonContent(data.content);
      setQuiz(data.quiz);
      setProgress(data.progress);

      // If this is a quiz lesson and the user already passed it, reflect that state in the UI
      if (lesson.lesson_type === 'quiz' && data.progress?.quiz_passed) {
        const totalQuestions = data.quiz?.questions?.length || 0;
        const score = data.progress.quiz_score ?? 100;
        const passingScore = data.quiz?.passing_score || 60;

        setQuizSubmitted(true);
        setQuizResult({
          score,
          correctAnswers: totalQuestions, // best-effort; exact count comes from stored attempts
          totalQuestions,
          passed: true,
          passingScore
        });
      }
    } catch (err) {
      console.error('Error loading lesson content:', err);
      alert('Failed to load lesson content: ' + (err.response?.data?.error || err.message));
    }
  };

  // Select a day and load its content
  const handleSelectDay = async (day, force = false) => {
    if (!force && !day.isUnlocked && !day.isCompleted) {
      alert(`Day ${day.day_number} is locked. Please complete Day ${day.day_number - 1} quiz first.`);
      return;
    }

    setSelectedDay(day);
    setQuizAnswers({});

    // If this day is already completed (quiz passed), keep quiz in completed state
    if (day.isCompleted && day.quiz?.progress?.quiz_passed) {
      setQuizSubmitted(true);
      setQuizResult(prev => prev || {
        score: day.quiz.progress.quiz_score ?? 100,
        correctAnswers: day.quiz.progress.correct_answers ?? (quiz?.questions?.length || 0),
        totalQuestions: quiz?.questions?.length || 0,
        passed: true,
        passingScore: day.quiz.progress.passing_score || 60,
      });
    } else {
      setQuizSubmitted(false);
      setQuizResult(null);
    }

    // Auto-select video tab if available
    if (day.video) {
      setActiveTab('video');
      await loadLessonContent(day.video);
    } else if (day.pdf) {
      setActiveTab('pdf');
      await loadLessonContent(day.pdf);
    } else if (day.quiz) {
      setActiveTab('quiz');
      await loadLessonContent(day.quiz);
    }
  };

  // Fetch day-based course structure
  const fetchCourseDays = async () => {
    try {
      setLoading(true);
      setError('');

      // Get enrollment to verify access
      const { data: enrollments } = await api.get('/enrollments');
      const enrollment = (enrollments || []).find(e => e.course_id === courseId);

      if (!enrollment) {
        setError('You are not enrolled in this course.');
        return;
      }

      setCourse(enrollment.course);
      setLastAccessedLessonId(enrollment.last_accessed_lesson_id || null);

      // Get day-based course structure
      const { data: daysData } = await api.get(`/courses/${courseId}/days`);
      
      const daysArray = daysData?.days || [];
      setDays(daysArray);

      // Return days so callers (like quiz submit) can act on the latest data
      return daysArray;
    } catch (err) {
      console.error('Error fetching course days:', err);
      setError(err.response?.data?.error || 'Failed to load course content');
    } finally {
      setLoading(false);
    }
  };

  // Fetch course days on mount
  useEffect(() => {
    if (courseId) {
      fetchCourseDays();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  // Auto-select a day when days are loaded and none is selected
  useEffect(() => {
    if (!selectedDay && days && days.length > 0) {
      // 1) If we know the last accessed lesson from enrollment, restore that day
      if (lastAccessedLessonId) {
        const dayFromLastLesson = days.find(d =>
          d.video?.id === lastAccessedLessonId ||
          d.pdf?.id === lastAccessedLessonId ||
          d.quiz?.id === lastAccessedLessonId
        );

        if (dayFromLastLesson) {
          handleSelectDay(dayFromLastLesson, true);
          return;
        }
      }

      // 2) Fallback: prefer the highest unlocked day (continuous flow)
      const unlockedDays = days.filter(d => d.isUnlocked);

      if (unlockedDays.length > 0) {
        // Among unlocked days, try to find the first one that is not yet completed
        const nextInFlow = unlockedDays.find(d => !d.isCompleted);
        const targetDay = nextInFlow || unlockedDays[unlockedDays.length - 1];

        // Force selection to ensure we don't get blocked by stale isUnlocked flags
        handleSelectDay(targetDay, true);
      }
    }
    // We intentionally omit handleSelectDay from deps to avoid re-triggering on each render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days, selectedDay, lastAccessedLessonId]);

  // Handle tab change
  const handleTabChange = async (tab, lesson) => {
    setActiveTab(tab);
    if (lesson) {
      await loadLessonContent(lesson);
    }
  };

  // Handle video watched
  const handleVideoWatched = async () => {
    if (!selectedLesson || progress?.video_watched) return;

    try {
      const { data } = await api.post(`/lessons/${selectedLesson.id}/progress`, {
        videoWatched: true
      });

      setProgress(data.progress);
      await fetchCourseDays(); // Refresh to update completion status

      // After video is marked watched, automatically move to PDF for this day (if available)
      if (selectedDay?.pdf) {
        setActiveTab('pdf');
        await loadLessonContent(selectedDay.pdf);
      }
    } catch (err) {
      console.error('Error updating video progress:', err);
    }
  };

  // Handle PDF viewed
  const handlePdfViewed = async () => {
    if (!selectedLesson || progress?.pdf_viewed) return;

    try {
      const { data } = await api.post(`/lessons/${selectedLesson.id}/progress`, {
        pdfViewed: true
      });

      setProgress(data.progress);
      await fetchCourseDays(); // Refresh to update completion status

      // After PDF is viewed, automatically move to Quiz for this day (if available)
      if (selectedDay?.quiz) {
        setActiveTab('quiz');
        await loadLessonContent(selectedDay.quiz);
      }
    } catch (err) {
      console.error('Error updating PDF progress:', err);
    }
  };

  // Handle quiz answer selection
  const handleQuizAnswer = (questionId, optionIndex) => {
    if (quizSubmitted) return;
    setQuizAnswers({
      ...quizAnswers,
      [questionId]: optionIndex
    });
  };

  // Submit quiz
  const handleSubmitQuiz = async () => {
    if (!quiz || !selectedDay || !selectedLesson) return;

    const questions = quiz.questions || [];
    let correctAnswers = 0;
    const answers = {};

    // Calculate score
    questions.forEach(question => {
      const selectedOptionIndex = quizAnswers[question.id];
      if (selectedOptionIndex !== undefined) {
        const selectedOption = question.options[selectedOptionIndex];
        answers[question.id] = selectedOption.id;
        
        if (selectedOption.is_correct) {
          correctAnswers++;
        }
      }
    });

    const totalQuestions = questions.length;
    const score = Math.round((correctAnswers / totalQuestions) * 100);
    const passingScore = quiz.passing_score || 60;
    const passed = score >= passingScore;

    setQuizSubmitted(true);
    setQuizResult({
      score,
      correctAnswers,
      totalQuestions,
      passed,
      passingScore
    });

    // Update progress on the backend
    try {
      const { data } = await api.post(`/lessons/${selectedLesson.id}/progress`, {
        quizScore: score,
        quizPassed: passed,
        totalQuestions,
        correctAnswers,
        answers
      });

      setProgress(data.progress);

      if (passed && selectedDay) {
        const currentDayNumber = selectedDay.day_number;
        const nextDayNumber = currentDayNumber + 1;

        // Create an updated copy of days so we can both update state and navigate correctly
        const updatedDays = (days || []).map(day => {
          if (day.day_number === currentDayNumber) {
            return { ...day, isCompleted: true };
          }
          if (day.day_number === nextDayNumber) {
            return { ...day, isUnlocked: true };
          }
          return day;
        });

        setDays(updatedDays);

        // Refresh from backend so sidebar counts (attempts, completed days) stay in sync
        await fetchCourseDays();

        // Dispatch custom event to notify other pages that progress has been updated
        window.dispatchEvent(new CustomEvent('courseProgressUpdated', {
          detail: { courseId, dayNumber: currentDayNumber }
        }));

        // Store timestamp in localStorage so pages can check for updates when navigated to
        localStorage.setItem('courseProgressLastUpdate', Date.now().toString());

        // Auto-navigate to attendance page with pre-filled details
        const today = new Date().toISOString().split('T')[0];
        const sessionLabel = `Day ${currentDayNumber}`;
        
        // Get current time for check-in (HH:MM format)
        const now = new Date();
        const checkInTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        
        // Set check-out time to 2 hours later (or user can modify)
        const checkOutDate = new Date(now.getTime() + 2 * 60 * 60 * 1000); // Add 2 hours
        const checkOutTime = `${String(checkOutDate.getHours()).padStart(2, '0')}:${String(checkOutDate.getMinutes()).padStart(2, '0')}`;
        
        console.log('Quiz passed! Navigating to attendance page...', {
          courseId,
          session: sessionLabel,
          dayNumber: currentDayNumber,
          checkInTime,
          checkOutTime
        });
        
        // Navigate immediately after quiz passes
        navigate('/attendance', {
          state: {
            fromCourseDetail: true,
            courseId: courseId,
            session: sessionLabel,
            date: today,
            dayNumber: currentDayNumber,
            courseTitle: course?.title || 'Course',
            checkInTime: checkInTime,
            checkOutTime: checkOutTime
          },
          replace: false // Allow back button to work
        });
      } else if (!passed) {
        alert(`Quiz not passed. Score: ${score}%\n\nYou need at least ${passingScore}% to pass. Please review and try again.`);
      }
    } catch (err) {
      console.error('Error submitting quiz:', err);
      alert('Failed to save quiz results: ' + (err.response?.data?.error || err.message));
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading course content...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/enrollments')}
            className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            Back to Enrollments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/enrollments')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {course?.title || 'Course Content'}
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  {course?.description || 'Learn at your own pace'}
                </p>
              </div>
            </div>
            {days.length > 0 && (
              <div className="text-right">
                <div className="text-sm text-gray-600">Progress</div>
                <div className="text-lg font-bold text-orange-600">
                  {days.filter(d => d.isCompleted).length} / {days.length} Days
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Side - Main Content Area */}
          <div className="lg:col-span-2">
            {selectedDay && selectedLesson ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                {/* Day Header */}
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-amber-50">
                  <div className="flex items-center gap-3 mb-2">
                    <Calendar className="w-6 h-6 text-orange-600" />
                    <h2 className="text-2xl font-bold text-gray-900">
                      Day {selectedDay.day_number}
                    </h2>
                    {selectedDay.isCompleted && (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    )}
                  </div>
                  <p className="text-gray-600">
                    Complete all three components: Video, PDF Notes, and Quiz
                  </p>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200">
                  <div className="flex">
                    {selectedDay.video && (
                      <button
                        onClick={() => handleTabChange('video', selectedDay.video)}
                        className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                          activeTab === 'video'
                            ? 'border-orange-600 text-orange-600'
                            : 'border-transparent text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <Video className="w-4 h-4 inline mr-2" />
                        Video Lesson
                      </button>
                    )}
                    {selectedDay.pdf && (
                      <button
                        onClick={() => handleTabChange('pdf', selectedDay.pdf)}
                        className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                          activeTab === 'pdf'
                            ? 'border-orange-600 text-orange-600'
                            : 'border-transparent text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <FileText className="w-4 h-4 inline mr-2" />
                        PDF Notes
                      </button>
                    )}
                    {selectedDay.quiz && (
                      <button
                        onClick={() => handleTabChange('quiz', selectedDay.quiz)}
                        className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                          activeTab === 'quiz'
                            ? 'border-orange-600 text-orange-600'
                            : 'border-transparent text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <HelpCircle className="w-4 h-4 inline mr-2" />
                        {(() => {
                          const attempts =
                            progress?.quiz_attempts ??
                            selectedDay.quiz.progress?.quiz_attempts ??
                            0;
                          return `Quiz (${attempts} attempt${attempts === 1 ? '' : 's'})`;
                        })()}
                      </button>
                    )}
                  </div>
                </div>

                {/* Content Area */}
                <div className="p-6">
                  {/* Video Tab */}
                  {activeTab === 'video' && selectedDay.video && lessonContent && (
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-4">
                        {lessonContent.title || `Day ${selectedDay.day_number} Video Lesson`}
                      </h3>
                      <div
                        className="aspect-video bg-gray-900 rounded-lg overflow-hidden mb-4 relative cursor-pointer"
                        onClick={() => {
                          // Only mark as watched when user actually clicks on the video area
                          if (!progress?.video_watched) {
                            handleVideoWatched();
                          }
                        }}
                        title="Click the video to mark as watched"
                      >
                        <iframe
                          src={lessonContent.url}
                          title={lessonContent.title || 'Video Lesson'}
                          className="w-full h-full absolute inset-0 pointer-events-none"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          frameBorder="0"
                        />
                        {/* Transparent overlay to capture click while still showing the YouTube player */}
                        <button
                          type="button"
                          className="absolute inset-0 w-full h-full"
                          aria-label="Play video and mark as watched"
                        />
                      </div>
                      {progress?.video_watched && (
                        <div className="flex items-center gap-2 text-green-600 mb-4">
                          <CheckCircle className="w-5 h-5" />
                          <span className="font-medium">Video marked as watched</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* PDF Tab */}
                  {activeTab === 'pdf' && selectedDay.pdf && lessonContent && (
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-4">
                        {lessonContent.title || `Day ${selectedDay.day_number} PDF Notes`}
                      </h3>
                      <div className="border border-gray-200 rounded-lg bg-gray-50 p-6 mb-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-700 font-medium mb-1">
                              Download & read the PDF notes for Day {selectedDay.day_number}.
                            </p>
                            <p className="text-sm text-gray-500">
                              Download the PDF to your device or open it in a new browser tab.
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={async () => {
                                const fileName = `${lessonContent.title || `Day-${selectedDay.day_number}-PDF`}.pdf`;
                                
                                try {
                                  // Get auth token
                                  let token = localStorage.getItem('supabase.auth.token');
                                  if (!token) {
                                    const { data: { session } } = await supabase.auth.getSession();
                                    token = session?.access_token;
                                  }
                                  
                                  // Use backend proxy to download PDF
                                  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
                                  const downloadUrl = `${API_URL}/download-pdf?url=${encodeURIComponent(lessonContent.url)}&filename=${encodeURIComponent(fileName)}`;
                                  
                                  console.log('📥 Downloading PDF:', downloadUrl);
                                  
                                  // Fetch PDF with auth token
                                  const response = await fetch(downloadUrl, {
                                    method: 'GET',
                                    headers: {
                                      'Authorization': `Bearer ${token}`,
                                    },
                                  });
                                  
                                  if (!response.ok) {
                                    const errorText = await response.text();
                                    console.error('❌ Download failed:', response.status, errorText);
                                    throw new Error(`Download failed: ${response.status}`);
                                  }
                                  
                                  // Get blob from response
                                  const blob = await response.blob();
                                  console.log('✅ PDF blob received, size:', blob.size, 'bytes');
                                  
                                  if (blob.size === 0) {
                                    throw new Error('Empty PDF received');
                                  }
                                  
                                  // Create download link with blob URL
                                  const blobUrl = window.URL.createObjectURL(blob);
                                  const link = document.createElement('a');
                                  link.href = blobUrl;
                                  link.download = fileName;
                                  link.style.display = 'none';
                                  
                                  // Append to body
                                  document.body.appendChild(link);
                                  
                                  // Trigger download
                                  link.click();
                                  
                                  // Clean up after download starts
                                  setTimeout(() => {
                                    document.body.removeChild(link);
                                    window.URL.revokeObjectURL(blobUrl);
                                  }, 200);
                                  
                                  handlePdfViewed();
                                } catch (error) {
                                  console.error('❌ Error downloading PDF:', error);
                                  // Fallback: open in new tab
                                  window.open(lessonContent.url, '_blank', 'noopener,noreferrer');
                                  handlePdfViewed();
                                }
                              }}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
                            >
                              <Download className="w-4 h-4" />
                              Download PDF
                            </button>
                            <button
                              onClick={() => {
                                window.open(lessonContent.url, '_blank', 'noopener,noreferrer');
                                handlePdfViewed();
                              }}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                            >
                              <FileText className="w-4 h-4" />
                              Open PDF
                            </button>
                          </div>
                        </div>
                      </div>
                      {progress?.pdf_viewed && (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="w-5 h-5" />
                          <span className="font-medium">PDF marked as viewed</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Quiz Tab */}
                  {activeTab === 'quiz' && selectedDay.quiz && quiz && (
                    <div>
                      <div className="mb-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          {quiz.title || `Day ${selectedDay.day_number} Quiz`}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>Passing Score: {quiz.passing_score || 60}%</span>
                          <span>•</span>
                          <span>{quiz.questions?.length || 0} Questions</span>
                          <span>•</span>
                          {quizCompleted ? (
                            <span className="text-green-700 font-medium">
                              Quiz completed • Day {selectedDay.day_number} done
                            </span>
                          ) : (
                            <span>Complete to unlock Day {selectedDay.day_number + 1}</span>
                          )}
                        </div>
                      </div>

                      {/* Quiz Result */}
                      {quizSubmitted && quizResult && (
                        <div className={`p-6 rounded-lg mb-6 ${
                          quizResult.passed 
                            ? 'bg-green-50 border-2 border-green-200' 
                            : 'bg-red-50 border-2 border-red-200'
                        }`}>
                          <div className="flex items-center gap-3 mb-3">
                            {quizResult.passed ? (
                              <CheckCircle className="w-8 h-8 text-green-600" />
                            ) : (
                              <Lock className="w-8 h-8 text-red-600" />
                            )}
                            <div>
                              <h4 className={`text-xl font-bold ${
                                quizResult.passed ? 'text-green-800' : 'text-red-800'
                              }`}>
                                {quizResult.passed ? 'Quiz Passed! 🎉' : 'Quiz Not Passed'}
                              </h4>
                              <p className="text-gray-700 mt-1">
                                Score: {quizResult.score}% ({quizResult.correctAnswers}/{quizResult.totalQuestions} correct)
                              </p>
                            </div>
                          </div>
                          {quizResult.passed && (
                            <p className="text-green-700 font-medium">
                              ✅ Day {selectedDay.day_number} completed! Day {selectedDay.day_number + 1} is now unlocked.
                            </p>
                          )}
                          {!quizResult.passed && (
                            <p className="text-red-700 font-medium">
                              You need at least {quizResult.passingScore}% to pass. Please review the material and try again.
                            </p>
                          )}
                        </div>
                      )}

                      {/* Quiz Questions */}
                      {!quizCompleted && quiz.questions && quiz.questions.length > 0 ? (
                        <div className="space-y-6">
                          {quiz.questions.map((question, qIdx) => {
                            const userAnswer = quizAnswers[question.id];
                            const isCorrect = question.options[userAnswer]?.is_correct;
                            const showResults = quizSubmitted;

                            return (
                              <div key={question.id} className="border border-gray-200 rounded-lg p-6">
                                <div className="flex items-start justify-between mb-4">
                                  <span className="font-semibold text-gray-900 text-lg">
                                    Question {qIdx + 1}
                                  </span>
                                  <span className="text-sm text-gray-500">
                                    {question.points} point{question.points !== 1 ? 's' : ''}
                                  </span>
                                </div>
                                <p className="text-gray-800 mb-4 text-lg">{question.question_text}</p>
                                <div className="space-y-3">
                                  {question.options.map((option, optIdx) => {
                                    const isSelected = userAnswer === optIdx;
                                    const showCorrect = showResults && option.is_correct;
                                    const showIncorrect = showResults && isSelected && !option.is_correct;

                                    return (
                                      <label
                                        key={optIdx}
                                        className={`flex items-start gap-3 p-4 rounded-lg border-2 transition-all ${
                                          showCorrect
                                            ? 'border-green-500 bg-green-50'
                                            : showIncorrect
                                            ? 'border-red-500 bg-red-50'
                                            : isSelected
                                            ? 'border-orange-500 bg-orange-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                        } ${showResults ? 'cursor-default' : 'cursor-pointer'}`}
                                      >
                                        <input
                                          type="radio"
                                          name={`question-${question.id}`}
                                          checked={isSelected}
                                          onChange={() => handleQuizAnswer(question.id, optIdx)}
                                          disabled={showResults}
                                          className="mt-1 w-4 h-4"
                                        />
                                        <span className={`flex-1 ${
                                          showCorrect ? 'text-green-700 font-semibold' : 
                                          showIncorrect ? 'text-red-700' : 
                                          'text-gray-700'
                                        }`}>
                                          {option.text || option.option_text}
                                          {showCorrect && (
                                            <span className="ml-2 text-green-600">✓ Correct Answer</span>
                                          )}
                                        </span>
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}

                          {/* Submit Button */}
                          {!quizSubmitted && (
                            <button
                              onClick={handleSubmitQuiz}
                              disabled={Object.keys(quizAnswers).length < quiz.questions.length}
                              className="w-full px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-lg hover:from-orange-700 hover:to-amber-700 transition-colors font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Submit Quiz
                            </button>
                          )}
                        </div>
                      ) : (
                        <p className="text-gray-600">No questions available for this quiz.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Select a Day
                </h3>
                <p className="text-gray-600">
                  Choose a day from the sidebar to start learning.
                </p>
              </div>
            )}
          </div>

          {/* Right Side - Days Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-20">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">Course Days</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {days.length} days • {days.filter(d => d.isCompleted).length} completed
                </p>
              </div>
              <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
                {days.map((day) => {
                  const isSelected = selectedDay?.day_number === day.day_number;
                  const isLocked = !day.isUnlocked && !day.isCompleted;

                  return (
                    <button
                      key={day.day_number}
                      onClick={() => !isLocked && handleSelectDay(day)}
                      disabled={isLocked}
                      className={`w-full text-left p-4 border-b border-gray-50 transition-all ${
                        isSelected
                          ? 'bg-orange-50 border-l-4 border-l-orange-600'
                          : isLocked
                          ? 'opacity-60 cursor-not-allowed'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {isLocked ? (
                          <Lock className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        ) : day.isCompleted ? (
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                        ) : (
                          <PlayCircle className="w-5 h-5 text-orange-600 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className={`font-medium text-sm ${
                              isSelected ? 'text-orange-900' : 'text-gray-900'
                            }`}>
                              Day {day.day_number}
                            </p>
                            {day.isCompleted && (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            )}
                            {isLocked && (
                              <Lock className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                            <Video className="w-3 h-3" />
                            <FileText className="w-3 h-3" />
                            <HelpCircle className="w-3 h-3" />
                            {isLocked && <span className="ml-auto">Locked</span>}
                            {day.isCompleted && <span className="ml-auto text-green-600">Completed</span>}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}

                {days.length === 0 && (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    No days available yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

