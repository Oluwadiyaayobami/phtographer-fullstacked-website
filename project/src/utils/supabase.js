import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true, // Persist session (localStorage)
    detectSessionInUrl: true
  }
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
      data: { name, role }
    }
  });
  return { user: data?.user, session: data?.session, error };
};

// Sign in user
export const signIn = async ({ email, password }) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
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
  const { data: { session }, error } = await supabase.auth.getSession();
  const user = session?.user || null;
  return {
    user,
    role: user?.user_metadata?.role || null,
    error
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

export const getCollectionImages = async (collectionId) => {
  const { data, error } = await supabase
    .from("images")
    .select("*")
    .eq("collection_id", collectionId)
    .order("created_at", { ascending: false });
  return { data, error };
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
      *,
      images (title, image_url, collections (title))
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return { data, error };
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
    .select(`
      *,
      users (name, email),
      images (title, image_url, collections (title))
    `)
    .order("created_at", { ascending: false });
  return { data, error };
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

// Upload file to Supabase storage
export const uploadFile = async (file, folder = "gallery") => {
  const filePath = `${folder}/${Date.now()}-${file.name}`;
  const { data, error } = await supabase.storage.from("gallery").upload(filePath, file);
  if (error) throw error;

  const { data: urlData } = supabase.storage.from("gallery").getPublicUrl(filePath);
  return urlData.publicUrl;
};

// Create signed URL for file access
export const createSignedUrl = async (imagePath, expires = 60) => {
  const { data, error } = await supabase.storage
    .from("images")
    .createSignedUrl(imagePath, expires);
  return { data, error };
};
