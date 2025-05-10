
import { supabase } from "@/integrations/supabase/client";

export async function createAdminUser() {
  const adminEmail = 'messoffice@rguktsklm.ac.in';
  const adminPassword = 'messoffice';
  
  try {
    // Check if admin user already exists
    const { data: existingUsers, error: lookupError } = await supabase.auth.admin.listUsers();
    
    if (lookupError) {
      console.error("Error checking for admin user:", lookupError);
      return { success: false, error: lookupError };
    }
    
    // Fixed: Properly check the users array and use type assertion if needed
    const adminExists = existingUsers?.users && existingUsers.users.some(
      (user: any) => user.email === adminEmail
    );
    
    if (!adminExists) {
      // Create admin user if doesn't exist
      const { data, error } = await supabase.auth.signUp({
        email: adminEmail,
        password: adminPassword,
      });
      
      if (error) {
        console.error("Error creating admin user:", error);
        return { success: false, error };
      }
      
      console.log("Admin user created successfully:", data);
      return { success: true, data };
    } else {
      console.log("Admin user already exists");
      return { success: true, message: "Admin user already exists" };
    }
  } catch (error) {
    console.error("Unexpected error creating admin user:", error);
    return { success: false, error };
  }
}
