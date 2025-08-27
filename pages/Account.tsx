
import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Input from '../components/Input';
import Button from '../components/Button';
import { useAuth } from '../contexts/AuthContext';
import { notifySuccess, notifyError } from '../services/notification';
import api from '../services/api';

const Account: React.FC = () => {
  const { user, refetchUser, logout } = useAuth();
  
  const [profileData, setProfileData] = useState({ name: '', email: '' });
  const [passwordData, setPasswordData] = useState({ password: '', password_confirmation: '' });
  
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData({ name: user.name, email: user.email });
    }
  }, [user]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsProfileSaving(true);
    try {
      await api.put(`/users/${user.id}`, profileData);
      notifySuccess('Profile updated successfully.');
      await refetchUser();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update profile.';
      notifyError(message);
    } finally {
      setIsProfileSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (passwordData.password !== passwordData.password_confirmation) {
      notifyError('Passwords do not match.');
      return;
    }
    if (!passwordData.password) {
        notifyError('Password cannot be empty.');
        return;
    }

    setIsPasswordSaving(true);
    try {
      const payload = { ...profileData, ...passwordData };
      await api.put(`/users/${user.id}`, payload);
      notifySuccess('Password updated successfully. Please log in again.');
      logout();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update password.';
      notifyError(message);
    } finally {
      setIsPasswordSaving(false);
    }
  };
  
  if (!user) {
    return <div>Loading user profile...</div>;
  }

  return (
    <>
      <Header title="Account Settings" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white border-b pb-3 dark:border-gray-700">Profile Information</h2>
          <form onSubmit={handleProfileSubmit} className="space-y-6 mt-4">
            <Input
              label="Name"
              id="name"
              name="name"
              value={profileData.name}
              onChange={handleProfileChange}
              required
            />
            <Input
              label="Email Address"
              id="email"
              name="email"
              type="email"
              value={profileData.email}
              onChange={handleProfileChange}
              required
            />
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isProfileSaving}>
                {isProfileSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white border-b pb-3 dark:border-gray-700">Update Password</h2>
          <form onSubmit={handlePasswordSubmit} className="space-y-6 mt-4">
            <Input
              label="New Password"
              id="password"
              name="password"
              type="password"
              value={passwordData.password}
              onChange={handlePasswordChange}
              autoComplete="new-password"
              required
            />
            <Input
              label="Confirm New Password"
              id="password_confirmation"
              name="password_confirmation"
              type="password"
              value={passwordData.password_confirmation}
              onChange={handlePasswordChange}
              required
            />
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isPasswordSaving}>
                {isPasswordSaving ? 'Saving...' : 'Change Password'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default Account;
