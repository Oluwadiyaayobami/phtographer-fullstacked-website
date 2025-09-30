import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true, // Persist session (localStorage)
    detectSessionInUrl: true,
  },
});

//
// ---------------- AUTH FUNCTIONS ----------------
//

// Sign up user with role metadata
export const signUp = async ({ email, password, name, role = "user" }) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, role },
    },
  });
  return { user: data?.user, session: data?.session, error };
};

// Sign in user
export const signIn = async ({ email, password }) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { user: data?.user, session: data?.session, error };
};

// Sign out user
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

// Get current logged-in user with role
export const getCurrentUser = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user || null;
  return {
    user,
    role: user?.user_metadata?.role || null,
  };
};

//
// ---------------- COLLECTION / IMAGES ----------------
//

export const getCollections = async () => {
  const { data, error } = await supabase
    .from("collections")
    .select("id, title, description, created_at")
    .order("created_at", { ascending: false });
  return { data, error };
};

// Create new collection
export const createCollection = async (title, description = "") => {
  const { data, error } = await supabase
    .from("collections")
    .insert([
      {
        title,
        description,
        created_at: new Date()
      }
    ])
    .select()
    .single();
  return { data, error };
};

// Delete collection and its images
export const deleteCollection = async (collectionId) => {
  // First delete all images in the collection
  const { error: imagesError } = await supabase
    .from("images")
    .delete()
    .eq("collection_id", collectionId);

  if (imagesError) return { error: imagesError };

  // Then delete the collection
  const { error: collectionError } = await supabase
    .from("collections")
    .delete()
    .eq("id", collectionId);

  return { error: collectionError };
};

// helper to normalize old filenames into full URLs
const normalizeImageUrl = (path) => {
  if (!path) return null;
  return path.startsWith("http")
    ? path
    : supabase.storage.from("images").getPublicUrl(path).data.publicUrl;
};

export const getCollectionImages = async (collectionId) => {
  const { data, error } = await supabase
    .from("images")
    .select("id, title, image_url, collection_id, created_at")
    .eq("collection_id", collectionId)
    .order("created_at", { ascending: false });

  if (error) return { data: null, error };

  const normalized = data.map((img) => ({
    ...img,
    url: normalizeImageUrl(img.image_url),
  }));

  return { data: normalized, error: null };
};

// Get random images (images without collection)
export const getRandomImages = async () => {
  const { data, error } = await supabase
    .from("images")
    .select("id, title, image_url, collection_id, created_at")
    .is("collection_id", null)
    .order("created_at", { ascending: false });

  if (error) return { data: null, error };

  const normalized = data.map((img) => ({
    ...img,
    url: normalizeImageUrl(img.image_url),
  }));

  return { data: normalized, error: null };
};

export const getPublicGalleryImages = async () => {
  const { data, error } = await supabase
    .from("images")
    .select("id, title, image_url, collection_id, created_at")
    .order("created_at", { ascending: false })
    .limit(15);

  if (error) return { data: null, error };

  const normalized = data.map((img) => ({
    ...img,
    url: normalizeImageUrl(img.image_url),
  }));

  return { data: normalized, error: null };
};

export const getAllImages = async () => {
  const { data, error } = await supabase
    .from("images")
    .select("id, title, image_url, collection_id, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching images:", error.message);
    return { data: [], error };
  }

  const normalized = data.map((img) => ({
    ...img,
    image_url: normalizeImageUrl(img.image_url),
  }));

  return { data: normalized, error: null };
};

// Delete single image
export const deleteImage = async (imageId) => {
  const { error } = await supabase
    .from("images")
    .delete()
    .eq("id", imageId);
  return { error };
};

export const verifyCollectionPin = async (collectionId, pin) => {
  const bcrypt = await import("bcryptjs");
  const { data, error } = await supabase
    .from("collections")
    .select("pin_hash")
    .eq("id", collectionId)
    .single();

  if (error || !data) return false;

  return bcrypt.compareSync(pin, data.pin_hash);
};

//
// ---------------- PURCHASE REQUEST ----------------
//

// Create a purchase request
export const createPurchaseRequest = async (userId, imageId) => {
  const { data, error } = await supabase
    .from("purchase_requests")
    .insert([{ user_id: userId, image_id: imageId, status: "pending" }])
    .select();

  return { data, error };
};

// Get all purchase requests for a specific user
export const getUserPurchaseRequests = async (userId) => {
  if (!userId) return { data: [], error: "No user ID provided" };

  const { data, error } = await supabase
    .from("purchase_requests")
    .select(
      `
      id,
      status,
      created_at,
      image:images (
        id,
        title,
        image_url
      )
    `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching user purchase requests:", error.message);
    return { data: [], error };
  }

  // Normalize image URL for frontend
  const normalized = (data || []).map((req) => ({
    id: req.id,
    status: req.status,
    created_at: req.created_at,
    image: req.image
      ? {
          id: req.image.id,
          title: req.image.title,
          url: req.image.image_url
            ? normalizeImageUrl(req.image.image_url)
            : null,
        }
      : null,
  }));

  return { data: normalized, error: null };
};

//
// ---------------- CONTACT FORM ----------------
//

export const submitContactForm = async (name, email, message) => {
  const { data, error } = await supabase
    .from("messages")
    .insert([{ name, email, message }]);
  return { data, error };
};

//
// ---------------- ADMIN FUNCTIONS ----------------
//

