# Smart Canteen – Backend API

Backend service for the Smart Canteen Demand Prediction project. It provides authentication, food-item management, daily sales tracking, and demand-prediction history.

> **Current prediction implementation:** The backend currently generates temporary predictions using the average quantity recorded in the previous **7 calendar days**. It does **not** call the Python/FastAPI ML service yet. Treat the prediction output as temporary/demo logic until the ML integration is implemented.

---

## 1. Project Overview

The backend supports this application flow:

1. A user registers or logs in.
2. The frontend stores the returned JWT.
3. The frontend sends that JWT with protected API requests.
4. The user adds and manages food items.
5. The user records daily sales for each food item.
6. The user generates demand predictions for a selected date.
7. The user views prediction history and individual prediction details.

All food, sales, and prediction records are scoped to the authenticated user. A user cannot fetch or modify another user's records through these APIs.

## 2. Tech Stack

- Node.js with JavaScript ES Modules
- Express 5
- MongoDB
- Mongoose
- JWT (`jsonwebtoken`) for authentication
- `bcryptjs` for password hashing
- `express-validator` for request validation
- `cors` and `dotenv`
- `nodemon` for development

`axios` is present as a dependency, but the current prediction service does not use it to call an external ML service.

## 3. Backend Folder Structure

```text
backend/
├── src/
│   ├── app/
│   │   └── app.js
│   ├── config/
│   │   ├── config.js
│   │   └── db.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── food.controller.js
│   │   ├── prediction.controller.js
│   │   └── sales.controller.js
│   ├── middleware/
│   │   └── auth.middleware.js
│   ├── models/
│   │   ├── food.model.js
│   │   ├── prediction.model.js
│   │   ├── sales.model.js
│   │   └── user.model.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── food.routes.js
│   │   ├── prediction.routes.js
│   │   └── sales.routes.js
│   ├── services/
│   │   └── prediction.service.js
│   ├── utils/
│   │   └── auth.util.js
│   └── server.js
├── package.json
└── .env
```

### Main responsibilities

| Folder/file | Responsibility |
|---|---|
| `app/app.js` | Creates Express app, configures CORS and JSON parsing, mounts routes |
| `config/config.js` | Reads environment variables |
| `config/db.js` | Connects to MongoDB |
| `routes/` | Defines API endpoints and route-level validation |
| `controllers/` | Handles HTTP requests and responses |
| `models/` | Defines MongoDB/Mongoose schemas |
| `middleware/auth.middleware.js` | Verifies JWT and attaches the logged-in user to `req.user` |
| `services/prediction.service.js` | Contains the current temporary prediction calculation |
| `utils/auth.util.js` | Generates JWT tokens |
| `server.js` | Connects to MongoDB and starts the HTTP server |

## 4. Setup and Run

### Requirements

- Node.js and npm
- MongoDB local service or MongoDB Atlas database
- Postman or another API client (recommended for testing)

### Install dependencies

Open a terminal in the `backend` directory:

```bash
npm install
```

### Environment variables

Create a `.env` file in the backend root (same level as `package.json`):

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/smart-canteen
JWT_SECRET=replace_with_a_long_random_secret
```

Use your actual MongoDB connection string if using MongoDB Atlas. `JWT_SECRET` must be a private, strong random value. Never commit `.env` or share its contents.

The backend reads these exact variable names:

| Variable | Purpose |
|---|---|
| `PORT` | HTTP server port; code falls back to `3000` if unset |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret used to sign and verify JWTs |

### Start the backend

```bash
npm run dev
```

The configured script runs:

```bash
nodemon ./src/server.js
```

Expected terminal messages after a successful startup include a MongoDB connection success message and the server port message.

### Base URL

For local development, if `PORT=5000`:

```text
http://localhost:5000
```

The API base path is:

```text
http://localhost:5000/api
```

If the frontend runs on a different device on the same Wi-Fi network, use the backend computer's LAN IP address instead of `localhost` (for example, `http://192.168.x.x:5000/api`). Ensure the port is reachable through the computer's firewall.

> The current Express app uses `cors()` with its default permissive configuration. Restrict allowed origins before production deployment.

## 5. API Conventions

- Request and response bodies use JSON.
- Send `Content-Type: application/json` for JSON request bodies.
- Protected endpoints require a JWT in the `Authorization` header.
- Dates accepted by sales and prediction endpoints must be strings in `YYYY-MM-DD` format.
- MongoDB document IDs are returned as `_id` strings.
- Prices and quantities are numbers, not formatted currency strings.

