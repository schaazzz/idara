import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Projects } from '../api/projects';
import { Issues } from '../api/issues';
import './home.html';

Template.home.helpers({
    taskCount(category) {
        var count = 0;

        if (category == 'responsible') {
            count = Issues.find({'responsible': Meteor.user().username, 'isClosed': false}).count();
        } else if (category == 'participant') {
            count = Issues.find({'responsible': {$ne: Meteor.user().username} ,'participants': {$elemMatch: {$elemMatch: {$in: [Meteor.user().username]}}}, 'isClosed': false}).count();
        }
        return count;
    },
    participant() {
        return Issues.find({'responsible': {$ne: Meteor.user().username} ,'participants': {$elemMatch: {$elemMatch: {$in: [Meteor.user().username]}}}, 'isClosed': false});
    },
    responsible() {
        return Issues.find({'responsible': Meteor.user().username, 'isClosed': false});
    }
});

Template.home.events({
    'click [name=open-issue-page]'(event, template) {
        var project = event.target.id;
        var issue = project.split(':')[1];
        project = project.split(':')[0];
        activeProject.set(project);
        activeIssue.set(issue);
        target.set('issuePage');
    },
    'click [name=open-project-page]'(event, template) {
        console.log(event.target.id);
        activeProject.set(event.target.id);
        target.set('projectPage');
    }
});
