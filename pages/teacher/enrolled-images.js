import { useState, useEffect } from 'react';
import Layout from '../../src/components/Layout';
import { useAuth } from '../../src/contexts/AuthContext';
import { dbHelpers } from '../../src/lib/supabase';
import { Users, Search, Eye, X, Camera } from 'lucide-react';

export default function EnrolledImages() {
  const { userProfile } = useAuth();
  const [enrolledImages, setEnrolledImages] = useState([]);
  const [filteredImages, setFilteredImages] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);

  useEffect(() => {
    if (userProfile) {
      fetchEnrolledImages();
    }
  }, [userProfile]);

  useEffect(() => {
    filterImages();
  }, [enrolledImages, searchTerm]);

  async function fetchEnrolledImages() {
    try {
      console.log('Fetching enrolled images...');
      const { data, error } = await dbHelpers.getAllEnrolledImages();

      console.log('Enrolled images response:', { data, error });

      if (error) {
        console.error('Error fetching enrolled images:', error);
        return;
      }

      setEnrolledImages(data || []);
    } catch (error) {
      console.error('Error fetching enrolled images:', error);
    } finally {
      setLoading(false);
    }
  }

  function filterImages() {
    if (!searchTerm) {
      setFilteredImages(enrolledImages);
      return;
    }
    
    const filtered = enrolledImages.filter(student =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.student_id && student.student_id.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    setFilteredImages(filtered);
  }

  function openImageModal(student) {
    setSelectedImage(student);
    setShowImageModal(true);
  }

  function closeImageModal() {
    setSelectedImage(null);
    setShowImageModal(false);
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="loading-spinner"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Enrolled Face Images</h1>
            <p className="text-gray-600">View all student enrolled face images</p>
          </div>
          <div className="text-sm text-gray-600">
            Total Enrolled: <span className="font-semibold">{enrolledImages.length}</span>
          </div>
        </div>

        {/* Search */}
        <div className="card">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or student ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
            <div className="text-sm text-gray-600">
              Showing {filteredImages.length} of {enrolledImages.length} students
            </div>
          </div>
        </div>

        {/* Images Grid */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Enrolled Images</h2>
          
          {filteredImages.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredImages.map((student) => (
                <div key={student.firebase_id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="text-center">
                    <img 
                      src={student.enrolled_image_url} 
                      alt={student.name}
                      className="w-24 h-24 rounded-full object-cover border-2 border-gray-200 mx-auto mb-3"
                    />
                    <h3 className="font-medium text-gray-900 mb-1">{student.name}</h3>
                    <p className="text-sm text-gray-600 mb-1">{student.student_id || 'N/A'}</p>
                    <p className="text-xs text-gray-500 mb-3">{student.email}</p>
                    <p className="text-xs text-gray-400 mb-3">
                      Enrolled: {new Date(student.enrolled_at).toLocaleDateString()}
                    </p>
                    <button
                      onClick={() => openImageModal(student)}
                      className="flex items-center justify-center w-full px-3 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Full Image
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {searchTerm ? 'No enrolled images found matching your search.' : 'No students have enrolled their faces yet.'}
              </p>
            </div>
          )}
        </div>

        {/* Image Modal */}
        {showImageModal && selectedImage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Enrolled Face Image</h3>
                <button
                  onClick={closeImageModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="text-center">
                <img 
                  src={selectedImage.enrolled_image_url} 
                  alt={selectedImage.name}
                  className="w-80 h-80 object-cover rounded-lg border-2 border-gray-200 mx-auto mb-4"
                />
                <div className="space-y-2">
                  <h4 className="text-lg font-medium text-gray-900">{selectedImage.name}</h4>
                  <p className="text-sm text-gray-600">Student ID: {selectedImage.student_id || 'N/A'}</p>
                  <p className="text-sm text-gray-600">Email: {selectedImage.email}</p>
                  <p className="text-xs text-gray-500">
                    Enrolled on: {new Date(selectedImage.enrolled_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

