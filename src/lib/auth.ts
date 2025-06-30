import { supabase } from './supabase';
import { Researcher } from '../types/survey';

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
}

export async function signUp(email: string, password: string, name: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: name
      }
    }
  });
  
  if (error) throw error;
  
  if (data.user) {
    // Create researcher profile immediately
    const { error: profileError } = await supabase
      .from('researchers')
      .insert({
        id: data.user.id,
        email: data.user.email!,
        name,
      });
    
    if (profileError) {
      console.error('Error creating researcher profile:', profileError);
      // Don't throw here - the auth context will handle creating the profile
    }
  }
  
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser(): Promise<Researcher | null> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return null;
    }
    
    // Try to get existing researcher profile
    const { data: researcher, error: researcherError } = await supabase
      .from('researchers')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (researcherError) {
      if (researcherError.code === 'PGRST116') {
        // No researcher profile exists, create one
        const name = user.user_metadata?.name || 
                     user.email?.split('@')[0] || 
                     'Researcher';
        
        const { data: newResearcher, error: createError } = await supabase
          .from('researchers')
          .insert({
            id: user.id,
            email: user.email!,
            name,
          })
          .select()
          .single();
        
        if (createError) {
          console.error('Error creating researcher profile:', createError);
          return null;
        }
        
        return newResearcher;
      }
      
      console.error('Error fetching researcher:', researcherError);
      return null;
    }
    
    return researcher;
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    return null;
  }
}