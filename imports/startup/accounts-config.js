import { Accounts } from 'meteor/accounts-base';

console.log('&*&*&*&*&*&*&');

Accounts.ui.config({
    passwordSignupFields: 'USERNAME_ONLY',
});
