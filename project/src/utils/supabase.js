import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

// Helper functions
export const signUp = async (email, password, name) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: name
      }
    }
  })
  return { data, error }
}

export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Collection functions
export const getCollections = async () => {
  const { data, error } = await supabase
    .from('collections')
    .select('id, title, description, created_at')
    .order('created_at', { ascending: false })
  return { data, error }
}

export const getCollectionImages = async (collectionId) => {
  const { data, error } = await supabase
    .from('images')
    .select('*')
    .eq('collection_id', collectionId)
    .order('created_at', { ascending: false })
  return { data, error }
}

export const verifyCollectionPin = async (collectionId, pin) => {
  const bcrypt = await import('bcryptjs')
  const { data, error } = await supabase
    .from('collections')
    .select('pin_hash')
    .eq('id', collectionId)
    .single()
  
  if (error || !data) return false
  
  return bcrypt.compareSync(pin, data.pin_hash)
}

// Purchase request functions
export const createPurchaseRequest = async (userId, imageId, details) => {
  const { data, error } = await supabase
    .from('purchase_requests')
    .insert([
      {
        user_id: userId,
        image_id: imageId,
        details: details,
        status: 'pending'
      }
    ])
  return { data, error }
}

export const getUserPurchaseRequests = async (userId) => {
  const { data, error } = await supabase
    .from('purchase_requests')
    .select(`
      *,
      images (
        title,
        image_url,
        collections (title)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return { data, error }
}

// Contact form
export const submitContactForm = async (name, email, message) => {
  const { data, error } = await supabase
    .from('messages')
    .insert([{ name, email, message }])
  return { data, error }
}

// Admin functions
export const isAdmin = async (userId) => {
  const { data, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()
  
  return data?.role === 'admin'
}

export const getAllPurchaseRequests = async () => {
  const { data, error } = await supabase
    .from('purchase_requests')
    .select(`
      *,
      users (name, email),
      images (
        title,
        image_url,
        collections (title)
      )
    `)
    .order('created_at', { ascending: false })
  return { data, error }
}

export const updatePurchaseRequestStatus = async (requestId, status) => {
  const { data, error } = await supabase
    .from('purchase_requests')
    .update({ status })
    .eq('id', requestId)
  return { data, error }
}

export const createSignedUrl = async (imagePath) => {
  const { data, error } = await supabase.storage
    .from('images')
    .createSignedUrl(imagePath, 60) // 60 seconds expiry
  return { data, error }
}