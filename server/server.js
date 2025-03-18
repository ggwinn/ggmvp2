const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const multer = require('multer'); // NEW: Import multer for file uploads

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const app = express();
app.use(express.json());

// NEW: Set up multer for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Serve static files from React build folder
app.use(express.static(path.join(__dirname, '../client/build')));

// ========================================================
// Authentication Routes using Supabase Auth
// ========================================================

// Registration endpoint using Supabase Auth
app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    console.log(`Received registration request for email: ${email}`);

    // Email validation
    const emailPattern = /@(spelman\.edu|morehouse\.edu)$/;
    if (!emailPattern.test(email)) {
        return res.status(400).json({ success: false, message: 'Email must end with @spelman.edu or @morehouse.edu.' });
    }

    try {
        // Register user in Supabase Auth
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { name } } // Store additional user info
        });

        if (error) throw error;

        res.json({ success: true, message: 'Registration successful. Check your email for verification.' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, message: error.message || 'Error registering user' });
    }
});

// Login endpoint
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    console.log(`Received login request for email: ${email}`);

    try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        res.json({ success: true, message: 'Login successful', user: data.user });
    } catch (error) {
        console.error('Login error:', error);
        res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
});

// Email verification using 6-digit code
app.post('/verify', async (req, res) => {
    const { email, verificationCode } = req.body;
    console.log(`Verifying email: ${email} with code: ${verificationCode}`);

    try {
        const { data, error } = await supabase.auth.verifyOtp({
            email,
            token: verificationCode,
            type: 'signup'
        });

        if (error) {
            console.error('Verification failed:', error);
            return res.status(400).json({ success: false, message: 'Invalid verification code.' });
        }

        res.json({ success: true, message: 'Email verified successfully' });
    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ success: false, message: 'Error verifying email' });
    }
});

// ========================================================
// NEW: Clothing Listings API
// ========================================================

// Endpoint to post a new clothing listing
app.post('/listings', upload.single('image'), async (req, res) => {
  const { title, size, itemType, condition, washInstructions, dateAvailable, price } = req.body;
  const { file } = req;
  const userEmail = req.headers['user-id']; 
  
  console.log("Received listing data:", {
      userEmail,
      title,
      size,
      itemType,
      condition,
      washInstructions,
      dateAvailable,
      price,
      hasFile: !!file
  });

  if (!userEmail) {
      return res.status(401).json({ success: false, message: 'User authentication required' });
  }

  try {
      // First, get the user UUID from the email
      // Use the auth API to look up the user
      const { data: authData, error: authError } = await supabase.auth
          .admin.listUsers();
          
      if (authError) {
          console.error("Error listing users:", authError);
          throw authError;
      }
      
      // Find the user with the matching email
      const user = authData.users.find(u => u.email === userEmail);
      
      if (!user) {
          console.error("User not found with email:", userEmail);
          return res.status(404).json({ success: false, message: 'User not found' });
      }
      
      const userId = user.id;
      console.log("Found user ID:", userId);
      
      let imageURL = null;

      if (file) {
          const fileName = `${Date.now()}_${file.originalname}`;
          console.log("Uploading file:", fileName);
          
          const { data: fileData, error: fileError } = await supabase.storage
              .from('clothing-images')
              .upload(fileName, file.buffer, { 
                  contentType: file.mimetype,
                  upsert: true
              });

          if (fileError) {
              console.error("File upload error:", fileError);
              throw fileError;
          }
          
          const { data: publicUrlData } = supabase.storage
              .from('clothing-images')
              .getPublicUrl(fileName);
              
          imageURL = publicUrlData.publicUrl;
          console.log("File uploaded successfully, URL:", imageURL);
      }

      console.log("Attempting insert with UUID:", userId);
      
      const { data, error } = await supabase
          .from('listings')
          .insert([{ 
              user: userId, // Use UUID instead of email
              title, 
              size, 
              itemType, 
              condition, 
              washInstructions, 
              dateAvailable, 
              price, 
              imageURL
          }]);

      if (error) {
          console.error("Supabase error details:", error);
          throw error;
      }
      
      console.log("Insert successful, returned data:", data);
      res.json({ success: true, message: 'Listing posted successfully', listing: data });
  } catch (error) {
      console.error("Full error object:", error);
      res.status(500).json({ success: false, message: error.message || 'Error posting listing' });
  }
});

// Search Listings Endpoint
app.get('/search', async (req, res) => {
  const { query } = req.query;
  console.log(`Received search request for: ${query}`);

  try {
      const { data, error } = await supabase
          .from('listings')
          .select('*')
          .or(`title.ilike.%${query}%,size.ilike.%${query}%,itemType.ilike.%${query}%,condition.ilike.%${query}%`);

      if (error) throw error;

      res.json({ success: true, listings: data });
  } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ success: false, message: error.message || 'Error searching listings' });
  }
});

// ========================================================
// Serve React Frontend
// ========================================================
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
