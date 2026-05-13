import { NgModule, APP_INITIALIZER } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AlertComponent } from './_components';
import { NavComponent } from './_components';
import { AccountService } from './_services';
import { appInitializer, JwtInterceptor, ErrorInterceptor, FakeBackendInterceptor } from './_helpers';

@NgModule({
    imports: [
        BrowserModule,
        ReactiveFormsModule,
        HttpClientModule,
        AppRoutingModule
    ],
    declarations: [
        AppComponent,
        AlertComponent,
        NavComponent
    ],
    providers: [
        { provide: APP_INITIALIZER, useFactory: appInitializer, deps: [AccountService], multi: true },
        { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
        { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },

        // FAKE BACKEND - enable for Stage A testing, disable for Stage B
        // { provide: HTTP_INTERCEPTORS, useClass: FakeBackendInterceptor, multi: true }
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
