import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import {Projects} from '../api/projects.js';
import './project-page.html';

Template.projectPage.onRendered(function onRendered() {
});

Template.projectPage.helpers({
    project() {
        return Projects.findOne({'name': activeProject.get()});
    },
});

Template.projectPage.events({
    'click [id=new-issue]'(event, template) {
        target.set('newIssue');
    },
});
