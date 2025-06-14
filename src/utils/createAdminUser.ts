
import { supabase } from "@/integrations/supabase/client";

export async function createAdminUser() {
  const adminEmail = 'messoffice@rguktsklm.ac.in';
  const adminPassword = 'messoffice';
  
  try {
    // Optimized admin check with minimal API calls
    const { data: existingUsers } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin')
      .limit(1);
    
    if (existingUsers && existingUsers.length > 0) {
      console.log("Admin user already exists");
      return { success: true, message: "Admin user already exists" };
    }
    
    // Create admin user with optimized flow
    const { data, error } = await supabase.auth.signUp({
      email: adminEmail,
      password: adminPassword,
      options: {
        emailRedirectTo: `${window.location.origin}/admin`,
        data: {
          role: 'admin'
        }
      }
    });
    
    if (error) {
      console.log("Admin user creation error:", error);
      return { success: false, error };
    }
    
    console.log("Admin user created successfully:", data);
    
    // Ensure immediate sign out to prevent auto-login
    await supabase.auth.signOut();
    
    return { success: true, data };
  } catch (error) {
    console.error("Unexpected error creating admin user:", error);
    return { success: false, error };
  }
}