### Authentication header

For every protected request, send:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

Example using `fetch`:

```js
const token = localStorage.getItem("token");

const response = await fetch("http://localhost:5000/api/foods", {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const result = await response.json();
```

The backend's `protect` middleware verifies the token using `JWT_SECRET`, loads the user from MongoDB, and attaches this object to `req.user`:

```json
{
  "id": "USER_MONGODB_ID",
  "name": "Demo User",
  "email": "demo@example.com"
}
```

A missing, invalid, or expired token returns HTTP `401`.

---

# 6. API Reference

All endpoints below are relative to:

```text
http://localhost:5000
```

## 6.1 Authentication

Authentication routes are mounted at `/api/auth`.

### Register

`POST /api/auth/register`

**Authentication:** Not required.

Request body:

```json
{
  "name": "Demo User",
  "email": "demo@example.com",
  "password": "password123"
}
```

Validation:
- `name` must not be empty.
- `email` must be a valid email address.
- `password` must contain at least 6 characters.

Success — HTTP `201`:

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "USER_MONGODB_ID",
      "name": "Demo User",
      "email": "demo@example.com"
    },
    "token": "JWT_TOKEN"
  }
}
```

Possible errors:
- `400` — validation failed; response contains an `errors` array.
- `409` — email already registered.
- `500` — server/database error.

### Login

`POST /api/auth/login`

**Authentication:** Not required.

Request body:

```json
{
  "email": "demo@example.com",
  "password": "password123"
}
```

Success — HTTP `200`:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "USER_MONGODB_ID",
      "name": "Demo User",
      "email": "demo@example.com"
    },
    "token": "JWT_TOKEN"
  }
}
```

Possible errors:
- `400` — validation failed.
- `401` — invalid email or password.
- `500` — server error.

### Get current user profile

`GET /api/auth/profile`

**Authentication:** Required.

Success — HTTP `200`:

```json
{
  "success": true,
  "message": "Profile fetched successfully",
  "data": {
    "id": "USER_MONGODB_ID",
    "name": "Demo User",
    "email": "demo@example.com"
  }
}
```

---

## 6.2 Food Management

Food routes are mounted at `/api/foods`.

**All food endpoints require authentication.** Each operation is restricted to food records created by the logged-in user.

### Add food item

`POST /api/foods`

Request body:

```json
{
  "name": "Veg Sandwich",
  "description": "Grilled vegetable sandwich",
  "price": 50,
  "category": "Snacks",
  "isAvailable": true
}
```

Fields:
- `name` — required, non-empty string.
- `price` — required, number greater than or equal to `0`.
- `description` — optional string; defaults to an empty string.
- `category` — optional; one of `Breakfast`, `Lunch`, `Snacks`, `Beverages`, `Other`. Defaults to `Other`.
- `isAvailable` — optional boolean; defaults to `true`.

Success — HTTP `201`:

```json
{
  "success": true,
  "message": "Food item added successfully",
  "data": {
    "_id": "FOOD_MONGODB_ID",
    "name": "Veg Sandwich",
    "description": "Grilled vegetable sandwich",
    "price": 50,
    "category": "Snacks",
    "isAvailable": true,
    "createdBy": "USER_MONGODB_ID",
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  }
}
```

The IDs and timestamps above are illustrative; MongoDB generates the actual values.

### Get all food items

`GET /api/foods`

Success — HTTP `200`:

```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "_id": "FOOD_MONGODB_ID",
      "name": "Veg Sandwich",
      "description": "Grilled vegetable sandwich",
      "price": 50,
      "category": "Snacks",
      "isAvailable": true,
      "createdBy": "USER_MONGODB_ID",
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-01T00:00:00.000Z"
    }
  ]
}
```

The list is sorted by newest `createdAt` first.

### Get one food item

`GET /api/foods/:id`

Example:

```text
GET /api/foods/FOOD_MONGODB_ID
```

Success — HTTP `200`:

```json
{
  "success": true,
  "data": {
    "_id": "FOOD_MONGODB_ID",
    "name": "Veg Sandwich",
    "description": "Grilled vegetable sandwich",
    "price": 50,
    "category": "Snacks",
    "isAvailable": true,
    "createdBy": "USER_MONGODB_ID",
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  }
}
```

Possible errors: `400` invalid ID, `404` item not found for this user.

### Update food item

