import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Accounts } from 'meteor/accounts-base';
import '../api/users.js';
import './login.js';
import './cpanel.js';
import './home.js';
import './body.html';

loggedIn = new ReactiveVar(true);
target = new ReactiveVar('home');

Template.body.onCreated(function onCreated() {
    this.state = new ReactiveDict();
    if (Meteor.user() == null) {
        loggedIn.set(false);
        this.state.set('showControlPanel', false);
    } else {
        loggedIn.set(true);
        this.state.set('showControlPanel', true);
    }
});

Template.body.helpers({
    showLoginForm() {
        return !loggedIn.get();
    },
    targetTemplate(){
        return target.get();
    }
});

Template.body.events({
    'click [id=btn-cpanel]'(event, template) {
        if (Meteor.user().profile.isRoot) {
            target.set('controlPanel');
        }
    },
});
