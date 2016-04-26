import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import {Projects} from '../api/projects';
import {Issues} from '../api/issues';
import './project-page.html';

activeIssue = new ReactiveVar('');

Template.projectPage.onRendered(function onRendered() {
});

Template.projectPage.helpers({
    project() {
        return Projects.findOne({'name': activeProject.get()});
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
    }
});

Template.projectPage.events({
    'click [id=new-issue]'(event, template) {
        target.set('newIssue');
    },
    'click [name=open-issue-page]'(event, template) {
        activeIssue.set(event.target.id);
        target.set('issuePage');
    },
    'click [id=a-config-project]'(event, template) {
        target.set('configProject');
    }
});