`PATCH /api/foods/:id`

Send only the fields that need to change:

```json
{
  "price": 55,
  "isAvailable": false
}
```

Allowed fields: `name`, `description`, `price`, `category`, `isAvailable`.

Success — HTTP `200`:

```json
{
  "success": true,
  "message": "Food item updated successfully",
  "data": {
    "_id": "FOOD_MONGODB_ID",
    "name": "Veg Sandwich",
    "description": "Grilled vegetable sandwich",
    "price": 55,
    "category": "Snacks",
    "isAvailable": false,
    "createdBy": "USER_MONGODB_ID",
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  }
}
```

Possible errors: `400` invalid ID / invalid fields / no valid update fields, `404` item not found.

### Delete food item

`DELETE /api/foods/:id`

Success — HTTP `200`:

```json
{
  "success": true,
  "message": "Food item deleted successfully"
}
```

Possible errors: `400` invalid ID, `404` item not found.

> Deleting a food item does not currently delete its related sales or prediction documents. The frontend should not assume cascading deletion.

---

## 6.3 Daily Sales

Sales routes are mounted at `/api/sales`.

**All sales endpoints require authentication.**

### Add daily sales

`POST /api/sales`

Request body:

```json
{
  "foodItem": "FOOD_MONGODB_ID",
  "date": "2026-11-24",
  "quantitySold": 35
}
```

Rules:
- `foodItem` must be a valid food MongoDB ID belonging to the logged-in user.
- `date` must be a real calendar date in `YYYY-MM-DD` format.
- `quantitySold` must be a non-negative integer.
- Only one sales record can exist for the same food item, user, and date.

Success — HTTP `201`:

```json
{
  "success": true,
  "message": "Daily sales added successfully",
  "data": {
    "_id": "SALES_MONGODB_ID",
    "foodItem": "FOOD_MONGODB_ID",
    "date": "2026-11-24T00:00:00.000Z",
    "quantitySold": 35,
    "createdBy": "USER_MONGODB_ID",
    "createdAt": "2026-11-24T00:00:00.000Z",
    "updatedAt": "2026-11-24T00:00:00.000Z"
  }
}
```

Possible errors:
- `400` invalid food ID, invalid date, or invalid quantity.
- `404` food item not found for this user.
- `409` a sales entry already exists for this food item and date.

### Get sales for a date

`GET /api/sales?date=2026-11-24`

**Query parameter:** `date` is required and must use `YYYY-MM-DD`.

Success — HTTP `200`:

```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "_id": "SALES_MONGODB_ID",
      "foodItem": {
        "_id": "FOOD_MONGODB_ID",
        "name": "Veg Sandwich",
        "price": 50,
        "category": "Snacks"
      },
      "date": "2026-11-24T00:00:00.000Z",
      "quantitySold": 35,
      "createdBy": "USER_MONGODB_ID",
      "createdAt": "2026-11-24T00:00:00.000Z",
      "updatedAt": "2026-11-24T00:00:00.000Z"
    }
  ]
}
```

Notice that `foodItem` is populated as an object in this response, not just an ID.

### Get complete sales history

`GET /api/sales/history`

Success — HTTP `200`:

```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "_id": "SALES_MONGODB_ID",
      "foodItem": {
        "_id": "FOOD_MONGODB_ID",
        "name": "Veg Sandwich",
        "price": 50,
        "category": "Snacks"
      },
      "date": "2026-11-24T00:00:00.000Z",
      "quantitySold": 35,
      "createdBy": "USER_MONGODB_ID",
      "createdAt": "2026-11-24T00:00:00.000Z",
      "updatedAt": "2026-11-24T00:00:00.000Z"
    }
  ]
}
```

History is sorted by date descending, then creation time descending.

### Update sales quantity

`PATCH /api/sales/:id`

Request body:

```json
{
  "quantitySold": 40
}
```

Success — HTTP `200`:

```json
{
  "success": true,
  "message": "Sales updated successfully",
  "data": {
    "_id": "SALES_MONGODB_ID",
    "foodItem": {
      "_id": "FOOD_MONGODB_ID",
      "name": "Veg Sandwich",
      "price": 50,
      "category": "Snacks"
    },
    "date": "2026-11-24T00:00:00.000Z",
    "quantitySold": 40,
    "createdBy": "USER_MONGODB_ID",
    "createdAt": "2026-11-24T00:00:00.000Z",
    "updatedAt": "2026-11-24T00:00:00.000Z"
  }
}
```

