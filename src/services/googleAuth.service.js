const {OAuth2Client} = require("google-auth-library");
const axios = require("axios");
const { PropertyToken } = require("../models/propertyToken.model");
const { NotFoundError, ValidationError } = require("../lib/CustomErrors");
const propertyService = require("../services/property.service");

const oauth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
)

/**
 * Generate Google OAuth URL for authorization
 * @returns {string} Authorization URL
 */
const generateAuthURL = (state) => {
    return oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: [
            "https://www.googleapis.com/auth/business.manage",
            "https://www.googleapis.com/auth/userinfo.email",
        ],
        prompt: "consent",
        state: state,
    });
}

/**
 * Get tokens from authorization code
 * @param {string} code - Authorization code
 * @returns {Promise<object>} Tokens object containing access_token and refresh_token
 */
const getTokensFromCode = async (code) => {
    const {tokens} = await oauth2Client.getToken(code);
    return tokens;
};

/**
 * Verify if the Google account email matches property email
 * @param {string} accessToken - Google access token
 * @param {string} propertyId - Property ID
 * @throws {ValidationError} If emails don't match
 */
const verifyEmailMatch = async (accessToken, propertyId) => {
    // Get Google account email
    const response = await axios.get(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        }
    );
    const googleEmail = response.data.email;

    // Get property email
    const { property } = await propertyService.getById(propertyId);
    if (!property) {
        throw new NotFoundError("Property not found", {
            propertyId: ["Property not found"],
        });
    }

    // Verify emails match
    if (googleEmail.toLowerCase() !== property.email.toLowerCase()) {
        throw new ValidationError("Email mismatch", {
            email: [`Google account email (${googleEmail}) does not match property email (${property.email})`],
        });
    }
};

/**
 * Store tokens in database
 * @param {string} propertyId - Property ID
 * @param {object} tokens - Tokens object containing access_token and refresh_token
 * @returns {Promise<object>} Stored property token
 */
const storeTokens = async (propertyId, tokens) => {
    const existingToken = await PropertyToken.findOne({ 
        propertyId,
        type: 'google'
    });
    
    if (existingToken) {
        existingToken.accessToken = tokens.access_token;
        if (tokens.refresh_token) {
            existingToken.refreshToken = tokens.refresh_token;
        }
        existingToken.expiryDate = new Date(tokens.expiry_date);
        return await existingToken.save();
    }

    const propertyToken = new PropertyToken({
        propertyId,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: new Date(tokens.expiry_date),
        type: 'google'
    });

    return await propertyToken.save();
};

/**
 * Get tokens from database
 * @param {string} propertyId - Property ID
 * @returns {Promise<object>} Property token object
 */
const getTokensFromDB = async (propertyId) => {
    const propertyToken = await PropertyToken.findOne({ 
        propertyId,
        type: 'google'
    });
    if(!propertyToken){
        throw new NotFoundError("Property token not found", {
            propertyId: ["Property token not found for the given id"],
        });
    }
    return propertyToken;
};

/**
 * Refresh access token using refresh token
 * @param {string} refreshToken - Refresh token
 * @returns {Promise<object>} New tokens
 */
const refreshAccessToken = async (refreshToken) => {
    oauth2Client.setCredentials({
        refresh_token: refreshToken,
    });

    try {
        const {credentials} = await oauth2Client.refreshAccessToken();
        return credentials;
    } catch (error) {
        throw new ValidationError("Failed to refresh token", {
            refresh_token: ["Invalid or expired refresh token"],
        });
    }
};

/**
 * Get valid access token (refreshes if expired)
 * @param {string} propertyId - Property ID
 * @returns {Promise<string>} Valid access token
 */
const getValidAccessToken = async (propertyId) => {
    const propertyToken = await getTokensFromDB(propertyId);
    
    if (new Date() >= new Date(propertyToken.expiryDate)) {
        const newTokens = await refreshAccessToken(propertyToken.refreshToken);
        await storeTokens(propertyId, newTokens);
        return newTokens.access_token;
    }

    return propertyToken.accessToken;
};

/**
 * Fetch Google Business locations
 * @param {string} propertyId - Property ID
 * @returns {Promise<Array>} List of business locations
 */
const fetchLocations = async (propertyId) => {
    const accessToken = await getValidAccessToken(propertyId);
    console.log('Using Google access token:', accessToken);

    try {
        // Step 1: Get the account ID
        const accountResponse = await axios.get(
            'https://mybusinessbusinessinformation.googleapis.com/v1/accounts',
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        const accounts = accountResponse.data.accounts;
        if (!accounts || accounts.length === 0) {
            throw new Error("No Google Business accounts found.");
        }

        const accountName = accounts[0].name; // e.g., "accounts/1234567890"
        console.log('Fetched Google Business account:', accountName);

        // Step 2: Fetch locations for the account
        const locationsResponse = await axios.get(
            `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        return locationsResponse.data;
    } catch (error) {
        console.error("Google API Error:", error.response?.data || error.message);
        throw new ValidationError("Failed to fetch locations", {
            google: ["Failed to fetch business locations"],
        });
    }
};

/**
 * Fetch Google Business reviews
 * @param {string} propertyId - Property ID
 * @param {string} locationId - Google Business location ID
 * @returns {Promise<Array>} List of reviews
 */
const fetchReviews = async (propertyId, locationId) => {
    const accessToken = await getValidAccessToken(propertyId);
    
    try {
        const response = await axios.get(
            `https://mybusinessbusinessinformation.googleapis.com/v1/${locationId}/reviews`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        return response.data.reviews || [];
    } catch (error) {
        throw new ValidationError("Failed to fetch reviews", {
            google: ["Failed to fetch business reviews"],
        });
    }
};

module.exports = {
    generateAuthURL,
    getTokensFromCode,
    getTokensFromDB,
    storeTokens,
    verifyEmailMatch,
    refreshAccessToken,
    getValidAccessToken,
    fetchLocations,
    fetchReviews,
};

