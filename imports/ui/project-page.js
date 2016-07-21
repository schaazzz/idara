import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import {Projects} from '../api/projects';
import {Epics} from '../api/epics';
import {Issues} from '../api/issues';
import './project-page.html';

activeIssue = new ReactiveVar('');
activeEpic = new ReactiveVar('');

Template.projectPage.onRendered(function onRendered() {
});

Template.projectPage.helpers({
    project() {
        return Projects.findOne({'name': activeProject.get()});
    },
    epics() {
        return Epics.find({'project': activeProject.get()});
    },
    issues() {
        return Issues.find({'project': activeProject.get()});
    },
    editingAllowed() {
        var result = false;
        thisProject = Projects.findOne({'name': activeProject.get()});

        if (Meteor.user().profile.isRoot || (Meteor.user().username == thisProject.admin)) {
            result = true;
        }

        return result;
    },
    addingIssuesAllowed() {
        var result = false;
        thisProject = Projects.findOne({'name': activeProject.get()});

        if (Meteor.user().profile.isRoot
            || thisProject.noIssueFilingRestrictions
            || (Meteor.user().username == thisProject.admin)
            || (thisProject.pmUsers.indexOf(Meteor.user().username) >= 0)) {
            result = true;
        }
        return result;
    },
    projetHasEpics() {
        return true;
    }
});

Template.projectPage.events({
    'click #new-epic'(event, template) {
        editEpic.set(false);
        target.set('newEpic');
    },
    'click #new-issue'(event, template) {
        editIssue.set(false);
        target.set('newIssue');
    },
    'click [name=a-epic-page]'(event, template) {
        activeEpic.set(event.target.id);
        target.set('epicPage');
    },
    'click [name=a-issue-page]'(event, template) {
        activeIssue.set(event.target.id);
        target.set('issuePage');
    },
    'click [name=a-user-id]'(event, template) {
         activeUserPage.set(event.target.id);
         target.set('userPage');
    },
    'click [id=a-config-project]'(event, template) {
        target.set('configProject');
    },
    'click [id=a-project-stats]'(event, template) {
        target.set('projectStats');
    }
});