Possible errors: `400` invalid ID or quantity, `404` sales record not found.

### Delete sales record

`DELETE /api/sales/:id`

Success — HTTP `200`:

```json
{
  "success": true,
  "message": "Sales deleted successfully"
}
```

Possible errors: `400` invalid ID, `404` sales record not found.

---

## 6.4 Demand Prediction

Prediction routes are mounted at `/api/predictions`.

**All prediction endpoints require authentication.**

### Generate prediction

`POST /api/predictions/generate`

Request body:

```json
{
  "predictionDate": "2026-11-25"
}
```

`predictionDate` must be a real calendar date in `YYYY-MM-DD` format.

Success — HTTP `200`:

```json
{
  "success": true,
  "message": "Demand prediction generated successfully",
  "data": {
    "_id": "PREDICTION_MONGODB_ID",
    "predictionDate": "2026-11-25T00:00:00.000Z",
    "historyDays": 7,
    "predictions": [
      {
        "foodItem": "FOOD_MONGODB_ID",
        "foodName": "Veg Sandwich",
        "averageSales": 32.5,
        "predictedQuantity": 33,
        "historyCount": 4,
        "status": "predicted"
      },
      {
        "foodItem": "ANOTHER_FOOD_ID",
        "foodName": "Tea",
        "averageSales": null,
        "predictedQuantity": null,
        "historyCount": 0,
        "status": "insufficient_data"
      }
    ],
    "createdBy": "USER_MONGODB_ID",
    "createdAt": "2026-11-25T00:00:00.000Z",
    "updatedAt": "2026-11-25T00:00:00.000Z"
  }
}
```

The sample values are illustrative. Actual values depend on saved food and sales records.

Possible errors:
- `400` invalid or incorrectly formatted date.
- `404` no food items exist for this user; add food items first.
- `401` missing/invalid/expired token.
- `500` internal server error.

### How the current temporary prediction works

The current service (`services/prediction.service.js`):

1. Reads all food items belonging to the logged-in user.
2. Reads sales from the 7 calendar days before the requested prediction date. The prediction date itself is excluded.
3. Groups recorded sales by food item.
4. Calculates the average of the available sales-record quantities for each food item.
5. Rounds the average to the nearest whole number for `predictedQuantity`.

For a food item with no sales records in that window:
- `averageSales` is `null`.
- `predictedQuantity` is `null`.
- `historyCount` is `0`.
- `status` is `insufficient_data`.

For an item with sales records:
- `averageSales` is the average of the recorded `quantitySold` values, rounded to 2 decimal places.
- `predictedQuantity` is the rounded average.
- `historyCount` is the number of sales records used.
- `status` is `predicted`.

**Important interpretation:** `historyCount` counts sales entries, not necessarily the number of calendar days. The algorithm averages only dates on which a sales record exists; it does not insert zero-sales entries for missing dates.

### Regenerating a prediction

The database has a unique index for each `(createdBy, predictionDate)` pair. Generating a prediction again for the same user and date updates the existing prediction instead of creating a second one.

### Get prediction history

`GET /api/predictions/history`

Success — HTTP `200`:

```json
{
  "success": true,
  "message": "Prediction history fetched successfully",
  "count": 1,
  "data": [
    {
      "_id": "PREDICTION_MONGODB_ID",
      "predictionDate": "2026-11-25T00:00:00.000Z",
      "historyDays": 7,
      "predictions": [
        {
          "foodItem": "FOOD_MONGODB_ID",
          "foodName": "Veg Sandwich",
          "averageSales": 32.5,
          "predictedQuantity": 33,
          "historyCount": 4,
          "status": "predicted"
        }
      ],
      "createdAt": "2026-11-25T00:00:00.000Z",
      "updatedAt": "2026-11-25T00:00:00.000Z"
    }
  ]
}
```

History is sorted by `predictionDate` descending. `createdBy` and `__v` are excluded from these history responses.

### Get prediction by ID

`GET /api/predictions/:id`

Success — HTTP `200`:

```json
{
  "success": true,
  "message": "Prediction details fetched successfully",
  "data": {
    "_id": "PREDICTION_MONGODB_ID",
    "predictionDate": "2026-11-25T00:00:00.000Z",
    "historyDays": 7,
    "predictions": [
      {
        "foodItem": "FOOD_MONGODB_ID",
        "foodName": "Veg Sandwich",
        "averageSales": 32.5,
        "predictedQuantity": 33,
        "historyCount": 4,
        "status": "predicted"
      }
    ],
    "createdAt": "2026-11-25T00:00:00.000Z",
    "updatedAt": "2026-11-25T00:00:00.000Z"
  }
}
```

