import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { Award, CheckCircle, Clock, XCircle, Download, User, BookOpen, Calendar } from 'lucide-react';

export const CertificateManagement = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('PENDING_APPROVAL'); // PENDING_APPROVAL, GENERATED, all

  useEffect(() => {
    fetchCertificates();
  }, [filter]);

  const checkStatus = async () => {
    try {
      const { data } = await api.get('/admin/certificates/status');
      console.log('Certificate System Status:', data);
      
      let message = 'Certificate System Status:\n\n';
      message += `Certificates Table: ${data.certificatesTableExists ? '✅ Exists' : '❌ Missing'}\n`;
      message += `Completed Enrollments: ${data.completedEnrollments}\n`;
      message += `Existing Certificates: ${data.existingCertificates}\n`;
      message += `Missing Certificates: ${data.missingCertificates}\n`;
      
      if (data.errors && data.errors.length > 0) {
        message += `\nErrors:\n${data.errors.map(e => `- ${e.check}: ${e.error}`).join('\n')}`;
      }
      
      if (!data.certificatesTableExists) {
        message += '\n\n⚠️ Please run certificates-schema.sql in Supabase SQL Editor';
      }
      
      alert(message);
    } catch (error) {
      console.error('Error checking status:', error);
      alert('Failed to check status: ' + (error.response?.data?.error || error.message));
    }
  };

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const url = filter === 'all' 
        ? '/admin/certificates' 
        : `/admin/certificates?status=${filter}`;
      console.log('Fetching certificates with filter:', filter, 'URL:', url);
      const { data } = await api.get(url);
      console.log('Fetched certificates:', data);
      setCertificates(data || []);
    } catch (error) {
      console.error('Error fetching certificates:', error);
      console.error('Error details:', error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (certificateId) => {
    if (!confirm('Are you sure you want to approve and generate this certificate?')) {
      return;
    }

    try {
      const response = await api.post(`/admin/certificates/${certificateId}/approve`);
      console.log('Approval response:', response.data);
      
      // Switch to "Generated" filter to show the approved certificate
      setFilter('GENERATED');
      
      // Wait a moment for filter to update, then fetch
      setTimeout(async () => {
        await fetchCertificates();
        alert('Certificate approved and generated successfully! View it in the "Generated" tab.');
      }, 100);
    } catch (error) {
      console.error('Error approving certificate:', error);
      console.error('Full error:', error.response?.data);
      alert('Failed to approve certificate: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleBackfill = async () => {
    if (!confirm('This will create certificates for all completed courses that don\'t have certificates yet. Continue?')) {
      return;
    }

    try {
      setLoading(true);
      console.log('Starting backfill...');
      const response = await api.post('/admin/certificates/backfill');
      console.log('Backfill response:', response.data);
      
      const message = `Backfill completed!\n\n` +
        `Created: ${response.data.created}\n` +
        `Skipped: ${response.data.skipped}\n` +
        `Errors: ${response.data.errors}` +
        (response.data.errorDetails && response.data.errorDetails.length > 0 
          ? `\n\nError details:\n${response.data.errorDetails.map(e => `- ${e.user}: ${e.course} - ${e.error}`).join('\n')}`
          : '');
      
      alert(message);
      await fetchCertificates();
    } catch (error) {
      console.error('Error backfilling certificates:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
      console.error('Full error:', error.response?.data);
      alert(`Failed to backfill certificates:\n\n${errorMessage}\n\nPlease check:\n1. Certificates table exists in database\n2. Run certificates-schema.sql if not done\n3. Check server console for details`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      GENERATED: 'bg-green-100 text-green-800 border-green-200',
      REJECTED: 'bg-red-100 text-red-800 border-red-200'
    };
    return styles[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING_APPROVAL':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'GENERATED':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'REJECTED':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-orange-50/20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  const pendingCount = certificates.filter(c => c.status === 'PENDING_APPROVAL').length;
  const generatedCount = certificates.filter(c => c.status === 'GENERATED').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-orange-50/20">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="inline-flex items-center px-4 py-2 rounded-full text-xs font-semibold tracking-widest uppercase bg-orange-500/20 text-orange-300 border border-orange-400/30 mb-6 backdrop-blur-sm">
                <Award className="w-3 h-3 mr-2" />
                Certificate Management
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight">Certificate Management</h1>
            </div>
            <div className="flex gap-3">
              <button
                onClick={checkStatus}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-500 text-white rounded-xl hover:from-gray-700 hover:to-gray-600 transition-all font-semibold shadow-lg"
              >
                Check Status
              </button>
              <button
                onClick={handleBackfill}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-700 hover:to-blue-600 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Award className="w-5 h-5" />
                Backfill Certificates
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">Pending Approval</p>
                <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">Generated</p>
                <p className="text-3xl font-bold text-green-600">{generatedCount}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">Total Certificates</p>
                <p className="text-3xl font-bold text-blue-600">{certificates.length}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Award className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
        <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('PENDING_APPROVAL')}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                filter === 'PENDING_APPROVAL'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setFilter('GENERATED')}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                filter === 'GENERATED'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Generated ({generatedCount})
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
          </div>
        </div>
      </div>

      {/* Certificates List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {certificates.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-16 text-center border border-gray-100">
            <Award className="w-24 h-24 text-gray-300 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No Certificates Found</h3>
            <p className="text-gray-600 text-lg">
              {filter === 'PENDING_APPROVAL' 
                ? 'No certificates are pending approval'
                : filter === 'GENERATED'
                ? 'No certificates have been generated yet'
                : 'No certificates found'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {certificates.map((cert) => (
              <div
                key={cert.id}
                className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 hover:shadow-2xl transition-all duration-300"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        {getStatusIcon(cert.status)}
                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${getStatusBadge(cert.status)}`}>
                          {cert.status.replace('_', ' ')}
                        </span>
                        {cert.certificate_number && (
                          <span className="text-sm text-gray-600 font-mono">
                            #{cert.certificate_number}
                          </span>
                        )}
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <User className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="text-sm text-gray-600">Student</p>
                            <p className="text-lg font-bold text-gray-900">
                              {cert.user?.full_name || cert.user?.email}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <BookOpen className="w-5 h-5 text-orange-600" />
                          <div>
                            <p className="text-sm text-gray-600">Course</p>
                            <p className="text-lg font-bold text-gray-900">
                              {cert.course?.title}
                            </p>
                          </div>
                        </div>

                        {cert.completed_at && (
                          <div className="flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-green-600" />
                            <div>
                              <p className="text-sm text-gray-600">Completed</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {new Date(cert.enrollment?.completed_at || cert.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        )}

                        {cert.issued_at && (
                          <div className="flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-purple-600" />
                            <div>
                              <p className="text-sm text-gray-600">Issued</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {new Date(cert.issued_at).toLocaleDateString()}
                              </p>
                              {cert.issued_by_profile && (
                                <p className="text-xs text-gray-500">
                                  by {cert.issued_by_profile.full_name}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 ml-6">
                      {cert.status === 'PENDING_APPROVAL' && (
                        <button
                          onClick={() => handleApprove(cert.id)}
                          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-xl hover:from-orange-700 hover:to-orange-600 transition-all font-semibold shadow-lg whitespace-nowrap"
                        >
                          <CheckCircle className="w-5 h-5" />
                          Approve & Generate
                        </button>
                      )}
                      {cert.status === 'GENERATED' && (
                        <button
                          onClick={async () => {
                            try {
                              const response = await api.get(`/certificates/${cert.id}/download`, {
                                responseType: 'blob',
                              });
                              
                              // Create blob URL and trigger download
                              const url = window.URL.createObjectURL(new Blob([response.data]));
                              const link = document.createElement('a');
                              link.href = url;
                              link.setAttribute('download', `certificate-${cert.certificate_number}.pdf`);
                              document.body.appendChild(link);
                              link.click();
                              link.remove();
                              window.URL.revokeObjectURL(url);
                            } catch (error) {
                              console.error('Error downloading certificate:', error);
                              alert('Failed to download certificate: ' + (error.response?.data?.error || error.message));
                            }
                          }}
                          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl hover:from-green-700 hover:to-green-600 transition-all font-semibold shadow-lg whitespace-nowrap"
                        >
                          <Download className="w-5 h-5" />
                          Download PDF
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

