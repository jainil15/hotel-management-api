const {
  APIError,
  InternalServerError,
  NotFoundError,
  ValidationError,
} = require("../lib/CustomErrors");
const { responseHandler } = require("../middlewares/response.middleware");
const googleAuthService = require("../services/googleAuth.service");
const propertyService = require("../services/property.service");

/**
 * Get Google OAuth URL for authorization
 * @param {import('express').Request} req - Request object
 * @param {import('express').Response} res - Response object
 * @param {import('express').NextFunction} next - Next function
 */
const getGoogleOAuthUrl = async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    // console.log("Property Id :- ",propertyId);
    // Verify property exists and get its email
    const { property } = await propertyService.getById(propertyId);
    if (!property) {
      throw new NotFoundError("Property not found", {
        propertyId: ["Property not found for the given id"],
      });
    }

    console.log("Property :- ", property);
    if (!property.email) {
      throw new ValidationError("Property email required", {
        email: [
          "Property must have an email configured before connecting Google account",
        ],
      });
    }

    // Store propertyId in session for callback verification
    const state = JSON.stringify({ propertyId });

    // Generate Google OAuth2 URL
    const authUrl = googleAuthService.generateAuthURL(state);
    console.log("Auth Url :- ", authUrl);
    return responseHandler(res, { authUrl });
  } catch (error) {
    if (error instanceof APIError) {
      return next(error);
    }
    console.log("Error :- ", error);
    return next(new InternalServerError(error.message));
  }
};

/**
 * Handle Google OAuth callback
 * @param {import('express').Request} req - Request object
 * @param {import('express').Response} res - Response object
 * @param {import('express').NextFunction} next - Next function
 */
const handleGoogleCallback = async (req, res, next) => {
  try {
    const { code, state } = req.query;

    if (!code) {
      throw new ValidationError("Authorization code is required", {
        code: ["Authorization code is missing"],
      });
    }

    let propertyId;
    try {
      const parsedState = JSON.parse(state);
      propertyId = parsedState.propertyId;
    } catch (e) {
      throw new ValidationError("Invalid or missing state parameter", {
        state: ["State could not be parsed"],
      });
    }

    // Exchange code for tokens
    const tokens = await googleAuthService.getTokensFromCode(code);

    // Verify the Google account email matches the property email
    //await googleAuthService.verifyEmailMatch(tokens.access_token, propertyId);

    // Store tokens in database
    await googleAuthService.storeTokens(propertyId, tokens);


    // Get property email for response
    const { property } = await propertyService.getById(propertyId);

    return responseHandler(res, {
      message: "Google account connected successfully",
      email: property.email,
    });
  } catch (error) {
    if (error instanceof APIError) {
      return next(error);
    }
    return next(new InternalServerError(error.message));
  }
};

/**
 * Get Google Business locations
 * @param {import('express').Request} req - Request object
 * @param {import('express').Response} res - Response object
 * @param {import('express').NextFunction} next - Next function
 */
const getLocations = async (req, res, next) => {
  try {
    const { propertyId } = req.params;

    const locations = await googleAuthService.fetchLocations(propertyId);
    console.log(locations);
    return responseHandler(res, { locations });
  } catch (error) {
    if (error instanceof APIError) {
      return next(error);
    }
    console.log(error);
    return next(new InternalServerError(error.message));
  }
};

/**
 * Get Google Business reviews
 * @param {import('express').Request} req - Request object
 * @param {import('express').Response} res - Response object
 * @param {import('express').NextFunction} next - Next function
 */
const getReviews = async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const { locationId } = req.query;

    if (!locationId) {
      throw new ValidationError("Location ID is required", {
        locationId: ["Location ID is required"],
      });
    }

    const reviews = await googleAuthService.fetchReviews(
      propertyId,
      locationId,
    );
    return responseHandler(res, { reviews });
  } catch (error) {
    if (error instanceof APIError) {
      return next(error);
    }
    return next(new InternalServerError(error.message));
  }
};

/**
 * Disconnect Google account
 * @param {import('express').Request} req - Request object
 * @param {import('express').Response} res - Response object
 * @param {import('express').NextFunction} next - Next function
 */
const disconnectGoogle = async (req, res, next) => {
  try {
    const { propertyId } = req.params;

    // Remove tokens from database
    await PropertyToken.findOneAndDelete({ propertyId });

    return responseHandler(res, {
      message: "Google account disconnected successfully",
    });
  } catch (error) {
    if (error instanceof APIError) {
      return next(error);
    }
    return next(new InternalServerError(error.message));
  }
};

module.exports = {
  getGoogleOAuthUrl,
  handleGoogleCallback,
  getLocations,
  getReviews,
  disconnectGoogle,
};
