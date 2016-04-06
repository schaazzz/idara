import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Accounts } from 'meteor/accounts-base';
import './cpanel.html';

Template.controlPanel.onRendered(function onCreated() {
    this.$('#custom-switch-03').bootstrapSwitch();
});

Template.controlPanel.events({
    'click [id=btn-add-user]'(event, template) {
        const username = template.find('[id=input-username]').value;
        const password = template.find('[id=input-password]').value;
        const isRoot = template.find('[id=chk-toggle-root]').checked;
        console.log('Client: Adding user (root: %s) %s:%s', isRoot, username, password);
        Accounts.createUser({username: username, password: password, profile: {isRoot: isRoot}});
    },
});
