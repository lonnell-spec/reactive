# Unit Tests

This directory contains unit tests for the most critical business logic functions in the application.

## Test Coverage

### 🔍 **Form Validation Tests** (`form-validation.test.ts`)
- **`validateSignUpInputs()`** - User registration form validation
- **`parseFormBoolean()`** - Boolean parsing from form data
- **`getFormString()`** - Safe string extraction from form data

### 🔄 **Data Transformation Tests** (`data-transformation.test.ts`)
- **`mapFormDataToGuestRecord()`** - Form data to database mapping
- **`generateQRExpiry()`** - QR code expiry date generation
- **`mapChildInfoToRecord()`** - Child data transformation
- **`createGuestProfileUpdateRecord()`** - Profile update record creation
- **`createChildPhotoUpdateRecord()`** - Child photo update record creation

### 🏗️ **Business Logic Tests** (`business-logic.test.ts`)
- **`validateRegistrationCode()`** - Registration code validation
- **`validateUserCreationInputs()`** - User creation input validation
- **`createUserCreationData()`** - User data object creation

### 🛠️ **Utility Function Tests** (`utility-functions.test.ts`)
- **`isEmptyString()`** - Empty string detection
- **`safeTrim()`** - Safe string trimming
- **`isValidEmailFormat()`** - Email format validation
- **`isValidPhoneFormat()`** - Phone number format validation

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Philosophy

These tests focus on:
1. **Pure functions** - Functions with no side effects that are easy to test
2. **Critical business logic** - Functions that handle validation, data transformation, and core workflows
3. **Edge cases** - Boundary conditions, error cases, and invalid inputs
4. **Dependency injection** - Functions designed with testable interfaces

## Test Structure

Each test file follows the pattern:
- **Arrange** - Set up test data and mocks
- **Act** - Call the function under test
- **Assert** - Verify the expected behavior

Tests are grouped by functionality and include both positive and negative test cases to ensure robust error handling.
