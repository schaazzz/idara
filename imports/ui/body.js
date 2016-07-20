import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Accounts } from 'meteor/accounts-base';
import {Projects} from '../api/projects';
import { Issues } from '../api/issues';
import './login';
import './cpanel';
import './user-page';
import './config-project';
import './project-page';
import './project-stats';
import './new-epic';
import './new-issue';
import './issue-page';
import './edit-workflow';
import './search-results';
import './body.html';

loggedIn = new ReactiveVar(true);
target = new ReactiveVar('userPage');
activeProject = new ReactiveVar(null);
editEpic = new ReactiveVar(false);
editIssue = new ReactiveVar(false);
workflow = new ReactiveVar('default');
activeWorkflow = new ReactiveVar(null);
newWorkflow = new ReactiveVar(false);
activeUserPage = new ReactiveVar(null);
searchTerm = new ReactiveVar(null);

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

Template.registerHelper("not", function(condition) {
    return !condition;
});

Template.registerHelper("eq", function(arg0, arg1) {
    return (arg0 == arg1);
});

Template.registerHelper("and", function(arg0, arg1) {
    return (arg0 && arg1);
});

Template.body.helpers({
    showLoginForm() {
        return !loggedIn.get();
    },
    targetTemplate() {
        return target.get();
    },
    projects() {
        return Projects.find({}, {'_id': 0, 'name': 1, description: '1'});
    },
    activeProject() {
        result = 'Projects';

        if (activeProject.get()) {
            result = activeProject.get();
        }

        return result;
    }
});

Template.body.events({
    'click #btn-search-issue'(event, template) {
        searchTerm.set($('#input-search-issue').val());
        target.set('searchResults');
    },
    'click #btn-cpanel'(event, template) {
        if (Meteor.user().profile.isRoot) {
            target.set('controlPanel');
        }
    },
    'click #btn-logout'(event, template) {
        Meteor.logout(function (error) {
            loggedIn.set(false);
        });
    },
    'click [id=btn-list-projects]'(event, template) {
        target.set('projects');
    },
    'click [id=btn-usr-page]'(event, template) {
        activeUserPage.set(Meteor.user().username);
        target.set('userPage');
    },
    'click [name=open-project-page]': function (event, template) {
        activeProject.set(event.target.id);
        target.set('projectPage');
    }
});
