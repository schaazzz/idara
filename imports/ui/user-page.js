import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Projects } from '../api/projects';
import { Issues } from '../api/issues';
import './user-page.html';

Template.userPage.helpers({
    taskCount(category) {
        var count = 0;
        console.log('{}{}{}{}', activeUserPage.get());
        if (category == 'responsible') {
            count = Issues.find({'responsible': activeUserPage.get(), 'isClosed': false}).count();
        } else if (category == 'participant') {
            count = Issues.find({'responsible': {$ne: activeUserPage.get()} ,'participants': {$elemMatch: {$elemMatch: {$in: [activeUserPage.get()]}}}, 'isClosed': false}).count();
        }
        return count;
    },
    participant() {
        return Issues.find({'responsible': {$ne: activeUserPage.get()} ,'participants': {$elemMatch: {$elemMatch: {$in: [activeUserPage.get()]}}}, 'isClosed': false});
    },
    responsible() {
        return Issues.find({'responsible': activeUserPage.get(), 'isClosed': false});
    }
});

Template.userPage.events({
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
