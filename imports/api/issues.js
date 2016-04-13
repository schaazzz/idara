import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';
import {Projects} from './projects';

export const Issues = new Mongo.Collection('issues');

Meteor.methods({
    'issues.insert'(project, title, description, tracker, priority, severity, dueDate, responsible) {
        check(title, String);
        check(description, String);
        check(tracker, String);
        check(priority, String);
        check(severity, String);
        check(responsible, String);
        check(dueDate, String)

        Issues.insert({
            number: Issues.find({}).count() + 1,
            project: project,
            title: title,
            description: description,
            tracker: tracker,
            priority: priority,
            severity: severity,
            createdBy: Meteor.user().username,
            responsible: responsible,
            status: 'Open',
            createdAt: moment(new Date()).format("YYYY-MM-DD HH:mm"),
            dueDate: dueDate,
        });
    },
    'issues.incrementState'(project, issueNumber) {
        thisIssue = Issues.findOne({'project': project, 'number': issueNumber});
        thisProject = Projects.findOne({'name': project});

        if (thisIssue.stateIndex < (thisProject.workflow.length - 1)) {
            thisIssue.stateIndex += 1;
            Issues.update({'project': project, 'number': issueNumber}, {$set: {'stateIndex': thisIssue.stateIndex}});
        }
    }
});
