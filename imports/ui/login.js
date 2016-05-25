import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Accounts } from 'meteor/accounts-base';
import './login.html';

Template.loginForm.events({
    'click [id=btn-login]'(event, template) {
        const username = template.find('[id=username]').value;
        const password = template.find('[id=password]').value;
        Meteor.loginWithPassword(username, password, function (error) {
            if (!error) {
                activeUserPage.set(Meteor.user().username);
                loggedIn.set(true);
            } else {
                loggedIn.set(false);
                console.log(error);
            }
        });
    },
});
