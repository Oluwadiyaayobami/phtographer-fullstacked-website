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
    image_url: normalizeImageUrl(img.image_url), // 🔥 always overwrite here
  }));

  return { data: normalized, error: null };
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

export const createPurchaseRequest = async (userId, imageId, details) => {
  const { data, error } = await supabase
    .from("purchase_requests")
    .insert([{ user_id: userId, image_id: imageId, details, status: "pending" }]);
  return { data, error };
};

export const getUserPurchaseRequests = async (userId) => {
  const { data, error } = await supabase
    .from("purchase_requests")
    .select(`
      id,
      status,
      details,
      created_at,
      images (id, title, image_url),
      users (id, name, email)
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching user purchase requests:", error.message);
    return { data: [], error };
  }

  // normalize URLs
  const normalized = data.map((req) => ({
    ...req,
    images: req.images
      ? { ...req.images, url: normalizeImageUrl(req.images.image_url) }
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

// Get all purchase requests for admin
export const getAllPurchaseRequests = async () => {
  const { data, error } = await supabase
    .from("purchase_requests")
    .select(
      `
      *,
      users (name, email),
      images (id, title, image_url, collections (title))
    `
    )
    .order("created_at", { ascending: false });

  if (error) return { data: null, error };

  const normalized = data.map((req) => ({
    ...req,
    images: req.images
      ? { ...req.images, url: normalizeImageUrl(req.images.image_url) }
      : null,
  }));

  return { data: normalized, error: null };
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
export const saveImageMetadata = async (title, collectionId, uploadedBy, file) => {
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

// Create signed URL for file access
export const createSignedUrl = async (imagePath, expires = 60) => {
  const { data, error } = await supabase.storage
    .from("images")
    .createSignedUrl(imagePath, expires);
  return { data, error };
};
