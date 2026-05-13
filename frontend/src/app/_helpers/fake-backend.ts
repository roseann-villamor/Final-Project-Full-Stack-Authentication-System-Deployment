import { Injectable } from '@angular/core';
import { HttpRequest, HttpResponse, HttpHandler, HttpEvent, HttpInterceptor, HTTP_INTERCEPTORS } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay, materialize, dematerialize } from 'rxjs/operators';

import { Role } from '@app/_models';

// ─── Hardcoded Users ─────────────────────────────────────
// These two accounts are available for Stage A testing.
const users: any[] = [
    {
        id: 1,
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@example.com',
        password: 'admin123',
        role: Role.Admin,
        isVerified: true
    },
    {
        id: 2,
        firstName: 'Normal',
        lastName: 'User',
        email: 'user@example.com',
        password: 'user123',
        role: Role.User,
        isVerified: true
    }
];

// Track the currently "logged in" user so refresh-token works
let currentUser: any = null;

@Injectable()
export class FakeBackendInterceptor implements HttpInterceptor {
    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const { url, method, headers, body } = request;

        return handleRoute();

        function handleRoute() {
            switch (true) {
                case url.endsWith('/accounts/authenticate') && method === 'POST':
                    return authenticate();
                case url.endsWith('/accounts/register') && method === 'POST':
                    return register();
                case url.endsWith('/accounts/verify-email') && method === 'POST':
                    return verifyEmail();
                case url.endsWith('/accounts/refresh-token') && method === 'POST':
                    return refreshToken();
                case url.endsWith('/accounts/revoke-token') && method === 'POST':
                    return revokeToken();
                case url.endsWith('/accounts/forgot-password') && method === 'POST':
                    return forgotPassword();
                case url.endsWith('/accounts/reset-password') && method === 'POST':
                    return resetPassword();
                case url.endsWith('/accounts') && method === 'GET':
                    return getAccounts();
                default:
                    // All others → pass through to real HTTP
                    return next.handle(request);
            }
        }

        // ─── POST /accounts/authenticate ─────────────────
        // Return fake JWT and set fake refreshToken cookie.
        function authenticate() {
            const { email, password } = body;
            const user = users.find(x => x.email === email && x.password === password);

            if (!user) {
                return error('Email or password is incorrect');
            }

            currentUser = user;
            return ok({
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                isVerified: user.isVerified,
                jwtToken: generateJwtToken(user)
            });
        }

        // ─── POST /accounts/register ─────────────────────
        // Simulate sending a verification email; return success message.
        function register() {
            return ok({
                message: 'Registration successful, please check your email for verification instructions'
            });
        }

        // ─── POST /accounts/verify-email ─────────────────
        // Accept any token, return success.
        function verifyEmail() {
            return ok({
                message: 'Verification successful, you can now login'
            });
        }

        // ─── POST /accounts/refresh-token ────────────────
        // Return new fake JWT.
        function refreshToken() {
            if (!currentUser) {
                return unauthorized();
            }

            return ok({
                id: currentUser.id,
                firstName: currentUser.firstName,
                lastName: currentUser.lastName,
                email: currentUser.email,
                role: currentUser.role,
                isVerified: currentUser.isVerified,
                jwtToken: generateJwtToken(currentUser)
            });
        }

        // ─── POST /accounts/revoke-token ─────────────────
        // Return success.
        function revokeToken() {
            currentUser = null;
            return ok({ message: 'Token revoked' });
        }

        // ─── POST /accounts/forgot-password ──────────────
        function forgotPassword() {
            return ok({
                message: 'Please check your email for password reset instructions'
            });
        }

        // ─── POST /accounts/reset-password ───────────────
        function resetPassword() {
            return ok({
                message: 'Password reset successful, you can now login'
            });
        }

        // ─── GET /accounts ───────────────────────────────
        // Return the hardcoded user list (Admin only).
        function getAccounts() {
            if (!isAdmin()) {
                return unauthorized();
            }

            return ok(users.map(u => ({
                id: u.id,
                firstName: u.firstName,
                lastName: u.lastName,
                email: u.email,
                role: u.role,
                isVerified: u.isVerified
            })));
        }

        // ─── Helper Functions ────────────────────────────

        function ok(responseBody?: any) {
            return of(new HttpResponse({ status: 200, body: responseBody }))
                .pipe(delay(500)); // simulate server latency
        }

        function error(message: string) {
            return throwError(() => ({ error: { message } }))
                .pipe(materialize(), delay(500), dematerialize());
        }

        function unauthorized() {
            return throwError(() => ({ status: 401, error: { message: 'Unauthorized' } }))
                .pipe(materialize(), delay(500), dematerialize());
        }

        function isAdmin() {
            return headers.get('Authorization')?.startsWith('Bearer fake-jwt-token')
                && currentUser?.role === Role.Admin;
        }

        function generateJwtToken(user: any) {
            // Create a fake JWT containing the user id and a 15-minute expiry
            const payload = btoa(JSON.stringify({
                id: user.id,
                exp: Math.round(new Date(Date.now() + 15 * 60 * 1000).getTime() / 1000)
            }));
            return `fake-jwt-token.${payload}.fake-signature`;
        }
    }
}

// Export the class for use in app.module.ts comment block
export const FakeBackendProvider = {
    provide: HTTP_INTERCEPTORS,
    useClass: FakeBackendInterceptor,
    multi: true
};
