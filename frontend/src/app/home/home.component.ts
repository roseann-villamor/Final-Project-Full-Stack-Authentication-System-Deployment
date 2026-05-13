import { Component } from '@angular/core';

import { AccountService } from '@app/_services';
import { Account } from '@app/_models';

@Component({
    templateUrl: 'home.component.html',
    standalone: false
})
export class HomeComponent {
    account: Account | null = null;

    constructor(private accountService: AccountService) {
        this.account = this.accountService.accountValue;
    }
}
