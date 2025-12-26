import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { BookOpen, Plus, Edit, Trash2, X, Calendar, CheckCircle, XCircle, Video, FileText, HelpCircle, ChevronRight, ChevronLeft } from 'lucide-react';

export const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [currentStep, setCurrentStep] = useState(1); // 1 = Course Info, 2 = Curriculum
  const [currentCourseId, setCurrentCourseId] = useState(null); // For curriculum step
  const [curriculum, setCurriculum] = useState([]); // Array of day curriculum
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'active',
    start_date: '',
    end_date: '',
    total_days: 30,
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const { data } = await api.get('/courses');
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingCourse(null);
    setCurrentStep(1);
    setCurrentCourseId(null);
    setCurriculum([]);
    setFormData({
      title: '',
      description: '',
      status: 'active',
      start_date: '',
      end_date: '',
      total_days: 30,
    });
    setShowModal(true);
  };

  const handleEdit = async (course) => {
    setEditingCourse(course);
    setCurrentStep(1);
    setCurrentCourseId(course.id);
    setFormData({
      title: course.title,
      description: course.description || '',
      status: course.status,
      start_date: course.start_date || '',
      end_date: course.end_date || '',
      total_days: course.total_days || 30,
    });
    
    // Load existing curriculum
    try {
      const { data } = await api.get(`/admin/courses/${course.id}/curriculum`);
      if (data && data.length > 0) {
        setCurriculum(data);
      } else {
        // Initialize empty curriculum for all days
        initializeCurriculum(course.total_days || 30);
      }
    } catch (error) {
      console.error('Error loading curriculum:', error);
      initializeCurriculum(course.total_days || 30);
    }
    
    setShowModal(true);
  };

  const initializeCurriculum = (totalDays) => {
    const days = [];
    for (let i = 1; i <= totalDays; i++) {
      days.push({
        day_number: i,
        video_url: '',
        pdf_url: '',
        quiz_data: null,
      });
    }
    setCurriculum(days);
  };

  const handleStep1Next = async () => {
    try {
      // Validate required fields
      if (!formData.title.trim()) {
        alert('Please enter a course title');
        return;
      }
      if (formData.total_days < 7 || formData.total_days > 30) {
        alert('Total days must be between 7 and 30');
        return;
      }

      let courseId;
      if (editingCourse) {
        // Update existing course
        const { data } = await api.put(`/admin/courses/${editingCourse.id}`, formData);
        courseId = editingCourse.id;
      } else {
        // Create new course
        const { data } = await api.post('/admin/courses', formData);
        courseId = data.id;
      }

      setCurrentCourseId(courseId);
      
      // Initialize curriculum if not already loaded
      if (curriculum.length === 0) {
        initializeCurriculum(formData.total_days);
      } else if (curriculum.length !== formData.total_days) {
        // Adjust curriculum if total_days changed
        const newCurriculum = [];
        for (let i = 1; i <= formData.total_days; i++) {
          const existing = curriculum.find(c => c.day_number === i);
          newCurriculum.push(existing || {
            day_number: i,
            video_url: '',
            pdf_url: '',
            quiz_data: null,
          });
        }
        setCurriculum(newCurriculum);
      }

      setCurrentStep(2);
    } catch (error) {
      console.error('Error saving course:', error);
      alert('Failed to save course: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleSaveCurriculum = async () => {
    try {
      await api.post(`/admin/courses/${currentCourseId}/curriculum`, {
        curriculum: curriculum.map(day => ({
          day_number: day.day_number,
          video_url: day.video_url?.trim() || null,
          pdf_url: day.pdf_url?.trim() || null,
          quiz_data: day.quiz_data || null,
        })),
      });

      await fetchCourses();
      setShowModal(false);
      setEditingCourse(null);
      setCurrentStep(1);
      setCurrentCourseId(null);
      setCurriculum([]);
      alert('Course and curriculum saved successfully!');
    } catch (error) {
      console.error('Error saving curriculum:', error);
      alert('Failed to save curriculum: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleBackToStep1 = () => {
    setCurrentStep(1);
  };

  const updateDayField = (dayNumber, field, value) => {
    setCurriculum(prev => prev.map(day => 
      day.day_number === dayNumber 
        ? { ...day, [field]: value }
        : day
    ));
  };

  const addQuizQuestion = (dayNumber) => {
    setCurriculum(prev => prev.map(day => {
      if (day.day_number === dayNumber) {
        const currentQuiz = day.quiz_data || { questions: [], passing_score: 60 };
        return {
          ...day,
          quiz_data: {
            ...currentQuiz,
            questions: [
              ...currentQuiz.questions,
              {
                question_text: '',
                options: ['', '', '', ''],
                correct_answer_index: 0,
              },
            ],
          },
        };
      }
      return day;
    }));
  };

  const updateQuizQuestion = (dayNumber, questionIndex, field, value) => {
    setCurriculum(prev => prev.map(day => {
      if (day.day_number === dayNumber && day.quiz_data) {
        const questions = [...day.quiz_data.questions];
        questions[questionIndex] = { ...questions[questionIndex], [field]: value };
        return {
          ...day,
          quiz_data: { ...day.quiz_data, questions },
        };
      }
      return day;
    }));
  };

  const updateQuizOption = (dayNumber, questionIndex, optionIndex, value) => {
    setCurriculum(prev => prev.map(day => {
      if (day.day_number === dayNumber && day.quiz_data) {
        const questions = [...day.quiz_data.questions];
        const options = [...questions[questionIndex].options];
        options[optionIndex] = value;
        questions[questionIndex] = { ...questions[questionIndex], options };
        return {
          ...day,
          quiz_data: { ...day.quiz_data, questions },
        };
      }
      return day;
    }));
  };

  const removeQuizQuestion = (dayNumber, questionIndex) => {
    setCurriculum(prev => prev.map(day => {
      if (day.day_number === dayNumber && day.quiz_data) {
        const questions = day.quiz_data.questions.filter((_, i) => i !== questionIndex);
        return {
          ...day,
          quiz_data: { ...day.quiz_data, questions },
        };
      }
      return day;
    }));
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this course?')) return;
    try {
      await api.delete(`/admin/courses/${id}`);
      await fetchCourses();
    } catch (error) {
      console.error('Error deleting course:', error);
      alert('Failed to delete course');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-orange-50/20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-orange-50/20">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="inline-flex items-center px-4 py-2 rounded-full text-xs font-semibold tracking-widest uppercase bg-orange-500/20 text-orange-300 border border-orange-400/30 mb-6 backdrop-blur-sm">
                <BookOpen className="w-3 h-3 mr-2" />
                Course Management
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight">Course Management</h1>
            </div>
            <button
              onClick={handleCreate}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-xl hover:from-orange-700 hover:to-orange-600 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              Create Course
            </button>
          </div>
        </div>
      </div>

      {/* Courses List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {courses.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-16 text-center border border-gray-100">
            <BookOpen className="w-24 h-24 text-gray-300 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No Courses Available</h3>
            <p className="text-gray-600 mb-8 text-lg">Get started by creating your first course</p>
            <button
              onClick={handleCreate}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-xl hover:from-orange-700 hover:to-orange-600 transition-all font-semibold shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Create Course
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 hover:shadow-2xl transition-all duration-300"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`p-3 rounded-xl ${
                          course.status === 'active' ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                          {course.status === 'active' ? (
                            <CheckCircle className="w-6 h-6 text-green-600" />
                          ) : (
                            <XCircle className="w-6 h-6 text-gray-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold text-gray-900 mb-2">{course.title}</h3>
                          <p className="text-gray-600 mb-4">{course.description || 'No description available'}</p>
                          <div className="flex items-center gap-6 text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                              <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                                course.status === 'active'
                                  ? 'bg-green-100 text-green-800'
                                  : course.status === 'inactive'
                                  ? 'bg-gray-100 text-gray-800'
                                  : 'bg-orange-100 text-orange-800'
                              }`}>
                                {course.status}
                              </div>
                            </div>
                            {course.start_date && (
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span>Start: {new Date(course.start_date).toLocaleDateString()}</span>
                              </div>
                            )}
                            {course.end_date && (
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span>End: {new Date(course.end_date).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3 ml-4">
                      <button
                        onClick={() => handleEdit(course)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-semibold shadow-lg"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(course.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-semibold shadow-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-slate-900 to-blue-900 text-white px-8 py-6 flex items-center justify-between rounded-t-2xl z-10">
              <div>
                <h3 className="text-2xl font-bold text-white">
                  {editingCourse ? 'Edit Course' : 'Create Course'}
                </h3>
                <p className="text-sm text-slate-300 mt-1">
                  Step {currentStep} of 2: {currentStep === 1 ? 'Course Information' : 'Curriculum Builder'}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingCourse(null);
                  setCurrentStep(1);
                  setCurrentCourseId(null);
                  setCurriculum([]);
                }}
                className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Step 1: Course Information */}
            {currentStep === 1 && (
              <>
                <div className="p-8 space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Title *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-medium"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={4}
                      className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-medium resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-medium"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
                      <input
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                        className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
                      <input
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                        className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Total Days <span className="text-xs text-gray-400">(7–30)</span>
                      </label>
                      <input
                        type="number"
                        min={7}
                        max={30}
                        value={formData.total_days}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            total_days: Math.min(30, Math.max(7, Number(e.target.value) || 7)),
                          })
                        }
                        className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-medium"
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="p-8 pt-0 flex gap-3 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingCourse(null);
                      setCurrentStep(1);
                      setCurrentCourseId(null);
                      setCurriculum([]);
                    }}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleStep1Next}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-xl hover:from-orange-700 hover:to-orange-600 transition-all font-semibold shadow-lg flex items-center justify-center gap-2"
                  >
                    Next: Curriculum Builder
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </>
            )}

            {/* Step 2: Curriculum Builder */}
            {currentStep === 2 && (
              <>
                <div className="p-8 space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Course:</strong> {formData.title} ({formData.total_days} days)
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Configure video, PDF, and quiz content for each day of the course.
                    </p>
                  </div>

                  <div className="space-y-6 max-h-[60vh] overflow-y-auto">
                    {curriculum.map((day) => (
                      <div key={day.day_number} className="border-2 border-gray-200 rounded-xl p-6 bg-gray-50">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="bg-gradient-to-r from-orange-600 to-orange-500 text-white px-4 py-2 rounded-lg font-bold text-lg">
                            Day {day.day_number}
                          </div>
                        </div>

                        <div className="space-y-4">
                          {/* Video URL */}
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                              <Video className="w-4 h-4 text-orange-600" />
                              Video URL
                            </label>
                            <input
                              type="url"
                              value={day.video_url || ''}
                              onChange={(e) => updateDayField(day.day_number, 'video_url', e.target.value)}
                              placeholder="https://example.com/video.mp4"
                              className="w-full border-2 border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-medium text-sm"
                            />
                          </div>

                          {/* PDF URL */}
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                              <FileText className="w-4 h-4 text-blue-600" />
                              PDF URL
                            </label>
                            <input
                              type="url"
                              value={day.pdf_url || ''}
                              onChange={(e) => updateDayField(day.day_number, 'pdf_url', e.target.value)}
                              placeholder="https://example.com/document.pdf"
                              className="w-full border-2 border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-medium text-sm"
                            />
                          </div>

                          {/* Quiz Section */}
                          <div className="border-t border-gray-300 pt-4">
                            <div className="flex items-center justify-between mb-3">
                              <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                                <HelpCircle className="w-4 h-4 text-purple-600" />
                                Quiz
                              </label>
                              <button
                                type="button"
                                onClick={() => addQuizQuestion(day.day_number)}
                                className="text-xs px-3 py-1 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 font-semibold"
                              >
                                + Add Question
                              </button>
                            </div>

                            {day.quiz_data?.questions?.length > 0 ? (
                              <div className="space-y-4">
                                {day.quiz_data.questions.map((question, qIdx) => (
                                  <div key={qIdx} className="bg-white border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-start justify-between mb-3">
                                      <span className="text-xs font-semibold text-gray-500">Question {qIdx + 1}</span>
                                      <button
                                        type="button"
                                        onClick={() => removeQuizQuestion(day.day_number, qIdx)}
                                        className="text-xs text-red-600 hover:text-red-800"
                                      >
                                        Remove
                                      </button>
                                    </div>
                                    <input
                                      type="text"
                                      value={question.question_text || ''}
                                      onChange={(e) => updateQuizQuestion(day.day_number, qIdx, 'question_text', e.target.value)}
                                      placeholder="Enter question text"
                                      className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-3 text-sm"
                                    />
                                    <div className="space-y-2">
                                      {question.options?.map((option, optIdx) => (
                                        <div key={optIdx} className="flex items-center gap-2">
                                          <input
                                            type="radio"
                                            name={`day-${day.day_number}-q-${qIdx}`}
                                            checked={question.correct_answer_index === optIdx}
                                            onChange={() => updateQuizQuestion(day.day_number, qIdx, 'correct_answer_index', optIdx)}
                                            className="w-4 h-4 text-orange-600"
                                          />
                                          <input
                                            type="text"
                                            value={option || ''}
                                            onChange={(e) => updateQuizOption(day.day_number, qIdx, optIdx, e.target.value)}
                                            placeholder={`Option ${optIdx + 1}`}
                                            className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                                          />
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                                <div className="mt-3">
                                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Passing Score (%)
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={day.quiz_data.passing_score || 60}
                                    onChange={(e) => {
                                      setCurriculum(prev => prev.map(d => 
                                        d.day_number === day.day_number 
                                          ? { ...d, quiz_data: { ...d.quiz_data, passing_score: parseInt(e.target.value) || 60 } }
                                          : d
                                      ));
                                    }}
                                    className="w-32 border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                                  />
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs text-gray-500 italic">No quiz questions added yet. Click "Add Question" to create one.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-8 pt-0 flex gap-3 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleBackToStep1}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold flex items-center justify-center gap-2"
                  >
                    <ChevronLeft className="w-5 h-5" />
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveCurriculum}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-xl hover:from-orange-700 hover:to-orange-600 transition-all font-semibold shadow-lg"
                  >
                    Save Course & Curriculum
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
