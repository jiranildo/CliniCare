
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iyezrokjlscpyjisancy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5ZXpyb2tqbHNjcHlqaXNhbmN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzNjI3OTgsImV4cCI6MjA4NDkzODc5OH0.dQnsOMYes_opPbE6bgARXSO4qpSyQNq_v8-WrxwxhHc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdmin() {
    console.log("Creating admin user...");
    const { data, error } = await supabase.auth.signUp({
        email: 'admin@clinicare.com',
        password: 'admin123',
        options: {
            data: {
                full_name: 'Super Admin',
                role: 'admin'
            }
        }
    });

    if (error) {
        console.error("Error creating admin:", error.message);
    } else {
        console.log("Admin user created/found:", data.user ? data.user.email : "No user returned");
        if (data.user && data.user.identities && data.user.identities.length === 0) {
            console.log("User already exists.");
        }
    }
}

createAdmin();