Possible errors: `400` invalid prediction ID, `404` prediction not found for this user.

---

# 7. Frontend Integration Guide

## 7.1 Recommended frontend API configuration

Keep the backend URL in one place. Example for a Vite frontend:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

For Next.js, use a public environment variable instead:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api
```

Axios example:

```js
import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});
```

If using Next.js, replace `import.meta.env.VITE_API_BASE_URL` with `process.env.NEXT_PUBLIC_API_BASE_URL`.

## 7.2 Attach token to protected requests

A convenient Axios interceptor:

```js
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
```

Use the storage approach selected by your frontend team. The current backend returns the JWT in JSON and expects it as a Bearer token; it does not set an authentication cookie.

## 7.3 Register and login example

```js
// Register
const registerResponse = await api.post("/auth/register", {
  name: "Demo User",
  email: "demo@example.com",
  password: "password123",
});

// Login
const loginResponse = await api.post("/auth/login", {
  email: "demo@example.com",
  password: "password123",
});

// Both responses return the token at data.token
const { token, user } = loginResponse.data.data;

localStorage.setItem("token", token);
```

After login, use the token for protected routes. On logout, remove the locally stored token:

```js
localStorage.removeItem("token");
```

The backend currently has no logout/revocation endpoint; removing the token on the frontend ends the local session. The token remains valid until its 7-day expiry unless the JWT secret changes or the user is otherwise unable to authenticate.

## 7.4 Suggested screen-to-API mapping

| Frontend screen/action | API |
|---|---|
| Register screen | `POST /auth/register` |
| Login screen | `POST /auth/login` |
| Profile/account | `GET /auth/profile` |
| Food menu/list | `GET /foods` |
| Add food form | `POST /foods` |
| Food details/edit form | `GET /foods/:id`, `PATCH /foods/:id` |
| Delete food | `DELETE /foods/:id` |
| Add daily sales form | `POST /sales` |
| Sales for selected date | `GET /sales?date=YYYY-MM-DD` |
| Sales history | `GET /sales/history` |
| Edit sales quantity | `PATCH /sales/:id` |
| Delete sales entry | `DELETE /sales/:id` |
| Generate prediction | `POST /predictions/generate` |
| Prediction history | `GET /predictions/history` |
| Prediction details | `GET /predictions/:id` |

## 7.5 Suggested integration order

1. Configure the API base URL.
2. Complete register/login and save the returned token.
3. Add the Bearer token to protected requests.
4. Verify `/auth/profile`.
5. Integrate food CRUD.
6. Integrate daily sales entry, date-wise sales, and sales history.
7. Integrate prediction generation.
8. Integrate prediction history and prediction detail.
9. Test empty states, validation errors, expired tokens, and loading states.

## 7.6 Handle API errors

A typical error response looks like:

```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

Validation errors from routes using `express-validator` can look like:

```json
{
  "success": false,
  "errors": [
    {
      "type": "field",
      "value": "",
      "msg": "Food name is required",
      "path": "name",
      "location": "body"
    }
  ]
}
```

Frontend handling should:
- Check HTTP status and `success`.
- Display `message` when present.
- Display the `errors[].msg` values for validation failures.
- On `401`, clear the local token and send the user to login.
- Handle `404` with a not-found or empty-state UI where appropriate.
- Handle `409` for duplicate daily sales with a clear message.

---

# 8. Database Models

The backend currently defines four collections through Mongoose.

## User

| Field | Type | Notes |
|---|---|---|
| `name` | String | Required |
| `email` | String | Required, unique, lowercase, trimmed |
| `password` | String | Required, minimum 6 characters; excluded from normal queries |
| `createdAt`, `updatedAt` | Date | Automatic timestamps |

Passwords are hashed with `bcryptjs` before being stored.

## Food

| Field | Type | Notes |
|---|---|---|
| `name` | String | Required |
| `description` | String | Defaults to `""` |
| `price` | Number | Required, minimum `0` |
| `category` | String | `Breakfast`, `Lunch`, `Snacks`, `Beverages`, `Other` |
| `isAvailable` | Boolean | Defaults to `true` |
| `createdBy` | ObjectId | Reference to User; required |
| timestamps | Date | Automatic |

