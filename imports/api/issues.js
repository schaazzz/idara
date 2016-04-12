import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';

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
    'issues.list'() {
        return Issues.find({});
    }
});
