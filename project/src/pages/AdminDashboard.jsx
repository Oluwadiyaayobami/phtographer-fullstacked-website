import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Upload,
  Users,
  ShoppingCart,
  Settings,
  CheckCircle,
  XCircle,
  Eye,
  LogOut,
  Trash2,
  ChevronDown,
  Check,
  X,
  Download,
  Key,
  FolderPlus,
  Image,
  UserCheck,
  UserX
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getAllPurchaseRequests, updatePurchaseRequestStatus, supabase } from '../utils/supabase';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const { user, logout } = useAuth();

  const [activeTab, setActiveTab] = useState('overview');
  const [purchaseRequests, setPurchaseRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  const [allUsers, setAllUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const [settings, setSettings] = useState({
    businessName: 'PLENATHEGRAPHER',
    email: 'contact@plenathegrapher.com',
    notifications: true,
    darkMode: false,
  });

  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [images, setImages] = useState([]);

  // Upload UI state
  const [uploadQueue, setUploadQueue] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  // Pin for download
  const [downloadPin, setDownloadPin] = useState('');
  const [isUpdatingPin, setIsUpdatingPin] = useState(false);
  const [pinInitialized, setPinInitialized] = useState(false);

  // New state for collection management
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDescription, setNewCollectionDescription] = useState('');
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [uploadMode, setUploadMode] = useState('random'); // 'random' or 'collection'

  // Inline confirmation states
  const [confirmingDelete, setConfirmingDelete] = useState(null);
  const [confirmingCollectionDelete, setConfirmingCollectionDelete] = useState(null);

  // File input ref
  const fileInputRef = React.useRef(null);

  // ---------- Download PIN ----------
  useEffect(() => {
    fetchDownloadPin();
  }, []);

  const fetchDownloadPin = async () => {
    try {
      const { data, error } = await supabase
        .from('download_pin')
        .select('pin')
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching PIN:', error);
        toast.error('Failed to load download PIN');
        return;
      }
      
      if (data) {
        setDownloadPin(data.pin);
        setPinInitialized(true);
      } else {
        setDownloadPin('1234');
        setPinInitialized(false);
      }
    } catch (err) {
      console.error('Failed to fetch download PIN:', err);
      toast.error('Failed to load download PIN');
    }
  };

  const handleSavePin = async () => {
    if (!downloadPin.trim()) {
      toast.error('Please enter a valid PIN');
      return;
    }
    
    setIsUpdatingPin(true);
    
    try {
      const { error } = await supabase
        .from('download_pin')
        .upsert({ id: 1, pin: downloadPin }, { onConflict: 'id' });
      
      if (error) throw error;
      
      toast.success('PIN saved successfully');
      setPinInitialized(true);
    } catch (err) {
      console.error('Failed to save PIN:', err);
      toast.error('Failed to save PIN');
    } finally {
      setIsUpdatingPin(false);
    }
  };

  // ---------- Purchase Requests ----------
  useEffect(() => {
    if (!user) return;
    fetchPurchaseRequests();
  }, [user]);

  const fetchPurchaseRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await getAllPurchaseRequests();
      if (error) throw error;
      setPurchaseRequests(data || []);
    } catch (err) {
      toast.error('Failed to load purchase requests');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (requestId, status) => {
    try {
      const { error } = await updatePurchaseRequestStatus(requestId, status);
      if (error) throw error;
      setPurchaseRequests((prev) => prev.map((r) => (r.id === requestId ? { ...r, status } : r)));
      toast.success(`Request ${status} successfully`);
    } catch (err) {
      toast.error('Failed to update request status');
    }
  };

  const stats = useMemo(() => {
    const totalRequests = purchaseRequests.length;
    const pendingRequests = purchaseRequests.filter((r) => r.status === 'pending').length;
    const approvedRequests = purchaseRequests.filter((r) => r.status === 'approved').length;
    const deniedRequests = purchaseRequests.filter((r) => r.status === 'denied').length;
    
    // User stats
    const totalUsers = allUsers.length;
    const adminUsers = allUsers.filter(u => u.role === 'admin').length;
    const regularUsers = allUsers.filter(u => u.role === 'user' || !u.role).length;
    const approvedUsers = allUsers.filter(u => u.approved).length;
    
    return { 
      totalRequests, 
      pendingRequests, 
      approvedRequests, 
      deniedRequests,
      totalUsers,
      adminUsers,
      regularUsers,
      approvedUsers
    };
  }, [purchaseRequests, allUsers]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Eye },
    { id: 'requests', label: 'Purchase Requests', icon: ShoppingCart },
    { id: 'upload', label: 'Upload Content', icon: Upload },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // ---------- Collections ----------
  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      const { data, error } = await supabase.from('collections').select('id, title, description').order('created_at', { ascending: false });
      if (error) throw error;
      setCollections(data || []);
      if (data && data.length > 0) setSelectedCollection(data[0].id);
    } catch (err) {
      toast.error('Failed to fetch collections');
    }
  };

  // ---------- Images ----------
  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const { data, error } = await supabase
        .from('images')
        .select('id, title, image_url, collection_id, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setImages(data || []);
    } catch (err) {
      toast.error('Failed to fetch images');
    }
  };

  // ---------- Users ----------
  useEffect(() => {
    // Fetch users when component mounts and when activeTab changes to users
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setAllUsers(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      toast.error('Failed to fetch users');
    } finally {
      setUsersLoading(false);
    }
  };

  // ---------- Create New Collection ----------
  const createNewCollection = async () => {
    if (!newCollectionName.trim()) {
      toast.error('Please enter a collection name');
      return;
    }

    setIsCreatingCollection(true);
    try {
      const { data, error } = await supabase
        .from('collections')
        .insert([
          {
            title: newCollectionName,
            description: newCollectionDescription,
            created_at: new Date()
          }
        ])
        .select()
        .single();

      if (error) throw error;

      toast.success('Collection created successfully!');
      setNewCollectionName('');
      setNewCollectionDescription('');
      await fetchCollections();
      setSelectedCollection(data.id);
    } catch (err) {
      toast.error('Failed to create collection');
    } finally {
      setIsCreatingCollection(false);
    }
  };

  // ---------- File Validation ----------
  const validateFiles = (files) => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png', 
      'image/gif', 
      'image/webp',
      'image/heic',
      'image/heif'
    ];
    
    const invalidFiles = [];
    
    Array.from(files).forEach(file => {
      // Check file type
      if (!allowedTypes.includes(file.type.toLowerCase())) {
        invalidFiles.push(`${file.name}: Invalid file type (${file.type || 'unknown'})`);
      }
      
      // Check file size
      if (file.size > maxSize) {
        invalidFiles.push(`${file.name}: File too large (${(file.size / 1024 / 1024).toFixed(1)}MB, max 10MB)`);
      }
      
      // Check if file is empty
      if (file.size === 0) {
        invalidFiles.push(`${file.name}: File is empty`);
      }
    });
    
    return invalidFiles;
  };

  // ---------- Upload Functions ----------
  const handleFileSelect = () => {
    // Programmatically click the hidden file input
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) {
      toast.error('No files selected');
      return;
    }

    // Validate files before upload
    const invalidFiles = validateFiles(files);
    if (invalidFiles.length > 0) {
      toast.error(`Some files are invalid:\n${invalidFiles.slice(0, 3).join('\n')}`);
      if (invalidFiles.length > 3) {
        toast.error(`... and ${invalidFiles.length - 3} more files have issues`);
      }
      return;
    }

    if (uploadMode === 'collection' && !selectedCollection) {
      toast.error('Please select or create a collection first');
      return;
    }

    const list = Array.from(files).map((file) => ({
      name: file.name,
      progress: 0,
      status: 'queued',
      file: file
    }));

    setUploadQueue(list);
    setIsUploading(true);

    // Process files sequentially to avoid overwhelming the system
    for (let i = 0; i < list.length; i++) {
      await processSingleFile(list[i], i);
    }

    setIsUploading(false);
    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    await fetchImages();
  };

  const processSingleFile = async (item, index) => {
    const file = item.file;
    
    // Update status to uploading
    setUploadQueue((prev) =>
      prev.map((it, idx) => (idx === index ? { ...it, status: 'uploading', progress: 5 } : it))
    );

    try {
      // Simulate progress
      let tick = 5;
      const progressTimer = setInterval(() => {
        tick = Math.min(tick + 7, 90);
        setUploadQueue((prev) =>
          prev.map((it, idx) => (idx === index ? { ...it, progress: tick } : it))
        );
      }, 180);

      // Create unique filename to avoid conflicts
      const timestamp = Date.now();
      const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      
      // Determine folder based on upload mode
      const folder = uploadMode === 'random' 
        ? `random_images/${timestamp}_${safeFileName}`
        : `collection_${selectedCollection}/${timestamp}_${safeFileName}`;

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(folder, file, {
          cacheControl: '3600',
          upsert: false
        });

      clearInterval(progressTimer);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        setUploadQueue((prev) =>
          prev.map((it, idx) => (idx === index ? { ...it, status: 'error', progress: 100, error: uploadError.message } : it))
        );
        toast.error(`Failed to upload ${file.name}`);
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('images')
        .getPublicUrl(folder);

      const publicUrl = urlData?.publicUrl;

      if (!publicUrl) {
        throw new Error('Could not get public URL for uploaded file');
      }

      // Insert into images table
      const imageData = {
        title: file.name,
        image_url: publicUrl,
        created_at: new Date(),
      };

      if (uploadMode === 'collection') {
        imageData.collection_id = selectedCollection;
      }

      const { error: dbError } = await supabase.from('images').insert([imageData]);

      if (dbError) {
        console.error('Database error:', dbError);
        setUploadQueue((prev) =>
          prev.map((it, idx) => (idx === index ? { ...it, status: 'error', progress: 100, error: 'Database error' } : it))
        );
        toast.error(`Failed to save metadata for ${file.name}`);
        return;
      }

      // Mark as done
      setUploadQueue((prev) =>
        prev.map((it, idx) => (idx === index ? { ...it, status: 'done', progress: 100 } : it))
      );
      toast.success(`${file.name} uploaded successfully!`);

    } catch (err) {
      console.error('Upload process error:', err);
      setUploadQueue((prev) =>
        prev.map((it, idx) => (idx === index ? { ...it, status: 'error', progress: 100, error: err.message } : it))
      );
      toast.error(`Upload failed for ${file.name}`);
    }
  };

  // ---------- Delete Functions with Inline Confirmation ----------
  const performImageDelete = async (image) => {
    try {
      const url = new URL(image.image_url);
      const pathParts = url.pathname.split('/');
      const idx = pathParts.findIndex((p) => p === 'images');
      const path = pathParts.slice(idx + 1).join('/');

      const { error: storageError } = await supabase.storage.from('images').remove([path]);
      if (storageError) throw storageError;

      const { error: dbError } = await supabase.from('images').delete().eq('id', image.id);
      if (dbError) throw dbError;

      toast.success('Image deleted successfully');
      fetchImages();
    } catch (err) {
      toast.error('Failed to delete image');
    } finally {
      setConfirmingDelete(null);
    }
  };

  const performCollectionDelete = async (collectionId) => {
    try {
      // First delete all images in the collection
      const { error: imagesError } = await supabase
        .from('images')
        .delete()
        .eq('collection_id', collectionId);
      if (imagesError) throw imagesError;

      // Then delete the collection
      const { error: collectionError } = await supabase
        .from('collections')
        .delete()
        .eq('id', collectionId);
      if (collectionError) throw collectionError;

      toast.success('Collection deleted successfully');
      await fetchCollections();
      await fetchImages();
    } catch (err) {
      toast.error('Failed to delete collection');
    } finally {
      setConfirmingCollectionDelete(null);
    }
  };

  const updateUserRole = async (userId, role) => {
    const { error } = await supabase.from('users').update({ role }).eq('id', userId);
    if (error) toast.error('Failed to update role');
    else {
      setAllUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
      toast.success('Role updated successfully');
    }
  };

  // ---------- Settings ----------
  useEffect(() => {
    if (activeTab === 'settings' && user) fetchSettings();
  }, [activeTab, user]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase.from('settings').select('*').single();
      if (!error && data) setSettings(data);
    } catch (err) {
      // non-blocking
    }
  };

  const updateSettings = async () => {
    const { error } = await supabase.from('settings').upsert(settings);
    if (error) toast.error('Failed to update settings');
    else toast.success('Settings updated!');
  };

  // ---------- Helpers ----------
  const randomImages = images.filter((img) => !img.collection_id);
  const imagesByCollection = collections.map((col) => ({
    ...col,
    images: images.filter((img) => img.collection_id === col.id),
  }));

  const ActiveIcon = tabs.find((t) => t.id === activeTab)?.icon || Eye;

  return (
    <div className={settings.darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-black via-gray-800 to-black rounded-lg shadow-lg p-6 mb-6 md:mb-8 flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0"
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white">Admin Dashboard</h1>
            <p className="text-gray-300 mt-1 text-sm md:text-base">Manage your photography business</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Mobile tab switcher */}
            <div className="md:hidden">
              <label className="sr-only">Select Section</label>
              <div className="relative">
                <select
                  value={activeTab}
                  onChange={(e) => setActiveTab(e.target.value)}
                  className="appearance-none bg-gray-900 text-white border border-gray-700 rounded-lg py-2 pl-3 pr-9 text-sm"
                >
                  {tabs.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <button
              onClick={logout}
              className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors shadow-md"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm md:text-base">Logout</span>
            </button>
          </div>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Sidebar (desktop) */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:w-1/4">
            <div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 md:p-6 sticky top-4">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 md:px-4 md:py-3 rounded-lg text-left transition-colors font-medium ${
                        active
                          ? 'bg-black text-white shadow-md dark:bg-gray-900'
                          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700/60'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm md:text-base">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </motion.div>

          {/* Content */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:w-3/4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 md:p-6 space-y-6 min-h-[70vh]">
              
              {/* Overview */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">Business Overview</h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      {
                        label: 'Total Requests',
                        value: stats.totalRequests,
                        icon: ShoppingCart,
                        bg: 'from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20',
                        text: 'text-blue-800 dark:text-blue-200',
                      },
                      {
                        label: 'Pending',
                        value: stats.pendingRequests,
                        icon: Eye,
                        bg: 'from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/20',
                        text: 'text-yellow-800 dark:text-yellow-200',
                      },
                      {
                        label: 'Approved',
                        value: stats.approvedRequests,
                        icon: CheckCircle,
                        bg: 'from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/20',
                        text: 'text-green-800 dark:text-green-200',
                      },
                      {
                        label: 'Denied',
                        value: stats.deniedRequests,
                        icon: XCircle,
                        bg: 'from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/20',
                        text: 'text-red-800 dark:text-red-200',
                      },
                    ].map((c, idx) => {
                      const Icon = c.icon;
                      return (
                        <div
                          key={idx}
                          className={`bg-gradient-to-br ${c.bg} border border-gray-100 dark:border-gray-700 rounded-xl p-4 md:p-6 shadow-sm flex justify-between items-center transform transition-transform hover:-translate-y-0.5`}
                        >
                          <div>
                            <p className={`${c.text} text-xs md:text-sm font-medium`}>{c.label}</p>
                            <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
                              {c.value}
                            </p>
                          </div>
                          <Icon className={`${c.text} w-6 h-6 md:w-8 md:h-8`} />
                        </div>
                      );
                    })}
                  </div>

                  {/* Additional Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/20 border border-gray-100 dark:border-gray-700 rounded-xl p-4 md:p-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-purple-800 dark:text-purple-200 text-sm font-medium">Total Images</p>
                          <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">{images.length}</p>
                        </div>
                        <Image className="text-purple-800 dark:text-purple-200 w-6 h-6 md:w-8 md:h-8" />
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/20 border border-gray-100 dark:border-gray-700 rounded-xl p-4 md:p-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-orange-800 dark:text-orange-200 text-sm font-medium">Random Images</p>
                          <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">{randomImages.length}</p>
                        </div>
                        <Image className="text-orange-800 dark:text-orange-200 w-6 h-6 md:w-8 md:h-8" />
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/30 dark:to-cyan-800/20 border border-gray-100 dark:border-gray-700 rounded-xl p-4 md:p-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-cyan-800 dark:text-cyan-200 text-sm font-medium">Collections</p>
                          <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">{collections.length}</p>
                        </div>
                        <FolderPlus className="text-cyan-800 dark:text-cyan-200 w-6 h-6 md:w-8 md:h-8" />
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/20 border border-gray-100 dark:border-gray-700 rounded-xl p-4 md:p-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-indigo-800 dark:text-indigo-200 text-sm font-medium">Total Users</p>
                          <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.totalUsers}</p>
                        </div>
                        <Users className="text-indigo-800 dark:text-indigo-200 w-6 h-6 md:w-8 md:h-8" />
                      </div>
                    </div>
                  </div>

                  {/* User Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/20 border border-gray-100 dark:border-gray-700 rounded-xl p-4 md:p-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-green-800 dark:text-green-200 text-sm font-medium">Admin Users</p>
                          <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.adminUsers}</p>
                        </div>
                        <UserCheck className="text-green-800 dark:text-green-200 w-6 h-6 md:w-8 md:h-8" />
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/30 dark:to-gray-800/20 border border-gray-100 dark:border-gray-700 rounded-xl p-4 md:p-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-gray-800 dark:text-gray-200 text-sm font-medium">Regular Users</p>
                          <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.regularUsers}</p>
                        </div>
                        <Users className="text-gray-800 dark:text-gray-200 w-6 h-6 md:w-8 md:h-8" />
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/20 border border-gray-100 dark:border-gray-700 rounded-xl p-4 md:p-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-yellow-800 dark:text-yellow-200 text-sm font-medium">Approved Users</p>
                          <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.approvedUsers}</p>
                        </div>
                        <UserCheck className="text-yellow-800 dark:text-yellow-200 w-6 h-6 md:w-8 md:h-8" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Requests */}
              {activeTab === 'requests' && (
                <div className="space-y-6">
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">Purchase Requests</h2>

                  {/* Mobile: cards */}
                  <div className="md:hidden space-y-3">
                    {purchaseRequests.map((req) => (
                      <div
                        key={req.id}
                        className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-600 dark:text-gray-300">Request ID</p>
                          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{req.id}</span>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-sm text-gray-600 dark:text-gray-300">User</p>
                          <span className="text-sm text-gray-900 dark:text-gray-100">{req.user_email}</span>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-sm text-gray-600 dark:text-gray-300">Status</p>
                          <span className="text-sm capitalize">{req.status}</span>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={() => handleStatusUpdate(req.id, 'approved')}
                            className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(req.id, 'denied')}
                            className="px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                          >
                            Deny
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop: table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead>
                        <tr className="bg-gray-100 dark:bg-gray-700/60">
                          <th className="px-4 py-2 text-left text-xs md:text-sm font-medium text-gray-700 dark:text-gray-200">
                            Request ID
                          </th>
                          <th className="px-4 py-2 text-left text-xs md:text-sm font-medium text-gray-700 dark:text-gray-200">
                            User
                          </th>
                          <th className="px-4 py-2 text-left text-xs md:text-sm font-medium text-gray-700 dark:text-gray-200">
                            Status
                          </th>
                          <th className="px-4 py-2 text-left text-xs md:text-sm font-medium text-gray-700 dark:text-gray-200">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {purchaseRequests.map((req, idx) => (
                          <tr key={req.id} className="odd:bg-white even:bg-gray-50 dark:odd:bg-gray-800 dark:even:bg-gray-900">
                            <td className="px-4 py-2 text-sm md:text-base text-gray-900 dark:text-gray-100">{req.id}</td>
                            <td className="px-4 py-2 text-sm md:text-base text-gray-800 dark:text-gray-200">{req.user_email}</td>
                            <td className="px-4 py-2 text-sm md:text-base capitalize">{req.status}</td>
                            <td className="px-4 py-2 text-sm md:text-base space-x-2">
                              <button
                                onClick={() => handleStatusUpdate(req.id, 'approved')}
                                className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(req.id, 'denied')}
                                className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                              >
                                Deny
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Upload */}
              {activeTab === 'upload' && (
                <div className="space-y-6">
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">Upload Content</h2>

                  {/* Upload Mode Selection */}
                  <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 md:p-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Upload Type</h3>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <button
                        onClick={() => setUploadMode('random')}
                        className={`flex-1 p-4 border-2 rounded-lg text-center transition-colors ${
                          uploadMode === 'random'
                            ? 'border-black bg-black text-white dark:border-gray-100 dark:bg-gray-100 dark:text-gray-900'
                            : 'border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
                        }`}
                      >
                        <Image className="w-8 h-8 mx-auto mb-2" />
                        <h4 className="font-semibold">Random Images</h4>
                        <p className="text-sm mt-1">Upload individual images without collections</p>
                      </button>
                      <button
                        onClick={() => setUploadMode('collection')}
                        className={`flex-1 p-4 border-2 rounded-lg text-center transition-colors ${
                          uploadMode === 'collection'
                            ? 'border-black bg-black text-white dark:border-gray-100 dark:bg-gray-100 dark:text-gray-900'
                            : 'border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
                        }`}
                      >
                        <FolderPlus className="w-8 h-8 mx-auto mb-2" />
                        <h4 className="font-semibold">Collection Images</h4>
                        <p className="text-sm mt-1">Upload images to organized collections</p>
                      </button>
                    </div>
                  </div>

                  {/* Collection Management (only for collection mode) */}
                  {uploadMode === 'collection' && (
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 md:p-6 space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Collection Management</h3>
                      
                      {/* Create New Collection */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-800 dark:text-gray-200">Create New Collection</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={newCollectionName}
                            onChange={(e) => setNewCollectionName(e.target.value)}
                            placeholder="Collection Name"
                            className="border rounded p-2 w-full bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                          />
                          <input
                            type="text"
                            value={newCollectionDescription}
                            onChange={(e) => setNewCollectionDescription(e.target.value)}
                            placeholder="Description (optional)"
                            className="border rounded p-2 w-full bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                          />
                        </div>
                        <button
                          onClick={createNewCollection}
                          disabled={isCreatingCollection}
                          className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 disabled:bg-gray-400 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
                        >
                          {isCreatingCollection ? 'Creating...' : 'Create Collection'}
                        </button>
                      </div>

                      {/* Select Existing Collection */}
                      <div>
                        <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Select Existing Collection</h4>
                        <select
                          value={selectedCollection || ''}
                          onChange={(e) => setSelectedCollection(e.target.value)}
                          className="border rounded p-2 w-full bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                        >
                          <option value="">Select a collection</option>
                          {collections.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.title}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Collections List */}
                      {collections.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Your Collections</h4>
                          <div className="space-y-2">
                            {collections.map((collection) => (
                              <div key={collection.id} className="flex justify-between items-center p-3 border rounded bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-gray-100">{collection.title}</p>
                                  {collection.description && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{collection.description}</p>
                                  )}
                                  <p className="text-xs text-gray-500 dark:text-gray-500">
                                    {images.filter(img => img.collection_id === collection.id).length} images
                                  </p>
                                </div>
                                {confirmingCollectionDelete === collection.id ? (
                                  <div className="flex gap-1 bg-white dark:bg-gray-700 p-1 rounded-lg shadow-lg border">
                                    <button
                                      onClick={() => performCollectionDelete(collection.id)}
                                      className="p-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                                      title="Confirm Delete"
                                    >
                                      <Check className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => setConfirmingCollectionDelete(null)}
                                      className="p-1.5 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                                      title="Cancel"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setConfirmingCollectionDelete(collection.id)}
                                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                                    title="Delete Collection"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Uploader */}
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center bg-gray-50 dark:bg-gray-900 relative">
                    {/* Hidden file input */}
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      multiple 
                      onChange={(e) => handleFileUpload(e.target.files)} 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                      id="fileInput"
                      accept="image/*,image/jpeg,image/jpg,image/png,image/gif,image/webp,image/heic,image/heif"
                    />
                    
                    <div className="pointer-events-none">
                      <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        {uploadMode === 'random' ? 'Upload Random Images' : 'Upload to Collection'}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-4">
                        {uploadMode === 'random' 
                          ? 'Upload individual images that will appear in the random images section'
                          : 'Upload images to the selected collection'
                        }
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Supported formats: JPEG, PNG, GIF, WebP, HEIC (max 10MB each)
                      </p>
                      <button 
                        type="button"
                        onClick={handleFileSelect}
                        className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors shadow-md pointer-events-auto"
                      >
                        Choose Files
                      </button>
                    </div>
                  </div>

                  {/* Upload queue with progress */}
                  {uploadQueue.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">Upload Progress</h4>
                      {uploadQueue.map((item, idx) => (
                        <div key={idx} className="border rounded-lg p-3 bg-white dark:bg-gray-900 dark:border-gray-700">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{item.name}</p>
                            <div className="flex items-center gap-2">
                              {item.status === 'uploading' && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">Uploading… {item.progress}%</span>
                              )}
                              {item.status === 'done' && <Check className="w-4 h-4 text-green-600" />}
                              {item.status === 'error' && <X className="w-4 h-4 text-red-600" />}
                            </div>
                          </div>
                          <div className="mt-2 h-2 w-full bg-gray-200 dark:bg-gray-700 rounded">
                            <div
                              className={`h-2 rounded transition-all duration-300 ${
                                item.status === 'error' 
                                  ? 'bg-red-500' 
                                  : item.status === 'done'
                                  ? 'bg-green-500'
                                  : 'bg-black dark:bg-gray-100'
                              }`}
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                          {item.error && (
                            <p className="text-xs text-red-500 mt-1">{item.error}</p>
                          )}
                        </div>
                      ))}
                      {isUploading && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Please keep this tab open while uploading. 
                          {uploadQueue.length > 5 && ' Large batches may take several minutes.'}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Gallery Display */}
                  <div className="space-y-6">
                    {/* Random Images Section */}
                    {uploadMode === 'random' && randomImages.length > 0 && (
                      <div>
                        <h3 className="text-lg md:text-xl font-bold mb-3 text-gray-900 dark:text-gray-100">Random Images</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                          {randomImages.map((img) => (
                            <div key={img.id} className="group border rounded-lg p-2 relative overflow-hidden bg-white dark:bg-gray-900 dark:border-gray-700">
                              <div className="aspect-[4/3] overflow-hidden rounded">
                                <img
                                  src={img.image_url}
                                  alt={img.title}
                                  className="w-full h-full object-cover transform transition-transform duration-300 group-hover:scale-105"
                                />
                              </div>
                              <p className="text-xs md:text-sm text-gray-700 dark:text-gray-300 mt-2 truncate">{img.title}</p>
                              {confirmingDelete === img.id ? (
                                <div className="absolute top-2 right-2 flex gap-1 bg-white dark:bg-gray-800 p-1 rounded-lg shadow-lg border">
                                  <button
                                    onClick={() => performImageDelete(img)}
                                    className="p-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                                    title="Confirm Delete"
                                  >
                                    <Check className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => setConfirmingDelete(null)}
                                    className="p-1.5 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                                    title="Cancel"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setConfirmingDelete(img.id)}
                                  className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 shadow-lg transition-colors"
                                  title="Delete Image"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Collections Images Section */}
                    {uploadMode === 'collection' && imagesByCollection.map((col) => (
                      <div key={col.id}>
                        <h3 className="text-lg md:text-xl font-bold mb-3 text-gray-900 dark:text-gray-100">{col.title}</h3>
                        {col.images.length === 0 ? (
                          <p className="text-gray-500 dark:text-gray-400">No images yet in this collection</p>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {col.images.map((img) => (
                              <div key={img.id} className="group border rounded-lg p-2 relative overflow-hidden bg-white dark:bg-gray-900 dark:border-gray-700">
                                <div className="aspect-[4/3] overflow-hidden rounded">
                                  <img
                                    src={img.image_url}
                                    alt={img.title}
                                    className="w-full h-full object-cover transform transition-transform duration-300 group-hover:scale-105"
                                  />
                                </div>
                                <p className="text-xs md:text-sm text-gray-700 dark:text-gray-300 mt-2 truncate">{img.title}</p>
                                {confirmingDelete === img.id ? (
                                  <div className="absolute top-2 right-2 flex gap-1 bg-white dark:bg-gray-800 p-1 rounded-lg shadow-lg border">
                                    <button
                                      onClick={() => performImageDelete(img)}
                                      className="p-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                                      title="Confirm Delete"
                                    >
                                      <Check className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => setConfirmingDelete(null)}
                                      className="p-1.5 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                                      title="Cancel"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setConfirmingDelete(img.id)}
                                    className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 shadow-lg transition-colors"
                                    title="Delete Image"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Users */}
              {activeTab === 'users' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">User Management</h2>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-3 py-1 rounded-full">
                        Total: {allUsers.length}
                      </span>
                      <span className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-3 py-1 rounded-full">
                        Admins: {allUsers.filter(u => u.role === 'admin').length}
                      </span>
                      <span className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 px-3 py-1 rounded-full">
                        Users: {allUsers.filter(u => u.role === 'user' || !u.role).length}
                      </span>
                    </div>
                  </div>

                  {usersLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-white mx-auto"></div>
                      <p className="text-gray-600 dark:text-gray-400 mt-2">Loading users...</p>
                    </div>
                  ) : (
                    <>
                      {/* Mobile: cards */}
                      <div className="md:hidden space-y-3">
                        {allUsers.map((u) => (
                          <div key={u.id} className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{u.name || 'No Name'}</p>
                                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{u.email}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <span className={`text-xs px-2 py-1 rounded ${
                                    u.role === 'admin' 
                                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                                  }`}>
                                    {u.role || 'user'}
                                  </span>
                                  <span className={`text-xs px-2 py-1 rounded ${
                                    u.approved 
                                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                  }`}>
                                    {u.approved ? 'Approved' : 'Pending'}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                  Joined: {new Date(u.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2 mt-3">
                              <button
                                onClick={() => updateUserRole(u.id, 'admin')}
                                disabled={u.role === 'admin'}
                                className={`px-3 py-1.5 rounded text-sm ${
                                  u.role === 'admin'
                                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                              >
                                Make Admin
                              </button>
                              <button
                                onClick={() => updateUserRole(u.id, 'user')}
                                disabled={u.role === 'user' || !u.role}
                                className={`px-3 py-1.5 rounded text-sm ${
                                  u.role === 'user' || !u.role
                                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                    : 'bg-gray-700 text-white hover:bg-gray-800'
                                }`}
                              >
                                Make User
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Desktop: table */}
                      <div className="hidden md:block overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                          <thead>
                            <tr className="bg-gray-100 dark:bg-gray-700/60">
                              <th className="px-4 py-3 text-left text-xs md:text-sm font-medium text-gray-700 dark:text-gray-200">User Info</th>
                              <th className="px-4 py-3 text-left text-xs md:text-sm font-medium text-gray-700 dark:text-gray-200">Role</th>
                              <th className="px-4 py-3 text-left text-xs md:text-sm font-medium text-gray-700 dark:text-gray-200">Status</th>
                              <th className="px-4 py-3 text-left text-xs md:text-sm font-medium text-gray-700 dark:text-gray-200">Joined</th>
                              <th className="px-4 py-3 text-left text-xs md:text-sm font-medium text-gray-700 dark:text-gray-200">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {allUsers.map((u) => (
                              <tr key={u.id} className="odd:bg-white even:bg-gray-50 dark:odd:bg-gray-800 dark:even:bg-gray-900">
                                <td className="px-4 py-3">
                                  <div>
                                    <p className="text-sm md:text-base font-medium text-gray-900 dark:text-gray-100">
                                      {u.name || 'No Name'}
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{u.email}</p>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    u.role === 'admin'
                                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                                  }`}>
                                    {u.role || 'user'}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    u.approved
                                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                  }`}>
                                    {u.approved ? 'Approved' : 'Pending'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                  {new Date(u.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-3 space-x-2">
                                  <button
                                    onClick={() => updateUserRole(u.id, 'admin')}
                                    disabled={u.role === 'admin'}
                                    className={`px-3 py-1 rounded text-sm ${
                                      u.role === 'admin'
                                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                        : 'bg-blue-600 text-white hover:bg-blue-700'
                                    }`}
                                  >
                                    Make Admin
                                  </button>
                                  <button
                                    onClick={() => updateUserRole(u.id, 'user')}
                                    disabled={u.role === 'user' || !u.role}
                                    className={`px-3 py-1 rounded text-sm ${
                                      u.role === 'user' || !u.role
                                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                        : 'bg-gray-700 text-white hover:bg-gray-800'
                                    }`}
                                  >
                                    Make User
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Settings */}
              {activeTab === 'settings' && (
                <div className="space-y-6">
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h2>
                  <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-4 md:p-6 rounded-lg shadow-sm space-y-4">
                    <input
                      type="text"
                      value={settings.businessName}
                      onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                      className="block w-full border rounded p-2 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                      placeholder="Business Name"
                    />
                    <input
                      type="email"
                      value={settings.email}
                      onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                      className="block w-full border rounded p-2 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                      placeholder="Email"
                    />
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <label className="flex items-center gap-2 text-gray-800 dark:text-gray-200">
                        <input
                          type="checkbox"
                          checked={settings.notifications}
                          onChange={(e) => setSettings({ ...settings, notifications: e.target.checked })}
                        />
                        <span>Enable Notifications</span>
                      </label>
                      <label className="flex items-center gap-2 text-gray-800 dark:text-gray-200">
                        <input
                          type="checkbox"
                          checked={settings.darkMode}
                          onChange={(e) => setSettings({ ...settings, darkMode: e.target.checked })}
                        />
                        <span>Dark Mode</span>
                      </label>
                    </div>
                    
                    {/* Download PIN Section */}
                    <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <Key className="w-5 h-5" />
                        Download PIN
                      </h3>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-3">
                        <input
                          type="text"
                          value={downloadPin}
                          onChange={(e) => setDownloadPin(e.target.value)}
                          className="border rounded p-2 w-full sm:w-1/2 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                          placeholder="Enter download PIN"
                          disabled={isUpdatingPin}
                        />
                        <button
                          onClick={handleSavePin}
                          disabled={isUpdatingPin}
                          className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 disabled:bg-gray-400 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200 disabled:dark:bg-gray-400"
                        >
                          {isUpdatingPin ? 'Saving...' : 'Save PIN'}
                        </button>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        This PIN will be required for clients to download purchased content.
                        {!pinInitialized && (
                          <span className="text-amber-600 dark:text-amber-400 font-medium"> No PIN set yet. Please create one.</span>
                        )}
                      </p>
                    </div>

                    <button
                      onClick={updateSettings}
                      className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
                    >
                      Save Settings
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;