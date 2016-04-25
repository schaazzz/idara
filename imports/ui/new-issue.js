import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import {Projects} from '../api/projects';
import {Issues} from '../api/issues';
import './new-issue.html';

Template.newIssue.onRendered(function onRendered() {
    if (editIssue.get()){
        var issue = Issues.findOne({'project': activeProject.get(), 'number': parseInt(activeIssue.get())});
        this.$('#issue-title').val(issue.title);
        this.$('#select-tracker').val(issue.tracker);
        this.$('#select-priority').val(issue.priority);
        this.$('#select-severity').val(issue.severity);
        this.$('#due-date').val(issue.dueDate);
        this.$('#select-responsible').val(issue.responsible);
        this.$('#issue-description').val(issue.description);
    }
});

Template.newIssue.helpers({
    project() {
        return Projects.findOne({'name': activeProject.get()});
    },
    users() {
        return Meteor.users.find({});
    },
    edit() {
        return editIssue.get();
    }
});

Template.newIssue.events({
    'click [id=btn-add-issue]'(event, template) {
        title = template.find('#issue-title').value;
        tracker = template.find('#select-tracker').value;
        priority = template.find('#select-priority').value;
        severity = template.find('#select-severity').value;
        dueDate = template.find('#due-date').value;
        responsible = template.find('#select-responsible :selected').text;
        description = template.find('#issue-description').value;

        if (editIssue.get()) {
            Meteor.call('issues.update', activeProject.get(), parseInt(activeIssue.get()), title, description, tracker, priority, severity, dueDate, responsible);
        } else {
            Meteor.call('issues.insert', activeProject.get(), title, description, tracker, priority, severity, dueDate, responsible);
        }

        target.set('projectPage');
    }
});
