import { Component } from '@angular/core';

import { AccountService } from '@app/_services';
import { Account, Role } from '@app/_models';

@Component({
    selector: 'app-nav',
    templateUrl: 'nav.component.html',
    standalone: false
})
export class NavComponent {
    account: Account | null = null;

    constructor(private accountService: AccountService) {
        this.accountService.account.subscribe(x => this.account = x);
    }

    get isAdmin() {
        return this.account?.role === Role.Admin;
    }

    logout() {
        this.accountService.logout();
    }
}
