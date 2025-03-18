# Spelman Clothing Marketplace - Implementation Guide

This guide documents the implementation of a clothing marketplace application for Spelman College students. The application allows users to register, log in, and post clothing listings for others to borrow or rent.

To get started, clone the following repo: https://github.com/amoretti86/digitalentrepreneurship-lab4b
You may view a reference version of the deployed app here: https://spelman-marketplace-hw4b-05f22265fae4.herokuapp.com

## Overview of Implementation

In this project, we:
1. Created a database structure in Supabase
2. Set up authentication with email validation for Spelman/Morehouse domains
3. Implemented file storage for clothing images
4. Created listings functionality for users to post items
5. Applied proper security policies

## Backend Implementation (server.js)

### Database Setup in Supabase

1. **Create a "listings" table**:
   - Navigate to Supabase dashboard > Table Editor
   - Click "Create a new table"
   - Name: `listings`
   - Columns:
     - `id` (type: uuid, primary key, default: uuid_generate_v4())
     - `created_at` (type: timestamp with time zone, default: now())
     - `user` (type: uuid, foreign key to auth.users)
     - `title` (type: text)
     - `size` (type: text)
     - `itemType` (type: text)
     - `condition` (type: text)
     - `washInstructions` (type: text)
     - `dateAvailable` (type: date)
     - `price` (type: numeric)
     - `imageURL` (type: text)

2. **Create a storage bucket**:
   - Navigate to Storage in Supabase
   - Click "Create a new bucket"
   - Name: `clothing-images`
   - Access: Private

3. **Set up Row Level Security policies**:
   - For the listings table:
     ```sql
     -- Enable RLS on the listings table
     ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

     -- Create policy for authenticated users to insert listings
     CREATE POLICY "Allow authenticated users to insert listings"
     ON listings
     FOR INSERT
     TO authenticated
     WITH CHECK (true);
     
     -- Create policy for users to view all listings
     CREATE POLICY "Allow public to select listings"
     ON listings
     FOR SELECT
     TO authenticated
     USING (true);
     ```

   - For the storage bucket:
     ```sql
     -- Create policy for authenticated users to upload files
     CREATE POLICY "Allow authenticated uploads"
     ON storage.objects
     FOR INSERT
     TO authenticated
     WITH CHECK (bucket_id = 'clothing-images');

     -- Create policy for public to view images
     CREATE POLICY "Allow public read access"
     ON storage.objects
     FOR SELECT
     TO public
     USING (bucket_id = 'clothing-images');
     ```

### Authentication Endpoints

We implemented several authentication endpoints in `server.js`:

```javascript
// Registration endpoint with email domain validation
app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    
    // Email validation for Spelman and Morehouse domains
    const emailPattern = /@(spelman\.edu|morehouse\.edu)$/;
    if (!emailPattern.test(email)) {
        return res.status(400).json({ success: false, message: 'Email must end with @spelman.edu or @morehouse.edu.' });
    }

    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { name } }
        });

        if (error) throw error;

        res.json({ success: true, message: 'Registration successful. Check your email for verification.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Error registering user' });
    }
});

// Login endpoint
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    
    try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        res.json({ success: true, message: 'Login successful', user: data.user });
    } catch (error) {
        res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
});

// Email verification using 6-digit code
app.post('/verify', async (req, res) => {
    const { email, verificationCode } = req.body;
    
    try {
        const { data, error } = await supabase.auth.verifyOtp({
            email,
            token: verificationCode,
            type: 'signup'
        });

        if (error) {
            return res.status(400).json({ success: false, message: 'Invalid verification code.' });
        }

        res.json({ success: true, message: 'Email verified successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error verifying email' });
    }
});
```

### Listings Endpoint

We added a new endpoint to handle clothing listings with file uploads:

```javascript
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
        // Get the user UUID from the email
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
                user: userId,
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
```

## Frontend Implementation

### Authentication Flow (App.js)

The main App.js file handles the authentication flow:
- Registration form for new users
- Login form for returning users
- Email verification
- Dashboard display after successful authentication

Key components:
- Toggle between registration and login modes
- Email domain validation (@spelman.edu or @morehouse.edu)
- Password management
- Verification code handling

### Dashboard Implementation (Dashboard.js)

The Dashboard component allows authenticated users to post clothing listings:

