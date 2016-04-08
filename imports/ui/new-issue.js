import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import {Projects} from '../api/projects.js';
import './new-issue.html';

Template.newIssue.onRendered(function onRendered() {
});

Template.newIssue.helpers({
    project() {
        return Projects.findOne({'name': activeProject.get()});
    },
});

Template.newIssue.events({
});
