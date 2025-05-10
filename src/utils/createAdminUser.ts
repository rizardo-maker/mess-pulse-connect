
import { supabase } from "@/integrations/supabase/client";

export async function createAdminUser() {
  const adminEmail = 'messoffice@rguktsklm.ac.in';
  const adminPassword = 'messoffice';
  
  try {
    // Check if admin user already exists by trying to sign in
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword,
    });

    if (signInError) {
      console.log("Admin user doesn't exist yet. Creating...");
      
      // Create admin user
      const { data, error } = await supabase.auth.signUp({
        email: adminEmail,
        password: adminPassword,
      });
      
      if (error) {
        console.error("Error creating admin user:", error);
        return { success: false, error };
      }
      
      console.log("Admin user created successfully:", data);
      
      // Sign out after creating the admin
      await supabase.auth.signOut();
      
      return { success: true, data };
    } else {
      console.log("Admin user already exists");
      
      // Sign out after checking
      if (signInData) {
        await supabase.auth.signOut();
      }
      
      return { success: true, message: "Admin user already exists" };
    }
  } catch (error) {
    console.error("Unexpected error creating admin user:", error);
    return { success: false, error };
  }
}