```javascript
import React, { useState } from 'react';
import axios from 'axios';
import './Dashboard.css';

function Dashboard({ name, email, onLogout }) {
    // State for clothing listing form
    const [title, setTitle] = useState('');
    const [size, setSize] = useState('S');
    const [itemType, setItemType] = useState('jeans');
    const [condition, setCondition] = useState('');
    const [washInstructions, setWashInstructions] = useState('');
    const [dateAvailable, setDateAvailable] = useState('');
    const [price, setPrice] = useState('');
    const [image, setImage] = useState(null);
    const [message, setMessage] = useState('');

    // Handle form submission
    const handlePostListing = async (e) => {
        e.preventDefault();
        
        const formData = new FormData();
        formData.append('title', title);
        formData.append('size', size);
        formData.append('itemType', itemType);
        formData.append('condition', condition);
        formData.append('washInstructions', washInstructions);
        formData.append('dateAvailable', dateAvailable);
        formData.append('price', price);
        if (image) formData.append('image', image);
        
        try {
            const response = await axios.post('/listings', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'user-id': email
                }
            });
            setMessage(response.data.message || 'Listing posted successfully!');
            // Clear form fields
            setTitle('');
            setSize('S');
            setItemType('jeans');
            setCondition('');
            setWashInstructions('');
            setDateAvailable('');
            setPrice('');
            setImage(null);
        } catch (error) {
            setMessage('Error posting listing: ' + (error.response?.data?.message || error.message));
        }
    };

    return (
        <div className="dashboard">
            <h2>Welcome to Your Dashboard</h2>
            <div className="user-greeting">
                <h3>Hello, {name}! </h3>
                <p>You've successfully logged in with: {email}</p>
            </div>

            {/* Clothing Listing Form */}
            <div className="listing-form">
                <h3>Post a Clothing Listing</h3>
                <form onSubmit={handlePostListing}>
                    <label>Title</label>
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />

                    <label>Size</label>
                    <select value={size} onChange={(e) => setSize(e.target.value)}>
                        <option value="S">S</option>
                        <option value="M">M</option>
                        <option value="L">L</option>
                        <option value="XL">XL</option>
                        <option value="XXL">XXL</option>
                    </select>

                    <label>Item Type</label>
                    <select value={itemType} onChange={(e) => setItemType(e.target.value)}>
                        <option value="jeans">Jeans</option>
                        <option value="skirt">Skirt</option>
                        <option value="pants">Pants</option>
                        <option value="sweater">Sweater</option>
                        <option value="shirt">Shirt</option>
                    </select>

                    <label>Condition</label>
                    <input type="text" value={condition} onChange={(e) => setCondition(e.target.value)} required />

                    <label>Wash Instructions</label>
                    <input type="text" value={washInstructions} onChange={(e) => setWashInstructions(e.target.value)} required />

                    <label>Date Available</label>
                    <input type="date" value={dateAvailable} onChange={(e) => setDateAvailable(e.target.value)} required />

                    <label>Price per day ($)</label>
                    <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required />

                    <label>Upload Image</label>
                    <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} required />

                    <button type="submit">Post Listing</button>
                </form>
            </div>
            
            {message && <p className="message">{message}</p>}

            <button className="logout-btn" onClick={onLogout}>Log Out</button>
        </div>
    );
}
```

## Troubleshooting Steps

During implementation, we encountered several issues that required debugging:

1. **Row Level Security Policy Violations**:
   - Problem: "new row violates row-level security policy" when posting listings
   - Solution: Created proper RLS policies for both the listings table and storage bucket

2. **UUID vs Email Mismatch**:
   - Problem: "invalid input syntax for type uuid: 'email@spelman.edu'"
   - Solution: Used Supabase Admin API to look up user UUID from email

3. **Storage Access Issues**:
   - Problem: File upload permissions
   - Solution: Added specific policies for the storage bucket

## Future Enhancements

The current implementation could be extended with:
1. A search interface for browsing available clothing
2. Payment integration with Stripe or Square
3. Enhanced styling and mobile responsiveness
4. Return date functionality
5. User reviews and ratings
6. Notifications for bookings and returns

## Deployment Instructions

To deploy this application on Heroku:

1. Create a new Heroku app
2. Connect your GitHub repository
3. Add environment variables:
   - SUPABASE_URL
   - SUPABASE_SERVICE_ROLE_KEY
   - SUPABASE_ANON_KEY

If needed, run 
```
heroku config:set SUPABASE_URL="your_supabase_url"
heroku config:set SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
heroku config:set OTHER_ENV_VAR="your_value"
```

4. Deploy the application

Note: Since we're using Supabase for the database, you don't need to enable the Postgres addon on Heroku.

## Conclusion

This implementation provides a solid foundation for a clothing marketplace tailored for Spelman and Morehouse students. The authentication system ensures only students with valid email addresses can access the platform, and the listings functionality allows users to share clothing items with detailed information and images.