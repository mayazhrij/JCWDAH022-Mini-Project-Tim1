"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import OrganizerNavbar from "@/components/dashboard/OrganizerNavbar"
import { updateProfilePicture, changePassword, resetPassword } from "@/services/profile.service"
import { toast } from 'sonner';
import { HiArrowLeft, HiCamera } from 'react-icons/hi2';

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [viewImageModal, setViewImageModal] = useState(false); // START FIX: TAMBAH STATE UNTUK MODAL
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');

  // START FIX: LOAD PROFILE DATA SAAT MOUNT
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        // Try to get profile picture dari localStorage first
        const savedPicture = localStorage.getItem('profile_picture');
        if (savedPicture) {
          setProfilePicture(savedPicture);
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
      }
    };
    loadProfileData();
  }, []);
  // END FIX

  const handleUploadPicture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    const formData = new FormData();
    formData.append('photo', file);

    setLoading(true);
    try {
      const result = await updateProfilePicture(formData);
      // START FIX: BUILD FULL IMAGE URL & SAVE
      const fullImageUrl = `${process.env.NEXT_PUBLIC_API_URL}${result.filePath}`;
      setProfilePicture(fullImageUrl);
      localStorage.setItem('profile_picture', fullImageUrl);
      localStorage.setItem('profile_picture_updated', Date.now().toString()); // Track update time
      toast.success('Profile picture updated successfully!');
      // END FIX
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to update profile picture');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    // PATCH: VALIDASI INPUT
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New password and confirm password do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    if (oldPassword === newPassword) {
      toast.error('New password must be different from old password');
      return;
    }

    setLoading(true);
    try {
      await changePassword({ oldPassword, newPassword });
      toast.success('Password changed successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Change password error:', error);
      toast.error(error.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetEmail) {
      toast.error('Please enter email');
      return;
    }

    setLoading(true);
    try {
      await resetPassword({ email: resetEmail });
      toast.success('Reset link sent to your email!');
      setResetEmail('');
    } catch (error: any) {
      console.error('Reset password error:', error);
      toast.error(error.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <OrganizerNavbar />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center space-x-4 mb-8">
            <button onClick={() => router.back()} className="text-gray-600 hover:text-gray-900">
              <HiArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Edit Profile</h1>
          </div>

          {/* Profile Picture */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Picture</h2>
            <div className="flex items-center space-x-6">

              {/* PATCH: BUAT PROFILE PICTURE CLICKABLE */}
              <button
                onClick={() => profilePicture && setViewImageModal(true)}
                disabled={!profilePicture}
                className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden border-2 border-gray-300 hover:opacity-80 hover:cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {profilePicture ? (
                  <img 
                    src={profilePicture} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '';
                      console.error('Image failed to load');
                    }}
                  />
                ) : (
                  <HiCamera className="w-12 h-12 text-gray-400" />
                )}
              </button>
              {/* END FIX */}
              <div>
                <input
                  type="file"
                  id="picture-input"
                  accept="image/*"
                  onChange={handleUploadPicture}
                  disabled={loading}
                  className="hidden"
                />
                <label
                  htmlFor="picture-input"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 cursor-pointer inline-block disabled:opacity-50"
                >
                  {loading ? 'Uploading...' : 'Upload Picture'}
                </label>
                <p className="text-xs text-gray-500 mt-2">Recommended: JPG or PNG, max 5MB</p>
              </div>
            </div>
          </div>

          {/* Change Password */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Change Password</h2>
            <div className="space-y-4">
              <input
                type="password"
                placeholder="Old Password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
              <input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
              <input
                type="password"
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
              <button
                onClick={handleChangePassword}
                disabled={loading}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition"
              >
                {loading ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* PATCH: MODAL UNTUK VIEW PROFILE PICTURE */}
      {viewImageModal && profilePicture && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Profile Picture</h3>
              <button
                onClick={() => setViewImageModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="w-full aspect-square bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
              <img 
                src={profilePicture}
                alt="Profile"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = '';
                  console.error('Image failed to load in modal');
                }}
              />
            </div>
            <button
              onClick={() => setViewImageModal(false)}
              className="w-full mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
      
    </>
  );
}