import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';
import {Projects} from './projects';

export const Issues = new Mongo.Collection('issues');

Meteor.methods({
    'issues.insert'(project, title, description, tracker, priority, severity, dueDate, responsible) {
        check(project, String);
        check(title, String);
        check(description, String);
        check(tracker, String);
        check(priority, String);
        check(severity, String);
        check(dueDate, String)
        check(responsible, String);

        var thisProject = Projects.findOne({'name': project});
        var numWorkflowSteps = thisProject.workflow.length;
        var participants = [];

        for (var i  = 0; i < numWorkflowSteps; i++) {
            participants.push([]);

            if (thisProject.workflow[i].hasParticipants) {
                participants[i].push(responsible);
            }
        }

        var historyTxt = '[' + moment(new Date()).format('YYYY-MM-DD, HH:MM') + '] Issue created by ' + Meteor.user().username + ' and assigned to ' + responsible;
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
            stateIndex: 0,
            createdAt: moment(new Date()).format("YYYY-MM-DD HH:mm"),
            dueDate: dueDate,
            history: [historyTxt],
            participants: participants
        });
    },
    'issues.incrementState'(project, issueNumber) {
        var thisIssue = Issues.findOne({'project': project, 'number': issueNumber});
        var thisProject = Projects.findOne({'name': project});

        if (thisIssue.stateIndex < (thisProject.workflow.length - 1)) {
            thisIssue.stateIndex += 1;
            Issues.update({'project': project, 'number': issueNumber}, {$set: {'stateIndex': thisIssue.stateIndex}});
        }
    },
    'issues.addParticipant'(project, issueNumber, state, participant) {
        var result = false;
        var thisIssue = Issues.findOne({'project': project, 'number': issueNumber});

        var participants = thisIssue.participants;
        if(participants[state].indexOf(participant) < 0) {
            participants[state].push(participant);
            result = true;
        }

        Issues.update({'project': project, 'number': issueNumber}, {$set: {'participants': participants}});

        return result;
    },
    'issues.addHistory'(project, issueNumber, text) {
        var thisIssue = Issues.findOne({'project': project, 'number': issueNumber});

        var history = thisIssue.history;
        history.push(text);

        Issues.update({'project': project, 'number': issueNumber}, {$set: {'history': history}});
    }
});
