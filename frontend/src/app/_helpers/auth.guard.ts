import { Injectable } from '@angular/core';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

import { AccountService } from '@app/_services';

@Injectable({ providedIn: 'root' })
export class AuthGuard {
    constructor(
        private router: Router,
        private accountService: AccountService
    ) { }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        const account = this.accountService.accountValue;
        if (account) {
            // Check if route is restricted by role
            if (route.data['roles'] && !route.data['roles'].includes(account.role)) {
                // Role not authorized, redirect to home
                this.router.navigate(['/home']);
                return false;
            }

            // Authorized
            return true;
        }

        // Not logged in, redirect to login with return url
        this.router.navigate(['/account/login'], { queryParams: { returnUrl: state.url } });
        return false;
    }
}
