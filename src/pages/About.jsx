import heroIllustration from '../assets/lsm-hero.png';
import { GraduationCap, Award, BookOpen, TrendingUp, CheckCircle, Users, Target } from 'lucide-react';

export const About = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-white py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-orange-200 bg-orange-50 hover:bg-orange-100 hover:border-orange-300 transition-all duration-300 group cursor-pointer">
                <GraduationCap className="w-4 h-4 text-orange-600 group-hover:rotate-12 transition-transform duration-300" />
                <span className="text-xs font-semibold text-orange-700 uppercase tracking-wide group-hover:text-orange-800 transition-colors duration-300">
                  Learning Management System
                </span>
              </div>

              {/* Main Headline */}
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 leading-tight tracking-tight">
                Transform Your{' '}
                <span className="text-orange-600 whitespace-nowrap">Learning Journey</span>
              </h1>

              {/* Description */}
              <p className="text-xl text-slate-600 leading-relaxed max-w-2xl">
                Master new skills with our comprehensive learning platform. Track your progress, 
                complete courses, and earn certificates. We provide structured learning paths, 
                progress analytics, and a clean, student-friendly interface designed for success.
              </p>

              {/* CTA Button */}
              <div className="flex items-center gap-4">
                <a
                  href="/courses"
                  className="group inline-flex items-center gap-2 px-8 py-4 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 hover:shadow-lg hover:shadow-orange-500/50 transition-all duration-300 transform hover:scale-105 shadow-sm"
                >
                  Explore Courses
                  <span className="text-xl group-hover:translate-x-1 transition-transform duration-300">→</span>
                </a>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-8 pt-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-slate-700 font-medium">500+ Students</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-slate-700 font-medium">Progress Tracking</span>
                </div>
              </div>
            </div>

            {/* Right Image */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-100 to-orange-50 rounded-3xl blur-3xl opacity-50 group-hover:opacity-70 transition-opacity duration-500"></div>
              <div className="relative bg-white rounded-2xl shadow-lg border border-slate-200 p-8 hover:shadow-xl hover:border-orange-200 transition-all duration-300 transform hover:scale-[1.02]">
                <img
                  src={heroIllustration}
                  alt="LMS Platform"
                  className="w-full h-auto rounded-lg transition-transform duration-500 group-hover:scale-105"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section - Dark Blue */}
      <section className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-orange-500/30 bg-orange-500/20 hover:bg-orange-500/30 hover:border-orange-500/50 transition-all duration-300 group cursor-pointer mb-6 backdrop-blur-sm">
              <Target className="w-4 h-4 text-orange-400 group-hover:scale-110 transition-transform duration-300" />
              <span className="text-xs font-semibold text-orange-300 uppercase tracking-wide group-hover:text-orange-200 transition-colors duration-300">
                Our Mission
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              Empowering Learners Through{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400">Innovation</span>
            </h2>
            <p className="text-lg text-slate-300 leading-relaxed mb-8">
              Our mission is to empower learners by providing a comprehensive, easy-to-use
              platform where they can learn new skills, track their progress, and achieve
              their career goals. We believe in making quality education accessible to everyone.
            </p>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center border border-orange-500/30">
                  <CheckCircle className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                  <p className="text-white font-semibold">Quality Education</p>
                  <p className="text-slate-400 text-sm">Accessible to all</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center border border-orange-500/30">
                  <Users className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                  <p className="text-white font-semibold">Student Success</p>
                  <p className="text-slate-400 text-sm">Our top priority</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Light Background */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Key Features
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Everything you need to succeed in your learning journey
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature Card 1 */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 hover:border-orange-400 hover:shadow-xl hover:shadow-orange-100 transition-all duration-300 group cursor-pointer transform hover:-translate-y-1">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-3 group-hover:bg-gradient-to-br group-hover:from-orange-600 group-hover:to-orange-700 transition-all duration-300">
                <BookOpen className="w-7 h-7 text-white group-hover:scale-110 transition-transform duration-300" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3 group-hover:text-orange-600 transition-colors duration-300">Wide Range of Courses</h3>
              <p className="text-slate-600 text-sm leading-relaxed group-hover:text-slate-700 transition-colors duration-300">
                Access a diverse catalog of expert-led courses designed to help you advance your career.
              </p>
            </div>

            {/* Feature Card 2 */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 hover:border-orange-400 hover:shadow-xl hover:shadow-orange-100 transition-all duration-300 group cursor-pointer transform hover:-translate-y-1">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-3 group-hover:bg-gradient-to-br group-hover:from-orange-600 group-hover:to-orange-700 transition-all duration-300">
                <TrendingUp className="w-7 h-7 text-white group-hover:scale-110 transition-transform duration-300" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3 group-hover:text-orange-600 transition-colors duration-300">Progress Tracking</h3>
              <p className="text-slate-600 text-sm leading-relaxed group-hover:text-slate-700 transition-colors duration-300">
                Track your learning journey with detailed progress analytics and personalized dashboards.
              </p>
            </div>

            {/* Feature Card 3 */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 hover:border-orange-400 hover:shadow-xl hover:shadow-orange-100 transition-all duration-300 group cursor-pointer transform hover:-translate-y-1">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-3 group-hover:bg-gradient-to-br group-hover:from-orange-600 group-hover:to-orange-700 transition-all duration-300">
                <Award className="w-7 h-7 text-white group-hover:scale-110 transition-transform duration-300" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3 group-hover:text-orange-600 transition-colors duration-300">Certificates</h3>
              <p className="text-slate-600 text-sm leading-relaxed group-hover:text-slate-700 transition-colors duration-300">
                Earn certificates upon course completion to showcase your achievements.
              </p>
            </div>

            {/* Feature Card 4 */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 hover:border-orange-400 hover:shadow-xl hover:shadow-orange-100 transition-all duration-300 group cursor-pointer transform hover:-translate-y-1">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-3 group-hover:bg-gradient-to-br group-hover:from-orange-600 group-hover:to-orange-700 transition-all duration-300">
                <Users className="w-7 h-7 text-white group-hover:scale-110 transition-transform duration-300" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3 group-hover:text-orange-600 transition-colors duration-300">Student-Focused Design</h3>
              <p className="text-slate-600 text-sm leading-relaxed group-hover:text-slate-700 transition-colors duration-300">
                A clean, intuitive interface that keeps learners focused on what matters most.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section - Dark Blue */}
      <section className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-orange-500/30 bg-orange-500/10 mb-6 backdrop-blur-sm">
              <TrendingUp className="w-4 h-4 text-orange-400" />
              <span className="text-xs font-semibold text-orange-300 uppercase tracking-wide">
                Platform Statistics
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Trusted by Thousands of{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400">Learners</span>
            </h2>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto">
              Join our growing community of successful learners
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10 hover:bg-white/10 hover:border-orange-500/30 transition-all duration-300 group cursor-pointer transform hover:-translate-y-1">
              <div className="w-16 h-16 bg-orange-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:bg-orange-500/30 group-hover:scale-110 transition-all duration-300 border border-orange-500/30">
                <Users className="w-8 h-8 text-orange-400" />
              </div>
              <div className="text-5xl font-bold text-white mb-3 group-hover:text-orange-400 transition-colors duration-300">500+</div>
              <p className="text-slate-300 font-semibold text-lg group-hover:text-slate-200 transition-colors duration-300">Active Students</p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10 hover:bg-white/10 hover:border-orange-500/30 transition-all duration-300 group cursor-pointer transform hover:-translate-y-1">
              <div className="w-16 h-16 bg-orange-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:bg-orange-500/30 group-hover:scale-110 transition-all duration-300 border border-orange-500/30">
                <BookOpen className="w-8 h-8 text-orange-400" />
              </div>
              <div className="text-5xl font-bold text-white mb-3 group-hover:text-orange-400 transition-colors duration-300">50+</div>
              <p className="text-slate-300 font-semibold text-lg group-hover:text-slate-200 transition-colors duration-300">Expert Courses</p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10 hover:bg-white/10 hover:border-orange-500/30 transition-all duration-300 group cursor-pointer transform hover:-translate-y-1">
              <div className="w-16 h-16 bg-orange-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:bg-orange-500/30 group-hover:scale-110 transition-all duration-300 border border-orange-500/30">
                <Award className="w-8 h-8 text-orange-400" />
              </div>
              <div className="text-5xl font-bold text-white mb-3 group-hover:text-orange-400 transition-colors duration-300">1000+</div>
              <p className="text-slate-300 font-semibold text-lg group-hover:text-slate-200 transition-colors duration-300">Certificates Issued</p>
            </div>
          </div>
        </div>
      </section>

      {/* Info Cards Section - Light Background */}
      <section className="bg-slate-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Platform Version Card */}
            <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm hover:shadow-xl hover:border-green-300 transition-all duration-300 group cursor-pointer transform hover:-translate-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 border border-green-200 mb-6 group-hover:bg-green-100 group-hover:border-green-300 transition-colors duration-300">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse group-hover:scale-125 transition-transform duration-300"></span>
                <span className="text-xs font-semibold text-green-700 uppercase tracking-wide group-hover:text-green-800 transition-colors duration-300">Current Release</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3 group-hover:text-green-700 transition-colors duration-300">Platform Version</h3>
              <p className="text-slate-600 mb-6 group-hover:text-slate-700 transition-colors duration-300">Stay updated with the latest features and improvements</p>
              <div className="inline-flex items-center gap-4 px-6 py-4 bg-slate-50 rounded-lg border border-slate-200 group-hover:bg-green-50 group-hover:border-green-200 transition-all duration-300">
                <span className="text-3xl font-bold text-slate-900 group-hover:text-green-700 transition-colors duration-300">1.0</span>
                <div className="h-8 w-px bg-slate-300 group-hover:bg-green-300 transition-colors duration-300"></div>
                <span className="text-slate-600 font-medium group-hover:text-green-700 transition-colors duration-300">Latest Version</span>
              </div>
            </div>

            {/* Contact Card */}
            <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm hover:shadow-xl hover:border-orange-300 transition-all duration-300 group cursor-pointer transform hover:-translate-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-200 mb-6 group-hover:bg-orange-100 group-hover:border-orange-300 transition-colors duration-300">
                <span className="text-xs font-semibold text-orange-700 uppercase tracking-wide group-hover:text-orange-800 transition-colors duration-300">Support</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3 group-hover:text-orange-600 transition-colors duration-300">Contact & Support</h3>
              <p className="text-slate-600 mb-6 group-hover:text-slate-700 transition-colors duration-300">
                Need help with your account or courses? Our support team is ready to assist you.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-4 group-hover:gap-5 transition-all duration-300">
                  <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center group-hover:bg-orange-100 group-hover:scale-110 transition-all duration-300">
                    <span className="text-orange-600 text-xl group-hover:scale-110 transition-transform duration-300">✉</span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-1">Email</p>
                    <p className="font-semibold text-slate-900 group-hover:text-orange-600 transition-colors duration-300">lms@learningplatform.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 group-hover:gap-5 transition-all duration-300">
                  <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center group-hover:bg-orange-100 group-hover:scale-110 transition-all duration-300">
                    <span className="text-orange-600 text-xl group-hover:scale-110 transition-transform duration-300">📞</span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-1">Phone</p>
                    <p className="font-semibold text-slate-900 group-hover:text-orange-600 transition-colors duration-300">+1 (800) 123-4567</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