// Check if user is admin
export const isAdmin = async (userId) => {
  const { data, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();
  return data?.role === "admin";
};

// Get all users for admin
export const getAllUsers = async () => {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });
  return { data, error };
};

// Update user role
export const updateUserRole = async (userId, role) => {
  const { data, error } = await supabase
    .from("users")
    .update({ role })
    .eq("id", userId);
  return { data, error };
};

// Get all purchase requests for admin - FIXED VERSION
export const getAllPurchaseRequests = async () => {
  try {
    // First, get all purchase requests with user data
    const { data: requestsData, error: requestsError } = await supabase
      .from("purchase_requests")
      .select(`
        *,
        users (
          name,
          email
        )
      `)
      .order("created_at", { ascending: false });

    if (requestsError) {
      console.error("Error fetching purchase requests:", requestsError);
      return { data: null, error: requestsError };
    }

    if (!requestsData || requestsData.length === 0) {
      return { data: [], error: null };
    }

    // Get all image IDs from the requests
    const imageIds = requestsData.map(req => req.image_id).filter(id => id);

    // Fetch images with their collections separately
    const { data: imagesData, error: imagesError } = await supabase
      .from("images")
      .select(`
        id,
        title,
        image_url,
        collection_id,
        collections (
          title
        )
      `)
      .in("id", imageIds);

    if (imagesError) {
      console.error("Error fetching images:", imagesError);
      // Continue with requests data even if images fail
    }

    // Combine the data
    const normalized = requestsData.map((req) => {
      const image = imagesData?.find(img => img.id === req.image_id);
      
      return {
        id: req.id,
        status: req.status,
        created_at: req.created_at,
        user_email: req.users?.email || 'Unknown User',
        user_name: req.users?.name || 'Unknown',
        image: image
          ? {
              id: image.id,
              title: image.title,
              collection_title: image.collections?.title || 'No Collection',
              image_url: normalizeImageUrl(image.image_url),
            }
          : null,
      };
    });

    return { data: normalized, error: null };
  } catch (err) {
    console.error("Exception in getAllPurchaseRequests:", err);
    return { data: null, error: err };
  }
};

// Update request status
export const updatePurchaseRequestStatus = async (requestId, status) => {
  const { data, error } = await supabase
    .from("purchase_requests")
    .update({ status })
    .eq("id", requestId);
  return { data, error };
};

//
// ---------------- SETTINGS ----------------
//

// Get settings
export const getSettings = async () => {
  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .single();
  return { data, error };
};

// Update settings
export const updateSettings = async (settings) => {
  const { data, error } = await supabase
    .from("settings")
    .upsert(settings);
  return { data, error };
};

//
// ---------------- STORAGE ----------------
//

// Simple upload (returns URL only)
export const uploadFile = async (file, folder = "uploads") => {
  const filePath = `${folder}/${Date.now()}-${file.name}`;
  const { error } = await supabase.storage
    .from("images")
    .upload(filePath, file);

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from("images")
    .getPublicUrl(filePath);

  return urlData.publicUrl; // Save into images.image_url column if needed
};

// Upload + Save metadata into `images` table
export const saveImageMetadata = async (
  title,
  collectionId,
  uploadedBy,
  file
) => {
  try {
    // 1. Upload file
    const filePath = `uploads/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("images")
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // 2. Get public URL
    const { data: urlData } = supabase.storage
      .from("images")
      .getPublicUrl(filePath);

    // 3. Insert metadata into `images` table
    const { data, error } = await supabase
      .from("images")
      .insert([
        {
          title,
          collection_id: collectionId,
          uploaded_by: uploadedBy,
          image_url: urlData.publicUrl, // store full URL
        },
      ])
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err };
  }
};

// Upload image with optional collection
export const uploadImageWithMetadata = async (file, title, collectionId = null) => {
  try {
    // Determine folder based on whether it's a collection or random image
    const folder = collectionId 
      ? `collection_${collectionId}/${Date.now()}`
      : `random_images/${Date.now()}`;

    // 1. Upload file to storage
    const { error: uploadError } = await supabase.storage
      .from("images")
      .upload(`${folder}/${file.name}`, file);

    if (uploadError) throw uploadError;

    // 2. Get public URL
    const { data: urlData } = supabase.storage
      .from("images")
      .getPublicUrl(`${folder}/${file.name}`);

    const publicUrl = urlData?.publicUrl;

    // 3. Insert metadata into images table
    const imageData = {
      title: title || file.name,
      image_url: publicUrl,
      created_at: new Date(),
    };

    if (collectionId) {
      imageData.collection_id = collectionId;
    }

    const { data, error } = await supabase
      .from("images")
      .insert([imageData])
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err };
  }
};

// Delete file from storage
export const deleteFileFromStorage = async (filePath) => {
  const { error } = await supabase.storage
    .from("images")
    .remove([filePath]);
  return { error };
};

// Create signed URL for file access
export const createSignedUrl = async (imagePath, expires = 60) => {
  const { data, error } = await supabase.storage
    .from("images")
    .createSignedUrl(imagePath, expires);
  return { data, error };
};

//
// ---------------- DOWNLOAD PIN ----------------
//

// Fetch the current download PIN
export const getDownloadPin = async () => {
  const { data, error } = await supabase
    .from("download_pin")
    .select("pin")
    .single();
  return { pin: data?.pin || null, error };
};

// Update the download PIN (admin only)
export const updateDownloadPin = async (newPin) => {
  const { data, error } = await supabase
    .from("download_pin")
    .update({ pin: newPin })
    .eq("id", 1);
  return { data, error };
};