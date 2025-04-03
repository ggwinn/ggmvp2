import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PostListingForm from './PostListingForm';
import ListingDetailModal from './ListingDetailModal';
import './Dashboard.css';

function Dashboard({ name, email, onLogout }) {
    const [showForm, setShowForm] = useState(false);
    const [listings, setListings] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredResults, setFilteredResults] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedListing, setSelectedListing] = useState(null);
    const [sortOrder, setSortOrder] = useState(''); // State to track sort order

    useEffect(() => {
        const fetchListings = async () => {
            setIsLoading(true);
            try {
                const response = await axios.get('/search?query=');
                setListings(response.data.listings || []);
                setFilteredResults(response.data.listings || []);
                setError('');
            } catch (error) {
                console.error('Error fetching listings:', error);
                setError('Failed to load listings. Please try again later.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchListings();
    }, []);

    // Handle search and sort
    useEffect(() => {
        let currentResults = listings;

        if (searchQuery.trim()) {
            currentResults = listings.filter(listing =>
                listing.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                listing.size?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                listing.itemType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                listing.condition?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        sortListings(currentResults);
        setFilteredResults(currentResults);

    }, [searchQuery, listings, sortOrder]); // Add sortOrder as a dependency

    const sortListings = (itemsToSort) => {
        const sortedItems = [...itemsToSort]; // Create a copy to avoid mutating the original state
        if (sortOrder === 'lowToHigh') {
            sortedItems.sort((a, b) => parseFloat(a.pricePerDay) - parseFloat(b.pricePerDay));
        } else if (sortOrder === 'highToLow') {
            sortedItems.sort((a, b) => parseFloat(b.pricePerDay) - parseFloat(a.pricePerDay));
        }
        return sortedItems;
    };

    const handleSortChange = (e) => {
        setSortOrder(e.target.value);
    };

    const handleListingClick = (listing) => {
        setSelectedListing(listing);
    };

    const handleCloseModal = () => {
        setSelectedListing(null);
    };

    // ... (rest of your Dashboard component)

    return (
        <div className="dashboard">
            <h2>Welcome, {name}!</h2>

            {/* Search and Sort Section */}
            <div className="search-sort-section">
                <div className="search-section">
                    <input
                        type="text"
                        placeholder="Search by title, size, type..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="sort-section">
                    <label htmlFor="sortOrder">Sort by Price:</label>
                    <select id="sortOrder" value={sortOrder} onChange={handleSortChange}>
                        <option value="">None</option>
                        <option value="lowToHigh">Low to High</option>
                        <option value="highToLow">High to Low</option>
                    </select>
                </div>
            </div>

            {/* Toggle Post Listing Form */}
            <button className="post-listing-btn" onClick={() => setShowForm(!showForm)}>
                {showForm ? "Cancel" : "Post a Listing"}
            </button>

            {/* Show Post Listing Form */}
            {showForm && <PostListingForm email={email} onClose={() => setShowForm(false)} />}

            {/* Listings Grid */}
            {!showForm && (
                <>
                    {isLoading ? (
                        <p className="status-message">Loading listings...</p>
                    ) : error ? (
                        <div className="error-container">
                            <p className="error-message">{error}</p>
                            {renderPlaceholderContent()}
                        </div>
                    ) : filteredResults.length > 0 ? (
                        <div className="listings-grid">
                            {filteredResults.map((listing) => (
                                <div
                                    key={listing.id}
                                    className="listing-card"
                                    onClick={() => handleListingClick(listing)}
                                >
                                    <img
                                        src={listing.imageURL || "https://via.placeholder.com/300x200?text=No+Image"}
                                        alt={listing.title}
                                    />
                                    <div className="listing-info">
                                        <h3>{listing.title}</h3>
                                        <p><strong>Size:</strong> {listing.size}</p>
                                        <p><strong>Type:</strong> {listing.itemType}</p>
                                        <p><strong>${listing.pricePerDay}/day</strong></p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : searchQuery ? (
                        <p className="status-message">No items matching "{searchQuery}" found.</p>
                    ) : (
                        <div>
                            <p className="status-message">No listings available. Be the first to post!</p>
                            {renderPlaceholderContent()}
                        </div>
                    )}
                </>
            )}

            {/* Listing Detail Modal */}
            {selectedListing && (
                <ListingDetailModal
                    listing={selectedListing}
                    onClose={handleCloseModal}
                    userEmail={email}
                />
            )}

            {/* Logout Button */}
            <button className="logout-btn" onClick={onLogout}>Log Out</button>
        </div>
    );
}

export default Dashboard;