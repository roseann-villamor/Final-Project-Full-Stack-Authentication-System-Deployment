import { Component, OnInit } from '@angular/core';
import { first } from 'rxjs/operators';

import { AccountService } from '@app/_services';
import { Account } from '@app/_models';

@Component({ templateUrl: 'list.component.html', standalone: false })
export class ListComponent implements OnInit {
    accounts: any[] = [];

    constructor(private accountService: AccountService) { }

    ngOnInit() {
        this.accountService.getAll()
            .pipe(first())
            .subscribe(accounts => this.accounts = accounts);
    }

    deleteAccount(id: number) {
        const account = this.accounts.find(x => x.id === id);
        if (!account) return;

        if (confirm('Are you sure you want to delete this account?')) {
            account.isDeleting = true;
            this.accountService.delete(id)
                .pipe(first())
                .subscribe(() => {
                    this.accounts = this.accounts.filter(x => x.id !== id);
                });
        }
    }
}
