import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Projects } from '../api/projects';
import { Issues } from '../api/issues';
import { Files } from '../api/files';
import './new-epic.html';

let issuesUpdated = new ReactiveVar(false);
let selectedIssues = [];

Template.newEpic.helpers({
    users() {
        return Meteor.users.find({});
    },
    project() {
        return Projects.findOne({'name': activeProject.get()});
    },
    issues() {
        return Issues.find({'project': activeProject.get(), 'state': 'Open'}).map(function (issue, index) {
            if (index == 0) {
                issue.first = true;
            }

            return issue;
        });
    },
    epicIssues() {
        if (issuesUpdated.get()) {
            issuesUpdated.set(false);
        }

        console.log('selectedIssues', selectedIssues);

        return Issues.find({'project': activeProject.get(), 'number': {$in: selectedIssues}}).map(function (issue, index) {
            console.log('yo!');
            if (index == 0) {
                issue.first = true;
            }

            return issue;
        });
    }
});

Template.newEpic.events({
    'click #a-attach-issue-to-epic'(event, template) {
        $('#modal-issues').modal();
    },
    'change [name=chk-select-issue]'(event, template) {
        let id = '#' + event.target.id;
        let value = parseInt(event.target.attributes.value.value);

        if ($(id).is(':checked')) {
            if (selectedIssues.indexOf(value) < 0) {
                selectedIssues.push(value);
            }
        } else {
            if (selectedIssues.indexOf(value) >= 0) {
                selectedIssues.splice(selectedIssues.indexOf(value), 1);
            }
        }

        console.log(selectedIssues);
    },
    'click #btn-add-issues'(event, template) {
        issuesUpdated.set(true);
        $('#modal-issues').modal('toggle');
    },
    'click #btn-cancel-selection'(event, template) {
        $('#modal-issues').modal('toggle');
    }
});
