import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import {Projects} from '../api/projects';
import {Issues} from '../api/issues';
import './new-issue.html';

customFieldsRowsGlobal = new ReactiveVar();

Template.newIssue.onRendered(function onRendered() {
    if (editIssue.get()) {
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
    },
    customFieldsRows() {
        var customFields = Projects.findOne({'name': activeProject.get()}).customFields;

        if (customFields) {
            var customFieldsRowsArray = [];

            if ((Object.keys(customFields).length % 2) != 0) {
                customFields.aligner = void 0;
            }

            var row = void 0;
            for (var key in customFields) {
                var obj = void 0;
                var index = Object.keys(customFields).indexOf(key);

                if (key.indexOf('input_') == 0) {
                    obj = {
                        type: 'input',
                        name: key,
                        title: customFields[key].title
                    };
                } else if (key.indexOf('select_') == 0) {
                    var options = customFields[key].options.split(',');

                    for (var i = 0; i < options.length; i++) {
                        options[i] = options[i].replace(/^\s+/, '');
                    }
                    obj = {
                        type: 'select',
                        name: key,
                        title: customFields[key].title,
                        options: options
                    };
                } else {
                    obj = customFields.aligner;
                }

                if ((index % 2) == 0) {
                    row = {}
                    row.first = obj;
                } else {
                    row.second = obj;
                    customFieldsRowsArray.push(row);
                }
            }

            customFieldsRowsGlobal.set(customFieldsRowsArray);
            return (customFieldsRowsArray);
        } else {
            return (void 0);
        }
    },
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

        var customFieldsRows = customFieldsRowsGlobal.get();

        for (var i = 0; i < customFieldsRows.length; i++) {
            customFieldsRows[i].first.value = $('#' + customFieldsRows[i].first.name).val();
            customFieldsRows[i].second.value = $('#' + customFieldsRows[i].second.name).val();
        }

        if (editIssue.get()) {
            Meteor.call('issues.update', activeProject.get(), parseInt(activeIssue.get()), title, description, tracker, priority, severity, dueDate, responsible, customFieldsRows);
        } else {
            Meteor.call('issues.insert', activeProject.get(), title, description, tracker, priority, severity, dueDate, responsible, customFieldsRows);
        }

        target.set('projectPage');
    }
});