## Sales

| Field | Type | Notes |
|---|---|---|
| `foodItem` | ObjectId | Reference to Food; required |
| `date` | Date | Required |
| `quantitySold` | Number | Required, minimum `0` |
| `createdBy` | ObjectId | Reference to User; required |
| timestamps | Date | Automatic |

Unique index: `(foodItem, date, createdBy)`. This prevents duplicate sales entries for the same food/user/date combination.

## Prediction

| Field | Type | Notes |
|---|---|---|
| `predictionDate` | Date | Required |
| `historyDays` | Number | Defaults to `7` |
| `predictions` | Array | Per-food prediction output |
| `createdBy` | ObjectId | Reference to User; required |
| timestamps | Date | Automatic |

Each prediction item contains:
- `foodItem`
- `foodName`
- `averageSales`
- `predictedQuantity`
- `historyCount`
- `status` (`predicted` or `insufficient_data`)

Unique index: `(createdBy, predictionDate)`. A user's prediction for a date is updated when generated again.

---

# 9. Postman Testing Checklist

Set a Postman environment variable:

```text
baseUrl = http://localhost:5000
```

After register/login, copy `data.token` and set:

```text
token = YOUR_JWT_TOKEN
```

For protected requests, use:

```text
Authorization: Bearer {{token}}
```

Suggested test sequence:

1. `POST {{baseUrl}}/api/auth/register`
2. `POST {{baseUrl}}/api/auth/login`
3. `GET {{baseUrl}}/api/auth/profile`
4. `POST {{baseUrl}}/api/foods`
5. `GET {{baseUrl}}/api/foods`
6. `POST {{baseUrl}}/api/sales`
7. `GET {{baseUrl}}/api/sales?date=2026-11-24`
8. `GET {{baseUrl}}/api/sales/history`
9. `POST {{baseUrl}}/api/predictions/generate`
10. `GET {{baseUrl}}/api/predictions/history`
11. `GET {{baseUrl}}/api/predictions/PREDICTION_MONGODB_ID`

Also test:
- Protected endpoint without token → `401`.
- Invalid token → `401`.
- Invalid MongoDB ID → `400` on endpoints that validate IDs.
- Duplicate sales for same food/date → `409`.
- Prediction with no food items → `404`.
- Prediction for a food item with no sales history → `insufficient_data`.

---

# 10. Current Scope and ML Integration Status

## Implemented in the uploaded backend

- User registration and login
- JWT-protected profile endpoint
- Food item create, read, update, and delete
- Daily sales create, read by date, history, update, and delete
- Temporary demand prediction generation
- Prediction history and prediction detail
- Per-user data filtering for food, sales, and predictions

## Not implemented in the current backend code

- Python/FastAPI ML service call
- ML model inference or model confidence/accuracy fields
- Dashboard-specific aggregate/statistics endpoint
- Image upload/OCR
- PDF report generation
- Pagination, search, or filtering for food/sales/prediction history beyond the date query shown above
- Cookie-based authentication or refresh-token flow

Do not build frontend dependencies on endpoints or response fields that are not documented as implemented here.

## Future ML service integration

When the ML service is ready, the backend prediction service/controller can be updated to call it. The current backend source does not define the ML service URL, request payload, response schema, timeout behavior, or fallback strategy. Those details must be agreed with the ML developer before implementation and documented after the integration is actually completed.

Until then, use the current `POST /api/predictions/generate` contract and treat its output as temporary average-based predictions.

---

# 11. Important Notes for the Frontend Developer

1. Use the exact route paths and HTTP methods documented above.
2. Send the JWT as `Authorization: Bearer <token>` for every protected route.
3. The token is returned under `response.data.data.token` for register and login when using Axios.
4. The API uses `foodItem` as the sales request field, not `foodItemId`.
5. Sales and prediction dates must be sent as `YYYY-MM-DD`.
6. Sales date/history responses populate `foodItem` as an object containing `_id`, `name`, `price`, and `category`.
7. Prediction result `foodItem` is an ID; `foodName` is also included in each prediction item.
8. A prediction can contain `insufficient_data`; render this state instead of treating `null` quantity as zero.
9. There is no dashboard summary endpoint in the current backend.
10. Do not expose `.env`, `JWT_SECRET`, or MongoDB credentials in frontend code or Git.

---

## 12. License

No project-specific license is declared in the current `package.json`. Add a license file if the project is to be distributed publicly.
