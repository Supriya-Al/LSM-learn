/**
 * CourseDetail - Udemy-style Course Content Page
 * 
 * Features:
 * - Left side: Main content area (video player / PDF viewer / quiz)
 * - Right side: Course content sidebar with sections and lessons
 * - Lesson types: video, pdf, quiz
 * - Progress tracking and lesson unlocking
 * - Quiz passing requirement (>=60%) to unlock next lesson
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
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
  ChevronDown,
  ChevronRight
} from 'lucide-react';

export const CourseDetail = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  
  // State management
  const [course, setCourse] = useState(null);
  const [sections, setSections] = useState([]);
  const [lessonsWithoutSections, setLessonsWithoutSections] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [lessonContent, setLessonContent] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedSections, setExpandedSections] = useState(new Set());
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizResult, setQuizResult] = useState(null);

  // Fetch course structure on mount
  useEffect(() => {
    if (courseId) {
      fetchCourseStructure();
    }
  }, [courseId]);

  // Auto-select first unlocked lesson
  useEffect(() => {
    if (sections.length > 0 && !selectedLesson) {
      const firstUnlockedLesson = findFirstUnlockedLesson();
      if (firstUnlockedLesson) {
        handleSelectLesson(firstUnlockedLesson);
      }
    }
  }, [sections]);

  // Fetch course structure (sections and lessons)
  const fetchCourseStructure = async () => {
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

      // Get course structure
      const { data: structure } = await api.get(`/courses/${courseId}/structure`);
      
      setSections(structure.sections || []);
      setLessonsWithoutSections(structure.lessonsWithoutSections || []);

      // Expand all sections by default
      const allSectionIds = new Set((structure.sections || []).map(s => s.id));
      setExpandedSections(allSectionIds);
    } catch (err) {
      console.error('Error fetching course structure:', err);
      setError(err.response?.data?.error || 'Failed to load course content');
    } finally {
      setLoading(false);
    }
  };

  // Find first unlocked lesson
  const findFirstUnlockedLesson = () => {
    // Check sections first
    for (const section of sections) {
      for (const lesson of section.lessons || []) {
        if (lesson.isUnlocked) {
          return lesson;
        }
      }
    }
    // Check lessons without sections
    for (const lesson of lessonsWithoutSections) {
      if (lesson.isUnlocked) {
        return lesson;
      }
    }
    return null;
  };

  // Select a lesson and load its content
  const handleSelectLesson = async (lesson) => {
    if (!lesson.isUnlocked && !lesson.isCompleted) {
      alert('Please complete the previous lesson to unlock this one.');
      return;
    }

    try {
      setSelectedLesson(lesson);
      setQuizAnswers({});
      setQuizSubmitted(false);
      setQuizResult(null);

      // Fetch lesson content
      const { data } = await api.get(`/lessons/${lesson.id}/content`);
      
      setLessonContent(data.content);
      setQuiz(data.quiz);
      setProgress(data.progress);

      // Update last accessed
      if (data.progress) {
        await api.post(`/lessons/${lesson.id}/progress`, {
          videoWatched: data.progress.video_watched,
          pdfViewed: data.progress.pdf_viewed
        });
      }
    } catch (err) {
      console.error('Error loading lesson content:', err);
      alert('Failed to load lesson content: ' + (err.response?.data?.error || err.message));
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
      await fetchCourseStructure(); // Refresh to update completion status
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
      await fetchCourseStructure(); // Refresh to update completion status
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
    if (!quiz || !selectedLesson) return;

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

    // Update progress
    try {
      const { data } = await api.post(`/lessons/${selectedLesson.id}/progress`, {
        quizScore: score,
        quizPassed: passed,
        totalQuestions,
        correctAnswers,
        answers
      });

      setProgress(data.progress);
      await fetchCourseStructure(); // Refresh to unlock next lesson

      if (passed) {
        // Show success message
        setTimeout(() => {
          alert(`🎉 Quiz Passed! Score: ${score}%\n\nNext lesson is now unlocked.`);
        }, 500);
      } else {
        alert(`Quiz not passed. Score: ${score}%\n\nYou need at least ${passingScore}% to pass. Please review and try again.`);
      }
    } catch (err) {
      console.error('Error submitting quiz:', err);
      alert('Failed to save quiz results: ' + (err.response?.data?.error || err.message));
    }
  };

  // Toggle section expansion
  const toggleSection = (sectionId) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  // Get lesson icon based on type
  const getLessonIcon = (lessonType, isCompleted) => {
    if (isCompleted) {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    }

    switch (lessonType) {
      case 'video':
        return <Video className="w-5 h-5 text-blue-600" />;
      case 'pdf':
        return <FileText className="w-5 h-5 text-purple-600" />;
      case 'quiz':
        return <HelpCircle className="w-5 h-5 text-orange-600" />;
      default:
        return <BookOpen className="w-5 h-5 text-gray-600" />;
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
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Side - Main Content Area */}
          <div className="lg:col-span-2">
            {selectedLesson ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                {/* Lesson Header */}
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {selectedLesson.title}
                  </h2>
                  {selectedLesson.description && (
                    <p className="text-gray-600">{selectedLesson.description}</p>
                  )}
                </div>

                {/* Content Area */}
                <div className="p-6">
                  {/* Video Content */}
                  {selectedLesson.lesson_type === 'video' && lessonContent && (
                    <div>
                      <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden mb-4 relative">
                        <iframe
                          src={lessonContent.url}
                          title={lessonContent.title || selectedLesson.title}
                          className="w-full h-full absolute inset-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          frameBorder="0"
                          onLoad={() => {
                            // Mark as watched after 10 seconds
                            setTimeout(() => {
                              handleVideoWatched();
                            }, 10000);
                          }}
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

                  {/* PDF Content */}
                  {selectedLesson.lesson_type === 'pdf' && lessonContent && (
                    <div>
                      <div className="border border-gray-200 rounded-lg bg-gray-50 p-6 mb-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              {lessonContent.title || selectedLesson.title}
                            </h3>
                            <p className="text-gray-600 text-sm">
                              Click the button below to open the PDF in a new tab.
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              window.open(lessonContent.url, '_blank', 'noopener,noreferrer');
                              handlePdfViewed();
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
                          >
                            <FileText className="w-4 h-4" />
                            Open PDF
                          </button>
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

                  {/* Quiz Content */}
                  {selectedLesson.lesson_type === 'quiz' && quiz && (
                    <div>
                      <div className="mb-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          {quiz.title || selectedLesson.title}
                        </h3>
                        {quiz.description && (
                          <p className="text-gray-600 mb-4">{quiz.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>Passing Score: {quiz.passing_score || 60}%</span>
                          <span>•</span>
                          <span>{quiz.questions?.length || 0} Questions</span>
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
                              <p className="text-sm text-gray-600 mt-1">
                                Passing Score: {quizResult.passingScore}%
                              </p>
                            </div>
                          </div>
                          {quizResult.passed && (
                            <p className="text-green-700 font-medium">
                              ✅ Next lesson is now unlocked!
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
                      {quiz.questions && quiz.questions.length > 0 ? (
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

                  {/* No Content Message */}
                  {!lessonContent && !quiz && (
                    <div className="text-center py-12">
                      <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        Content Not Available
                      </h3>
                      <p className="text-gray-600">
                        This lesson's content is being prepared. Please check back later.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Select a Lesson
                </h3>
                <p className="text-gray-600">
                  Choose a lesson from the sidebar to start learning.
                </p>
              </div>
            )}
          </div>

          {/* Right Side - Course Content Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-20">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">Course Content</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {sections.reduce((sum, s) => sum + (s.lessons?.length || 0), 0) + lessonsWithoutSections.length} lessons
                </p>
              </div>
              <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
                {/* Sections */}
                {sections.map((section) => (
                  <div key={section.id} className="border-b border-gray-100">
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="w-full text-left p-4 hover:bg-gray-50 transition-colors flex items-center justify-between"
                    >
                      <span className="font-medium text-gray-900">{section.title}</span>
                      {expandedSections.has(section.id) ? (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                    {expandedSections.has(section.id) && section.lessons && (
                      <div>
                        {section.lessons.map((lesson) => {
                          const isSelected = selectedLesson?.id === lesson.id;
                          const isLocked = !lesson.isUnlocked && !lesson.isCompleted;

                          return (
                            <button
                              key={lesson.id}
                              onClick={() => !isLocked && handleSelectLesson(lesson)}
                              disabled={isLocked}
                              className={`w-full text-left p-4 pl-8 border-b border-gray-50 transition-all ${
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
                                ) : (
                                  getLessonIcon(lesson.lesson_type, lesson.isCompleted)
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className={`font-medium text-sm ${
                                    isSelected ? 'text-orange-900' : 'text-gray-900'
                                  }`}>
                                    {lesson.title}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    {lesson.duration_minutes > 0 && (
                                      <span className="text-xs text-gray-500 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {lesson.duration_minutes} min
                                      </span>
                                    )}
                                    {isLocked && (
                                      <span className="text-xs text-gray-500">Locked</span>
                                    )}
                                    {lesson.isCompleted && (
                                      <span className="text-xs text-green-600 font-medium">Completed</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}

                {/* Lessons without sections */}
                {lessonsWithoutSections.length > 0 && (
                  <div className="border-b border-gray-100">
                    {lessonsWithoutSections.map((lesson) => {
                      const isSelected = selectedLesson?.id === lesson.id;
                      const isLocked = !lesson.isUnlocked && !lesson.isCompleted;

                      return (
                        <button
                          key={lesson.id}
                          onClick={() => !isLocked && handleSelectLesson(lesson)}
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
                            ) : (
                              getLessonIcon(lesson.lesson_type, lesson.isCompleted)
                            )}
                            <div className="flex-1 min-w-0">
                              <p className={`font-medium text-sm ${
                                isSelected ? 'text-orange-900' : 'text-gray-900'
                              }`}>
                                {lesson.title}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                {lesson.duration_minutes > 0 && (
                                  <span className="text-xs text-gray-500 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {lesson.duration_minutes} min
                                  </span>
                                )}
                                {isLocked && (
                                  <span className="text-xs text-gray-500">Locked</span>
                                )}
                                {lesson.isCompleted && (
                                  <span className="text-xs text-green-600 font-medium">Completed</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Empty State */}
                {sections.length === 0 && lessonsWithoutSections.length === 0 && (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    No lessons available yet.
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
