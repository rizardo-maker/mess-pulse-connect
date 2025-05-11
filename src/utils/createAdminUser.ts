
import { supabase } from "@/integrations/supabase/client";

export async function createAdminUser() {
  const adminEmail = 'messoffice@rguktsklm.ac.in';
  const adminPassword = 'messoffice';
  
  try {
    // Check if admin user already exists by trying to sign in without actually logging in
    const { data, error } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword,
    });

    if (error) {
      console.log("Admin user doesn't exist yet. Creating...");
      
      // Create admin user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: adminEmail,
        password: adminPassword,
      });
      
      if (signUpError) {
        console.error("Error creating admin user:", signUpError);
        return { success: false, error: signUpError };
      }
      
      console.log("Admin user created successfully:", signUpData);
      
      // Make sure we immediately sign out to avoid automatic login
      await supabase.auth.signOut();
      
      return { success: true, data: signUpData };
    } else {
      console.log("Admin user already exists");
      
      // Sign out after checking to avoid automatic login
      if (data) {
        await supabase.auth.signOut();
      }
      
      return { success: true, message: "Admin user already exists" };
    }
  } catch (error) {
    console.error("Unexpected error creating admin user:", error);
    return { success: false, error };
  }
}
