import React, { useState } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './Dashboard.css';

function Dashboard({ name, email, onLogout }) {
    // State for clothing listing form
    const [title, setTitle] = useState('');
    const [size, setSize] = useState('S');
    const [itemType, setItemType] = useState('jeans');
    const [condition, setCondition] = useState('');
    const [washInstructions, setWashInstructions] = useState('');
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [pricePerDay, setPricePerDay] = useState('');
    const [totalPrice, setTotalPrice] = useState(0);
    const [image, setImage] = useState(null);
    const [message, setMessage] = useState('');
    
    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    // Calculate total price when dates are selected
    const calculateTotalPrice = () => {
        if (startDate && endDate && pricePerDay) {
            const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
            setTotalPrice(days * parseFloat(pricePerDay));
        }
    };

    // Handle search
    const handleSearch = async () => {
        if (!searchQuery) return;
        try {
            const response = await axios.get(`/search?query=${encodeURIComponent(searchQuery)}`);
            setSearchResults(response.data.listings || []);
        } catch (error) {
            setMessage('Error searching listings: ' + (error.response?.data?.message || error.message));
        }
    };

    // Handle form submission for posting a listing
    const handlePostListing = async (e) => {
        e.preventDefault();
        
        const formData = new FormData();
        formData.append('title', title);
        formData.append('size', size);
        formData.append('itemType', itemType);
        formData.append('condition', condition);
        formData.append('washInstructions', washInstructions);
        formData.append('startDate', startDate.toISOString());
        formData.append('endDate', endDate.toISOString());
        formData.append('pricePerDay', pricePerDay);
        formData.append('totalPrice', totalPrice);
        if (image) formData.append('image', image);
        
        try {
            const response = await axios.post('/listings', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'user-id': email
                }
            });
            setMessage(response.data.message || 'Listing posted successfully!');
            setTitle('');
            setSize('S');
            setItemType('jeans');
            setCondition('');
            setWashInstructions('');
            setStartDate(null);
            setEndDate(null);
            setPricePerDay('');
            setTotalPrice(0);
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

            {/* Search Feature */}
            <div className="search-section">
                <input 
                    type="text" 
                    placeholder="Search listings..." 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button onClick={handleSearch}>Search</button>
            </div>
            
            {/* Display search results */}
            <div className="search-results">
                {searchResults.length > 0 ? (
                    searchResults.map((listing) => (
                        <div key={listing.id} className="listing">
                            <h3>{listing.title}</h3>
                            <p>Size: {listing.size}</p>
                            <p>Type: {listing.itemType}</p>
                            <p>Condition: {listing.condition}</p>
                            {listing.imageURL && <img src={listing.imageURL} alt={listing.title} className="listing-image" />}
                        </div>
                    ))
                ) : (
                    <p>No results found.</p>
                )}
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
                    
                    <label>Available Dates</label>
                    <div className="date-picker">
                        <DatePicker 
                            selected={startDate} 
                            onChange={(date) => { setStartDate(date); calculateTotalPrice(); }}
                            selectsStart
                            startDate={startDate}
                            endDate={endDate}
                            placeholderText="Start Date"
                        />
                        <DatePicker 
                            selected={endDate} 
                            onChange={(date) => { setEndDate(date); calculateTotalPrice(); }}
                            selectsEnd
                            startDate={startDate}
                            endDate={endDate}
                            minDate={startDate}
                            placeholderText="End Date"
                        />
                    </div>
                    
                    <label>Price per day ($)</label>
                    <input type="number" value={pricePerDay} onChange={(e) => { setPricePerDay(e.target.value); calculateTotalPrice(); }} required />
                    
                    <p>Total Price: ${totalPrice.toFixed(2)}</p>
                    
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