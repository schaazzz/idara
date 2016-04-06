import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Accounts } from 'meteor/accounts-base';
import './login.html';

Template.loginForm.events({
    'click [id=btn-login]'(event, template,instance) {
        const username = template.find('[id=username]').value;
        const password = template.find('[id=password]').value;
        Meteor.loginWithPassword(username, password, function (error) {
            if (!error) {
                loggedIn.set(true);
            } else {
                loggedIn.set(false);
                console.log(error);
            }
        });
    },
});
