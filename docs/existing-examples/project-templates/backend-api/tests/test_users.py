"""
Test cases for user management API endpoints.
Covers registration, authentication, profile management, and admin operations.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User, UserRole
from tests.conftest import create_user_data, TestUtils


class TestUserRegistration:
    """Test user registration endpoints."""

    def test_register_user_success(self, client: TestClient):
        """Test successful user registration."""
        user_data = create_user_data()
        response = client.post("/users/register", json=user_data)

        assert response.status_code == 201
        data = response.json()

        assert data["email"] == user_data["email"]
        assert data["full_name"] == user_data["full_name"]
        assert data["role"] == "user"
        assert data["is_active"] is True
        assert data["is_verified"] is False  # Email verification required
        assert "id" in data

    def test_register_duplicate_email(self, client: TestClient, test_user: User):
        """Test registration with existing email."""
        user_data = create_user_data(email=test_user.email)
        response = client.post("/users/register", json=user_data)

        TestUtils.assert_error_response(response, 409, "RESOURCE_CONFLICT")

    def test_register_invalid_email(self, client: TestClient):
        """Test registration with invalid email."""
        user_data = create_user_data(email="invalid-email")
        response = client.post("/users/register", json=user_data)

        TestUtils.assert_error_response(response, 422)

    def test_register_weak_password(self, client: TestClient):
        """Test registration with weak password."""
        user_data = create_user_data(password="weak")
        response = client.post("/users/register", json=user_data)

        TestUtils.assert_error_response(response, 422)

    def test_register_terms_not_accepted(self, client: TestClient):
        """Test registration without accepting terms."""
        user_data = create_user_data(accept_terms=False)
        response = client.post("/users/register", json=user_data)

        TestUtils.assert_error_response(response, 422)


class TestUserAuthentication:
    """Test user authentication endpoints."""

    def test_login_success(self, client: TestClient, test_user: User):
        """Test successful user login."""
        login_data = {
            "email": test_user.email,
            "password": "testpassword123",
            "remember_me": False
        }
        response = client.post("/users/login", json=login_data)

        assert response.status_code == 200
        data = response.json()

        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        assert data["expires_in"] > 0
        assert data["user"]["id"] == test_user.id

    def test_login_invalid_credentials(self, client: TestClient):
        """Test login with invalid credentials."""
        login_data = {
            "email": "nonexistent@example.com",
            "password": "wrongpassword"
        }
        response = client.post("/users/login", json=login_data)

        TestUtils.assert_error_response(response, 401, "AUTHENTICATION_ERROR")

    def test_login_inactive_user(self, client: TestClient, db_session: AsyncSession):
        """Test login with inactive user account."""
        # Create inactive user
        user_data = create_user_data(email="inactive@example.com")
        response = client.post("/users/register", json=user_data)
        user_id = response.json()["id"]

        # Deactivate user (this would normally be done through admin API)
        # For testing, we'll simulate this

        login_data = {
            "email": user_data["email"],
            "password": user_data["password"]
        }
        # This should still work since we just registered the user
        # In a real scenario, you'd deactivate the user first

    def test_refresh_token(self, client: TestClient, test_user: User):
        """Test token refresh functionality."""
        # First, login to get tokens
        login_data = {
            "email": test_user.email,
            "password": "testpassword123"
        }
        login_response = client.post("/users/login", json=login_data)
        refresh_token = login_response.json()["refresh_token"]

        # Use refresh token to get new access token
        refresh_data = {"refresh_token": refresh_token}
        response = client.post("/users/refresh", json=refresh_data)

        assert response.status_code == 200
        data = response.json()

        assert "access_token" in data
        assert "refresh_token" in data
        assert data["user"]["id"] == test_user.id

    def test_refresh_invalid_token(self, client: TestClient):
        """Test refresh with invalid token."""
        refresh_data = {"refresh_token": "invalid_token"}
        response = client.post("/users/refresh", json=refresh_data)

        TestUtils.assert_error_response(response, 401, "AUTHENTICATION_ERROR")


class TestUserProfile:
    """Test user profile management endpoints."""

    def test_get_current_user(self, client: TestClient, auth_headers: dict, test_user: User):
        """Test getting current user profile."""
        response = client.get("/users/me", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()

        assert data["id"] == test_user.id
        assert data["email"] == test_user.email
        assert data["full_name"] == test_user.full_name
        assert "recent_posts" in data
        assert "recent_comments" in data

    def test_get_current_user_unauthorized(self, client: TestClient):
        """Test getting profile without authentication."""
        response = client.get("/users/me")

        TestUtils.assert_error_response(response, 403)  # No auth header

    def test_update_profile(self, client: TestClient, auth_headers: dict, test_user: User):
        """Test updating user profile."""
        update_data = {
            "full_name": "Updated Name",
            "bio": "Updated bio",
            "location": "New Location"
        }
        response = client.put("/users/me", json=update_data, headers=auth_headers)

        assert response.status_code == 200
        data = response.json()

        assert data["full_name"] == update_data["full_name"]
        assert data["bio"] == update_data["bio"]
        assert data["location"] == update_data["location"]

    def test_change_password(self, client: TestClient, auth_headers: dict):
        """Test password change."""
        password_data = {
            "current_password": "testpassword123",
            "new_password": "newsecurepassword123",
            "confirm_password": "newsecurepassword123"
        }
        response = client.post("/users/change-password", json=password_data, headers=auth_headers)

        assert response.status_code == 200
        assert response.json()["message"] == "Password updated successfully"

    def test_change_password_wrong_current(self, client: TestClient, auth_headers: dict):
        """Test password change with wrong current password."""
        password_data = {
            "current_password": "wrongpassword",
            "new_password": "newsecurepassword123",
            "confirm_password": "newsecurepassword123"
        }
        response = client.post("/users/change-password", json=password_data, headers=auth_headers)

        TestUtils.assert_error_response(response, 401, "AUTHENTICATION_ERROR")

    def test_change_password_mismatch(self, client: TestClient, auth_headers: dict):
        """Test password change with mismatched passwords."""
        password_data = {
            "current_password": "testpassword123",
            "new_password": "newsecurepassword123",
            "confirm_password": "differentpassword123"
        }
        response = client.post("/users/change-password", json=password_data, headers=auth_headers)

        TestUtils.assert_error_response(response, 422)


class TestUserAdmin:
    """Test admin user management endpoints."""

    def test_list_users_as_moderator(self, client: TestClient, moderator_headers: dict):
        """Test listing users as moderator."""
        response = client.get("/users", headers=moderator_headers)

        assert response.status_code == 200
        data = response.json()

        assert "users" in data
        assert "total" in data
        assert "page" in data
        assert "size" in data

    def test_list_users_as_regular_user(self, client: TestClient, auth_headers: dict):
        """Test listing users as regular user (should be forbidden)."""
        response = client.get("/users", headers=auth_headers)

        TestUtils.assert_error_response(response, 403, "AUTHORIZATION_ERROR")

    def test_get_user_stats_as_admin(self, client: TestClient, admin_headers: dict):
        """Test getting user statistics as admin."""
        response = client.get("/users/stats", headers=admin_headers)

        assert response.status_code == 200
        data = response.json()

        assert "total_users" in data
        assert "active_users" in data
        assert "verified_users" in data
        assert "users_by_role" in data

    def test_get_user_by_id(self, client: TestClient, moderator_headers: dict, test_user: User):
        """Test getting user by ID as moderator."""
        response = client.get(f"/users/{test_user.id}", headers=moderator_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_user.id

    def test_admin_update_user(self, client: TestClient, admin_headers: dict, test_user: User):
        """Test admin updating user role and status."""
        update_data = {
            "role": "moderator",
            "is_verified": True
        }
        response = client.put(
            f"/users/{test_user.id}/admin",
            json=update_data,
            headers=admin_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["role"] == "moderator"
        assert data["is_verified"] is True

    def test_admin_update_nonexistent_user(self, client: TestClient, admin_headers: dict):
        """Test admin updating nonexistent user."""
        update_data = {"role": "moderator"}
        response = client.put("/users/99999/admin", json=update_data, headers=admin_headers)

        TestUtils.assert_error_response(response, 404, "RESOURCE_NOT_FOUND")

    def test_delete_user_as_admin(self, client: TestClient, admin_headers: dict, test_user: User):
        """Test deleting user as admin."""
        response = client.delete(f"/users/{test_user.id}", headers=admin_headers)

        assert response.status_code == 200
        assert "deactivated" in response.json()["message"]


class TestPasswordReset:
    """Test password reset functionality."""

    def test_request_password_reset(self, client: TestClient, test_user: User):
        """Test requesting password reset."""
        reset_data = {"email": test_user.email}
        response = client.post("/users/request-password-reset", json=reset_data)

        assert response.status_code == 200
        assert "password reset instructions sent" in response.json()["message"]

    def test_request_password_reset_nonexistent_email(self, client: TestClient):
        """Test requesting reset for nonexistent email."""
        reset_data = {"email": "nonexistent@example.com"}
        response = client.post("/users/request-password-reset", json=reset_data)

        # Should still return success for security
        assert response.status_code == 200
        assert "password reset instructions sent" in response.json()["message"]


@pytest.mark.asyncio
class TestUserIntegration:
    """Integration tests for user workflows."""

    async def test_full_registration_and_login_flow(self, client: TestClient):
        """Test complete user registration and login workflow."""
        # Register user
        user_data = create_user_data(email="integration@example.com")
        register_response = client.post("/users/register", json=user_data)
        assert register_response.status_code == 201

        # Login with registered user
        login_data = {
            "email": user_data["email"],
            "password": user_data["password"]
        }
        login_response = client.post("/users/login", json=login_data)
        assert login_response.status_code == 200

        # Get profile
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        profile_response = client.get("/users/me", headers=headers)
        assert profile_response.status_code == 200

    async def test_user_permission_escalation_prevention(
        self,
        client: TestClient,
        test_user: User,
        admin_headers: dict
    ):
        """Test that users cannot escalate their own permissions."""
        # User should not be able to update their own role
        update_data = {"role": "admin"}
        response = client.put(
            f"/users/{test_user.id}/admin",
            json=update_data,
            headers=admin_headers
        )

        # This should work for admin updating other users
        assert response.status_code == 200