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
    const [activeTab, setActiveTab] = useState('listings'); // State to manage active tab

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

        const sortedResults = sortListings(currentResults);
        setFilteredResults(sortedResults);

    }, [searchQuery, listings, sortOrder]); // Add sortOrder as a dependency

    const sortListings = (itemsToSort) => {
        const sortedItems = [...itemsToSort];
        sortedItems.sort((a, b) => {
            const priceA = parseFloat(a.pricePerDay);
            const priceB = parseFloat(b.pricePerDay);

            if (isNaN(priceA) && isNaN(priceB)) return 0;
            if (isNaN(priceA)) return 1; // Put items with no price at the end
            if (isNaN(priceB)) return -1;

            if (sortOrder === 'lowToHigh') {
                return priceA - priceB;
            } else if (sortOrder === 'highToLow') {
                return priceB - priceA;
            }
            return 0; // No sorting
        });
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

    const handleTabClick = (tab) => {
        setActiveTab(tab);
    };

    const renderListingsTab = () => (
        <>
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
                            {/* You might want to add a placeholder content function here */}
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
                            {/* You might want to add a placeholder content function here */}
                        </div>
                    )}
                </>
            )}
        </>
    );

    const renderAboutMeTab = () => (
        <div className="about-me-tab">
            <h2>About Community Closet</h2>
            <p>Community Closet is a platform designed to connect students at Spelman and Morehouse, providing an easy and affordable way to rent clothing from each other. We believe in fostering a sustainable and collaborative campus environment where sharing resources is key.</p>
            <p>Our mission is to make fashion accessible to everyone while reducing textile waste. By renting instead of buying new, students can save money, experiment with different styles, and contribute to a greener campus.</p>
            <p>Whether you're looking for an outfit for a special occasion, a casual everyday look, or something in between, Community Closet is here to help you find what you need within your campus community.</p>
        </div>
    );

    const renderCommunityTab = () => {
        const vendors = [
            { name: 'Vendor A', url: 'http://spelmancollegesga.weebly.com/my-sisters-closet.html', description: 'Provides white attire for students.' },
            { name: 'Vendor B', url: 'https://www.instagram.com/stylingsoflylikeag6/', description: 'Offers curated secondhand and vintage clothes for students.' },
            { name: 'Vendor C', url: 'https://www.instagram.com/breakingthecycleglobal/', description: 'Accepts dontations for prom dresses and suits.' },
            // You can dynamically add vendors here in the future
        ];

        return (
            <div className="community-tab">
                <h2>Community Vendors</h2>
                <p>In addition to peer-to-peer rentals, Community Closet is proud to partner with local vendors to offer a wider range of clothing options and services to our users.</p>
                <p>Here's a list of some of our featured community vendors:</p>
                <ul>
                    {vendors.map((vendor, index) => (
                        <li key={index}>
                            <a href={vendor.url} target="_blank" rel="noopener noreferrer">
                                <strong>{vendor.name}</strong>
                            </a> - {vendor.description}
                        </li>
                    ))}
                </ul>
                <p>Stay tuned as we continue to expand our network of community partners to bring you even more choices and support local businesses!</p>
            </div>
        );
    };

    return (
        <div className="dashboard">
            <h2>Welcome, {name}!</h2>

            {/* Tab Navigation */}
            <div className="dashboard-tabs">
                <button
                    className={`tab-button ${activeTab === 'listings' ? 'active' : ''}`}
                    onClick={() => handleTabClick('listings')}
                >
                    Listings
                </button>
                <button
                    className={`tab-button ${activeTab === 'about' ? 'active' : ''}`}
                    onClick={() => handleTabClick('about')}
                >
                    About Us
                </button>
                <button
                    className={`tab-button ${activeTab === 'community' ? 'active' : ''}`}
                    onClick={() => handleTabClick('community')}
                >
                    Vendors
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'listings' && renderListingsTab()}
            {activeTab === 'about' && renderAboutMeTab()}
            {activeTab === 'community' && renderCommunityTab()}

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