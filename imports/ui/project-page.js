import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import {Projects} from '../api/projects.js';
import {Issues} from '../api/issues.js';
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
    }
});

Template.projectPage.events({
    'click [id=new-issue]'(event, template) {
        target.set('newIssue');
    },
    'click .clickable-row'(event, template) {
        // console.log(event);
        console.log(event.target.id);
        activeIssue.set(event.target.id);
        // target.set('issuePage');
    }
});
