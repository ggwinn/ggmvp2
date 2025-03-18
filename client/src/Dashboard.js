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

    // Handle form submission for posting a listing
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
                    'user-id': email // Assuming email is used as a unique identifier
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

export default Dashboard;
