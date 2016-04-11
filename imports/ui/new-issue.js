import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import {Projects} from '../api/projects.js';
import {Issues} from '../api/issues.js';
import './new-issue.html';

Template.newIssue.onRendered(function onRendered() {
});

Template.newIssue.helpers({
    project() {
        return Projects.findOne({'name': activeProject.get()});
    },
    users() {
        return Meteor.users.find({});
    }
});

Template.newIssue.events({
    'click [id=btn-add-user]'(event, template) {
        title = template.find('#issue-title').value;
        tracker = template.find('#select-tracker').value;
        priority = template.find('#select-priority').value;
        severity = template.find('#select-severity').value;
        dueDate = template.find('#due-date').value;
        responsible = template.find('#select-responsible :selected').text;
        description = template.find('#issue-description').value;

        Meteor.call('issues.insert', activeProject.get(), title, description, tracker, priority, severity, dueDate, responsible);
        
        target.set('projectPage');
    }
});
